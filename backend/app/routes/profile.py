from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from app.models import UserResponse
from app.auth import get_current_user
from app.database import get_db
from app.services.telegram_service import TelegramCDNService
from datetime import datetime
import logging
import os
import tempfile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/profile", tags=["Profile"])
telegram_service = TelegramCDNService()

# Studio Models
from pydantic import BaseModel, HttpUrl

class StudioCreate(BaseModel):
    name: str
    logo_url: Optional[str] = None
    website: Optional[HttpUrl] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    # Keep old 'contact' field for backward compatibility
    contact: Optional[str] = None

class StudioResponse(BaseModel):
    id: str
    name: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    # Keep old 'contact' field for backward compatibility
    contact: Optional[str] = None
    created_at: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


@router.get("/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile with studios"""
    try:
        db = get_db()
        user = await db.users.find_one({"id": current_user["user_id"]})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's studios
        studios_cursor = db.studios.find({"user_id": current_user["user_id"]})
        studios = []
        async for studio in studios_cursor:
            # Handle both old and new studio documents
            studio_id = studio.get("id") or str(studio["_id"])
            studios.append({
                "id": studio_id,
                "name": studio["name"],
                "logo_url": studio.get("logo_url"),
                "website": studio.get("website"),
                "email": studio.get("email"),
                "phone": studio.get("phone"),
                "address": studio.get("address"),
                "contact": studio.get("contact"),  # Backward compatibility
                "created_at": studio["created_at"].isoformat()
            })
        
        return {
            "id": user["id"],
            "email": user["email"],
            "full_name": user.get("full_name"),
            "phone": user.get("phone"),
            "avatar_url": user.get("avatar_url"),
            "role": user.get("role", "user"),
            "subscription_plan": user.get("subscription_plan", "free"),
            "studios": studios,
            "created_at": user["created_at"].isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update")
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    try:
        db = get_db()
        
        update_fields = profile_data.dict(exclude_unset=True)
        update_fields["updated_at"] = datetime.utcnow()
        
        await db.users.update_one(
            {"id": current_user["user_id"]},
            {"$set": update_fields}
        )
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload profile avatar to Telegram CDN"""
    tmp_path = None
    try:
        logger.info(f"[AVATAR_UPLOAD] Upload request from user: {current_user['user_id']}")
        logger.info(f"[AVATAR_UPLOAD] File: {file.filename}, Content-Type: {file.content_type}")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            logger.error(f"[AVATAR_UPLOAD] Invalid file type: {file.content_type}")
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        logger.info(f"[AVATAR_UPLOAD] Temp file created: {tmp_path}, size: {len(content)} bytes")
        
        try:
            # Upload to Telegram
            logger.info(f"[AVATAR_UPLOAD] Starting Telegram upload...")
            result = await telegram_service.upload_photo(tmp_path, f"Avatar for {current_user['user_id']}")
            file_id = result['file_id']
            cdn_url = result['cdn_url']
            logger.info(f"[AVATAR_UPLOAD] Telegram upload successful: {cdn_url}")
            
            # Update user avatar
            db = get_db()
            update_result = await db.users.update_one(
                {"id": current_user["user_id"]},
                {"$set": {
                    "avatar_url": cdn_url,
                    "avatar_file_id": file_id,
                    "updated_at": datetime.utcnow()
                }}
            )
            logger.info(f"[AVATAR_UPLOAD] User avatar updated: matched={update_result.matched_count}, modified={update_result.modified_count}")
            
            return {
                "avatar_url": cdn_url,
                "message": "Avatar uploaded successfully"
            }
        finally:
            # Clean up temp file
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
                logger.info(f"[AVATAR_UPLOAD] Temp file cleaned up")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AVATAR_UPLOAD] Error uploading avatar: {str(e)}")
        import traceback
        logger.error(f"[AVATAR_UPLOAD] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")


@router.post("/studios", response_model=StudioResponse)
async def create_studio(
    studio_data: StudioCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new studio (Premium only)"""
    try:
        db = get_db()
        
        # Check if user has premium subscription
        user = await db.users.find_one({"id": current_user["user_id"]})
        if user.get("subscription_plan") == "free":
            raise HTTPException(
                status_code=403,
                detail="Studio management is only available for Premium users. Please upgrade your plan."
            )
        
        import uuid
        studio_id = str(uuid.uuid4())
        
        studio_doc = {
            "_id": studio_id,
            "user_id": current_user["user_id"],
            "name": studio_data.name,
            "logo_url": studio_data.logo_url,
            "website": str(studio_data.website) if studio_data.website and studio_data.website != "" else None,
            "email": studio_data.email,
            "phone": studio_data.phone,
            "address": studio_data.address,
            "contact": studio_data.contact,  # Backward compatibility
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.studios.insert_one(studio_doc)
        
        return StudioResponse(
            id=studio_id,
            name=studio_data.name,
            logo_url=studio_data.logo_url,
            website=studio_data.website,
            email=studio_data.email,
            phone=studio_data.phone,
            address=studio_data.address,
            contact=studio_data.contact,
            created_at=studio_doc["created_at"].isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating studio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/studios", response_model=List[StudioResponse])
async def get_studios(current_user: dict = Depends(get_current_user)):
    """Get all studios for current user"""
    try:
        db = get_db()
        studios_cursor = db.studios.find({"user_id": current_user["user_id"]})
        studios = []
        
        async for studio in studios_cursor:
            # Handle both old and new studio documents
            studio_id = studio.get("id") or str(studio["_id"])
            studios.append(StudioResponse(
                id=studio_id,
                name=studio["name"],
                logo_url=studio.get("logo_url"),
                website=studio.get("website"),
                email=studio.get("email"),
                phone=studio.get("phone"),
                address=studio.get("address"),
                contact=studio.get("contact"),
                created_at=studio["created_at"].isoformat()
            ))
        
        return studios
    except Exception as e:
        logger.error(f"Error getting studios: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/studios/{studio_id}", response_model=StudioResponse)
async def update_studio(
    studio_id: str,
    studio_data: StudioCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update studio details"""
    try:
        db = get_db()
        
        # Verify ownership
        studio = await db.studios.find_one({"_id": studio_id, "user_id": current_user["user_id"]})
        if not studio:
            raise HTTPException(status_code=404, detail="Studio not found")
        
        update_data = studio_data.dict(exclude_unset=True)
        if "website" in update_data and update_data["website"] and update_data["website"] != "":
            update_data["website"] = str(update_data["website"])
        update_data["updated_at"] = datetime.utcnow()
        
        await db.studios.update_one(
            {"_id": studio_id},
            {"$set": update_data}
        )
        
        updated_studio = await db.studios.find_one({"_id": studio_id})
        
        return StudioResponse(
            id=str(updated_studio["_id"]),
            name=updated_studio["name"],
            logo_url=updated_studio.get("logo_url"),
            website=updated_studio.get("website"),
            email=updated_studio.get("email"),
            phone=updated_studio.get("phone"),
            address=updated_studio.get("address"),
            contact=updated_studio.get("contact"),
            created_at=updated_studio["created_at"].isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating studio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/studios/{studio_id}")
async def delete_studio(
    studio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete studio"""
    try:
        db = get_db()
        
        # Verify ownership
        studio = await db.studios.find_one({"_id": studio_id, "user_id": current_user["user_id"]})
        if not studio:
            raise HTTPException(status_code=404, detail="Studio not found")
        
        await db.studios.delete_one({"_id": studio_id})
        
        return {"message": "Studio deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting studio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/studios/{studio_id}/logo")
async def upload_studio_logo(
    studio_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload studio logo to Telegram CDN"""
    tmp_path = None
    try:
        db = get_db()
        
        logger.info(f"[STUDIO_LOGO] Upload request for studio_id: {studio_id}")
        
        # Verify ownership
        studio = await db.studios.find_one({"_id": studio_id, "user_id": current_user["user_id"]})
        if not studio:
            logger.error(f"[STUDIO_LOGO] Studio not found: {studio_id}")
            raise HTTPException(status_code=404, detail="Studio not found")
        
        logger.info(f"[STUDIO_LOGO] Studio found: {studio['name']}")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            logger.error(f"[STUDIO_LOGO] Invalid file type: {file.content_type}")
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        logger.info(f"[STUDIO_LOGO] File type valid: {file.content_type}, size: {file.size if hasattr(file, 'size') else 'unknown'}")
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        logger.info(f"[STUDIO_LOGO] Temp file created: {tmp_path}, size: {len(content)} bytes")
        
        try:
            # Upload to Telegram
            logger.info(f"[STUDIO_LOGO] Starting Telegram upload...")
            result = await telegram_service.upload_photo(tmp_path, f"Logo for {studio['name']}")
            cdn_url = result['cdn_url']
            logger.info(f"[STUDIO_LOGO] Telegram upload successful: {cdn_url}")
            
            # Update studio logo
            update_result = await db.studios.update_one(
                {"_id": studio_id},
                {"$set": {
                    "logo_url": cdn_url,
                    "updated_at": datetime.utcnow()
                }}
            )
            logger.info(f"[STUDIO_LOGO] Database updated: matched={update_result.matched_count}, modified={update_result.modified_count}")
            
            return {
                "logo_url": cdn_url,
                "message": "Studio logo uploaded successfully"
            }
        finally:
            # Clean up temp file
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
                logger.info(f"[STUDIO_LOGO] Temp file cleaned up")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[STUDIO_LOGO] Error uploading studio logo: {str(e)}")
        import traceback
        logger.error(f"[STUDIO_LOGO] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
