"""
Section Configuration Routes
Handles 3-section wedding configuration with dynamic borders
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from app.models_sections import (
    WeddingSectionConfig, CoverCoupleSection, StudioSection,
    CoverMode, PhotoWithCrop, UpdateCoverSectionRequest,
    UpdateStudioSectionRequest, PhotoCropResponse, RecropResponse,
    RecropPhotoRequest
)
from app.auth import get_current_user
from app.database import get_db_dependency
from app.services.telegram_service import TelegramCDNService
from app.services.auto_crop_service import auto_crop_service
from typing import Optional
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

# ==================== SECTION CONFIGURATION ====================

@router.get("/weddings/{wedding_id}/sections")
async def get_wedding_sections(
    wedding_id: str,
    db = Depends(get_db_dependency)
):
    """Get wedding section configuration (public access)"""
    try:
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        section_config = wedding.get("section_config", {})
        
        # Return default if not set
        if not section_config:
            section_config = WeddingSectionConfig().model_dump()
        
        return section_config
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_SECTIONS] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get section configuration"
        )

# ==================== SECTION 1: COVER/COUPLE ====================

@router.put("/weddings/{wedding_id}/sections/cover")
async def update_cover_section(
    wedding_id: str,
    update_data: UpdateCoverSectionRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Update cover/couple section configuration"""
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
        if not section_config:
            section_config = WeddingSectionConfig().model_dump()
        
        # Get current cover section
        cover_section = section_config.get("section_1_cover", {})
        
        # Update fields
        if update_data.mode is not None:
            cover_section["mode"] = update_data.mode.value
        
        if update_data.couple_border_id is not None:
            cover_section["couple_border_id"] = update_data.couple_border_id
        
        if update_data.selected_border_id is not None:
            cover_section["selected_border_id"] = update_data.selected_border_id
        
        # Save updated config
        section_config["section_1_cover"] = cover_section
        
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {"section_config": section_config, "updated_at": datetime.utcnow()}}
        )
        
        logger.info(f"[COVER_UPDATE] Updated cover section for wedding: {wedding_id}")
        
        return {"success": True, "section_config": cover_section}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[COVER_UPDATE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update cover section: {str(e)}"
        )

@router.post("/weddings/{wedding_id}/sections/cover/upload-photo", response_model=PhotoCropResponse)
async def upload_cover_photo(
    wedding_id: str,
    category: str = Form(...),  # "couple", "bride", "groom"
    border_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Upload photo for cover section with auto-crop
    Category: couple, bride, or groom
    """
    temp_path = None
    cropped_path = None
    
    try:
        logger.info(f"[COVER_UPLOAD] Uploading {category} photo for wedding: {wedding_id}")
        
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
            caption=f"Original {category} photo",
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
            "border_id": border_id,
            "cropped_url": None,
            "cropped_file_id": None,
            "is_mirrored": False,
            "uploaded_at": datetime.utcnow(),
            "last_cropped_at": None
        }
        
        # If border is provided, apply auto-crop
        cropped_url = None
        if border_id:
            logger.info(f"[COVER_UPLOAD] Applying auto-crop with border: {border_id}")
            
            # Get border data
            border = await db.photo_borders.find_one({"id": border_id})
            if not border:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Border not found"
                )
            
            # Determine if mirroring needed (groom photos in separate mode)
            mirror = (category == "groom")
            
            # Get fresh border URL from Telegram
            border_url = await get_fresh_border_url(border)
            
            # Apply auto-crop
            cropped_path, message = await auto_crop_service.apply_crop_with_border(
                photo_url=original_url,
                border_url=border_url,
                mask_data=border["mask"],
                mirror=mirror
            )
            
            # Upload cropped version
            cropped_result = await telegram_service.upload_photo(
                file_path=cropped_path,
                caption=f"Cropped {category} photo with border",
                wedding_id=wedding_id
            )
            
            if cropped_result.get("success"):
                cropped_url = await telegram_service.get_file_url(cropped_result["file_id"])
                photo_data["cropped_url"] = cropped_url
                photo_data["cropped_file_id"] = cropped_result["file_id"]
                photo_data["is_mirrored"] = mirror
                photo_data["last_cropped_at"] = datetime.utcnow()
            
            # Cleanup cropped temp file
            if cropped_path and os.path.exists(cropped_path):
                os.unlink(cropped_path)
        
        # Update wedding section config
        section_config = wedding.get("section_config", {})
        if not section_config:
            section_config = WeddingSectionConfig().model_dump()
        
        cover_section = section_config.get("section_1_cover", {})
        
        if category == "couple":
            cover_section["couple_photo"] = photo_data
        elif category == "bride":
            cover_section["bride_photo"] = photo_data
        elif category == "groom":
            cover_section["groom_photo"] = photo_data
        
        section_config["section_1_cover"] = cover_section
        
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {"section_config": section_config, "updated_at": datetime.utcnow()}}
        )
        
        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        logger.info(f"[COVER_UPLOAD] Successfully uploaded {category} photo: {photo_id}")
        
        return PhotoCropResponse(
            photo_id=photo_id,
            original_url=original_url,
            cropped_url=cropped_url,
            border_applied=border_id,
            message=f"{category.capitalize()} photo uploaded successfully"
        )
        
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
        logger.error(f"[COVER_UPLOAD] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Photo upload failed: {str(e)}"
        )

# ==================== SECTION 3: STUDIO ====================

@router.put("/weddings/{wedding_id}/sections/studio")
async def update_studio_section(
    wedding_id: str,
    update_data: UpdateStudioSectionRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Update studio section configuration"""
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
        if not section_config:
            section_config = WeddingSectionConfig().model_dump()
        
        # Get current studio section
        studio_section = section_config.get("section_3_studio", {})
        
        # Update studio_id and fetch studio details
        if update_data.studio_id is not None:
            studio_section["studio_id"] = update_data.studio_id
            
            # Fetch studio details
            if update_data.studio_id:
                studio = await db.studios.find_one({"id": update_data.studio_id})
                if studio:
                    studio_section["studio_name"] = studio.get("name", "")
                    studio_section["studio_logo_url"] = studio.get("logo_url", "")
                    studio_section["studio_contact"] = studio.get("phone", "")
                    studio_section["studio_website"] = studio.get("website", "")
                    studio_section["studio_email"] = studio.get("email", "")
                    studio_section["studio_phone"] = studio.get("phone", "")
        
        # Update border
        if update_data.studio_border_id is not None:
            studio_section["studio_border_id"] = update_data.studio_border_id
        
        # Save updated config
        section_config["section_3_studio"] = studio_section
        
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {"section_config": section_config, "updated_at": datetime.utcnow()}}
        )
        
        logger.info(f"[STUDIO_UPDATE] Updated studio section for wedding: {wedding_id}")
        
        return {"success": True, "section_config": studio_section}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[STUDIO_UPDATE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update studio section: {str(e)}"
        )

