"""
Media Management Routes
Handles photo/video uploads, media gallery, and recording management
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Request
from app.auth import get_current_user
from app.database import get_db
from app.services.telegram_service import TelegramCDNService
from app.services.storage_service import StorageService
from app.plan_restrictions import check_upload_allowed
from app.utils.file_id_validator import validate_and_log_file_id, is_valid_telegram_file_id
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
storage_service = StorageService()

# Models
class MediaResponse(BaseModel):
    id: str
    wedding_id: str
    media_type: str  # "photo", "video", or "youtube_video"
    file_id: Optional[str] = None
    telegram_message_id: Optional[int] = None
    caption: Optional[str] = None
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime
    file_url: Optional[str] = None
    # YouTube-specific fields
    youtube_video_id: Optional[str] = None
    youtube_url: Optional[str] = None
    youtube_embed_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None
    view_count: Optional[int] = None
    category: Optional[str] = None

class RecordingResponse(BaseModel):
    id: str
    wedding_id: str
    recording_url: str
    duration: Optional[int] = None
    file_size: Optional[int] = None
    status: str  # "processing", "ready", "failed"
    created_at: datetime

# Chunked Upload System
class ChunkUploadInit(BaseModel):
    wedding_id: str
    filename: str
    total_size: int
    total_chunks: int
    media_type: str  # "photo" or "video"
    caption: Optional[str] = ""
    category: Optional[str] = "general"

class ChunkUploadResponse(BaseModel):
    upload_id: str
    wedding_id: str
    chunk_index: int
    total_chunks: int
    status: str

@router.post("/upload/init")
async def init_chunked_upload(
    request: ChunkUploadInit,
    current_user: dict = Depends(get_current_user)
):
    """Initialize chunked upload session"""
    db = get_db()
    
    # Verify wedding exists and user has access
    wedding = await db.weddings.find_one({"id": request.wedding_id})
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
    
    # Get user and check plan restrictions
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    allowed, error_message = check_upload_allowed(user, request.total_size)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_message
        )
    
    # Create upload session
    upload_id = str(uuid.uuid4())
    upload_session = {
        "id": upload_id,
        "user_id": current_user["user_id"],
        "wedding_id": request.wedding_id,
        "filename": request.filename,
        "total_size": request.total_size,
        "total_chunks": request.total_chunks,
        "media_type": request.media_type,
        "caption": request.caption,
        "category": request.category,  # Add category field
        "uploaded_chunks": [],
        "status": "in_progress",
        "created_at": datetime.utcnow()
    }
    
    await db.upload_sessions.insert_one(upload_session)
    
    return {
        "upload_id": upload_id,
        "message": "Chunked upload initialized",
        "total_chunks": request.total_chunks
    }

@router.post("/upload/chunk")
async def upload_chunk(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    chunk: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a single chunk"""
    db = get_db()
    
    # Get upload session
    session = await db.upload_sessions.find_one({"id": upload_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload session not found"
        )
    
    # Verify user owns this session
    if session["user_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Store chunk temporarily
    import aiofiles
    chunk_dir = f"/tmp/chunks/{upload_id}"
    os.makedirs(chunk_dir, exist_ok=True)
    chunk_path = os.path.join(chunk_dir, f"chunk_{chunk_index}")
    
    # Save chunk
    content = await chunk.read()
    async with aiofiles.open(chunk_path, 'wb') as f:
        await f.write(content)
    
    # Update session
    await db.upload_sessions.update_one(
        {"id": upload_id},
        {"$addToSet": {"uploaded_chunks": chunk_index}}
    )
    
    # Get updated session
    session = await db.upload_sessions.find_one({"id": upload_id})
    uploaded_count = len(session["uploaded_chunks"])
    
    return {
        "upload_id": upload_id,
        "chunk_index": chunk_index,
        "uploaded_chunks": uploaded_count,
        "total_chunks": session["total_chunks"],
        "status": "chunk_uploaded"
    }

@router.post("/upload/complete")
async def complete_chunked_upload(
    upload_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Complete chunked upload and merge chunks"""
    db = get_db()
    
    # Get upload session
    session = await db.upload_sessions.find_one({"id": upload_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload session not found"
        )
    
    # Verify user owns this session
    if session["user_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Verify all chunks uploaded
    if len(session["uploaded_chunks"]) != session["total_chunks"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing chunks. Uploaded {len(session['uploaded_chunks'])}/{session['total_chunks']}"
        )
    
    # Merge chunks
    chunk_dir = f"/tmp/chunks/{upload_id}"
    merged_path = f"/tmp/{upload_id}_{session['filename']}"
    
    try:
        import aiofiles
        async with aiofiles.open(merged_path, 'wb') as merged_file:
            for i in sorted(session["uploaded_chunks"]):
                chunk_path = os.path.join(chunk_dir, f"chunk_{i}")
                async with aiofiles.open(chunk_path, 'rb') as chunk_file:
                    chunk_data = await chunk_file.read()
                    await merged_file.write(chunk_data)
        
        # Upload merged file to Telegram
        if session["media_type"] == "photo":
            result = await telegram_service.upload_photo(merged_path, session["caption"], session["wedding_id"])
        else:
            result = await telegram_service.upload_video(merged_path, session["caption"], session["wedding_id"])
        
        # Clean up chunks and merged file
        import shutil
        shutil.rmtree(chunk_dir, ignore_errors=True)
        os.unlink(merged_path)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {result.get('error', 'Unknown error')}"
            )
        
        # CRITICAL: Validate file_id before saving to database
        file_id = result.get("file_id")
        is_valid, error_msg = validate_and_log_file_id(file_id, context="chunked_upload")
        if not is_valid:
            logger.error(f"[CHUNKED_UPLOAD] Invalid file_id returned from Telegram: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Invalid file_id received from Telegram CDN: {error_msg}"
            )
        
        # Save to database
        media_id = str(uuid.uuid4())
        media = {
            "id": media_id,
            "wedding_id": session["wedding_id"],
            "user_id": current_user["user_id"],
            "media_type": session["media_type"],
            "file_id": file_id,  # Use validated file_id
            "telegram_message_id": result["message_id"],
            "caption": session["caption"],
            "category": session.get("category", "general"),  # Add category field
            "file_size": result["file_size"],
            "width": result.get("width"),
            "height": result.get("height"),
            "duration": result.get("duration"),
            "uploaded_by": current_user["user_id"],
            "uploaded_at": datetime.utcnow()
        }
        
        await db.media.insert_one(media)
        
        # Update user's storage usage
        await storage_service.add_file_to_storage(current_user["user_id"], result["file_size"])
        
        # Delete upload session
        await db.upload_sessions.delete_one({"id": upload_id})
        
        # Get file URL (Use proxy URL)
        # file_url = await telegram_service.get_file_url(file_id)
        file_url = f"/api/media/telegram-proxy/photos/{file_id}"
        
        return MediaResponse(
            id=media["id"],
            wedding_id=media["wedding_id"],
            media_type=media["media_type"],
            file_id=file_id,  # Use validated file_id
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
        logger.error(f"Error completing chunked upload: {str(e)}")
        # Clean up on error
        import shutil
        if os.path.exists(chunk_dir):
            shutil.rmtree(chunk_dir, ignore_errors=True)
        if os.path.exists(merged_path):
            os.unlink(merged_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload completion failed: {str(e)}"
        )

# Media Upload Routes (for small files < 200MB)
@router.post("/upload/photo", response_model=MediaResponse)
async def upload_photo(
    wedding_id: str = Form(...),
    caption: str = Form(""),
    category: str = Form("general"),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a photo to wedding media gallery"""
    logger.info(f"[UPLOAD] Starting photo upload for wedding_id={wedding_id}, user={current_user['user_id']}")
    
    db = get_db()
    temp_path = None
    
    try:
        # Get user details for plan checking
        logger.info(f"[UPLOAD] Fetching user details for user_id={current_user['user_id']}")
        user = await db.users.find_one({"id": current_user["user_id"]})
        if not user:
            logger.error(f"[UPLOAD] User not found: {current_user['user_id']}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check plan and storage restrictions FIRST
        logger.info(f"[UPLOAD] Reading file content")
        content = await file.read()
        file_size = len(content)
        logger.info(f"[UPLOAD] File size: {file_size} bytes")
        
        allowed, error_message = check_upload_allowed(user, file_size)
        if not allowed:
            logger.warning(f"[UPLOAD] Upload not allowed: {error_message}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_message
            )
        
        # Verify wedding exists and user has access
        logger.info(f"[UPLOAD] Checking wedding access for wedding_id={wedding_id}")
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            logger.error(f"[UPLOAD] Wedding not found: {wedding_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"] and current_user.get("role") != "admin":
            logger.error(f"[UPLOAD] Unauthorized upload attempt by user {current_user['user_id']}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to upload media for this wedding"
            )
        
        # Validate file type
        logger.info(f"[UPLOAD] File content_type: {file.content_type}")
        if not file.content_type or not file.content_type.startswith("image/"):
            logger.error(f"[UPLOAD] Invalid file type: {file.content_type}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed"
            )
        
        # Save file temporarily
        logger.info(f"[UPLOAD] Creating temporary file")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            temp_file.write(content)  # content already read above
            temp_path = temp_file.name
        
        logger.info(f"[UPLOAD] Temp file created at: {temp_path}")
        
        # Upload to Telegram
        logger.info(f"[UPLOAD] Starting Telegram upload")
        result = await telegram_service.upload_photo(temp_path, caption, wedding_id)
        logger.info(f"[UPLOAD] Telegram upload result: {result}")
        
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
            logger.info(f"[UPLOAD] Temp file cleaned up")
        
        if not result.get("success"):
            error_detail = result.get('error', 'Unknown error')
            logger.error(f"[UPLOAD] Telegram upload failed: {error_detail}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Telegram upload failed: {error_detail}"
            )
        
        # CRITICAL: Validate file_id before saving to database
        file_id = result.get("file_id")
        is_valid, error_msg = validate_and_log_file_id(file_id, context="photo_upload")
        if not is_valid:
            logger.error(f"[UPLOAD] Invalid file_id returned from Telegram: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Invalid file_id received from Telegram CDN: {error_msg}"
            )
        
        # Save to database
        logger.info(f"[UPLOAD] Saving media to database with validated file_id")
        media_id = str(uuid.uuid4())
        media = {
            "id": media_id,
            "wedding_id": wedding_id,
            "user_id": current_user["user_id"],  # Add user_id for storage tracking
            "media_type": "photo",
            "file_id": file_id,  # Use validated file_id
            "telegram_message_id": result["message_id"],
            "caption": caption,
            "category": category,  # Add category field
            "file_size": result["file_size"],
            "width": result.get("width"),
            "height": result.get("height"),
            "uploaded_by": current_user["user_id"],
            "uploaded_at": datetime.utcnow()
        }
        
        await db.media.insert_one(media)
        logger.info(f"[UPLOAD] Media saved to database with id={media_id}")
        
        # Update user's storage usage
        logger.info(f"[UPLOAD] Updating storage usage")
        await storage_service.add_file_to_storage(current_user["user_id"], result["file_size"])
        
        # Get file URL (Use proxy URL to secure bot token and avoid CORS)
        logger.info(f"[UPLOAD] Generating proxy URL for validated file_id")
        # file_url = await telegram_service.get_file_url(file_id) # Don't use direct URL
        file_url = f"/api/media/telegram-proxy/photos/{file_id}"
        logger.info(f"[UPLOAD] Upload completed successfully, file_url={file_url}")
        
        return MediaResponse(
            id=media["id"],
            wedding_id=media["wedding_id"],
            media_type=media["media_type"],
            file_id=file_id,  # Use validated file_id
            telegram_message_id=media["telegram_message_id"],
            caption=media.get("caption"),
            file_size=media["file_size"],
            width=media.get("width"),
            height=media.get("height"),
            uploaded_by=media["uploaded_by"],
            uploaded_at=media["uploaded_at"],
            file_url=file_url
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise
    except Exception as e:
        # Clean up temp file on error
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass
        
        logger.error(f"[UPLOAD] Unexpected error during photo upload: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.post("/upload/video", response_model=MediaResponse)
async def upload_video(
    wedding_id: str = Form(...),
    caption: str = Form(""),
    category: str = Form("general"),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a video to wedding media gallery"""
    db = get_db()
    
    # Get user details for plan checking
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check plan and storage restrictions FIRST
    content = await file.read()
    file_size = len(content)
    
    allowed, error_message = check_upload_allowed(user, file_size)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_message
        )
    
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
            temp_file.write(content)  # content already read above
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
        
        # CRITICAL: Validate file_id before saving to database
        file_id = result.get("file_id")
        is_valid, error_msg = validate_and_log_file_id(file_id, context="video_upload")
        if not is_valid:
            logger.error(f"[VIDEO_UPLOAD] Invalid file_id returned from Telegram: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Invalid file_id received from Telegram CDN: {error_msg}"
            )
        
        # Save to database
        media_id = str(uuid.uuid4())
        media = {
            "id": media_id,
            "wedding_id": wedding_id,
            "user_id": current_user["user_id"],  # Add user_id for storage tracking
            "media_type": "video",
            "file_id": file_id,  # Use validated file_id
            "telegram_message_id": result["message_id"],
            "caption": caption,
            "category": category,  # Add category field
            "file_size": result["file_size"],
            "width": result.get("width"),
            "height": result.get("height"),
            "duration": result.get("duration"),
            "uploaded_by": current_user["user_id"],
            "uploaded_at": datetime.utcnow()
        }
        
        await db.media.insert_one(media)
        
        # Update user's storage usage
        await storage_service.add_file_to_storage(current_user["user_id"], result["file_size"])
        
        # Get file URL
        file_url = await telegram_service.get_file_url(file_id)
        
        return MediaResponse(
            id=media["id"],
            wedding_id=media["wedding_id"],
            media_type=media["media_type"],
            file_id=file_id,  # Use validated file_id
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

# Debug endpoint to check all media
@router.get("/debug/all-media")
async def debug_all_media():
    """Debug endpoint to see all media in database"""
    db = get_db()
    
    try:
        # Get all media items
        cursor = db.media.find({}).limit(10)
        media_list = await cursor.to_list(length=10)
        
        result = []
        for media in media_list:
            result.append({
                "id": media["id"],
                "wedding_id": media["wedding_id"],
                "media_type": media["media_type"],
                "file_id": media["file_id"],
                "uploaded_by": media["uploaded_by"],
                "uploaded_at": media["uploaded_at"]
            })
        
        return {
            "total_count": await db.media.count_documents({}),
            "sample_items": result
        }
    except Exception as e:
        return {"error": str(e)}

# Media Gallery Routes
@router.get("/gallery/{wedding_id}", response_model=List[MediaResponse])
async def get_wedding_gallery(wedding_id: str, skip: int = 0, limit: int = 50, include_urls: bool = True, request: Request = None):
    """Get all media for a wedding (public access) - Fast endpoint with fallback URLs"""
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
    skipped_count = 0
    
    # Build base URL from request
    if request:
        base_url = f"{request.url.scheme}://{request.url.netloc}"
    else:
        # Fallback for environments without request context
        base_url = os.getenv("API_BASE_URL", "http://localhost:8001")
    
    # FIX 2: Enhanced logging and error handling for photo loading
    logger.info(f"[GALLERY] Loading media for wedding {wedding_id}, found {len(media_list)} total items")
    
    # Use proxy URLs by default for fast response - avoids Telegram API timeout
    for media in media_list:
        # Handle YouTube videos differently
        if media.get("media_type") == "youtube_video":
            result.append(MediaResponse(
                id=media["id"],
                wedding_id=media["wedding_id"],
                media_type="youtube_video",
                file_id=None,
                telegram_message_id=None,
                caption=media.get("caption"),
                file_size=None,
                duration=media.get("duration"),
                uploaded_by=media["uploaded_by"],
                uploaded_at=media["uploaded_at"],
                file_url=None,
                youtube_video_id=media.get("youtube_video_id"),
                youtube_url=media.get("youtube_url"),
                youtube_embed_url=media.get("youtube_embed_url"),
                thumbnail_url=media.get("thumbnail_url"),
                title=media.get("title"),
                view_count=media.get("view_count", 0),
                category=media.get("category")
            ))
        else:
            # Regular photo/video from Telegram CDN
            file_id = media.get('file_id', '')
            
            # CRITICAL FIX: Skip media with invalid/placeholder file_ids
            # Invalid file_ids are temporary references like "file_61", "file_62"
            # These indicate placeholder/template images that were never properly uploaded
            if file_id.startswith("file_") and file_id.replace("file_", "").replace(".jpg", "").replace(".png", "").isdigit():
                logger.warning(f"[GALLERY] Skipping media {media['id']} with invalid placeholder file_id: {file_id}")
                skipped_count += 1
                continue
            
            # Validate that file_id looks like a real Telegram file_id
            # Telegram file_ids are typically 50+ characters and start with specific prefixes
            if not file_id or len(file_id) < 20:
                logger.warning(f"[GALLERY] Skipping media {media['id']} with suspiciously short file_id: {file_id}")
                skipped_count += 1
                continue
            
            file_url = f"/api/media/telegram-proxy/photos/{file_id}"
            
            # FIX 2: Log each valid media item for debugging
            logger.debug(f"[GALLERY] Valid media {media['id']}: file_id={file_id[:20]}..., url={file_url}")
            
            result.append(MediaResponse(
                id=media["id"],
                wedding_id=media["wedding_id"],
                media_type=media["media_type"],
                file_id=file_id,
                telegram_message_id=media.get("telegram_message_id"),
                caption=media.get("caption"),
                file_size=media.get("file_size"),
                width=media.get("width"),
                height=media.get("height"),
                duration=media.get("duration"),
                uploaded_by=media["uploaded_by"],
                uploaded_at=media["uploaded_at"],
                file_url=file_url,
                category=media.get("category")
            ))
    
    # FIX 2: Log summary of what we're returning
    logger.info(f"[GALLERY] Returning {len(result)} valid media items for wedding {wedding_id} (skipped {skipped_count} invalid items)")
    
    return result

@router.delete("/media/{media_id}")
async def delete_media(media_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete media item
    IMPROVED: Task 5.3 - Better cleanup and storage tracking
    """
    db = get_db()
    
    try:
        logger.info(f"[DELETE_MEDIA] START - Media ID: {media_id}, User: {current_user['user_id']}")
        
        media = await db.media.find_one({"id": media_id})
        if not media:
            logger.error(f"[DELETE_MEDIA] Media not found: {media_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Media not found", "media_id": media_id}
            )
        
        # Check authorization
        wedding = await db.weddings.find_one({"id": media["wedding_id"]})
        if not wedding:
            logger.error(f"[DELETE_MEDIA] Wedding not found for media: {media['wedding_id']}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated wedding not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"] and current_user.get("role") != "admin":
            logger.error(f"[DELETE_MEDIA] Unauthorized delete attempt by {current_user['user_id']}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this media"
            )
        
        # Store file size for storage calculation
        file_size = media.get("file_size", 0)
        user_id = media.get("user_id", current_user["user_id"])
        
        # Delete from Telegram (Task 5.3)
        telegram_message_id = media.get("telegram_message_id")
        if telegram_message_id:
            logger.info(f"[DELETE_MEDIA] Deleting from Telegram: message_id={telegram_message_id}")
            deletion_success = await telegram_service.delete_message(telegram_message_id)
            if not deletion_success:
                logger.warning(f"[DELETE_MEDIA] Failed to delete from Telegram: message_id={telegram_message_id}")
                # Continue with database deletion even if Telegram deletion fails
        else:
            logger.warning(f"[DELETE_MEDIA] No Telegram message_id found for media: {media_id}")
        
        # Delete from database
        delete_result = await db.media.delete_one({"id": media_id})
        if delete_result.deleted_count == 0:
            logger.error(f"[DELETE_MEDIA] Failed to delete from database: {media_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete media from database"
            )
        
        # Update storage usage (Task 5.3)
        if file_size > 0:
            try:
                await storage_service.remove_file_from_storage(user_id, file_size)
                logger.info(f"[DELETE_MEDIA] Storage updated: removed {file_size} bytes for user {user_id}")
            except Exception as storage_error:
                logger.error(f"[DELETE_MEDIA] Failed to update storage: {str(storage_error)}")
                # Don't fail the entire operation if storage update fails
        
        logger.info(f"[DELETE_MEDIA] SUCCESS - Media deleted: {media_id}")
        
        return {
            "success": True,
            "message": "Media deleted successfully",
            "media_id": media_id,
            "storage_freed": file_size
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DELETE_MEDIA] Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to delete media", "details": str(e)}
        )

# Update Media Category
@router.put("/{media_id}/category")
async def update_media_category(
    media_id: str,
    category: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Update media category (for layout assignment)"""
    db = get_db()
    
    # Get media
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
            detail="Not authorized to update this media"
        )
    
    # Validate category
    valid_categories = ["bride", "groom", "couple", "moment", "general"]
    if category not in valid_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
        )
    
    # Update category
    await db.media.update_one(
        {"id": media_id},
        {"$set": {"category": category}}
    )
    
    logger.info(f"[MEDIA_CATEGORY] Updated media {media_id} category to: {category}")
    
    return {"success": True, "message": "Category updated successfully", "category": category}

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

# Streaming Proxy Endpoint
@router.get("/stream/{file_id}")
async def stream_media(file_id: str):
    """
    Proxy endpoint for streaming media from Telegram CDN
    Provides secure streaming without exposing bot token
    """
    try:
        # Get file URL from Telegram
        file_url = await telegram_service.get_file_url(file_id)
        
        if not file_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media file not found"
            )
        
        # Redirect to Telegram CDN URL for streaming
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=file_url)
        
    except Exception as e:
        logger.error(f"Error streaming media: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stream media"
        )


@router.post("/move")
async def move_media(
    media_id: str,
    folder_id: Optional[str] = None,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Move media to a different folder (or root if folder_id is None)
    Creator only
    """
    try:
        from bson import ObjectId
        
        # Verify media exists
        media = await db.media.find_one({"_id": ObjectId(media_id)})
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
        
        # Verify folder exists if folder_id provided
        if folder_id:
            folder = await db.media_folders.find_one({"_id": ObjectId(folder_id)})
            if not folder:
                raise HTTPException(status_code=404, detail="Folder not found")
            
            # Verify folder belongs to same wedding
            if folder["wedding_id"] != media["wedding_id"]:
                raise HTTPException(
                    status_code=400,
                    detail="Folder and media must belong to the same wedding"
                )
        
        # Update media's folder
        result = await db.media.update_one(
            {"_id": ObjectId(media_id)},
            {"$set": {"folder_id": folder_id}}
        )
        
        if result.modified_count > 0:
            logger.info(f"📦 Media {media_id} moved to folder {folder_id or 'root'}")
            return {
                "success": True,
                "message": f"Media moved to {'folder' if folder_id else 'root'} successfully"
            }
        
        return {
            "success": False,
            "message": "Media was not moved"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to move media: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
