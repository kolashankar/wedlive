"""
Layout-Aware Photo Management Routes
Handles photo uploads based on layout schemas - placeholder-based system
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from app.auth import get_current_user
from app.database import get_db_dependency
from app.services.telegram_service import TelegramCDNService
from app.layout_schemas import (
    get_layout_schema,
    validate_photo_placeholder,
    get_placeholder_max_count,
    get_supported_photo_placeholders
)
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import uuid
import logging
import tempfile
import aiofiles
import os

logger = logging.getLogger(__name__)
router = APIRouter()
telegram_service = TelegramCDNService()

# ==================== REQUEST/RESPONSE MODELS ====================

class PhotoPlaceholderUploadRequest(BaseModel):
    """Request model for uploading photo to a specific placeholder"""
    wedding_id: str
    placeholder: str  # bridePhoto, groomPhoto, couplePhoto, preciousMoments, studioImage
    
class PhotoPlaceholderResponse(BaseModel):
    """Response model for photo upload"""
    photo_id: str
    placeholder: str
    url: str
    file_id: str
    uploaded_at: datetime
    message: str

class LayoutPhotosResponse(BaseModel):
    """Response model for all layout photos"""
    wedding_id: str
    layout_id: str
    photos: Dict[str, Any]  # Keyed by placeholder name
    
class UpdateLayoutPhotoRequest(BaseModel):
    """Request to update/replace photo in placeholder"""
    placeholder: str
    photo_url: Optional[str] = None
    photo_id: Optional[str] = None

# ==================== UPLOAD PHOTO TO PLACEHOLDER ====================

@router.post("/weddings/{wedding_id}/layout-photos/upload", response_model=PhotoPlaceholderResponse)
async def upload_photo_to_placeholder(
    wedding_id: str,
    placeholder: str = Form(...),  # bridePhoto, groomPhoto, etc.
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Upload photo to a specific layout placeholder
    Validates based on selected layout schema
    """
    temp_path = None
    
    try:
        logger.info(f"[LAYOUT_PHOTO_UPLOAD] Wedding: {wedding_id}, Placeholder: {placeholder}")
        
        # Get wedding and verify ownership
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get layout ID
        layout_id = wedding.get("theme_settings", {}).get("layout_id") or wedding.get("theme_settings", {}).get("theme_id") or "layout_1"
        
        # Validate placeholder against layout schema
        if not validate_photo_placeholder(layout_id, placeholder):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Placeholder '{placeholder}' is not supported by layout '{layout_id}'"
            )
        
        # Validate file
        file_content = await file.read()
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed"
            )
        
        # Check file size (max 10MB)
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 10MB limit"
            )
        
        # Save to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        async with aiofiles.open(temp_file.name, 'wb') as f:
            await f.write(file_content)
        temp_path = temp_file.name
        
        # Upload to Telegram CDN
        upload_result = await telegram_service.upload_photo(
            file_path=temp_path,
            caption=f"{placeholder} photo for {wedding_id}",
            wedding_id=wedding_id
        )
        
        if not upload_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload photo"
            )
        
        # Get CDN URL
        photo_url = await telegram_service.get_file_url(upload_result["file_id"])
        photo_id = str(uuid.uuid4())
        
        # Get current layout_photos from wedding
        layout_photos = wedding.get("layout_photos", {})
        
        # For preciousMoments, append to array
        if placeholder == "preciousMoments":
            max_count = get_placeholder_max_count(layout_id, placeholder)
            current_photos = layout_photos.get(placeholder, [])
            
            if len(current_photos) >= max_count:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Maximum {max_count} photos allowed for {placeholder}"
                )
            
            current_photos.append({
                "photo_id": photo_id,
                "url": photo_url,
                "file_id": upload_result["file_id"],
                "uploaded_at": datetime.utcnow()
            })
            layout_photos[placeholder] = current_photos
        else:
            # For single photo placeholders, replace
            layout_photos[placeholder] = {
                "photo_id": photo_id,
                "url": photo_url,
                "file_id": upload_result["file_id"],
                "uploaded_at": datetime.utcnow()
            }
        
        # Update wedding
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {
                "layout_photos": layout_photos,
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        logger.info(f"[LAYOUT_PHOTO_UPLOAD] Successfully uploaded to {placeholder}: {photo_id}")
        
        return PhotoPlaceholderResponse(
            photo_id=photo_id,
            placeholder=placeholder,
            url=photo_url,
            file_id=upload_result["file_id"],
            uploaded_at=datetime.utcnow(),
            message=f"Photo uploaded to {placeholder} successfully"
        )
        
    except HTTPException:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise
    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        logger.error(f"[LAYOUT_PHOTO_UPLOAD] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Photo upload failed: {str(e)}"
        )

# ==================== GET LAYOUT PHOTOS ====================

@router.get("/weddings/{wedding_id}/layout-photos")
async def get_layout_photos(
    wedding_id: str,
    db = Depends(get_db_dependency)
):
    """Get all layout photos for a wedding (public access)"""
    try:
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        layout_id = wedding.get("theme_settings", {}).get("layout_id") or wedding.get("theme_settings", {}).get("theme_id") or "layout_1"
        layout_photos = wedding.get("layout_photos", {})
        
        # Filter photos based on supported placeholders
        supported_placeholders = get_supported_photo_placeholders(layout_id)
        filtered_photos = {
            placeholder: layout_photos[placeholder]
            for placeholder in supported_placeholders
            if placeholder in layout_photos
        }
        
        return {
            "wedding_id": wedding_id,
            "layout_id": layout_id,
            "photos": filtered_photos
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_LAYOUT_PHOTOS] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get layout photos"
        )