# ==================== RE-CROP PHOTO ====================

@router.post("/weddings/{wedding_id}/recrop", response_model=RecropResponse)
async def recrop_photo(
    wedding_id: str,
    request_data: RecropPhotoRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Re-crop an existing photo with a new border
    Always uses original image as source
    """
    cropped_path = None
    
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
        
        # Find photo in section config
        section_config = wedding.get("section_config", {})
        photo_data = None
        section_key = None
        photo_key = None
        
        # Search in cover section
        cover_section = section_config.get("section_1_cover", {})
        for key in ["couple_photo", "bride_photo", "groom_photo"]:
            if cover_section.get(key, {}).get("photo_id") == request_data.photo_id:
                photo_data = cover_section[key]
                section_key = "section_1_cover"
                photo_key = key
                break
        
        # Search in studio section
        if not photo_data:
            studio_section = section_config.get("section_3_studio", {})
            if studio_section.get("studio_photo", {}).get("photo_id") == request_data.photo_id:
                photo_data = studio_section["studio_photo"]
                section_key = "section_3_studio"
                photo_key = "studio_photo"
        
        if not photo_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found in wedding configuration"
            )
        
        # Get new border
        new_border = await db.photo_borders.find_one({"id": request_data.new_border_id})
        if not new_border:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Border not found"
            )
        
        logger.info(f"[RECROP] Re-cropping photo {request_data.photo_id} with border {request_data.new_border_id}")
        
        # Get fresh border URL from Telegram
        new_border_url = await get_fresh_border_url(new_border)
        
        # Apply auto-crop with new border
        cropped_path, message = await auto_crop_service.recrop_photo(
            original_photo_url=photo_data["original_url"],
            new_border_url=new_border_url,
            new_mask_data=new_border["mask"],
            mirror=photo_data.get("is_mirrored", False)
        )
        
        # Upload new cropped version
        cropped_result = await telegram_service.upload_photo(
            file_path=cropped_path,
            caption=f"Re-cropped photo with new border",
            wedding_id=wedding_id
        )
        
        if not cropped_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload re-cropped photo"
            )
        
        new_cropped_url = await telegram_service.get_file_url(cropped_result["file_id"])
        
        # Update photo data
        photo_data["border_id"] = request_data.new_border_id
        photo_data["cropped_url"] = new_cropped_url
        photo_data["cropped_file_id"] = cropped_result["file_id"]
        photo_data["last_cropped_at"] = datetime.utcnow()
        
        # Update in database
        section_config[section_key][photo_key] = photo_data
        
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {"section_config": section_config, "updated_at": datetime.utcnow()}}
        )
        
        # Cleanup
        if cropped_path and os.path.exists(cropped_path):
            os.unlink(cropped_path)
        
        logger.info(f"[RECROP] Successfully re-cropped photo: {request_data.photo_id}")
        
        return RecropResponse(
            photo_id=request_data.photo_id,
            new_cropped_url=new_cropped_url,
            message="Photo re-cropped successfully with new border"
        )
        
    except HTTPException:
        if cropped_path and os.path.exists(cropped_path):
            os.unlink(cropped_path)
        raise
    except Exception as e:
        if cropped_path and os.path.exists(cropped_path):
            os.unlink(cropped_path)
        logger.error(f"[RECROP] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Re-crop failed: {str(e)}"
        )
