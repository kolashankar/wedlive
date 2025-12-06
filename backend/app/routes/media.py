"""
Media Management Routes
Handles photo/video uploads, media gallery, and recording management
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from app.auth import get_current_user
from app.database import get_db
from app.services.telegram_service import TelegramCDNService
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
import os
import tempfile
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
telegram_service = TelegramCDNService()

# Models
class MediaResponse(BaseModel):
    id: str
    wedding_id: str
    media_type: str  # "photo" or "video"
    file_id: str
    telegram_message_id: int
    caption: Optional[str] = None
    file_size: int
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[int] = None
    uploaded_by: str
    uploaded_at: datetime
    file_url: Optional[str] = None

class RecordingResponse(BaseModel):
    id: str
    wedding_id: str
    recording_url: str
    duration: Optional[int] = None
    file_size: Optional[int] = None
    status: str  # "processing", "ready", "failed"
    created_at: datetime

# Media Upload Routes
@router.post("/upload/photo", response_model=MediaResponse)
async def upload_photo(
    wedding_id: str = Form(...),
    caption: str = Form(""),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a photo to wedding media gallery"""
    db = get_db()
    
    # Verify wedding exists and user has access
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload media for this wedding"
        )
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )
    
    # Save file temporarily
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Upload to Telegram
        result = await telegram_service.upload_photo(temp_path, caption, wedding_id)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {result.get('error', 'Unknown error')}"
            )
        
        # Save to database
        media_id = str(uuid.uuid4())
        media = {
            "id": media_id,
            "wedding_id": wedding_id,
            "media_type": "photo",
            "file_id": result["file_id"],
            "telegram_message_id": result["message_id"],
            "caption": caption,
            "file_size": result["file_size"],
            "width": result.get("width"),
            "height": result.get("height"),
            "uploaded_by": current_user["user_id"],
            "uploaded_at": datetime.utcnow()
        }
        
        await db.media.insert_one(media)
        
        # Get file URL
        file_url = await telegram_service.get_file_url(result["file_id"])
        
        return MediaResponse(
            id=media["id"],
            wedding_id=media["wedding_id"],
            media_type=media["media_type"],
            file_id=media["file_id"],
            telegram_message_id=media["telegram_message_id"],
            caption=media.get("caption"),
            file_size=media["file_size"],
            width=media.get("width"),
            height=media.get("height"),
            uploaded_by=media["uploaded_by"],
            uploaded_at=media["uploaded_at"],
            file_url=file_url
        )
        
    except Exception as e:
        logger.error(f"Error uploading photo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/upload/video", response_model=MediaResponse)
async def upload_video(
    wedding_id: str = Form(...),
    caption: str = Form(""),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a video to wedding media gallery"""
    db = get_db()
    
    # Verify wedding exists and user has access
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload media for this wedding"
        )
    
    # Validate file type
    if not file.content_type.startswith("video/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only video files are allowed"
        )
    
    # Save file temporarily
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Upload to Telegram
        result = await telegram_service.upload_video(temp_path, caption, wedding_id)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {result.get('error', 'Unknown error')}"
            )
        
        # Save to database
        media_id = str(uuid.uuid4())
        media = {
            "id": media_id,
            "wedding_id": wedding_id,
            "media_type": "video",
            "file_id": result["file_id"],
            "telegram_message_id": result["message_id"],
            "caption": caption,
            "file_size": result["file_size"],
            "width": result.get("width"),
            "height": result.get("height"),
            "duration": result.get("duration"),
            "uploaded_by": current_user["user_id"],
            "uploaded_at": datetime.utcnow()
        }
        
        await db.media.insert_one(media)
        
        # Get file URL
        file_url = await telegram_service.get_file_url(result["file_id"])
        
        return MediaResponse(
            id=media["id"],
            wedding_id=media["wedding_id"],
            media_type=media["media_type"],
            file_id=media["file_id"],
            telegram_message_id=media["telegram_message_id"],
            caption=media.get("caption"),
            file_size=media["file_size"],
            width=media.get("width"),
            height=media.get("height"),
            duration=media.get("duration"),
            uploaded_by=media["uploaded_by"],
            uploaded_at=media["uploaded_at"],
            file_url=file_url
        )
        
    except Exception as e:
        logger.error(f"Error uploading video: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

# Media Gallery Routes
@router.get("/gallery/{wedding_id}", response_model=List[MediaResponse])
async def get_wedding_gallery(wedding_id: str, skip: int = 0, limit: int = 50):
    """Get all media for a wedding (public access)"""
    db = get_db()
    
    # Verify wedding exists
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    # Get media
    cursor = db.media.find({"wedding_id": wedding_id}).sort("uploaded_at", -1).skip(skip).limit(limit)
    media_list = await cursor.to_list(length=limit)
    
    result = []
    for media in media_list:
        # Get file URL
        file_url = await telegram_service.get_file_url(media["file_id"])
        
        result.append(MediaResponse(
            id=media["id"],
            wedding_id=media["wedding_id"],
            media_type=media["media_type"],
            file_id=media["file_id"],
            telegram_message_id=media["telegram_message_id"],
            caption=media.get("caption"),
            file_size=media["file_size"],
            width=media.get("width"),
            height=media.get("height"),
            duration=media.get("duration"),
            uploaded_by=media["uploaded_by"],
            uploaded_at=media["uploaded_at"],
            file_url=file_url
        ))
    
    return result

@router.delete("/media/{media_id}")
async def delete_media(media_id: str, current_user: dict = Depends(get_current_user)):
    """Delete media item"""
    db = get_db()
    
    media = await db.media.find_one({"id": media_id})
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found"
        )
    
    # Check authorization
    wedding = await db.weddings.find_one({"id": media["wedding_id"]})
    if wedding["creator_id"] != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this media"
        )
    
    # Delete from Telegram
    await telegram_service.delete_message(media["telegram_message_id"])
    
    # Delete from database
    await db.media.delete_one({"id": media_id})
    
    return {"message": "Media deleted successfully"}

# Recording Management Routes
@router.get("/recordings/{wedding_id}", response_model=List[RecordingResponse])
async def get_wedding_recordings(wedding_id: str):
    """Get all recordings for a wedding"""
    db = get_db()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    cursor = db.recordings.find({"wedding_id": wedding_id}).sort("created_at", -1)
    recordings = await cursor.to_list(length=100)
    
    return [
        RecordingResponse(
            id=rec["id"],
            wedding_id=rec["wedding_id"],
            recording_url=rec["recording_url"],
            duration=rec.get("duration"),
            file_size=rec.get("file_size"),
            status=rec["status"],
            created_at=rec["created_at"]
        )
        for rec in recordings
    ]

@router.post("/recordings", response_model=RecordingResponse)
async def create_recording(
    wedding_id: str = Form(...),
    recording_url: str = Form(...),
    duration: Optional[int] = Form(None),
    file_size: Optional[int] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Create a recording entry"""
    db = get_db()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    recording_id = str(uuid.uuid4())
    recording = {
        "id": recording_id,
        "wedding_id": wedding_id,
        "recording_url": recording_url,
        "duration": duration,
        "file_size": file_size,
        "status": "ready",
        "created_at": datetime.utcnow()
    }
    
    await db.recordings.insert_one(recording)
    
    # Update wedding with recording URL
    await db.weddings.update_one(
        {"id": wedding_id},
        {"$set": {"recording_url": recording_url, "status": "recorded"}}
    )
    
    return RecordingResponse(**recording)
