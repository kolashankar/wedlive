"""
Layout-Aware Photo Management Routes - IMPROVED with Phase 5 Error Handling
Handles photo uploads based on layout schemas - placeholder-based system
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from app.auth import get_current_user
from app.database import get_db_dependency
from app.services.telegram_service import TelegramCDNService
from app.utils.file_id_validator import validate_and_log_file_id, is_valid_telegram_file_id
from app.layout_schemas import (
    get_layout_schema,
    validate_photo_placeholder,
    get_placeholder_max_count,
    get_supported_photo_placeholders
)
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, validator
import uuid
import logging
import tempfile
import aiofiles
import os

logger = logging.getLogger(__name__)
router = APIRouter()
telegram_service = TelegramCDNService()

# ==================== CONSTANTS ====================
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

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

class ErrorResponse(BaseModel):
    """Standardized error response"""
    error: str
    detail: str
    error_code: str
    timestamp: datetime = datetime.utcnow()

# ==================== HELPER FUNCTIONS ====================

def validate_file_type(content_type: str) -> tuple[bool, str]:
    """Validate file content type"""
    if not content_type:
        return False, "No content type provided"
    if not content_type.startswith('image/'):
        return False, f"Invalid file type: {content_type}. Only images are allowed"
    if content_type not in ALLOWED_IMAGE_TYPES:
        return False, f"Unsupported image format: {content_type}. Supported: JPEG, PNG, WebP"
    return True, ""

def validate_file_size(size: int) -> tuple[bool, str]:
    """Validate file size"""
    if size > MAX_FILE_SIZE:
        size_mb = size / (1024 * 1024)
        return False, f"File size ({size_mb:.2f}MB) exceeds maximum allowed size (10MB)"
    if size == 0:
        return False, "File is empty"
    return True, ""

async def cleanup_temp_file(path: Optional[str]):
    """Safely cleanup temporary file"""
    if path and os.path.exists(path):
        try:
            os.unlink(path)
            logger.info(f"[CLEANUP] Removed temp file: {path}")
        except Exception as e:
            logger.warning(f"[CLEANUP] Failed to remove temp file {path}: {str(e)}")

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
    IMPROVED: Enhanced error handling, validation, and cleanup
    """
    temp_path = None
    
    try:
        logger.info(f"[LAYOUT_PHOTO_UPLOAD] START - Wedding: {wedding_id}, Placeholder: {placeholder}, User: {current_user['user_id']}")
        
        # Step 1: Get wedding and verify ownership
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            logger.error(f"[LAYOUT_PHOTO_UPLOAD] Wedding not found: {wedding_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Wedding not found", "wedding_id": wedding_id}
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            logger.error(f"[LAYOUT_PHOTO_UPLOAD] Unauthorized access attempt by {current_user['user_id']} for wedding {wedding_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "Not authorized to upload photos for this wedding"}
            )
        
        # Step 2: Get layout ID and validate placeholder
        layout_id = wedding.get("theme_settings", {}).get("layout_id") or wedding.get("theme_settings", {}).get("theme_id") or "layout_1"
        logger.info(f"[LAYOUT_PHOTO_UPLOAD] Layout ID: {layout_id}")
        
        if not validate_photo_placeholder(layout_id, placeholder):
            logger.error(f"[LAYOUT_PHOTO_UPLOAD] Invalid placeholder '{placeholder}' for layout '{layout_id}'")
            supported = get_supported_photo_placeholders(layout_id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": f"Placeholder '{placeholder}' is not supported by layout '{layout_id}'",
                    "supported_placeholders": supported,
                    "layout_id": layout_id
                }
            )
        
        # Step 3: Validate file
        logger.info(f"[LAYOUT_PHOTO_UPLOAD] Reading file: {file.filename}")
        file_content = await file.read()
        
        # Validate file type
        is_valid_type, type_error = validate_file_type(file.content_type)
        if not is_valid_type:
            logger.error(f"[LAYOUT_PHOTO_UPLOAD] {type_error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": type_error, "content_type": file.content_type}
            )
        
        # Validate file size
        file_size = len(file_content)
        is_valid_size, size_error = validate_file_size(file_size)
        if not is_valid_size:
            logger.error(f"[LAYOUT_PHOTO_UPLOAD] {size_error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": size_error, "file_size": file_size}
            )
        
        logger.info(f"[LAYOUT_PHOTO_UPLOAD] File validated: {file_size} bytes, {file.content_type}")
        
        # Step 4: Check max count for array placeholders
        if placeholder == "preciousMoments":
            max_count = get_placeholder_max_count(layout_id, placeholder)
            layout_photos = wedding.get("layout_photos", {})
            current_photos = layout_photos.get(placeholder, [])
            
            if len(current_photos) >= max_count:
                logger.error(f"[LAYOUT_PHOTO_UPLOAD] Max count reached: {len(current_photos)}/{max_count}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": f"Maximum {max_count} photos allowed for {placeholder}",
                        "current_count": len(current_photos),
                        "max_count": max_count
                    }
                )
        
        # Step 5: Save to temp file
        logger.info(f"[LAYOUT_PHOTO_UPLOAD] Creating temporary file")
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        async with aiofiles.open(temp_file.name, 'wb') as f:
            await f.write(file_content)
        temp_path = temp_file.name
        logger.info(f"[LAYOUT_PHOTO_UPLOAD] Temp file created: {temp_path}")
        
        # Step 6: Upload to Telegram CDN
        logger.info(f"[LAYOUT_PHOTO_UPLOAD] Uploading to Telegram CDN")
        upload_result = await telegram_service.upload_photo(
            file_path=temp_path,
            caption=f"{placeholder} photo for {wedding_id}",
            wedding_id=wedding_id
        )
        
        if not upload_result.get("success"):
            error_detail = upload_result.get('error', 'Unknown error')
            logger.error(f"[LAYOUT_PHOTO_UPLOAD] Telegram upload failed: {error_detail}")
            await cleanup_temp_file(temp_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "Failed to upload photo to CDN",
                    "details": error_detail,
                    "service": "telegram_cdn"
                }
            )
        
        # CRITICAL: Validate file_id before saving to database
        file_id = upload_result.get("file_id")
        is_valid, error_msg = validate_and_log_file_id(file_id, context=f"layout_photo_{placeholder}")
        if not is_valid:
            logger.error(f"[LAYOUT_PHOTO_UPLOAD] Invalid file_id returned from Telegram: {error_msg}")
            await cleanup_temp_file(temp_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "Invalid file_id received from Telegram CDN",
                    "details": error_msg,
                    "file_id": file_id
                }
            )
        
        # Step 7: Get CDN URL
        photo_url = await telegram_service.get_file_url(file_id)
        if not photo_url:
            logger.error(f"[LAYOUT_PHOTO_UPLOAD] Failed to get CDN URL for file_id: {file_id}")
            await cleanup_temp_file(temp_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "Failed to retrieve photo URL from CDN",
                    "file_id": file_id
                }
            )
        
        photo_id = str(uuid.uuid4())
        logger.info(f"[LAYOUT_PHOTO_UPLOAD] CDN URL obtained: {photo_url[:50]}...")
        
        # Step 8: Update wedding document
        layout_photos = wedding.get("layout_photos", {})
        
        # For preciousMoments, append to array
        if placeholder == "preciousMoments":
            current_photos = layout_photos.get(placeholder, [])
            current_photos.append({
                "photo_id": photo_id,
                "url": photo_url,  # Store full Telegram URL
                "file_id": file_id,  # Use validated file_id
                "uploaded_at": datetime.utcnow()
            })
            layout_photos[placeholder] = current_photos
        else:
            # For single photo placeholders, replace with proper URL
            layout_photos[placeholder] = {
                "photo_id": photo_id,
                "url": photo_url,  # Store full Telegram URL
                "file_id": file_id,  # Use validated file_id
                "uploaded_at": datetime.utcnow()
            }
        
        # Update wedding
        update_result = await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {
                "layout_photos": layout_photos,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if update_result.modified_count == 0:
            logger.warning(f"[LAYOUT_PHOTO_UPLOAD] Wedding document not modified for {wedding_id}")
        
        # Cleanup temp file
        await cleanup_temp_file(temp_path)
        
        logger.info(f"[LAYOUT_PHOTO_UPLOAD] SUCCESS - Photo uploaded to {placeholder}: {photo_id}")
        
        return PhotoPlaceholderResponse(
            photo_id=photo_id,
            placeholder=placeholder,
            url=photo_url,
            file_id=file_id,  # Use validated file_id
            uploaded_at=datetime.utcnow(),
            message=f"Photo uploaded to {placeholder} successfully"
        )
        
    except HTTPException:
        await cleanup_temp_file(temp_path)
        raise
    except Exception as e:
        await cleanup_temp_file(temp_path)
        logger.error(f"[LAYOUT_PHOTO_UPLOAD] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Internal server error during photo upload",
                "details": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

# ==================== GET LAYOUT PHOTOS ====================

def convert_to_proxy_url(photo_data: dict) -> dict:
    """
    Convert a photo dict to use proxy URL instead of direct Telegram URL.
    This prevents CORS issues when loading images from frontend.
    """
    if not isinstance(photo_data, dict):
        return photo_data
    
    file_id = photo_data.get('file_id', '')
    if file_id:
        # Use proxy URL format: /api/media/telegram-proxy/photos/{file_id}
        # This allows the backend to proxy the request and add proper CORS headers
        photo_data['url'] = f"/api/media/telegram-proxy/photos/{file_id}"
        logger.debug(f"[CONVERT_URL] Converted to proxy URL for file_id: {file_id[:20]}...")
    
    return photo_data

@router.get("/weddings/{wedding_id}/layout-photos")
async def get_layout_photos(
    wedding_id: str,
    db = Depends(get_db_dependency)
):
    """
    Get all layout photos for a wedding (public access)
    FIXED: Read from layout_photos field directly, not from cover_photos
    FIXED: Return proxy URLs instead of direct Telegram URLs to avoid CORS issues
    """
    try:
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Wedding not found", "wedding_id": wedding_id}
            )
        
        layout_id = wedding.get("theme_settings", {}).get("layout_id") or wedding.get("theme_settings", {}).get("theme_id") or "layout_1"
        
        # Get photos from layout_photos field (NEW location)
        layout_photos = wedding.get("layout_photos", {})
        
        # If no layout_photos but has cover_photos (legacy), migrate data
        if not layout_photos:
            cover_photos = wedding.get("theme_settings", {}).get("cover_photos", [])
            
            # Convert cover_photos array to placeholder-based structure
            layout_photos = {}
            
            for photo in cover_photos:
                if isinstance(photo, dict):
                    category = photo.get("category", "general")
                    url = photo.get("url", "")
                    media_id = photo.get("media_id", "")
                    file_id = photo.get("file_id", "")  # Get actual Telegram file_id
                    
                    # Map categories to placeholder names
                    placeholder_name = None
                    if category == "bride":
                        placeholder_name = "bridePhoto"
                    elif category == "groom":
                        placeholder_name = "groomPhoto"
                    elif category == "couple":
                        placeholder_name = "couplePhoto"
                    elif category == "moment":
                        placeholder_name = "preciousMoments"
                    elif category == "studio":
                        placeholder_name = "studioImage"
                    
                    if placeholder_name and (url or file_id):
                        # Handle arrays for precious moments
                        if placeholder_name == "preciousMoments":
                            if placeholder_name not in layout_photos:
                                layout_photos[placeholder_name] = []
                            layout_photos[placeholder_name].append({
                                "url": url,
                                "file_id": file_id,  # CRITICAL: Include file_id
                                "media_id": media_id,
                                "photo_id": media_id or str(uuid.uuid4()),
                                "type": photo.get("type", "photo")
                            })
                        else:
                            layout_photos[placeholder_name] = {
                                "url": url,
                                "file_id": file_id,  # CRITICAL: Include file_id
                                "media_id": media_id,
                                "photo_id": media_id or str(uuid.uuid4()),
                                "type": photo.get("type", "photo")
                            }
        
        # Filter photos based on supported placeholders
        supported_placeholders = get_supported_photo_placeholders(layout_id)
        initial_filtered = {
            placeholder: layout_photos[placeholder]
            for placeholder in supported_placeholders
            if placeholder in layout_photos
        }
        
        # CRITICAL: Validate file_ids before sending to frontend
        # Remove any photos with invalid/placeholder file_ids
        validated_photos = {}
        removed_count = 0
        
        for placeholder, photo_data in initial_filtered.items():
            # Handle single photo placeholders (dict)
            if isinstance(photo_data, dict):
                file_id = photo_data.get('file_id', '')
                if file_id:
                    # Validate the file_id
                    is_valid, error_msg = validate_and_log_file_id(file_id, context=f"GET_{placeholder}")
                    if not is_valid:
                        logger.warning(f"[GET_LAYOUT_PHOTOS] Skipping invalid photo in {placeholder}: {error_msg}")
                        removed_count += 1
                        continue  # Skip this photo
                
                # Photo is valid - convert to proxy URL
                converted_photo = convert_to_proxy_url(photo_data.copy())
                validated_photos[placeholder] = converted_photo
            
            # Handle array photo placeholders (list)
            elif isinstance(photo_data, list):
                valid_photos = []
                for photo in photo_data:
                    if isinstance(photo, dict):
                        file_id = photo.get('file_id', '')
                        if file_id:
                            is_valid, error_msg = validate_and_log_file_id(file_id, context=f"GET_{placeholder}_array")
                            if not is_valid:
                                logger.warning(f"[GET_LAYOUT_PHOTOS] Skipping invalid photo in {placeholder} array: {error_msg}")
                                removed_count += 1
                                continue  # Skip this photo
                        
                        # Photo is valid - convert to proxy URL
                        converted_photo = convert_to_proxy_url(photo.copy())
                        valid_photos.append(converted_photo)
                
                # Only include the placeholder if it has valid photos
                if valid_photos:
                    validated_photos[placeholder] = valid_photos
        
        if removed_count > 0:
            logger.warning(f"[GET_LAYOUT_PHOTOS] Removed {removed_count} photo(s) with invalid file_ids from wedding {wedding_id}")
        
        logger.info(f"[GET_LAYOUT_PHOTOS] Wedding {wedding_id}, Layout {layout_id}, Photos: {list(validated_photos.keys())}")
        
        return {
            "wedding_id": wedding_id,
            "layout_id": layout_id,
            "photos": validated_photos
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_LAYOUT_PHOTOS] Error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to retrieve layout photos", "details": str(e)}
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
    """
    Delete a photo from a specific placeholder
    IMPROVED: Better error handling and Telegram cleanup
    """
    try:
        logger.info(f"[DELETE_LAYOUT_PHOTO] START - Wedding: {wedding_id}, Placeholder: {placeholder}, Photo: {photo_id}")
        
        # Get wedding and verify ownership
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Wedding not found", "wedding_id": wedding_id}
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "Not authorized to delete photos for this wedding"}
            )
        
        layout_photos = wedding.get("layout_photos", {})
        
        if placeholder not in layout_photos:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": f"No photos found in {placeholder}", "placeholder": placeholder}
            )
        
        # Track telegram message for deletion
        telegram_message_id = None
        
        # For preciousMoments, remove from array
        if placeholder == "preciousMoments":
            photos_array = layout_photos[placeholder]
            photo_to_delete = None
            
            # Try to find photo by photo_id first
            photo_to_delete = next((p for p in photos_array if p.get("photo_id") == photo_id), None)
            
            # If not found by photo_id, try fallback identifiers
            if not photo_to_delete:
                # Handle fallback identifiers like "photo-0", "photo-1", etc.
                if photo_id.startswith("photo-"):
                    try:
                        index = int(photo_id.split("-")[1])
                        if 0 <= index < len(photos_array):
                            photo_to_delete = photos_array[index]
                            logger.warning(f"[DELETE_LAYOUT_PHOTO] Using fallback index {index} for photo {photo_id}")
                    except (ValueError, IndexError):
                        pass
                
                # Handle numeric indices
                elif photo_id.isdigit():
                    index = int(photo_id)
                    if 0 <= index < len(photos_array):
                        photo_to_delete = photos_array[index]
                        logger.warning(f"[DELETE_LAYOUT_PHOTO] Using numeric index {index} for photo {photo_id}")
            
            if not photo_to_delete:
                logger.error(f"[DELETE_LAYOUT_PHOTO] Photo {photo_id} not found in {placeholder}. Available photos: {[p.get('photo_id', 'no-id') for p in photos_array]}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={"error": f"Photo {photo_id} not found in {placeholder}", "available_photos": [p.get('photo_id', 'no-id') for p in photos_array]}
                )
            
            # Get file_id for Telegram deletion
            file_id = photo_to_delete.get("file_id")
            actual_photo_id = photo_to_delete.get("photo_id", photo_id)
            
            # Remove from array by actual photo_id or index
            layout_photos[placeholder] = [
                photo for photo in photos_array 
                if photo.get("photo_id") != actual_photo_id
            ]
        else:
            # For single photo placeholders, remove the entry
            photo_data = layout_photos[placeholder]
            if photo_data.get("photo_id") != photo_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={"error": f"Photo {photo_id} not found in {placeholder}"}
                )
            
            # Get file_id for Telegram deletion
            file_id = photo_data.get("file_id")
            
            # Delete placeholder entry
            del layout_photos[placeholder]
        
        # Update wedding
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {
                "layout_photos": layout_photos,
                "updated_at": datetime.utcnow()
            }}
        )
        
        # TODO: Delete from Telegram (Task 5.3)
        # Note: We need message_id, not file_id to delete from Telegram
        # For now, log the intent
        logger.info(f"[DELETE_LAYOUT_PHOTO] Photo deleted from DB. file_id: {file_id}")
        logger.warning(f"[DELETE_LAYOUT_PHOTO] Telegram cleanup not implemented yet for file_id: {file_id}")
        
        logger.info(f"[DELETE_LAYOUT_PHOTO] SUCCESS - Deleted {photo_id} from {placeholder}")
        
        return {
            "success": True,
            "message": f"Photo deleted from {placeholder} successfully",
            "photo_id": photo_id,
            "placeholder": placeholder
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DELETE_LAYOUT_PHOTO] Error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Failed to delete photo",
                "details": str(e),
                "photo_id": photo_id,
                "placeholder": placeholder
            }
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
                detail={"error": "Wedding not found", "wedding_id": wedding_id}
            )
        
        layout_id = wedding.get("theme_settings", {}).get("layout_id") or wedding.get("theme_settings", {}).get("theme_id") or "layout_1"
        schema = get_layout_schema(layout_id)
        
        if not schema:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": f"Layout schema not found for {layout_id}", "layout_id": layout_id}
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
        logger.error(f"[GET_SUPPORTED_PLACEHOLDERS] Error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to get supported placeholders", "details": str(e)}
        )
