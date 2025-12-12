from fastapi import APIRouter, HTTPException, status, Depends
"""Wedding management routes - includes multi-camera and settings"""
from app.models import (
    WeddingCreate, WeddingUpdate, WeddingResponse,
    StreamStatus, StreamCredentials, WeddingSettings,
    UpdateWeddingSettings, MultiCamera, CameraStatus,
    ThemeSettings, UpdateThemeSettings, StudioDetails, CustomMessages
)
from app.auth import get_current_user, get_current_creator, get_current_user_optional
from app.database import get_db
from app.services.stream_service import StreamService
from app.utils import generate_short_code
from datetime import datetime
from typing import List, Optional
import uuid

router = APIRouter()
stream_service = StreamService()

async def resolve_theme_asset_urls(db, theme_assets: dict) -> dict:
    """Resolve theme asset IDs to actual URLs"""
    if not theme_assets:
        return {}
    
    resolved_assets = theme_assets.copy()
    
    # Helper function to get URL from asset ID
    async def get_asset_url(asset_id: str, collection: str) -> str:
        if not asset_id:
            return ""
        try:
            asset = await db[collection].find_one({"id": asset_id})
            return asset.get("cdn_url", "") if asset else ""
        except Exception as e:
            print(f"Error resolving asset URL for {asset_id}: {e}")
            return ""
    
    # Resolve border URLs
    borders = theme_assets.get("borders", {})
    if borders.get("bride_border_id"):
        resolved_assets["bride_border_url"] = await get_asset_url(borders["bride_border_id"], "photo_borders")
    if borders.get("groom_border_id"):
        resolved_assets["groom_border_url"] = await get_asset_url(borders["groom_border_id"], "photo_borders")
    if borders.get("couple_border_id"):
        resolved_assets["couple_border_url"] = await get_asset_url(borders["couple_border_id"], "photo_borders")
    if borders.get("cover_border_id"):
        resolved_assets["cover_border_url"] = await get_asset_url(borders["cover_border_id"], "photo_borders")
    
    # Resolve precious moment style URL
    if theme_assets.get("precious_moment_style_id"):
        resolved_assets["couple_style_url"] = await get_asset_url(theme_assets["precious_moment_style_id"], "precious_moment_styles")
    
    # Resolve background image URL
    if theme_assets.get("background_image_id"):
        resolved_assets["background_url"] = await get_asset_url(theme_assets["background_image_id"], "background_images")
    
    return resolved_assets

