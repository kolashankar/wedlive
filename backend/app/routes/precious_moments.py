"""
Section 4: Precious Moments Routes
Handles multi-slot borders with 2-5 photos
Each slot has its own mask
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from app.models_sections import PhotoWithCrop
from app.auth import get_current_user
from app.database import get_db_dependency
from app.services.telegram_service import TelegramCDNService
from app.services.auto_crop_service import auto_crop_service
from typing import Optional, List
from datetime import datetime
import uuid
import os
import logging
import tempfile
import aiofiles

logger = logging.getLogger(__name__)
router = APIRouter()
telegram_service = TelegramCDNService()

async def get_fresh_border_url(border: dict) -> str:
    """
    Get fresh download URL for border from Telegram using file_id.
    This ensures the URL is valid even if stored cdn_url is stale.
    """
    telegram_file_id = border.get("telegram_file_id")
    if telegram_file_id:
        # Get fresh URL from Telegram API
        fresh_url = await telegram_service.get_file_url(telegram_file_id)
        if fresh_url:
            logger.info(f"[FRESH_URL] Got fresh URL for border {border.get('id')}")
            return fresh_url
    
    # Fallback to stored cdn_url if telegram_file_id is not available
    logger.warning(f"[FRESH_URL] Using stored cdn_url as fallback for border {border.get('id')}")
    return border.get("cdn_url", "")

# ==================== SECTION 4: PRECIOUS MOMENTS ====================

@router.put("/weddings/{wedding_id}/sections/precious-moments")
async def update_precious_moments_section(
    wedding_id: str,
    border_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Update precious moments section configuration
    Border determines the number of photo slots (2-5)
    """
    try:
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        # Verify ownership
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get current section config
        section_config = wedding.get("section_config", {})
        precious_section = section_config.get("section_4_precious", {})
        
        # If border_id provided, verify it exists and get slot count
        max_photos = 5  # Default
        if border_id:
            border = await db.photo_borders.find_one({"id": border_id})
            if not border:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Border not found"
                )
            
            # Get slot count from border metadata (if multi-slot border)
            slot_count = border.get("slot_count", 1)
            max_photos = min(max(slot_count, 2), 5)  # Ensure 2-5 range
            
            precious_section["border_id"] = border_id
            precious_section["max_photos"] = max_photos
        
        # Save updated config
        section_config["section_4_precious"] = precious_section
        
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {"section_config": section_config, "updated_at": datetime.utcnow()}}
        )
        
        logger.info(f"[PRECIOUS_UPDATE] Updated precious moments section for wedding: {wedding_id}")
        
        return {"success": True, "section_config": precious_section, "max_photos": max_photos}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[PRECIOUS_UPDATE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update precious moments section: {str(e)}"
        )

