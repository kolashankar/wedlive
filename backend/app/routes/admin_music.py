"""Admin Music Management Routes"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
import uuid
import os
import aiofiles
import mutagen
from mutagen.mp3 import MP3
from mutagen.wave import WAVE
from mutagen.oggvorbis import OggVorbis
from mutagen.mp4 import MP4

from app.auth import get_current_user, get_current_admin
from app.database import get_db
from app.models_music import (
    MusicLibraryCreate,
    MusicLibraryUpdate,
    MusicLibraryResponse,
    MusicFolderCreate,
    MusicFolderUpdate,
    MusicFolderResponse,
    AudioCategory,
    AudioFormat,
    UploadedByRole
)
from app.services.telegram_service import TelegramCDNService

router = APIRouter(prefix="/api/admin/music", tags=["admin-music"])

# Initialize services
telegram_service = TelegramCDNService()

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

# ==================== FOLDER MANAGEMENT ====================

@router.post("/folders", response_model=MusicFolderResponse, dependencies=[Depends(get_current_admin)])
async def create_music_folder(
    folder: MusicFolderCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new music folder"""
    db = get_db()
    
    # Validate parent folder if specified
    if folder.parent_folder_id:
        parent = await db.music_folders.find_one({"_id": folder.parent_folder_id})
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent folder not found"
            )
        # Check if parent is same category
        if parent["category"] != folder.category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent folder must be same category"
            )
    
    # Check for duplicate name in same parent
    existing = await db.music_folders.find_one({
        "name": folder.name,
        "parent_folder_id": folder.parent_folder_id,
        "category": folder.category
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder with this name already exists in this location"
        )
    
    folder_id = str(uuid.uuid4())
    folder_doc = {
        "_id": folder_id,
        "name": folder.name,
        "description": folder.description,
        "parent_folder_id": folder.parent_folder_id,
        "category": folder.category,
        "icon": folder.icon or "🎵",
        "is_system": False,
        "created_by": current_user["id"],
        "created_at": datetime.utcnow()
    }
    
    await db.music_folders.insert_one(folder_doc)
    
    # Count files in folder
    file_count = await db.music_library.count_documents({"folder_id": folder_id})
    
    return MusicFolderResponse(
        id=folder_id,
        name=folder_doc["name"],
        description=folder_doc.get("description"),
        parent_folder_id=folder_doc.get("parent_folder_id"),
        category=folder_doc["category"],
        icon=folder_doc["icon"],
        is_system=folder_doc["is_system"],
        file_count=file_count,
        created_by=folder_doc["created_by"],
        created_at=folder_doc["created_at"]
    )

@router.get("/folders", response_model=List[MusicFolderResponse], dependencies=[Depends(get_current_admin)])
async def list_music_folders(
    category: Optional[AudioCategory] = None,
    parent_folder_id: Optional[str] = None
):
    """List all music folders, optionally filtered by category or parent"""
    db = get_db()
    query = {}
    if category:
        query["category"] = category
    if parent_folder_id:
        query["parent_folder_id"] = parent_folder_id
    elif parent_folder_id is None:
        # If no parent specified, return root folders
        query["parent_folder_id"] = None
    
    folders = await db.music_folders.find(query).sort("name", 1).to_list(length=1000)
    
    # Add file counts
    result = []
    for folder in folders:
        file_count = await db.music_library.count_documents({"folder_id": folder["_id"]})
        result.append(MusicFolderResponse(
            id=folder["_id"],
            name=folder["name"],
            description=folder.get("description"),
            parent_folder_id=folder.get("parent_folder_id"),
            category=folder["category"],
            icon=folder.get("icon", "🎵"),
            is_system=folder.get("is_system", False),
            file_count=file_count,
            created_by=folder["created_by"],
            created_at=folder["created_at"]
        ))
    
    return result

@router.put("/folders/{folder_id}", response_model=MusicFolderResponse, dependencies=[Depends(get_current_admin)])
async def update_music_folder(
    folder_id: str,
    folder_update: MusicFolderUpdate
):
    """Update music folder details"""
    db = get_db()
    folder = await db.music_folders.find_one({"_id": folder_id})
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    if folder.get("is_system"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify system folders"
        )
    
    update_data = folder_update.dict(exclude_unset=True)
    if update_data:
        await db.music_folders.update_one(
            {"_id": folder_id},
            {"$set": update_data}
        )
    
    # Get updated folder
    updated_folder = await db.music_folders.find_one({"_id": folder_id})
    file_count = await db.music_library.count_documents({"folder_id": folder_id})
    
    return MusicFolderResponse(
        id=updated_folder["_id"],
        name=updated_folder["name"],
        description=updated_folder.get("description"),
        parent_folder_id=updated_folder.get("parent_folder_id"),
        category=updated_folder["category"],
        icon=updated_folder.get("icon", "🎵"),
        is_system=updated_folder.get("is_system", False),
        file_count=file_count,
        created_by=updated_folder["created_by"],
        created_at=updated_folder["created_at"]
    )

@router.delete("/folders/{folder_id}", dependencies=[Depends(get_current_admin)])
async def delete_music_folder(folder_id: str):
    """Delete a music folder (must be empty)"""
    db = get_db()
    folder = await db.music_folders.find_one({"_id": folder_id})
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    if folder.get("is_system"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete system folders"
        )
    
    # Check if folder has files
    file_count = await db.music_library.count_documents({"folder_id": folder_id})
    if file_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Folder contains {file_count} files. Please move or delete them first."
        )
    
    # Check for subfolders
    subfolder_count = await db.music_folders.count_documents({"parent_folder_id": folder_id})
    if subfolder_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Folder contains {subfolder_count} subfolders. Please delete them first."
        )
    
    await db.music_folders.delete_one({"_id": folder_id})
    
    return {"success": True, "message": "Folder deleted successfully"}