@router.post("/", response_model=WeddingResponse, status_code=status.HTTP_201_CREATED)
async def create_wedding(
    wedding_data: WeddingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new wedding event"""
    try:
        db = get_db()
        
        # Get user's subscription plan
        user = await db.users.find_one({"id": current_user["user_id"]})
        subscription_plan = user.get("subscription_plan", "free") if user else "free"
        
        # Check if user is on free plan and already has a wedding
        if subscription_plan == "free":
            existing_weddings_count = await db.weddings.count_documents({"creator_id": current_user["user_id"]})
            if existing_weddings_count >= 1:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Free plan users can only create 1 wedding event. Please upgrade to Premium to create unlimited weddings."
                )
        
        # Generate wedding ID first (needed for stream key generation)
        wedding_id = str(uuid.uuid4())
        
        # Generate RTMP credentials using Stream.com with wedding_id
        print(f"🎥 Creating stream for wedding: {wedding_id}")
        stream_creds = await stream_service.create_stream(wedding_id)
        print(f"✅ Stream created successfully")
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ Error creating wedding: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create wedding: {str(e)}"
        )
    
    # Generate unique short code for easy sharing
    short_code = generate_short_code()
    # Ensure short code is unique
    while await db.weddings.find_one({"short_code": short_code}):
        short_code = generate_short_code()
    wedding = {
        "id": wedding_id,
        "short_code": short_code,
        "title": wedding_data.title,
        "description": wedding_data.description,
        "bride_name": wedding_data.bride_name,
        "groom_name": wedding_data.groom_name,
        "creator_id": current_user["user_id"],
        "scheduled_date": wedding_data.scheduled_date,
        "location": wedding_data.location,
        "cover_image": wedding_data.cover_image,
        "status": StreamStatus.SCHEDULED.value,
        "stream_call_id": stream_creds["call_id"],
        "rtmp_url": stream_creds["rtmp_url"],
        "stream_key": stream_creds["stream_key"],
        "playback_url": stream_creds["playback_url"],
        "recording_url": None,
        "viewers_count": 0,
        "is_locked": False,
        "multi_cameras": [],
        "settings": {
            "auto_delete_media": False,
            "auto_delete_days": 30,
            "enable_download": True,
            "enable_sharing": True,
            "enable_dvr": False,
            "auto_record": True,
            "allow_comments": True,
            "allow_public_sharing": True,
            "viewer_limit": None,
            "playback_quality": "auto",
            "live_quality": "480p",
            "recording_quality": "480p"
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.weddings.insert_one(wedding)
    
    # Get creator info
    creator = await db.users.find_one({"id": current_user["user_id"]})
    
    return WeddingResponse(
        id=wedding["id"],
        short_code=wedding.get("short_code"),
        title=wedding["title"],
        description=wedding.get("description"),
        bride_name=wedding["bride_name"],
        groom_name=wedding["groom_name"],
        creator_id=wedding["creator_id"],
        creator_name=creator.get("full_name") if creator else None,
        scheduled_date=wedding["scheduled_date"],
        location=wedding.get("location"),
        cover_image=wedding.get("cover_image"),
        status=StreamStatus(wedding["status"]),
        stream_credentials=StreamCredentials(
            rtmp_url=wedding["rtmp_url"],
            stream_key=wedding["stream_key"],
            playback_url=wedding["playback_url"]
        ),
        playback_url=wedding["playback_url"],
        recording_url=wedding.get("recording_url"),
        viewers_count=wedding["viewers_count"],
        is_locked=wedding.get("is_locked", False),
        multi_cameras=[MultiCamera(**cam) for cam in wedding.get("multi_cameras", [])],
        settings=WeddingSettings(**wedding.get("settings", {})) if wedding.get("settings") else None,
        created_at=wedding["created_at"],
        updated_at=wedding["updated_at"]
    )

@router.get("/", response_model=List[WeddingResponse])
async def list_weddings(skip: int = 0, limit: int = 20):
    """List all public weddings"""
    db = get_db()
    
    cursor = db.weddings.find().sort("scheduled_date", -1).skip(skip).limit(limit)
    weddings = await cursor.to_list(length=limit)
    
    result = []
    for wedding in weddings:
        # Get creator info
        creator = await db.users.find_one({"id": wedding["creator_id"]})
        
        # Don't expose stream credentials in public listing
        result.append(WeddingResponse(
            id=wedding["id"],
            short_code=wedding.get("short_code"),
            title=wedding["title"],
            description=wedding.get("description"),
            bride_name=wedding["bride_name"],
            groom_name=wedding["groom_name"],
            creator_id=wedding["creator_id"],
            creator_name=creator.get("full_name") if creator else None,
            scheduled_date=wedding["scheduled_date"],
            location=wedding.get("location"),
            cover_image=wedding.get("cover_image"),
            status=StreamStatus(wedding["status"]),
            playback_url=wedding["playback_url"] if wedding["status"] in ["live", "recorded"] else None,
            recording_url=wedding.get("recording_url"),
            viewers_count=wedding["viewers_count"],
            is_locked=wedding.get("is_locked", False),
            created_at=wedding["created_at"],
            updated_at=wedding["updated_at"]
        ))
    
    return result

@router.get("/my-weddings", response_model=List[WeddingResponse])
async def list_my_weddings(current_user: dict = Depends(get_current_user)):
    """List current user's weddings"""
    db = get_db()
    
    cursor = db.weddings.find({"creator_id": current_user["user_id"]}).sort("created_at", -1)
    weddings = await cursor.to_list(length=100)
    
    result = []
    for wedding in weddings:
        creator = await db.users.find_one({"id": wedding["creator_id"]})
        
        result.append(WeddingResponse(
            id=wedding["id"],
            short_code=wedding.get("short_code"),
            title=wedding["title"],
            description=wedding.get("description"),
            bride_name=wedding["bride_name"],
            groom_name=wedding["groom_name"],
            creator_id=wedding["creator_id"],
            creator_name=creator.get("full_name") if creator else None,
            scheduled_date=wedding["scheduled_date"],
            location=wedding.get("location"),
            cover_image=wedding.get("cover_image"),
            status=StreamStatus(wedding["status"]),
            stream_credentials=StreamCredentials(
                rtmp_url=wedding["rtmp_url"],
                stream_key=wedding["stream_key"],
                playback_url=wedding["playback_url"]
            ),
            playback_url=wedding["playback_url"],
            recording_url=wedding.get("recording_url"),
            viewers_count=wedding["viewers_count"],
            is_locked=wedding.get("is_locked", False),
            multi_cameras=[MultiCamera(**cam) for cam in wedding.get("multi_cameras", [])],
            settings=WeddingSettings(**wedding.get("settings", {})) if wedding.get("settings") else None,
            created_at=wedding["created_at"],
            updated_at=wedding["updated_at"]
        ))
    
    return result

@router.get("/creator/{wedding_id}", response_model=WeddingResponse)
async def get_wedding_as_creator(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get wedding details with full access for creator (including locked weddings)"""
    db = get_db()
    
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
            detail="Not authorized to access this wedding"
        )
    
    creator = await db.users.find_one({"id": wedding["creator_id"]})
    
    # Creator always gets full access including RTMP credentials
    return WeddingResponse(
        id=wedding["id"],
        short_code=wedding.get("short_code"),
        title=wedding["title"],
        description=wedding.get("description"),
        bride_name=wedding["bride_name"],
        groom_name=wedding["groom_name"],
        creator_id=wedding["creator_id"],
        creator_name=creator.get("full_name") if creator else None,
        scheduled_date=wedding["scheduled_date"],
        location=wedding.get("location"),
        cover_image=wedding.get("cover_image"),
        status=StreamStatus(wedding["status"]),
        stream_credentials=StreamCredentials(
            rtmp_url=wedding["rtmp_url"],
            stream_key=wedding["stream_key"],
            playback_url=wedding["playback_url"]
        ),
        playback_url=wedding["playback_url"],
        recording_url=wedding.get("recording_url"),
        viewers_count=wedding["viewers_count"],
        is_locked=wedding.get("is_locked", False),
        multi_cameras=[MultiCamera(**cam) for cam in wedding.get("multi_cameras", [])],
        settings=WeddingSettings(**wedding.get("settings", {})) if wedding.get("settings") else None,
        created_at=wedding["created_at"],
        updated_at=wedding["updated_at"]
    )

@router.get("/{wedding_id}", response_model=WeddingResponse)
async def get_wedding(
    wedding_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get wedding details - if authenticated as creator, returns RTMP credentials"""
    db = get_db()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    creator = await db.users.find_one({"id": wedding["creator_id"]})
    is_locked = wedding.get("is_locked", False)
    
    # Check if requester is the creator
    is_creator = current_user and current_user.get("user_id") == wedding["creator_id"]
    
    # For public viewing, if wedding is locked, restrict playback access
    # Creator can still access via their dashboard or by authenticating
    playback_url = None
    recording_url = None
    stream_credentials = None
    
    if is_creator:
        # Creator gets full credentials
        stream_credentials = StreamCredentials(
            rtmp_url=wedding["rtmp_url"],
            stream_key=wedding["stream_key"],
            playback_url=wedding["playback_url"]
        )
        playback_url = wedding["playback_url"] if wedding["status"] in ["live", "recorded"] else None
        recording_url = wedding.get("recording_url")
    elif not is_locked:
        # Wedding is unlocked - everyone can access playback
        playback_url = wedding["playback_url"] if wedding["status"] in ["live", "recorded"] else None
        recording_url = wedding.get("recording_url")
    # If locked and not creator, credentials remain None
    
    # Get theme_settings with fallback to default
    theme_settings_data = wedding.get("theme_settings")
    if theme_settings_data and isinstance(theme_settings_data, dict):
        try:
            # Ensure nested objects are properly initialized
            if "studio_details" not in theme_settings_data or not theme_settings_data["studio_details"]:
                theme_settings_data["studio_details"] = {}
            if "custom_messages" not in theme_settings_data or not theme_settings_data["custom_messages"]:
                theme_settings_data["custom_messages"] = {}
            
            # Resolve theme asset IDs to URLs
            theme_assets = theme_settings_data.get("theme_assets", {})
            if theme_assets:
                resolved_assets = await resolve_theme_asset_urls(db, theme_assets)
                theme_settings_data["theme_assets"] = resolved_assets
            
            theme_settings = ThemeSettings(**theme_settings_data)
        except Exception as e:
            print(f"⚠️ Error parsing theme_settings: {e}")
            # Fallback to defaults if parsing fails
            theme_settings = ThemeSettings()
    else:
        # Provide default theme settings to prevent crashes
        theme_settings = ThemeSettings()
    
    return WeddingResponse(
        id=wedding["id"],
        short_code=wedding.get("short_code"),
        title=wedding["title"],
        description=wedding.get("description"),
        bride_name=wedding["bride_name"],
        groom_name=wedding["groom_name"],
        creator_id=wedding["creator_id"],
        creator_name=creator.get("full_name") if creator else None,
        creator_subscription_plan=creator.get("subscription_plan", "free") if creator else "free",
        scheduled_date=wedding["scheduled_date"],
        location=wedding.get("location"),
        cover_image=wedding.get("cover_image"),
        status=StreamStatus(wedding["status"]),
        stream_credentials=stream_credentials,
        playback_url=playback_url,
        recording_url=recording_url,
        viewers_count=wedding["viewers_count"],
        is_locked=is_locked,
        multi_cameras=[MultiCamera(**cam) for cam in wedding.get("multi_cameras", [])] if is_creator else [],
        settings=WeddingSettings(**wedding.get("settings", {})) if is_creator and wedding.get("settings") else None,
        theme_settings=theme_settings,
        created_at=wedding["created_at"],
        updated_at=wedding["updated_at"]
    )

@router.put("/{wedding_id}", response_model=WeddingResponse)
async def update_wedding(
    wedding_id: str,
    wedding_data: WeddingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update wedding details"""
    db = get_db()
    
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
            detail="Not authorized to update this wedding"
        )
    
    # Update only provided fields
    update_data = wedding_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    await db.weddings.update_one(
        {"id": wedding_id},
        {"$set": update_data}
    )
    
    # Return updated wedding
    updated_wedding = await db.weddings.find_one({"id": wedding_id})
    creator = await db.users.find_one({"id": updated_wedding["creator_id"]})
    
    return WeddingResponse(
        id=updated_wedding["id"],
        short_code=updated_wedding.get("short_code"),
        title=updated_wedding["title"],
        description=updated_wedding.get("description"),
        bride_name=updated_wedding["bride_name"],
        groom_name=updated_wedding["groom_name"],
        creator_id=updated_wedding["creator_id"],
        creator_name=creator.get("full_name") if creator else None,
        scheduled_date=updated_wedding["scheduled_date"],
        location=updated_wedding.get("location"),
        cover_image=updated_wedding.get("cover_image"),
        status=StreamStatus(updated_wedding["status"]),
        stream_credentials=StreamCredentials(
            rtmp_url=updated_wedding["rtmp_url"],
            stream_key=updated_wedding["stream_key"],
            playback_url=updated_wedding["playback_url"]
        ),
        playback_url=updated_wedding["playback_url"],
        recording_url=updated_wedding.get("recording_url"),
        viewers_count=updated_wedding["viewers_count"],
        is_locked=updated_wedding.get("is_locked", False),
        multi_cameras=[MultiCamera(**cam) for cam in updated_wedding.get("multi_cameras", [])],
        settings=WeddingSettings(**updated_wedding.get("settings", {})) if updated_wedding.get("settings") else None,
        created_at=updated_wedding["created_at"],
        updated_at=updated_wedding["updated_at"]
    )

@router.delete("/{wedding_id}")
async def delete_wedding(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a wedding event"""
    db = get_db()
    
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
            detail="Not authorized to delete this wedding"
        )
    
    await db.weddings.delete_one({"id": wedding_id})
    
    return {"message": "Wedding deleted successfully"}

# Wedding Settings Endpoints
@router.get("/{wedding_id}/settings", response_model=WeddingSettings)
async def get_wedding_settings(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get wedding settings"""
    db = get_db()
    
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
            detail="Not authorized to access these settings"
        )
    
    settings = wedding.get("settings", {})
    return WeddingSettings(**settings)

@router.put("/{wedding_id}/settings", response_model=WeddingSettings)
async def update_wedding_settings(
    wedding_id: str,
    settings_update: UpdateWeddingSettings,
    current_user: dict = Depends(get_current_user)
):
    """Update wedding settings"""
    db = get_db()
    
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
            detail="Not authorized to update these settings"
        )
    
    # Get current settings
    current_settings = wedding.get("settings", {})
    
    # Update only provided fields
    update_data = settings_update.dict(exclude_unset=True)
    current_settings.update(update_data)
    
    # Save updated settings
    await db.weddings.update_one(
        {"id": wedding_id},
        {"$set": {"settings": current_settings, "updated_at": datetime.utcnow()}}
    )
    


@router.get("/{wedding_id}/theme", response_model=ThemeSettings)
async def get_wedding_theme_settings(
    wedding_id: str
):
    """Get wedding theme settings (public access)"""
    db = get_db()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    theme_settings = wedding.get("theme_settings", {})
    
    # Return default theme settings if not set
    if not theme_settings:
        theme_settings = ThemeSettings().model_dump()
    
    return ThemeSettings(**theme_settings)


@router.put("/{wedding_id}/theme", response_model=ThemeSettings)
async def update_wedding_theme_settings(
    wedding_id: str,
    theme_update: UpdateThemeSettings,
    current_user: dict = Depends(get_current_user)
):
    """Update wedding theme settings (creator only)"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"[THEME_UPDATE] Starting update for wedding_id: {wedding_id}")
        logger.info(f"[THEME_UPDATE] Update data: {theme_update.dict(exclude_unset=True)}")
        
        db = get_db()
        
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            logger.error(f"[THEME_UPDATE] Wedding not found: {wedding_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        # Verify ownership
        if wedding["creator_id"] != current_user["user_id"]:
            logger.error(f"[THEME_UPDATE] Unauthorized access by user: {current_user['user_id']}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update theme settings"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[THEME_UPDATE] Initial validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating request: {str(e)}"
        )
    
    # Get current theme settings or initialize with defaults
    current_theme = wedding.get("theme_settings", {})
    if not current_theme:
        current_theme = ThemeSettings().model_dump()
    
    # Ensure nested objects exist
    if "studio_details" not in current_theme or not current_theme["studio_details"]:
        current_theme["studio_details"] = StudioDetails().model_dump()
    if "custom_messages" not in current_theme or not current_theme["custom_messages"]:
        current_theme["custom_messages"] = CustomMessages().model_dump()
    
    # Update only provided fields - handle nested objects properly
    update_data = theme_update.model_dump(exclude_unset=True)
    
    # Handle nested updates for studio_details
    if "studio_details" in update_data and update_data["studio_details"] is not None:
        # Convert to dict if it's a Pydantic model instance
        studio_dict = update_data["studio_details"]
        if isinstance(studio_dict, StudioDetails):
            studio_dict = studio_dict.model_dump()
        elif not isinstance(studio_dict, dict):
            studio_dict = dict(studio_dict)
        
        # Update all provided fields (allow empty strings for clearing)
        for key, value in studio_dict.items():
            if value is not None:
                current_theme["studio_details"][key] = value
        del update_data["studio_details"]
    
    # Handle nested updates for custom_messages
    if "custom_messages" in update_data and update_data["custom_messages"] is not None:
        # Convert to dict if it's a Pydantic model instance
        messages_dict = update_data["custom_messages"]
        if isinstance(messages_dict, CustomMessages):
            messages_dict = messages_dict.model_dump()
        elif not isinstance(messages_dict, dict):
            messages_dict = dict(messages_dict)
        
        # Update all provided fields (allow empty strings for clearing)
        for key, value in messages_dict.items():
            if value is not None:
                current_theme["custom_messages"][key] = value
        del update_data["custom_messages"]
    
    # Update remaining fields
    current_theme.update(update_data)
    
    # Validate the final theme before saving
    try:
        logger.info(f"[THEME_UPDATE] Validating final theme settings...")
        validated_theme = ThemeSettings(**current_theme)
        logger.info(f"[THEME_UPDATE] Theme validation successful")
    except Exception as e:
        logger.error(f"[THEME_UPDATE] Theme validation error: {str(e)}")
        logger.error(f"[THEME_UPDATE] Current theme data: {current_theme}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid theme settings: {str(e)}"
        )
    
    # Save updated theme settings
    try:
        logger.info(f"[THEME_UPDATE] Saving to database...")
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {"theme_settings": validated_theme.model_dump(), "updated_at": datetime.utcnow()}}
        )
        logger.info(f"[THEME_UPDATE] Theme settings saved successfully")
    except Exception as e:
        logger.error(f"[THEME_UPDATE] Database save error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving theme settings: {str(e)}"
        )
    
    return validated_theme
