"""
Viewer Access Routes
Public endpoints for guests to access weddings via Wedding ID
"""

from fastapi import APIRouter, HTTPException, status
from app.database import get_db
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

class WeddingAccessRequest(BaseModel):
    wedding_code: str  # 6-digit code

class MediaItem(BaseModel):
    id: str
    type: str
    url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    created_at: datetime

class WeddingAccessResponse(BaseModel):
    wedding_id: str
    short_code: str
    title: str
    bride_name: str
    groom_name: str
    scheduled_date: datetime
    location: Optional[str] = None
    cover_image: Optional[str] = None
    status: str
    
    # Live streaming
    is_live: bool
    playback_url: Optional[str] = None
    stream_call_id: Optional[str] = None
    viewers_count: int = 0
    
    # Media
    has_media: bool
    media_count: int = 0
    
    # Recordings
    has_recording: bool
    recording_url: Optional[str] = None
    
    # Branding
    branding: Optional[dict] = None

@router.post("/join")
async def join_wedding_by_code(request: WeddingAccessRequest):
    """
    Join a wedding using 6-digit wedding code
    Public endpoint - no authentication required
    Returns all wedding info including live stream, media, and recordings
    """
    db = get_db()
    
    # Find wedding by short code
    wedding = await db.weddings.find_one({"short_code": request.wedding_code})
    
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found. Please check the wedding code and try again."
        )
    
    # Check if wedding is locked (free plan restriction)
    if wedding.get("is_locked", False):
        # Locked weddings can still be viewed but with limited features
        return WeddingAccessResponse(
            wedding_id=wedding["id"],
            short_code=wedding["short_code"],
            title=wedding["title"],
            bride_name=wedding["bride_name"],
            groom_name=wedding["groom_name"],
            scheduled_date=wedding["scheduled_date"],
            location=wedding.get("location"),
            cover_image=wedding.get("cover_image"),
            status=wedding["status"],
            is_live=False,
            playback_url=None,
            stream_call_id=None,
            viewers_count=0,
            has_media=False,
            media_count=0,
            has_recording=False,
            recording_url=None,
            branding=None
        )
    
    # Count media items
    media_count = await db.media_gallery.count_documents({"wedding_id": wedding["id"]})
    
    # Get creator's branding if exists
    branding = await db.branding_settings.find_one({"user_id": wedding["creator_id"]})
    branding_data = None
    if branding:
        branding_data = {
            "logo_url": branding.get("logo_url"),
            "primary_color": branding.get("primary_color", "#FF6B6B"),
            "hide_wedlive_branding": branding.get("hide_wedlive_branding", False)
        }
    
    return WeddingAccessResponse(
        wedding_id=wedding["id"],
        short_code=wedding["short_code"],
        title=wedding["title"],
        bride_name=wedding["bride_name"],
        groom_name=wedding["groom_name"],
        scheduled_date=wedding["scheduled_date"],
        location=wedding.get("location"),
        cover_image=wedding.get("cover_image"),
        status=wedding["status"],
        is_live=wedding["status"] == "live",
        playback_url=wedding.get("playback_url") if wedding["status"] == "live" else None,
        stream_call_id=wedding.get("stream_call_id") if wedding["status"] == "live" else None,
        viewers_count=wedding.get("viewers_count", 0),
        has_media=media_count > 0,
        media_count=media_count,
        has_recording=wedding.get("recording_url") is not None,
        recording_url=wedding.get("recording_url"),
        branding=branding_data
    )

@router.get("/wedding/{wedding_id}/media")
async def get_wedding_media(wedding_id: str, skip: int = 0, limit: int = 50):
    """
    Get all media (photos + videos) for a wedding
    Public endpoint - no authentication required
    """
    db = get_db()
    
    # Verify wedding exists and is not locked
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding.get("is_locked", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This wedding is locked. Creator needs to upgrade to Premium to unlock."
        )
    
    # Get media items
    media_items = await db.media_gallery.find(
        {"wedding_id": wedding_id}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total_count = await db.media_gallery.count_documents({"wedding_id": wedding_id})
    
    return {
        "wedding_id": wedding_id,
        "media": [
            {
                "id": item["id"],
                "type": item["type"],
                "url": item["url"],
                "thumbnail_url": item.get("thumbnail_url"),
                "caption": item.get("caption"),
                "created_at": item["created_at"],
                "file_size": item.get("file_size", 0)
            }
            for item in media_items
        ],
        "total_count": total_count,
        "page": skip // limit + 1,
        "has_more": skip + limit < total_count
    }

@router.get("/wedding/{wedding_id}/all")
async def get_wedding_complete_view(wedding_id: str):
    """
    Get complete wedding view with everything: details, live stream, media, recordings
    Public endpoint - no authentication required
    This is the unified endpoint for the viewer page
    """
    db = get_db()
    
    # Get wedding details
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    is_locked = wedding.get("is_locked", False)
    
    # Get media count and recent items
    media_count = await db.media_gallery.count_documents({"wedding_id": wedding_id})
    recent_media = await db.media_gallery.find(
        {"wedding_id": wedding_id}
    ).sort("created_at", -1).limit(12).to_list(12)
    
    # Get photo booth count
    photobooth_count = await db.photo_booth.count_documents({"wedding_id": wedding_id})
    
    # Get creator branding
    branding = await db.branding_settings.find_one({"user_id": wedding["creator_id"]})
    branding_data = None
    if branding:
        branding_data = {
            "logo_url": branding.get("logo_url"),
            "primary_color": branding.get("primary_color", "#FF6B6B"),
            "hide_wedlive_branding": branding.get("hide_wedlive_branding", False)
        }
    
    return {
        "wedding": {
            "id": wedding["id"],
            "short_code": wedding["short_code"],
            "title": wedding["title"],
            "description": wedding.get("description"),
            "bride_name": wedding["bride_name"],
            "groom_name": wedding["groom_name"],
            "scheduled_date": wedding["scheduled_date"],
            "location": wedding.get("location"),
            "cover_image": wedding.get("cover_image"),
            "status": wedding["status"],
            "is_locked": is_locked
        },
        "live_stream": {
            "is_live": wedding["status"] == "live" and not is_locked,
            "playback_url": wedding.get("playback_url") if not is_locked else None,
            "stream_call_id": wedding.get("stream_call_id") if not is_locked else None,
            "viewers_count": wedding.get("viewers_count", 0)
        },
        "media": {
            "total_count": media_count if not is_locked else 0,
            "recent_items": [
                {
                    "id": item["id"],
                    "type": item["type"],
                    "url": item["url"],
                    "thumbnail_url": item.get("thumbnail_url"),
                    "caption": item.get("caption")
                }
                for item in recent_media
            ] if not is_locked else []
        },
        "photo_booth": {
            "count": photobooth_count if not is_locked else 0
        },
        "recording": {
            "available": wedding.get("recording_url") is not None and not is_locked,
            "url": wedding.get("recording_url") if not is_locked else None
        },
        "branding": branding_data,
        "access_restricted": is_locked,
        "restriction_message": "This wedding content is locked. The creator needs to upgrade to Premium to unlock all features." if is_locked else None
    }