@router.post("/weddings/{wedding_id}/sections/precious-moments/upload-photo")
async def upload_precious_moment_photo(
    wedding_id: str,
    slot_index: int = Form(...),  # Which slot (0-4)
    border_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Upload photo for a specific slot in precious moments section
    Each slot uses its corresponding mask from the multi-slot border
    """
    temp_path = None
    cropped_path = None
    
    try:
        logger.info(f"[PRECIOUS_UPLOAD] Uploading photo for slot {slot_index} in wedding: {wedding_id}")
        
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        # Verify ownership
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get section config
        section_config = wedding.get("section_config", {})
        precious_section = section_config.get("section_4_precious", {})
        
        # Get border for this section
        current_border_id = border_id or precious_section.get("border_id")
        if not current_border_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No border selected for precious moments section"
            )
        
        # Get border data
        border = await db.photo_borders.find_one({"id": current_border_id})
        if not border:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Border not found"
            )
        
        # Verify slot index is valid
        max_photos = precious_section.get("max_photos", 5)
        if slot_index < 0 or slot_index >= max_photos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid slot index. Must be between 0 and {max_photos - 1}"
            )
        
        # Validate file
        file_content = await file.read()
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed"
            )
        
        # Save to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        async with aiofiles.open(temp_file.name, 'wb') as f:
            await f.write(file_content)
        temp_path = temp_file.name
        
        # Upload original to Telegram
        original_result = await telegram_service.upload_photo(
            file_path=temp_path,
            caption=f"Precious moment {slot_index + 1}",
            wedding_id=wedding_id
        )
        
        if not original_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload original photo"
            )
        
        original_url = await telegram_service.get_file_url(original_result["file_id"])
        
        # Create photo record
        photo_id = str(uuid.uuid4())
        photo_data = {
            "photo_id": photo_id,
            "original_url": original_url,
            "original_file_id": original_result["file_id"],
            "border_id": current_border_id,
            "cropped_url": None,
            "cropped_file_id": None,
            "is_mirrored": False,
            "slot_index": slot_index,
            "uploaded_at": datetime.utcnow(),
            "last_cropped_at": None
        }
        
        # Apply auto-crop with slot-specific mask
        cropped_url = None
        if border.get("masks"):
            # Multi-slot border with multiple masks
            slot_masks = border["masks"]
            if slot_index < len(slot_masks):
                slot_mask = slot_masks[slot_index]
                
                logger.info(f"[PRECIOUS_UPLOAD] Applying auto-crop with slot {slot_index} mask")
                
                # Get fresh border URL from Telegram
                border_url = await get_fresh_border_url(border)
                
                cropped_path, message = await auto_crop_service.apply_crop_with_border(
                    photo_url=original_url,
                    border_url=border_url,
                    mask_data=slot_mask,
                    mirror=False
                )
                
                # Upload cropped version
                cropped_result = await telegram_service.upload_photo(
                    file_path=cropped_path,
                    caption=f"Cropped precious moment {slot_index + 1}",
                    wedding_id=wedding_id
                )
                
                if cropped_result.get("success"):
                    cropped_url = await telegram_service.get_file_url(cropped_result["file_id"])
                    photo_data["cropped_url"] = cropped_url
                    photo_data["cropped_file_id"] = cropped_result["file_id"]
                    photo_data["last_cropped_at"] = datetime.utcnow()
                
                # Cleanup cropped temp file
                if cropped_path and os.path.exists(cropped_path):
                    os.unlink(cropped_path)
        elif border.get("mask"):
            # Single mask border - use same mask for all slots
            logger.info(f"[PRECIOUS_UPLOAD] Applying auto-crop with single mask")
            
            # Get fresh border URL from Telegram
            border_url = await get_fresh_border_url(border)
            
            cropped_path, message = await auto_crop_service.apply_crop_with_border(
                photo_url=original_url,
                border_url=border_url,
                mask_data=border["mask"],
                mirror=False
            )
            
            # Upload cropped version
            cropped_result = await telegram_service.upload_photo(
                file_path=cropped_path,
                caption=f"Cropped precious moment {slot_index + 1}",
                wedding_id=wedding_id
            )
            
            if cropped_result.get("success"):
                cropped_url = await telegram_service.get_file_url(cropped_result["file_id"])
                photo_data["cropped_url"] = cropped_url
                photo_data["cropped_file_id"] = cropped_result["file_id"]
                photo_data["last_cropped_at"] = datetime.utcnow()
            
            # Cleanup cropped temp file
            if cropped_path and os.path.exists(cropped_path):
                os.unlink(cropped_path)
        
        # Update wedding section config
        photos = precious_section.get("photos", [])
        
        # Find and replace photo at slot_index or append
        found = False
        for i, p in enumerate(photos):
            if p.get("slot_index") == slot_index:
                photos[i] = photo_data
                found = True
                break
        
        if not found:
            photos.append(photo_data)
        
        precious_section["photos"] = photos
        section_config["section_4_precious"] = precious_section
        
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {"section_config": section_config, "updated_at": datetime.utcnow()}}
        )
        
        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        logger.info(f"[PRECIOUS_UPLOAD] Successfully uploaded photo for slot {slot_index}: {photo_id}")
        
        return {
            "photo_id": photo_id,
            "original_url": original_url,
            "cropped_url": cropped_url,
            "slot_index": slot_index,
            "message": f"Photo uploaded successfully for slot {slot_index + 1}"
        }
        
    except HTTPException:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        if cropped_path and os.path.exists(cropped_path):
            os.unlink(cropped_path)
        raise
    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        if cropped_path and os.path.exists(cropped_path):
            os.unlink(cropped_path)
        logger.error(f"[PRECIOUS_UPLOAD] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Photo upload failed: {str(e)}"
        )

@router.delete("/weddings/{wedding_id}/sections/precious-moments/photos/{photo_id}")
async def delete_precious_moment_photo(
    wedding_id: str,
    photo_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Delete a photo from precious moments section"""
    try:
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        # Verify ownership
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get section config
        section_config = wedding.get("section_config", {})
        precious_section = section_config.get("section_4_precious", {})
        photos = precious_section.get("photos", [])
        
        # Remove photo with matching photo_id
        updated_photos = [p for p in photos if p.get("photo_id") != photo_id]
        
        if len(updated_photos) == len(photos):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found"
            )
        
        precious_section["photos"] = updated_photos
        section_config["section_4_precious"] = precious_section
        
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {"section_config": section_config, "updated_at": datetime.utcnow()}}
        )
        
        logger.info(f"[PRECIOUS_DELETE] Deleted photo: {photo_id}")
        
        return {"success": True, "message": "Photo deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[PRECIOUS_DELETE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete photo: {str(e)}"
        )