# ==================== MUSIC LIBRARY MANAGEMENT ====================

@router.post("/upload", response_model=MusicLibraryResponse, dependencies=[Depends(get_current_admin)])
async def upload_music(
    file: UploadFile = File(...),
    title: str = Form(...),
    artist: Optional[str] = Form(None),
    category: AudioCategory = Form(...),
    folder_id: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # Comma-separated
    is_public: bool = Form(True),
    current_user: dict = Depends(get_current_user)
):
    """Upload audio file to music library"""
    
    # Validate file type
    allowed_extensions = ['.mp3', '.wav', '.aac', '.ogg', '.m4a']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Validate file size (max 50MB)
    max_size = 50 * 1024 * 1024  # 50MB
    file_content = await file.read()
    file_size = len(file_content)
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 50MB limit"
        )
    
    # Validate folder if specified
    if folder_id:
        folder = await db.music_folders.find_one({"_id": folder_id})
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )
        if folder["category"] != category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Folder category mismatch"
            )
    
    # Save file temporarily
    temp_dir = "/tmp/music_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, f"{uuid.uuid4()}{file_ext}")
    
    async with aiofiles.open(temp_file_path, 'wb') as f:
        await f.write(file_content)
    
    # Get audio duration
    duration = await get_audio_duration(temp_file_path)
    
    # Upload to Telegram CDN
    upload_result = await telegram_service.upload_document(
        file_path=temp_file_path,
        caption=f"Music: {title} by {artist or 'Unknown'}",
        wedding_id="music_library"
    )
    
    # Clean up temp file
    try:
        os.remove(temp_file_path)
    except:
        pass
    
    if not upload_result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to CDN"
        )
    
    # Parse tags
    tag_list = []
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    
    # Create music document
    music_id = str(uuid.uuid4())
    
    # Construct proxy URL for audio file
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8001")
    file_url = f"{backend_url}/api/media/telegram-proxy/documents/{upload_result['file_id']}"
    
    music_doc = {
        "_id": music_id,
        "file_id": upload_result["file_id"],
        "title": title,
        "artist": artist,
        "category": category,
        "folder_id": folder_id,
        "file_url": file_url,
        "file_size": file_size,
        "duration": duration,
        "format": get_audio_format(file.filename),
        "uploaded_by": current_user["id"],
        "uploaded_by_role": UploadedByRole.ADMIN,
        "is_public": is_public,
        "tags": tag_list,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.music_library.insert_one(music_doc)
    
    # Get folder name if exists
    folder_name = None
    if folder_id:
        folder = await db.music_folders.find_one({"_id": folder_id})
        folder_name = folder["name"] if folder else None
    
    return MusicLibraryResponse(
        id=music_id,
        file_id=music_doc["file_id"],
        title=music_doc["title"],
        artist=music_doc.get("artist"),
        category=music_doc["category"],
        folder_id=music_doc.get("folder_id"),
        folder_name=folder_name,
        file_url=music_doc["file_url"],
        file_size=music_doc["file_size"],
        duration=music_doc.get("duration"),
        format=music_doc["format"],
        uploaded_by=music_doc["uploaded_by"],
        uploaded_by_role=music_doc["uploaded_by_role"],
        is_public=music_doc["is_public"],
        tags=music_doc.get("tags", []),
        created_at=music_doc["created_at"],
        updated_at=music_doc["updated_at"]
    )

@router.get("/library", response_model=List[MusicLibraryResponse], dependencies=[Depends(get_current_admin)])
async def list_music_library(
    category: Optional[AudioCategory] = None,
    folder_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """List music library with optional filters"""
    query = {}
    
    if category:
        query["category"] = category
    
    if folder_id:
        query["folder_id"] = folder_id
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"artist": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    music_items = await db.music_library.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    # Add folder names
    result = []
    for item in music_items:
        folder_name = None
        if item.get("folder_id"):
            folder = await db.music_folders.find_one({"_id": item["folder_id"]})
            folder_name = folder["name"] if folder else None
        
        result.append(MusicLibraryResponse(
            id=item["_id"],
            file_id=item["file_id"],
            title=item["title"],
            artist=item.get("artist"),
            category=item["category"],
            folder_id=item.get("folder_id"),
            folder_name=folder_name,
            file_url=item["file_url"],
            file_size=item["file_size"],
            duration=item.get("duration"),
            format=item["format"],
            uploaded_by=item["uploaded_by"],
            uploaded_by_role=item["uploaded_by_role"],
            is_public=item["is_public"],
            tags=item.get("tags", []),
            created_at=item["created_at"],
            updated_at=item["updated_at"]
        ))
    
    return result

@router.get("/library/{music_id}", response_model=MusicLibraryResponse, dependencies=[Depends(get_current_admin)])
async def get_music_details(music_id: str):
    """Get specific music details"""
    music = await db.music_library.find_one({"_id": music_id})
    if not music:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Music not found"
        )
    
    folder_name = None
    if music.get("folder_id"):
        folder = await db.music_folders.find_one({"_id": music["folder_id"]})
        folder_name = folder["name"] if folder else None
    
    return MusicLibraryResponse(
        id=music["_id"],
        file_id=music["file_id"],
        title=music["title"],
        artist=music.get("artist"),
        category=music["category"],
        folder_id=music.get("folder_id"),
        folder_name=folder_name,
        file_url=music["file_url"],
        file_size=music["file_size"],
        duration=music.get("duration"),
        format=music["format"],
        uploaded_by=music["uploaded_by"],
        uploaded_by_role=music["uploaded_by_role"],
        is_public=music["is_public"],
        tags=music.get("tags", []),
        created_at=music["created_at"],
        updated_at=music["updated_at"]
    )

@router.put("/library/{music_id}", response_model=MusicLibraryResponse, dependencies=[Depends(get_current_admin)])
async def update_music_metadata(
    music_id: str,
    update_data: MusicLibraryUpdate
):
    """Update music metadata"""
    music = await db.music_library.find_one({"_id": music_id})
    if not music:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Music not found"
        )
    
    # Validate folder if changing
    if update_data.folder_id:
        folder = await db.music_folders.find_one({"_id": update_data.folder_id})
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )
        if folder["category"] != music["category"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Folder category mismatch"
            )
    
    update_dict = update_data.dict(exclude_unset=True)
    if update_dict:
        update_dict["updated_at"] = datetime.utcnow()
        await db.music_library.update_one(
            {"_id": music_id},
            {"$set": update_dict}
        )
    
    # Get updated music
    updated_music = await db.music_library.find_one({"_id": music_id})
    
    folder_name = None
    if updated_music.get("folder_id"):
        folder = await db.music_folders.find_one({"_id": updated_music["folder_id"]})
        folder_name = folder["name"] if folder else None
    
    return MusicLibraryResponse(
        id=updated_music["_id"],
        file_id=updated_music["file_id"],
        title=updated_music["title"],
        artist=updated_music.get("artist"),
        category=updated_music["category"],
        folder_id=updated_music.get("folder_id"),
        folder_name=folder_name,
        file_url=updated_music["file_url"],
        file_size=updated_music["file_size"],
        duration=updated_music.get("duration"),
        format=updated_music["format"],
        uploaded_by=updated_music["uploaded_by"],
        uploaded_by_role=updated_music["uploaded_by_role"],
        is_public=updated_music["is_public"],
        tags=updated_music.get("tags", []),
        created_at=updated_music["created_at"],
        updated_at=updated_music["updated_at"]
    )

@router.delete("/library/{music_id}", dependencies=[Depends(get_current_admin)])
async def delete_music(music_id: str):
    """Delete music from library"""
    music = await db.music_library.find_one({"_id": music_id})
    if not music:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Music not found"
        )
    
    # Check if music is used in any wedding playlists
    usage_count = await db.wedding_music_assignments.count_documents({
        "music_playlist.music_id": music_id
    })
    
    if usage_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Music is used in {usage_count} wedding playlists. Remove from playlists first."
        )
    
    await db.music_library.delete_one({"_id": music_id})
    
    return {"success": True, "message": "Music deleted successfully"}

@router.get("/categories", dependencies=[Depends(get_current_admin)])
async def get_music_categories():
    """Get all music categories with counts"""
    categories = []
    
    for category in AudioCategory:
        count = await db.music_library.count_documents({"category": category})
        categories.append({
            "category": category,
            "count": count
        })
    
    return {"categories": categories}
