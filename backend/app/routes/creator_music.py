"""Creator Music Management Routes"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
import uuid
import os
import aiofiles
import mutagen

from app.auth import get_current_user
from app.database import get_db
from app.models_music import (
    CreatorMusicCreate,
    CreatorMusicResponse,
    MusicLibraryResponse,
    AudioFormat,
    AudioCategory,
    UploadedByRole
)
from app.services.telegram_service import TelegramCDNService
from app.services.storage_service import StorageService
from app.plan_restrictions import get_storage_limit

router = APIRouter(prefix="/api/music", tags=["creator-music"])

# Initialize services
telegram_service = TelegramCDNService()
storage_service = StorageService()

# Helper function to get audio duration
async def get_audio_duration(file_path: str) -> Optional[int]:
    """Get audio duration in seconds"""
    try:
        audio = mutagen.File(file_path)
        if audio and audio.info:
            return int(audio.info.length)
    except Exception as e:
        print(f"Error getting audio duration: {e}")
    return None

# Helper function to determine audio format
def get_audio_format(filename: str) -> AudioFormat:
    """Determine audio format from filename"""
    ext = os.path.splitext(filename)[1].lower()
    format_map = {
        ".mp3": AudioFormat.MP3,
        ".wav": AudioFormat.WAV,
        ".aac": AudioFormat.AAC,
        ".ogg": AudioFormat.OGG,
        ".m4a": AudioFormat.M4A
    }
    return format_map.get(ext, AudioFormat.MP3)

# ==================== CREATOR MUSIC UPLOAD ====================

@router.post("/upload", response_model=CreatorMusicResponse)
async def upload_creator_music(
    file: UploadFile = File(...),
    title: str = Form(...),
    artist: Optional[str] = Form(None),
    is_private: bool = Form(True),
    current_user: dict = Depends(get_current_user)
):
    """Upload personal music for creator"""
    db = get_db()
    user_id = current_user["user_id"]
    
    # Validate file format
    allowed_formats = [".mp3", ".wav", ".aac", ".ogg", ".m4a"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_formats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format. Allowed: {', '.join(allowed_formats)}"
        )
    
    # Check file size (max 50MB)
    max_size = 50 * 1024 * 1024  # 50MB
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 50MB"
        )
    
    # Check storage quota
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    plan = user.get("subscription_plan", "free")
    storage_limit = get_storage_limit(plan)
    current_storage = user.get("storage_used", 0)
    
    if current_storage + file_size > storage_limit:
        raise HTTPException(
            status_code=status.HTTP_507_INSUFFICIENT_STORAGE,
            detail=f"Storage quota exceeded. Limit: {storage_limit} bytes, Used: {current_storage} bytes"
        )
    
    # Save to temp file
    temp_path = f"/tmp/{uuid.uuid4()}{file_ext}"
    async with aiofiles.open(temp_path, 'wb') as f:
        await f.write(file_content)
    
    try:
        # Get audio duration
        duration = await get_audio_duration(temp_path)
        
        # Upload to Telegram CDN
        telegram_result = await telegram_service.upload_audio(
            file_path=temp_path,
            filename=file.filename
        )
        
        if not telegram_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file to CDN"
            )
        
        # Create music document
        music_id = str(uuid.uuid4())
        music_doc = {
            "_id": music_id,
            "creator_id": user_id,
            "file_id": telegram_result["file_id"],
            "title": title,
            "artist": artist,
            "file_url": telegram_result["file_url"],
            "file_size": file_size,
            "duration": duration,
            "format": get_audio_format(file.filename).value,
            "storage_used": file_size,
            "is_private": is_private,
            "created_at": datetime.utcnow()
        }
        
        await db.creator_music.insert_one(music_doc)
        
        # Update user storage
        await storage_service.add_file_to_storage(user_id, file_size)
        
        # Return response
        return CreatorMusicResponse(
            id=music_id,
            creator_id=user_id,
            file_id=telegram_result["file_id"],
            title=title,
            artist=artist,
            file_url=telegram_result["file_url"],
            file_size=file_size,
            duration=duration,
            format=get_audio_format(file.filename),
            storage_used=file_size,
            is_private=is_private,
            created_at=music_doc["created_at"]
        )
    
    finally:
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

# ==================== GET CREATOR'S MUSIC ====================

@router.get("/my-library", response_model=List[CreatorMusicResponse])
async def get_my_music_library(
    current_user: dict = Depends(get_current_user)
):
    """Get creator's personal music library"""
    db = get_db()
    user_id = current_user["user_id"]
    
    music_items = await db.creator_music.find(
        {"creator_id": user_id}
    ).sort("created_at", -1).to_list(None)
    
    return [
        CreatorMusicResponse(
            id=item["_id"],
            creator_id=item["creator_id"],
            file_id=item["file_id"],
            title=item["title"],
            artist=item.get("artist"),
            file_url=item["file_url"],
            file_size=item["file_size"],
            duration=item.get("duration"),
            format=AudioFormat(item["format"]),
            storage_used=item["storage_used"],
            is_private=item["is_private"],
            created_at=item["created_at"]
        )
        for item in music_items
    ]