@router.post("/admin/borders/multi-slot/upload")
async def upload_multi_slot_border(
    file: UploadFile = File(...),
    name: str = Form(...),
    slot_count: int = Form(...),  # 2-5
    masks_json: str = Form(...),  # JSON array of mask data for each slot
    tags: str = Form(""),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Upload a multi-slot border for precious moments section
    Each slot must have its own mask defined
    """
    import json
    temp_path = None
    
    try:
        logger.info(f"[MULTI_SLOT_BORDER] Starting upload: {name} with {slot_count} slots")
        
        # Validate slot count
        if slot_count < 2 or slot_count > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slot count must be between 2 and 5"
            )
        
        # Parse masks
        try:
            masks = json.loads(masks_json)
            if not isinstance(masks, list) or len(masks) != slot_count:
                raise ValueError("Masks array must match slot count")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid masks JSON: {str(e)}"
            )
        
        # Validate file
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 10MB limit"
            )
        
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed"
            )
        
        # Save to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
        async with aiofiles.open(temp_file.name, 'wb') as f:
            await f.write(file_content)
        temp_path = temp_file.name
        
        # Get image dimensions
        from PIL import Image
        with Image.open(temp_path) as img:
            width, height = img.size
        
        # Upload to Telegram CDN
        upload_result = await telegram_service.upload_photo(
            file_path=temp_path,
            caption=f"Multi-slot border: {name} ({slot_count} slots)",
            wedding_id="precious-moments-borders"
        )
        
        if not upload_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload to CDN: {upload_result.get('error')}"
            )
        
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []
        tag_list.append("multi-slot")
        tag_list.append(f"{slot_count}-photos")
        
        # Create border document
        border_id = str(uuid.uuid4())
        user_id = current_user.get("id") or current_user.get("user_id") or "unknown"
        
        border_doc = {
            "id": border_id,
            "name": name,
            "cdn_url": upload_result["cdn_url"],
            "telegram_file_id": upload_result["file_id"],
            "masks": masks,  # Array of mask data
            "slot_count": slot_count,
            "width": width,
            "height": height,
            "file_size": upload_result.get("file_size", len(file_content)),
            "orientation": "landscape" if width > height else "portrait" if height > width else "square",
            "tags": tag_list,
            "supports_mirror": False,  # Multi-slot borders don't support mirroring
            "created_at": datetime.utcnow(),
            "uploaded_by": user_id,
            "border_type": "multi_slot"
        }
        
        # Save to database
        await db.photo_borders.insert_one(border_doc)
        
        logger.info(f"[MULTI_SLOT_BORDER] Successfully uploaded: {name} ({border_id})")
        
        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        return {
            "id": border_doc["id"],
            "name": border_doc["name"],
            "cdn_url": border_doc["cdn_url"],
            "slot_count": border_doc["slot_count"],
            "masks": border_doc["masks"],
            "created_at": border_doc["created_at"]
        }
        
    except HTTPException:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise
    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        logger.error(f"[MULTI_SLOT_BORDER] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multi-slot border upload failed: {str(e)}"
        )