# ==================== DELETE PHOTO FROM PLACEHOLDER ====================

@router.delete("/weddings/{wedding_id}/layout-photos/{placeholder}/{photo_id}")
async def delete_photo_from_placeholder(
    wedding_id: str,
    placeholder: str,
    photo_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Delete a photo from a specific placeholder"""
    try:
        # Get wedding and verify ownership
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        layout_photos = wedding.get("layout_photos", {})
        
        if placeholder not in layout_photos:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No photos found in {placeholder}"
            )
        
        # For preciousMoments, remove from array
        if placeholder == "preciousMoments":
            photos_array = layout_photos[placeholder]
            layout_photos[placeholder] = [
                photo for photo in photos_array 
                if photo.get("photo_id") != photo_id
            ]
        else:
            # For single photo placeholders, remove the entry
            if layout_photos[placeholder].get("photo_id") == photo_id:
                del layout_photos[placeholder]
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Photo {photo_id} not found in {placeholder}"
                )
        
        # Update wedding
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {
                "layout_photos": layout_photos,
                "updated_at": datetime.utcnow()
            }}
        )
        
        logger.info(f"[DELETE_LAYOUT_PHOTO] Deleted {photo_id} from {placeholder}")
        
        return {"message": f"Photo deleted from {placeholder} successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DELETE_LAYOUT_PHOTO] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete photo: {str(e)}"
        )

# ==================== GET SUPPORTED PLACEHOLDERS ====================

@router.get("/weddings/{wedding_id}/supported-placeholders")
async def get_supported_placeholders_for_wedding(
    wedding_id: str,
    db = Depends(get_db_dependency)
):
    """Get list of supported photo placeholders for wedding's layout"""
    try:
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        layout_id = wedding.get("theme_settings", {}).get("layout_id") or wedding.get("theme_settings", {}).get("theme_id") or "layout_1"
        schema = get_layout_schema(layout_id)
        
        if not schema:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Layout schema not found for {layout_id}"
            )
        
        placeholders_info = []
        for placeholder_name, slot in schema.photo_slots.items():
            placeholders_info.append({
                "name": placeholder_name,
                "required": slot.required,
                "supports_border": slot.supports_border,
                "max_count": slot.max_count,
                "description": slot.description
            })
        
        return {
            "layout_id": layout_id,
            "layout_name": schema.name,
            "placeholders": placeholders_info,
            "border_slots": [
                {
                    "name": border_name,
                    "applies_to": border_slot.applies_to,
                    "description": border_slot.description
                }
                for border_name, border_slot in schema.border_slots.items()
            ],
            "supports_youtube": schema.supports_youtube,
            "supports_studio_image": schema.supports_studio_image
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_SUPPORTED_PLACEHOLDERS] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get supported placeholders"
        )