# ==================== DELETE CREATOR MUSIC ====================

@router.delete("/{music_id}")
async def delete_creator_music(
    music_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete creator's personal music"""
    db = get_db()
    user_id = current_user["user_id"]
    
    # Find music
    music = await db.creator_music.find_one({"_id": music_id})
    if not music:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Music not found"
        )
    
    # Check ownership
    if music["creator_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this music"
        )
    
    # Delete from database
    await db.creator_music.delete_one({"_id": music_id})
    
    # Update storage
    file_size = music.get("file_size", 0)
    if file_size > 0:
        await storage_service.add_file_to_storage(user_id, -file_size)
    
    return {"success": True, "message": "Music deleted successfully"}

# ==================== BROWSE PUBLIC LIBRARY ====================

@router.get("/library", response_model=List[MusicLibraryResponse])
async def get_public_music_library(
    category: Optional[AudioCategory] = None,
    folder_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get public music library (admin-uploaded)"""
    db = get_db()
    
    # Build query
    query = {"is_public": True, "uploaded_by_role": "admin"}
    
    if category:
        query["category"] = category.value
    
    if folder_id:
        query["folder_id"] = folder_id
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"artist": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    music_items = await db.music_library.find(query).sort("created_at", -1).to_list(None)
    
    # Get folder names
    folder_ids = [item.get("folder_id") for item in music_items if item.get("folder_id")]
    folders = {}
    if folder_ids:
        folder_docs = await db.music_folders.find({"_id": {"$in": folder_ids}}).to_list(None)
        folders = {f["_id"]: f["name"] for f in folder_docs}
    
    return [
        MusicLibraryResponse(
            id=item["_id"],
            file_id=item["file_id"],
            title=item["title"],
            artist=item.get("artist"),
            category=AudioCategory(item["category"]),
            folder_id=item.get("folder_id"),
            folder_name=folders.get(item.get("folder_id")),
            file_url=item["file_url"],
            file_size=item["file_size"],
            duration=item.get("duration"),
            format=AudioFormat(item["format"]),
            uploaded_by=item["uploaded_by"],
            uploaded_by_role=UploadedByRole(item["uploaded_by_role"]),
            is_public=item["is_public"],
            tags=item.get("tags", []),
            created_at=item["created_at"],
            updated_at=item["updated_at"]
        )
        for item in music_items
    ]

# ==================== GET STORAGE INFO ====================

@router.get("/storage")
async def get_storage_info(
    current_user: dict = Depends(get_current_user)
):
    """Get creator's storage usage info"""
    db = get_db()
    user_id = current_user["user_id"]
    
    # Get storage info
    storage_info = await storage_service.update_user_storage(user_id)
    
    # Calculate breakdown
    creator_music = await db.creator_music.aggregate([
        {"$match": {"creator_id": user_id}},
        {"$group": {"_id": None, "total": {"$sum": "$file_size"}}}
    ]).to_list(None)
    
    music_size = creator_music[0]["total"] if creator_music else 0
    
    return {
        "storage_used": storage_info["storage_used"],
        "storage_used_formatted": storage_info["storage_used_formatted"],
        "storage_limit": storage_info["storage_limit"],
        "storage_limit_formatted": storage_info["storage_limit_formatted"],
        "percentage": storage_info["percentage"],
        "breakdown": {
            "music": music_size,
            "other": storage_info["storage_used"] - music_size
        }
    }
