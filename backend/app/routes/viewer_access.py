"""
Viewer Access Routes
Public endpoints for guests to access weddings via Wedding ID
"""

from fastapi import APIRouter, HTTPException, status
from app.database import get_db
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.services.wedding_data_mapper import WeddingDataMapper
from app.utils.telegram_url_proxy import telegram_url_to_proxy, telegram_file_id_to_proxy_url
import re
import logging

router = APIRouter()
wedding_mapper = WeddingDataMapper()
logger = logging.getLogger(__name__)

def clean_invalid_telegram_urls(data):
    """
    Recursively clean invalid placeholder Telegram URLs from data structure.
    Replaces URLs containing /file_XXX.png pattern (placeholder images) with None.
    These are NOT valid Telegram file_ids and will always return 404.
    """
    if isinstance(data, dict):
        cleaned = {}
        for key, value in data.items():
            if isinstance(value, str) and "api.telegram.org" in value:
                # Check if this is a placeholder URL pattern
                if re.search(r'/file_\d+\.(png|jpg|jpeg|webp)', value):
                    logger.warning(f"Removing invalid placeholder URL from {key}: {value}")
                    cleaned[key] = None  # Replace with None instead of keeping invalid URL
                else:
                    cleaned[key] = value
            elif isinstance(value, (dict, list)):
                cleaned[key] = clean_invalid_telegram_urls(value)
            else:
                cleaned[key] = value
        return cleaned
    elif isinstance(data, list):
        return [clean_invalid_telegram_urls(item) for item in data]
    else:
        return data

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
    from app.services.live_status_service import LiveStatusService

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
    
    # Get video template assignment and template data
    template_data = None
    template_assignment = await db.wedding_template_assignments.find_one({"wedding_id": wedding_id})
    if template_assignment:
        template = await db.video_templates.find_one({"id": template_assignment["template_id"]})
        if template:
            video_data = template.get("video_data", {})
            preview_thumbnail = template.get("preview_thumbnail", {})
            
            # Construct resolution string from width and height
            width = video_data.get("width")
            height = video_data.get("height")
            resolution = f"{width}x{height}" if width and height else None
            
            # Set reference resolution for overlay positioning
            # Use actual video dimensions if available, otherwise use common portrait resolution
            reference_resolution = {
                "width": width if width else 1080,
                "height": height if height else 1920
            }
            
            # Map wedding data for overlays
            wedding_data_mapped = wedding_mapper.map_wedding_data(wedding)
            
            # Populate overlays with wedding data
            text_overlays = template.get("text_overlays", [])
            populated_overlays = []
            for overlay in text_overlays:
                text_value = wedding_mapper.populate_overlay_text(overlay, wedding_data_mapped)
                
                # Create copy of overlay with populated text
                # PRESERVE ORIGINAL TIMING - Do not override start_time/end_time
                # The frontend VideoTemplatePlayer handles visibility based on configured timing
                overlay_copy = {
                    **overlay,
                    "text_value": text_value,
                    "text": text_value,  # Ensure both fields are available
                }
                populated_overlays.append(overlay_copy)
            
            # CRITICAL DEBUG LOGGING
            logger.info(f"[VIEWER_ACCESS] Wedding {wedding_id} - Populated {len(populated_overlays)} overlays")
            for idx, overlay in enumerate(populated_overlays):
                logger.info(f"[VIEWER_ACCESS] Overlay {idx}: text='{overlay.get('text')}', text_value='{overlay.get('text_value')}', timing={overlay.get('timing')}")
            
            # CRITICAL FIX: Use telegram_file_id to generate fresh proxy URLs
            # This ensures URLs always work even if the stored urls are stale/expired
            video_file_id = video_data.get("telegram_file_id")
            thumbnail_file_id = preview_thumbnail.get("telegram_file_id")
            
            video_url_proxied = telegram_file_id_to_proxy_url(video_file_id, "videos") if video_file_id else telegram_url_to_proxy(video_data.get("original_url"))
            thumbnail_url_proxied = telegram_file_id_to_proxy_url(thumbnail_file_id, "photos") if thumbnail_file_id else telegram_url_to_proxy(preview_thumbnail.get("url"))
            
            template_data = {
                "id": template["id"],
                "name": template.get("name"),
                "video_url": video_url_proxied,
                "thumbnail_url": thumbnail_url_proxied,
                "duration": video_data.get("duration_seconds"),
                "resolution": resolution,
                "reference_resolution": reference_resolution,
                "text_overlays": populated_overlays
            }
    
    # Clean invalid placeholder URLs from theme_settings before returning
    # This prevents 404 errors from /file_XXX.png placeholder images
    theme_settings = wedding.get("theme_settings")
    if theme_settings:
        theme_settings = clean_invalid_telegram_urls(theme_settings)
        logger.info(f"[VIEWER] Cleaned theme_settings for wedding {wedding_id}")
    
    # Get layout photos for the public view
    layout_photos = wedding.get("layout_photos", {})
    
    # Convert layout_photos URLs to proxy URLs to avoid CORS issues
    def convert_to_proxy_url(photo_data):
        """Convert photo data to use proxy URL"""
        if not isinstance(photo_data, dict):
            return photo_data
        
        file_id = photo_data.get('file_id', '')
        if file_id:
            # Use proxy URL format: /api/media/telegram-proxy/photos/{file_id}
            photo_data['url'] = f"/api/media/telegram-proxy/photos/{file_id}"
        
        return photo_data
    
    # Process layout_photos to use proxy URLs
    processed_layout_photos = {}
    for placeholder_name, photo_data in layout_photos.items():
        if isinstance(photo_data, list):
            # Handle arrays (like preciousMoments)
            processed_layout_photos[placeholder_name] = [
                convert_to_proxy_url(photo.copy()) if isinstance(photo, dict) else photo
                for photo in photo_data
            ]
        elif isinstance(photo_data, dict):
            # Handle single photos
            processed_layout_photos[placeholder_name] = convert_to_proxy_url(photo_data.copy())
        else:
            processed_layout_photos[placeholder_name] = photo_data
    
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
            "bride_photo": wedding.get("bride_photo"),
            "groom_photo": wedding.get("groom_photo"),
            "status": wedding["status"],
            "is_locked": is_locked
        },
        "live_stream": {
    
    # Resolve playback URL (Composed stream vs Standard)
    playback_url = wedding.get("playback_url")
    if wedding["status"] == "live" and not is_locked:
        # Check if composition is active
        comp_config = wedding.get("composition_config", {})
        # If we have an active composition, we should prioritize its output URL
        # The composition URL is typically /hls_output/output_{id}/output.m3u8
        # But we only use it if composition is actually running/active
        # OR if we want to enforce it for multi-camera weddings
        if comp_config.get("active") or wedding.get("active_camera_id"):
             # If multi-camera is involved, we likely want the composed stream
             # Assuming standard path
             composed_url = f"/hls_output/output_{wedding_id}/output.m3u8"
             playback_url = composed_url
    

            "is_live": wedding["status"] == "live" and not is_locked,
            "playback_url": playback_url,
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
        "theme_settings": theme_settings,
        "layout_photos": processed_layout_photos,  # Include layout photos for public view
        "video_template": template_data,
        "branding": branding_data,
        "access_restricted": is_locked,
        "restriction_message": "This wedding content is locked. The creator needs to upgrade to Premium to unlock all features." if is_locked else None
    }
