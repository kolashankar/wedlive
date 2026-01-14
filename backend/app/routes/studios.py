"""
Studio Management Routes
Handles studio profiles for Section 3
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from app.models_sections import StudioCreate, StudioUpdate, StudioResponse
from app.auth import get_current_user
from app.database import get_db_dependency
from app.services.telegram_service import TelegramCDNService
from typing import List
from datetime import datetime
import uuid
import os
import logging
import tempfile
import aiofiles

logger = logging.getLogger(__name__)
router = APIRouter()
telegram_service = TelegramCDNService()

# ==================== STUDIO CRUD ====================

@router.post("/studios", response_model=StudioResponse)
async def create_studio(
    studio_data: StudioCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Create a new studio profile"""
    try:
        studio_id = str(uuid.uuid4())
        
        studio_doc = {
            "id": studio_id,
            "user_id": current_user["user_id"],
            "name": studio_data.name,
            "logo_url": "",
            "email": studio_data.email,
            "phone": studio_data.phone,
            "address": studio_data.address,
            "website": studio_data.website,
            "instagram": studio_data.instagram,
            "facebook": studio_data.facebook,
            "default_image_url": "",
            "default_image_file_id": "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.studios.insert_one(studio_doc)
        
        logger.info(f"[STUDIO_CREATE] Created studio: {studio_data.name} ({studio_id})")
        
        return StudioResponse(
            id=studio_doc["id"],
            name=studio_doc["name"],
            logo_url=studio_doc["logo_url"],
            email=studio_doc["email"],
            phone=studio_doc["phone"],
            address=studio_doc["address"],
            website=studio_doc["website"],
            instagram=studio_doc["instagram"],
            facebook=studio_doc["facebook"],
            default_image_url=studio_doc["default_image_url"],
            created_at=studio_doc["created_at"]
        )
        
    except Exception as e:
        logger.error(f"[STUDIO_CREATE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create studio: {str(e)}"
        )

@router.get("/studios", response_model=List[StudioResponse])
async def list_my_studios(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """List user's studios"""
    try:
        cursor = db.studios.find({"user_id": current_user["user_id"]}).sort("created_at", -1)
        studios = await cursor.to_list(length=100)
        
        return [
            StudioResponse(
                id=studio["id"],
                name=studio["name"],
                logo_url=studio.get("logo_url", ""),
                email=studio.get("email", ""),
                phone=studio.get("phone", ""),
                address=studio.get("address", ""),
                website=studio.get("website", ""),
                instagram=studio.get("instagram", ""),
                facebook=studio.get("facebook", ""),
                default_image_url=studio.get("default_image_url", ""),
                created_at=studio["created_at"]
            )
            for studio in studios
        ]
        
    except Exception as e:
        logger.error(f"[STUDIO_LIST] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list studios"
        )

@router.get("/studios/{studio_id}", response_model=StudioResponse)
async def get_studio(
    studio_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Get a specific studio"""
    try:
        studio = await db.studios.find_one({"id": studio_id})
        
        if not studio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Studio not found"
            )
        
        # Verify ownership
        if studio["user_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this studio"
            )
        
        return StudioResponse(
            id=studio["id"],
            name=studio["name"],
            logo_url=studio.get("logo_url", ""),
            email=studio.get("email", ""),
            phone=studio.get("phone", ""),
            address=studio.get("address", ""),
            website=studio.get("website", ""),
            instagram=studio.get("instagram", ""),
            facebook=studio.get("facebook", ""),
            default_image_url=studio.get("default_image_url", ""),
            created_at=studio["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[STUDIO_GET] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get studio"
        )

@router.put("/studios/{studio_id}", response_model=StudioResponse)
async def update_studio(
    studio_id: str,
    studio_data: StudioUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Update studio details"""
    try:
        studio = await db.studios.find_one({"id": studio_id})
        
        if not studio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Studio not found"
            )
        
        # Verify ownership
        if studio["user_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this studio"
            )
        
        # Update only provided fields
        update_data = studio_data.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        await db.studios.update_one(
            {"id": studio_id},
            {"$set": update_data}
        )
        
        updated_studio = await db.studios.find_one({"id": studio_id})
        
        logger.info(f"[STUDIO_UPDATE] Updated studio: {studio_id}")
        
        return StudioResponse(
            id=updated_studio["id"],
            name=updated_studio["name"],
            logo_url=updated_studio.get("logo_url", ""),
            email=updated_studio.get("email", ""),
            phone=updated_studio.get("phone", ""),
            address=updated_studio.get("address", ""),
            website=updated_studio.get("website", ""),
            instagram=updated_studio.get("instagram", ""),
            facebook=updated_studio.get("facebook", ""),
            default_image_url=updated_studio.get("default_image_url", ""),
            created_at=updated_studio["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[STUDIO_UPDATE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update studio"
        )

@router.delete("/studios/{studio_id}")
async def delete_studio(
    studio_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Delete a studio"""
    try:
        studio = await db.studios.find_one({"id": studio_id})
        
        if not studio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Studio not found"
            )
        
        # Verify ownership
        if studio["user_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this studio"
            )
        
        await db.studios.delete_one({"id": studio_id})
        
        logger.info(f"[STUDIO_DELETE] Deleted studio: {studio_id}")
        
        return {"success": True, "message": "Studio deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[STUDIO_DELETE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete studio"
        )

# ==================== STUDIO LOGO UPLOAD ====================

@router.post("/studios/{studio_id}/logo")
async def upload_studio_logo(
    studio_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Upload studio logo"""
    temp_path = None
    
    try:
        studio = await db.studios.find_one({"id": studio_id})
        
        if not studio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Studio not found"
            )
        
        # Verify ownership
        if studio["user_id"] != current_user["user_id"]:
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
        
        # Upload to Telegram
        upload_result = await telegram_service.upload_photo(
            file_path=temp_path,
            caption=f"Studio logo: {studio['name']}",
            wedding_id=f"studio-{studio_id}"
        )
        
        if not upload_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload logo"
            )
        
        logo_url = await telegram_service.get_file_url(upload_result["file_id"])
        
        # Validate that we got a direct image URL, not a redirect
        if "google.com/url" in logo_url or "googleurl" in logo_url:
            logger.error(f"[STUDIO_LOGO] Invalid logo URL detected: {logo_url}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid logo URL generated. Please try uploading again."
            )
        
        # Update studio
        await db.studios.update_one(
            {"id": studio_id},
            {"$set": {"logo_url": logo_url, "updated_at": datetime.utcnow()}}
        )
        
        # Cleanup
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        logger.info(f"[STUDIO_LOGO] Uploaded logo for studio: {studio_id}")
        
        return {"success": True, "logo_url": logo_url}
        
    except HTTPException:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise
    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        logger.error(f"[STUDIO_LOGO] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logo upload failed: {str(e)}"
        )

# ==================== STUDIO DEFAULT IMAGE ====================

@router.post("/studios/{studio_id}/default-image")
async def upload_studio_default_image(
    studio_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Upload studio default image"""
    temp_path = None
    
    try:
        studio = await db.studios.find_one({"id": studio_id})
        
        if not studio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Studio not found"
            )
        
        # Verify ownership
        if studio["user_id"] != current_user["user_id"]:
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
        
        # Upload to Telegram
        upload_result = await telegram_service.upload_photo(
            file_path=temp_path,
            caption=f"Studio default image: {studio['name']}",
            wedding_id=f"studio-{studio_id}"
        )
        
        if not upload_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image"
            )
        
        image_url = await telegram_service.get_file_url(upload_result["file_id"])
        
        # Validate that we got a direct image URL, not a redirect
        if "google.com/url" in image_url or "googleurl" in image_url:
            logger.error(f"[STUDIO_IMAGE] Invalid image URL detected: {image_url}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid image URL generated. Please try uploading again."
            )
        
        # Update studio
        await db.studios.update_one(
            {"id": studio_id},
            {"$set": {
                "default_image_url": image_url,
                "default_image_file_id": upload_result["file_id"],
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Cleanup
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        logger.info(f"[STUDIO_IMAGE] Uploaded default image for studio: {studio_id}")
        
        return {"success": True, "image_url": image_url}
        
    except HTTPException:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise
    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        logger.error(f"[STUDIO_IMAGE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {str(e)}"
        )

# ==================== STUDIO LOGO CLEANUP ====================

@router.post("/studios/cleanup-invalid-urls")
async def cleanup_invalid_studio_urls(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Clean up studios with invalid Google redirect URLs"""
    try:
        # Find all studios with Google redirect URLs
        studios_with_bad_urls = []
        cursor = db.studios.find({
            "$or": [
                {"logo_url": {"$regex": "google\\.com/url"}},
                {"default_image_url": {"$regex": "google\\.com/url"}}
            ]
        })
        
        async for studio in cursor:
            # Verify ownership
            if studio["user_id"] != current_user["user_id"]:
                continue
                
            studios_with_bad_urls.append(studio)
        
        logger.info(f"[CLEANUP] Found {len(studios_with_bad_urls)} studios with invalid URLs for user {current_user['user_id']}")
        
        fixed_count = 0
        for studio in studios_with_bad_urls:
            updates = {}
            
            # Clear invalid logo URL
            if "logo_url" in studio and "google.com/url" in studio.get("logo_url", ""):
                updates["logo_url"] = ""
                logger.info(f"[CLEANUP] Clearing invalid logo_url for studio {studio['id']}")
            
            # Clear invalid default image URL
            if "default_image_url" in studio and "google.com/url" in studio.get("default_image_url", ""):
                updates["default_image_url"] = ""
                updates["default_image_file_id"] = ""
                logger.info(f"[CLEANUP] Clearing invalid default_image_url for studio {studio['id']}")
            
            if updates:
                updates["updated_at"] = datetime.utcnow()
                await db.studios.update_one(
                    {"id": studio["id"]},
                    {"$set": updates}
                )
                fixed_count += 1
        
        logger.info(f"[CLEANUP] Fixed {fixed_count} studios")
        
        return {
            "success": True,
            "message": f"Fixed {fixed_count} studios with invalid URLs",
            "fixed_count": fixed_count
        }
        
    except Exception as e:
        logger.error(f"[CLEANUP] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup studio URLs: {str(e)}"
        )
