from fastapi import APIRouter, HTTPException, status, Depends
"""Wedding management routes - includes multi-camera and settings"""
from app.models import (
    WeddingCreate, WeddingUpdate, WeddingResponse,
    StreamStatus, StreamCredentials, WeddingSettings,
    UpdateWeddingSettings, MultiCamera, CameraStatus,
    ThemeSettings, UpdateThemeSettings, StudioDetails, CustomMessages,
    WeddingThemeAssets, WeddingBackgrounds
)
from app.auth import get_current_user, get_current_creator, get_current_user_optional
from app.database import get_db
from app.services.stream_service import StreamService
from app.utils import generate_short_code
from app.utils.telegram_url_proxy import telegram_url_to_proxy, telegram_file_id_to_proxy_url
from datetime import datetime
from typing import List, Optional
import uuid

router = APIRouter()
stream_service = StreamService()

async def filter_invalid_photo_references(photos: list, logger) -> list:
    """
    Filter out invalid/placeholder photo references from photo lists
    Returns only photos with valid Telegram file_ids or full URLs
    """
    if not photos:
        return []
    
    valid_photos = []
    for photo in photos:
        if isinstance(photo, dict):
            file_id = photo.get('file_id', '')
            url = photo.get('url', '') or photo.get('cdn_url', '')
            
            # Check if photo has a valid URL (full http/https URL)
            if url and (url.startswith('http://') or url.startswith('https://')):
                valid_photos.append(photo)
                continue
            
            # Check if file_id is valid (not a placeholder like file_61)
            if file_id:
                # Invalid: file_XX pattern where XX is a number
                if file_id.startswith("file_") and file_id.replace("file_", "").replace(".jpg", "").replace(".png", "").isdigit():
                    logger.warning(f"[FILTER_PHOTOS] Skipping placeholder photo with file_id: {file_id}")
                    continue
                
                # Invalid: suspiciously short file_ids
                if len(file_id) < 20:
                    logger.warning(f"[FILTER_PHOTOS] Skipping photo with suspiciously short file_id: {file_id}")
                    continue
                
                # Valid file_id
                valid_photos.append(photo)
        elif isinstance(photo, str):
            # String URL - check if it's valid
            if photo.startswith('http://') or photo.startswith('https://'):
                valid_photos.append(photo)
            else:
                logger.warning(f"[FILTER_PHOTOS] Skipping invalid string photo reference: {photo[:50]}")
    
    logger.info(f"[FILTER_PHOTOS] Filtered {len(photos)} photos -> {len(valid_photos)} valid photos")
    return valid_photos

async def resolve_theme_asset_urls(db, theme_assets: dict) -> dict:
    """
    COMPLETE THEME ASSET RESOLVER
    Converts ALL border/background IDs to ready-to-use URLs
    Returns flat structure for frontend consumption
    
    IMPROVED: Filters out invalid/missing asset references to prevent 404 errors
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if not theme_assets:
        logger.info("[RESOLVE_ASSET] No theme assets to resolve")
        return {}
    
    resolved_assets = {}
    missing_assets = []  # Track missing assets for logging
    
    # Helper function to get URL from asset ID
    async def get_asset_url(asset_id: str, collection: str, asset_name: str = "") -> str:
        if not asset_id:
            return None
        try:
            asset = await db[collection].find_one({"id": asset_id})
            if asset:
                cdn_url = asset.get("cdn_url", "")
                telegram_file_id = asset.get("telegram_file_id", "")
                
                # Prefer telegram_file_id for more reliable URL generation
                if telegram_file_id:
                    # Determine media type based on collection
                    media_type = "documents" if collection == "photo_borders" else "photos"
                    proxy_url = telegram_file_id_to_proxy_url(telegram_file_id, media_type)
                    logger.info(f"[RESOLVE_ASSET] {collection}/{asset_id} -> {proxy_url} (via file_id)")
                    return proxy_url
                
                # Fallback to cdn_url with proxy conversion
                if cdn_url:
                    proxy_url = telegram_url_to_proxy(cdn_url)
                    logger.info(f"[RESOLVE_ASSET] {collection}/{asset_id} -> {proxy_url} (via cdn_url)")
                    return proxy_url
                
                logger.warning(f"[RESOLVE_ASSET] No URL available for {collection}/{asset_id} ({asset_name})")
                return None
            else:
                logger.warning(f"[RESOLVE_ASSET] Asset not found: {collection}/{asset_id} ({asset_name})")
                missing_assets.append({
                    "id": asset_id,
                    "type": collection,
                    "name": asset_name
                })
                return None
        except Exception as e:
            logger.error(f"[RESOLVE_ASSET] Error resolving {collection}/{asset_id}: {e}")
            return None
    
    logger.info(f"[RESOLVE_ASSET] Starting resolution for assets: {list(theme_assets.keys())}")
    
    # === BORDER RESOLUTION ===
    borders = theme_assets.get("borders", {})
    if borders:
        logger.info(f"[RESOLVE_ASSET] Resolving borders: {list(borders.keys())}")
        
        # Handle shared bride_groom border (applies to both) - check both key formats
        bride_groom_id = borders.get("bride_groom_border") or borders.get("bride_groom_border_id")
        if bride_groom_id:
            border_url = await get_asset_url(bride_groom_id, "photo_borders", "bride_groom_border")
            if border_url:
                resolved_assets["bride_border_url"] = border_url
                resolved_assets["groom_border_url"] = border_url
                logger.info(f"[RESOLVE_ASSET] bride_groom_border resolved: {bride_groom_id} -> {border_url}")
        
        # Individual borders override shared borders - check both key formats
        bride_id = borders.get("bride_border") or borders.get("bride_border_id")
        if bride_id:
            border_url = await get_asset_url(bride_id, "photo_borders", "bride_border")
            if border_url:
                resolved_assets["bride_border_url"] = border_url
                logger.info(f"[RESOLVE_ASSET] bride_border resolved: {bride_id} -> {border_url}")
        
        groom_id = borders.get("groom_border") or borders.get("groom_border_id")
        if groom_id:
            border_url = await get_asset_url(groom_id, "photo_borders", "groom_border")
            if border_url:
                resolved_assets["groom_border_url"] = border_url
                logger.info(f"[RESOLVE_ASSET] groom_border resolved: {groom_id} -> {border_url}")
        
        couple_id = borders.get("couple_border") or borders.get("couple_border_id")
        if couple_id:
            border_url = await get_asset_url(couple_id, "photo_borders", "couple_border")
            if border_url:
                resolved_assets["couple_border_url"] = border_url
                logger.info(f"[RESOLVE_ASSET] couple_border resolved: {couple_id} -> {border_url}")
        
        precious_id = borders.get("precious_moments_border") or borders.get("precious_moments_border_id")
        if precious_id:
            border_url = await get_asset_url(precious_id, "photo_borders", "precious_moments_border")
            if border_url:
                resolved_assets["precious_moments_border_url"] = border_url
                logger.info(f"[RESOLVE_ASSET] precious_moments_border resolved: {precious_id} -> {border_url}")
        
        # FIX 5: Add stream border support
        stream_id = borders.get("stream_border") or borders.get("stream_border_id")
        if stream_id:
            border_url = await get_asset_url(stream_id, "photo_borders", "stream_border")
            if border_url:
                resolved_assets["stream_border_url"] = border_url
                logger.info(f"[RESOLVE_ASSET] stream_border resolved: {stream_id} -> {border_url}")
        
        studio_id = borders.get("studio_border") or borders.get("studio_border_id")
        if studio_id:
            border_url = await get_asset_url(studio_id, "photo_borders", "studio_border")
            if border_url:
                resolved_assets["studio_border_url"] = border_url
                logger.info(f"[RESOLVE_ASSET] studio_border resolved: {studio_id} -> {border_url}")
    
    # === BACKGROUND RESOLUTION ===
    
    # Resolve legacy background_image_id
    if theme_assets.get("background_image_id"):
        bg_url = await get_asset_url(theme_assets["background_image_id"], "background_images", "background_image")
        if bg_url:
            resolved_assets["background_url"] = bg_url
            resolved_assets["hero_background"] = bg_url  # Compatibility alias
            resolved_assets["layout_page_background_url"] = bg_url  # Primary layout background
            logger.info(f"[RESOLVE_ASSET] background_image_id resolved: {theme_assets['background_image_id']} -> {bg_url}")
    
    # Resolve backgrounds object (from backgrounds endpoint)
    backgrounds = theme_assets.get("backgrounds", {})
    if backgrounds and isinstance(backgrounds, dict):
        logger.info(f"[RESOLVE_ASSET] Resolving backgrounds object: {list(backgrounds.keys())}")
        
        # Resolve layout page background
        if backgrounds.get("layout_page_background_id"):
            layout_bg_url = await get_asset_url(backgrounds["layout_page_background_id"], "background_images", "layout_page_background")
            if layout_bg_url:
                resolved_assets["layout_page_background_url"] = layout_bg_url
                resolved_assets["background_url"] = layout_bg_url  # Override main background
                logger.info(f"[RESOLVE_ASSET] layout_page_background_id resolved: {backgrounds['layout_page_background_id']} -> {layout_bg_url}")
        
        # Resolve stream page background
        if backgrounds.get("stream_page_background_id"):
            stream_bg_url = await get_asset_url(backgrounds["stream_page_background_id"], "background_images", "stream_page_background")
            if stream_bg_url:
                resolved_assets["stream_page_background_url"] = stream_bg_url
                logger.info(f"[RESOLVE_ASSET] stream_page_background_id resolved: {backgrounds['stream_page_background_id']} -> {stream_bg_url}")
    
    # === OTHER ASSET RESOLUTION ===
    
    # Resolve precious moment style URL
    if theme_assets.get("precious_moment_style_id"):
        style_url = await get_asset_url(theme_assets["precious_moment_style_id"], "precious_moment_styles", "precious_moment_style")
        if style_url:
            resolved_assets["couple_style_url"] = style_url
            logger.info(f"[RESOLVE_ASSET] precious_moment_style_id resolved: {theme_assets['precious_moment_style_id']} -> {style_url}")
    
    # Resolve background template URL (animated backgrounds)
    if theme_assets.get("background_template_id"):
        template_url = await get_asset_url(theme_assets["background_template_id"], "background_templates", "background_template")
        if template_url:
            resolved_assets["background_template_url"] = template_url
            logger.info(f"[RESOLVE_ASSET] background_template_id resolved: {theme_assets['background_template_id']} -> {template_url}")
    
    # Log summary
    if missing_assets:
        missing_summary = [f"{a['type']}/{a['id']}" for a in missing_assets]
        logger.warning(f"[RESOLVE_ASSET] ⚠️ Missing {len(missing_assets)} asset(s): {missing_summary}")
        resolved_assets["_missing_assets"] = missing_assets  # Include in response for frontend handling
    
    logger.info(f"[RESOLVE_ASSET] Final resolved assets: {list(resolved_assets.keys())}")
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
        "streaming_type": "weblive",  # Default to WebLive streaming
        "stream_call_id": stream_creds["call_id"],
        "rtmp_url": stream_creds["rtmp_url"],
        "stream_key": stream_creds["stream_key"],
        "playback_url": stream_creds["playback_url"],
        "recording_url": None,
        "viewers_count": 0,
        "is_locked": False,
        "multi_cameras": [],
        "youtube_settings": {
            "auth_connected": False,
            "broadcast_id": None,
            "stream_id": None,
            "youtube_video_url": None,
            "youtube_embed_url": None,
            "auth_tokens": None
        },
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
    
    # Get backgrounds data
    backgrounds_data = wedding.get("backgrounds", {})
    backgrounds = WeddingBackgrounds(**backgrounds_data) if backgrounds_data else None
    
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
            rtmp_url=wedding.get("rtmp_url", ""),
            stream_key=wedding.get("stream_key", ""),
            playback_url=wedding.get("playback_url") or ""
        ),
        playback_url=wedding["playback_url"],
        recording_url=wedding.get("recording_url"),
        viewers_count=wedding["viewers_count"],
        is_locked=wedding.get("is_locked", False),
        multi_cameras=[MultiCamera(**cam) for cam in wedding.get("multi_cameras", [])],
        settings=WeddingSettings(**wedding.get("settings", {})) if wedding.get("settings") else None,
        backgrounds=backgrounds,
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
        # Get creator info - add timeout protection
        try:
            creator = await db.users.find_one({"id": wedding["creator_id"]})
        except Exception as e:
            print(f"Error fetching creator for wedding {wedding['id']}: {e}")
            creator = None
        
        # Get backgrounds data
        backgrounds_data = wedding.get("backgrounds", {})
        backgrounds = WeddingBackgrounds(**backgrounds_data) if backgrounds_data else None
        
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
            backgrounds=backgrounds,
            created_at=wedding["created_at"],
            updated_at=wedding["updated_at"]
        ))
    
    return result

@router.get("/test")
async def test_endpoint():
    """Simple test endpoint"""
    return {"message": "API is working", "timestamp": datetime.utcnow()}

@router.get("/my-weddings-raw")
async def list_my_weddings_raw(current_user: dict = Depends(get_current_user)):
    """Raw endpoint without any model validation"""
    try:
        print("=== RAW DEBUG START ===")
        print(f"Current user: {current_user}")
        
        if not current_user or not current_user.get("user_id"):
            return {"error": "Authentication failed", "user": current_user}
        
        user_id = current_user.get("user_id")
        print(f"User ID: {user_id}")
        
        db = get_db()
        
        # Get raw wedding data without any processing
        weddings = []
        cursor = db.weddings.find({"creator_id": user_id})
        
        async for wedding in cursor:
            # Convert ObjectId to string and remove MongoDB-specific fields
            wedding_data = dict(wedding)
            wedding_data.pop("_id", None)
            weddings.append(wedding_data)
        
        print(f"Found {len(weddings)} raw weddings")
        print("=== RAW DEBUG END ===")
        
        return {
            "success": True,
            "count": len(weddings),
            "weddings": weddings
        }
        
    except Exception as e:
        print(f"RAW ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@router.get("/my-weddings-minimal")
async def list_my_weddings_minimal(current_user: dict = Depends(get_current_user)):
    """Minimal endpoint to test basic functionality"""
    try:
        print("=== MINIMAL DEBUG START ===")
        print(f"Step 1 - Current user: {current_user}")
        
        if not current_user:
            print("Step 2 - ERROR: No current user")
            return {"error": "No user", "user": current_user}
        
        user_id = current_user.get("user_id")
        print(f"Step 2 - User ID: {user_id}")
        
        if not user_id:
            print("Step 3 - ERROR: No user_id")
            return {"error": "No user_id", "user": current_user}
        
        print("Step 3 - Getting database...")
        db = get_db()
        
        print("Step 4 - Querying weddings...")
        cursor = db.weddings.find({"creator_id": user_id})
        count = await db.weddings.count_documents({"creator_id": user_id})
        print(f"Step 5 - Wedding count: {count}")
        
        print("=== MINIMAL DEBUG END ===")
        return {
            "success": True,
            "user_id": user_id,
            "wedding_count": count,
            "message": "Basic functionality works"
        }
        
    except Exception as e:
        print(f"MINIMAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@router.get("/my-weddings-simple")
async def list_my_weddings_simple(current_user: dict = Depends(get_current_user)):
    """Simple version of my-weddings without complex model validation"""
    try:
        print("=== MY-WEDDINGS-SIMPLE DEBUG START ===")
        print(f"Current user from auth: {current_user}")
        
        if not current_user or not current_user.get("user_id"):
            print("ERROR: No valid user authentication")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user_id = current_user.get("user_id")
        print(f"Fetching weddings for user_id: {user_id}")
        
        db = get_db()
        cursor = db.weddings.find({"creator_id": user_id}).sort("created_at", -1)
        weddings = await cursor.to_list(length=100)
        
        print(f"Found {len(weddings)} weddings")
        
        # Return simple data without complex model validation
        simple_weddings = []
        for wedding in weddings:
            simple_weddings.append({
                "id": wedding.get("id"),
                "title": wedding.get("title"),
                "description": wedding.get("description"),
                "bride_name": wedding.get("bride_name"),
                "groom_name": wedding.get("groom_name"),
                "status": wedding.get("status"),
                "scheduled_date": wedding.get("scheduled_date"),
                "location": wedding.get("location"),
                "created_at": wedding.get("created_at"),
                "updated_at": wedding.get("updated_at")
            })
        
        print(f"Returning {len(simple_weddings)} simple weddings")
        print("=== MY-WEDDINGS-SIMPLE DEBUG END ===")
        return simple_weddings
        
    except Exception as e:
        print(f"Error in my-weddings-simple: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )

@router.get("/public-test")
async def public_test():
    """Public endpoint without authentication to test basic functionality"""
    try:
        print("=== PUBLIC TEST START ===")
        db = get_db()
        
        # Test database connection
        wedding_count = await db.weddings.count_documents({})
        print(f"Total weddings in database: {wedding_count}")
        
        # Get a sample wedding to test data structure
        sample = await db.weddings.find_one({})
        if sample:
            print(f"Sample wedding fields: {list(sample.keys())}")
            print(f"Sample wedding ID: {sample.get('id')}")
            print(f"Sample wedding creator_id: {sample.get('creator_id')}")
        
        return {
            "success": True,
            "message": "Database connection working",
            "total_weddings": wedding_count,
            "sample_fields": list(sample.keys()) if sample else []
        }
        
    except Exception as e:
        print(f"PUBLIC TEST ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@router.get("/my-weddings-working")
async def list_my_weddings_working(current_user: dict = Depends(get_current_user)):
    """GUARANTEED WORKING endpoint - returns weddings without complex validation"""
    try:
        print(f"=== WORKING ENDPOINT START ===")
        print(f"User: {current_user}")
        
        if not current_user or not current_user.get("user_id"):
            return {"error": "Not authenticated"}
        
        user_id = current_user.get("user_id")
        print(f"Finding weddings for user: {user_id}")
        
        db = get_db()
        
        # Direct database query - no processing
        cursor = db.weddings.find({"creator_id": user_id})
        weddings = []
        
        async for wedding in cursor:
            # Minimal processing - just convert ObjectId and remove _id
            wedding_data = {
                "id": str(wedding.get("id", "")),
                "title": wedding.get("title", "Untitled"),
                "bride_name": wedding.get("bride_name", ""),
                "groom_name": wedding.get("groom_name", ""),
                "status": wedding.get("status", "scheduled"),
                "scheduled_date": wedding.get("scheduled_date"),
                "created_at": wedding.get("created_at"),
                "updated_at": wedding.get("updated_at"),
                "location": wedding.get("location"),
                "description": wedding.get("description")
            }
            weddings.append(wedding_data)
        
        print(f"FOUND {len(weddings)} WEDDINGS!")
        for w in weddings:
            print(f"  - {w['title']} ({w['id']})")
        
        return weddings
        
    except Exception as e:
        print(f"WORKING ENDPOINT ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "details": traceback.format_exc()}

@router.get("/my-weddings-debug")
async def list_my_weddings_debug(current_user: dict = Depends(get_current_user)):
    """Debug endpoint to diagnose wedding retrieval issues"""
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info("=== MY-WEDDINGS-DEBUG START ===")
        logger.info(f"Current user payload: {current_user}")
        
        if not current_user or not current_user.get("user_id"):
            return {
                "error": "No user_id in token",
                "current_user": current_user
            }
        
        user_id = current_user.get("user_id")
        logger.info(f"Extracted user_id: {user_id}")
        
        db = get_db()
        
        # Check total weddings in database
        total_count = await db.weddings.count_documents({})
        logger.info(f"Total weddings in database: {total_count}")
        
        # Check weddings for this user
        user_count = await db.weddings.count_documents({"creator_id": user_id})
        logger.info(f"Weddings for user {user_id}: {user_count}")
        
        # Get sample wedding to check creator_id format
        sample_wedding = await db.weddings.find_one({})
        sample_creator_id = sample_wedding.get("creator_id") if sample_wedding else None
        logger.info(f"Sample creator_id from database: {sample_creator_id}")
        
        # Check if user exists in database
        user_in_db = await db.users.find_one({"id": user_id})
        logger.info(f"User exists in database: {user_in_db is not None}")
        
        # Get all unique creator_ids
        pipeline = [{"$group": {"_id": "$creator_id"}}, {"$limit": 10}]
        creator_ids = await db.weddings.aggregate(pipeline).to_list(length=10)
        logger.info(f"Sample creator_ids in database: {[c['_id'] for c in creator_ids]}")
        
        return {
            "success": True,
            "user_id": user_id,
            "user_id_type": type(user_id).__name__,
            "total_weddings": total_count,
            "user_weddings": user_count,
            "user_exists_in_db": user_in_db is not None,
            "sample_creator_id": sample_creator_id,
            "sample_creator_ids": [c['_id'] for c in creator_ids]
        }
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@router.get("/my-weddings")
async def list_my_weddings(current_user: dict = Depends(get_current_user)):
    """Get user's weddings - returns array of wedding objects"""
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        if not current_user or not current_user.get("user_id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user_id = current_user.get("user_id")
        logger.info(f"[MY-WEDDINGS] Fetching weddings for user_id: {user_id}")
        
        db = get_db()
        
        # Log database query
        query = {"creator_id": user_id}
        logger.info(f"[MY-WEDDINGS] Query: {query}")
        
        # Direct database query - minimal processing
        cursor = db.weddings.find(query).sort("created_at", -1)
        weddings = []
        
        async for wedding in cursor:
            try:
                # Extract only essential fields that we know exist
                wedding_data = {
                    "id": str(wedding.get("id", "")),
                    "title": str(wedding.get("title", "Untitled Wedding")),
                    "bride_name": str(wedding.get("bride_name", "")),
                    "groom_name": str(wedding.get("groom_name", "")),
                    "status": str(wedding.get("status", "scheduled")),
                    "scheduled_date": wedding.get("scheduled_date"),
                    "created_at": wedding.get("created_at"),
                    "updated_at": wedding.get("updated_at"),
                    "location": wedding.get("location"),
                    "description": wedding.get("description"),
                    "creator_id": str(wedding.get("creator_id", "")),
                    "viewers_count": int(wedding.get("viewers_count", 0)),
                    "is_locked": bool(wedding.get("is_locked", False))
                }
                weddings.append(wedding_data)
            except Exception as field_error:
                logger.error(f"Error processing wedding {wedding.get('id')}: {field_error}")
                continue
        
        logger.info(f"[MY-WEDDINGS] Returning {len(weddings)} weddings")
        return weddings
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MY-WEDDINGS ERROR: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch weddings"
        )

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
    
    # Get backgrounds data
    backgrounds_data = wedding.get("backgrounds", {})
    backgrounds = WeddingBackgrounds(**backgrounds_data) if backgrounds_data else None
    
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
            rtmp_url=wedding.get("rtmp_url", ""),
            stream_key=wedding.get("stream_key", ""),
            playback_url=wedding.get("playback_url") or ""
        ),
        playback_url=wedding["playback_url"],
        recording_url=wedding.get("recording_url"),
        viewers_count=wedding["viewers_count"],
        is_locked=wedding.get("is_locked", False),
        multi_cameras=[MultiCamera(**cam) for cam in wedding.get("multi_cameras", [])],
        settings=WeddingSettings(**wedding.get("settings", {})) if wedding.get("settings") else None,
        backgrounds=backgrounds,
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
            rtmp_url=wedding.get("rtmp_url", ""),
            stream_key=wedding.get("stream_key", ""),
            playback_url=wedding.get("playback_url") or ""
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
            import logging
            logger = logging.getLogger(__name__)
            
            # Ensure nested objects are properly initialized
            if "studio_details" not in theme_settings_data or not theme_settings_data["studio_details"]:
                theme_settings_data["studio_details"] = {}
            if "custom_messages" not in theme_settings_data or not theme_settings_data["custom_messages"]:
                theme_settings_data["custom_messages"] = {}
            
            # CRITICAL FIX: Filter out invalid/placeholder photos before sending to frontend
            # This prevents "file_61", "file_62" type placeholder references from being displayed
            if "cover_photos" in theme_settings_data and theme_settings_data["cover_photos"]:
                theme_settings_data["cover_photos"] = await filter_invalid_photo_references(
                    theme_settings_data["cover_photos"], logger
                )
            
            if "gallery_photos" in theme_settings_data and theme_settings_data["gallery_photos"]:
                theme_settings_data["gallery_photos"] = await filter_invalid_photo_references(
                    theme_settings_data["gallery_photos"], logger
                )
            
            # Filter individual photo fields
            for photo_field in ["bride_photo", "groom_photo", "main_couple_photo"]:
                if photo_field in theme_settings_data and theme_settings_data[photo_field]:
                    photo = theme_settings_data[photo_field]
                    if isinstance(photo, dict):
                        file_id = photo.get('file_id', '')
                        # Check for invalid placeholder file_ids
                        if file_id and file_id.startswith("file_") and file_id.replace("file_", "").replace(".jpg", "").replace(".png", "").isdigit():
                            logger.warning(f"[GET_WEDDING] Removing invalid {photo_field}: {file_id}")
                            theme_settings_data[photo_field] = None
            
            # CRITICAL FIX: Resolve theme asset IDs to URLs and merge with existing data
            theme_assets = theme_settings_data.get("theme_assets", {})
            if theme_assets:
                logger.info(f"[GET_WEDDING] Resolving theme assets for wedding: {wedding_id}")
                logger.info(f"[GET_WEDDING] Theme assets before resolution: {theme_assets.keys()}")
                
                resolved_assets = await resolve_theme_asset_urls(db, theme_assets)
                
                # Merge resolved URLs with existing theme_assets (preserve IDs + add URLs)
                theme_assets.update(resolved_assets)
                theme_settings_data["theme_assets"] = theme_assets
                
                # CRITICAL FIX: Also add resolved URLs to top level for layout components
                theme_settings_data.update(resolved_assets)
                
                logger.info(f"[GET_WEDDING] Theme assets after resolution: {theme_assets.keys()}")
            
            theme_settings = ThemeSettings(**theme_settings_data)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"⚠️ Error parsing theme_settings: {e}", exc_info=True)
            # Fallback to defaults if parsing fails
            theme_settings = ThemeSettings()
    else:
        # Provide default theme settings to prevent crashes
        theme_settings = ThemeSettings()
    
    # FIX: Get backgrounds data from root level OR from theme_assets
    backgrounds_data = wedding.get("backgrounds", {})
    
    # If no root-level backgrounds, check theme_assets (where they're actually stored)
    if not backgrounds_data:
        # CRITICAL FIX: Add None-safety checks for nested dict access
        theme_settings_obj = wedding.get("theme_settings") or {}
        theme_assets_obj = theme_settings_obj.get("theme_assets") if isinstance(theme_settings_obj, dict) else {}
        theme_assets_backgrounds = theme_assets_obj.get("backgrounds", {}) if isinstance(theme_assets_obj, dict) else {}
        
        if theme_assets_backgrounds:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"[GET_WEDDING] Found backgrounds in theme_assets: {theme_assets_backgrounds}")
            backgrounds_data = theme_assets_backgrounds.copy()
    
    backgrounds = None
    if backgrounds_data:
        # Resolve background URLs if they're missing
        if backgrounds_data.get("layout_page_background_id") and not backgrounds_data.get("layout_page_background_url"):
            try:
                bg = await db.background_images.find_one({"id": backgrounds_data["layout_page_background_id"]})
                if bg:
                    backgrounds_data["layout_page_background_url"] = bg.get("cdn_url", "")
                    logger.info(f"[GET_WEDDING] Resolved layout background URL: {backgrounds_data['layout_page_background_url']}")
                else:
                    logger.warning(f"[GET_WEDDING] Background image not found for ID: {backgrounds_data['layout_page_background_id']}")
            except Exception as e:
                logger.error(f"[GET_WEDDING] Error resolving layout background URL: {e}")
        
        if backgrounds_data.get("stream_page_background_id") and not backgrounds_data.get("stream_page_background_url"):
            try:
                bg = await db.background_images.find_one({"id": backgrounds_data["stream_page_background_id"]})
                if bg:
                    backgrounds_data["stream_page_background_url"] = bg.get("cdn_url", "")
                    logger.info(f"[GET_WEDDING] Resolved stream background URL: {backgrounds_data['stream_page_background_url']}")
                else:
                    logger.warning(f"[GET_WEDDING] Background image not found for ID: {backgrounds_data['stream_page_background_id']}")
            except Exception as e:
                logger.error(f"[GET_WEDDING] Error resolving stream background URL: {e}")
        
        logger.info(f"[GET_WEDDING] Final backgrounds_data: {backgrounds_data}")
        backgrounds = WeddingBackgrounds(**backgrounds_data)
    
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
        backgrounds=backgrounds,
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
    
    # Get backgrounds data
    backgrounds_data = updated_wedding.get("backgrounds", {})
    backgrounds = WeddingBackgrounds(**backgrounds_data) if backgrounds_data else None
    
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
            rtmp_url=updated_wedding.get("rtmp_url", ""),
            stream_key=updated_wedding.get("stream_key", ""),
            playback_url=updated_wedding.get("playback_url") or ""
        ),
        playback_url=updated_wedding["playback_url"],
        recording_url=updated_wedding.get("recording_url"),
        viewers_count=updated_wedding["viewers_count"],
        is_locked=updated_wedding.get("is_locked", False),
        multi_cameras=[MultiCamera(**cam) for cam in updated_wedding.get("multi_cameras", [])],
        settings=WeddingSettings(**updated_wedding.get("settings", {})) if updated_wedding.get("settings") else None,
        backgrounds=backgrounds,
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
    
    return WeddingSettings(**current_settings)

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
    
    logger.info(f"[THEME_UPDATE] Processing update_data: {update_data}")
    
    # CRITICAL FIX: Handle layout_id/theme_id compatibility
    if "layout_id" in update_data:
        # Update both layout_id and theme_id for backward compatibility
        current_theme["layout_id"] = update_data["layout_id"]
        current_theme["theme_id"] = update_data["layout_id"]  # Keep theme_id in sync
        logger.info(f"[THEME_UPDATE] Updated layout_id to: {update_data['layout_id']}")
    
    # Handle simple field updates
    simple_fields = ["custom_font", "primary_color", "secondary_color", "pre_wedding_video"]
    for field in simple_fields:
        if field in update_data:
            current_theme[field] = update_data[field]
            logger.info(f"[THEME_UPDATE] Updated {field} to: {update_data[field]}")
    
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
        logger.info(f"[THEME_UPDATE] Updated studio_details: {studio_dict}")
    
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
        logger.info(f"[THEME_UPDATE] Updated custom_messages: {messages_dict}")
    
    # Handle theme_assets updates
    if "theme_assets" in update_data and update_data["theme_assets"] is not None:
        if not current_theme.get("theme_assets"):
            current_theme["theme_assets"] = {}
        
        # CRITICAL FIX: Convert frontend border structure to backend model structure
        theme_assets_update = update_data["theme_assets"]
        if "borders" in theme_assets_update:
            # Convert dynamic border keys to SelectedBorders structure
            borders_data = theme_assets_update["borders"]
            if not current_theme["theme_assets"].get("borders"):
                current_theme["theme_assets"]["borders"] = {}
            
            # Update with dynamic keys (the SelectedBorders model now supports this)
            current_theme["theme_assets"]["borders"].update(borders_data)
        
        # Handle other theme_assets fields
        for key, value in theme_assets_update.items():
            if key != "borders":
                current_theme["theme_assets"][key] = value
        
        logger.info(f"[THEME_UPDATE] Updated theme_assets")
    
    # Handle cover_photos updates
    if "cover_photos" in update_data and update_data["cover_photos"] is not None:
        current_theme["cover_photos"] = update_data["cover_photos"]
        logger.info(f"[THEME_UPDATE] Updated cover_photos: {len(update_data['cover_photos'])} items")
    
    # PROMPT 7: Validate max 15 precious moments (increased from 5)
    if "cover_photos" in current_theme:
        moment_photos = [p for p in current_theme["cover_photos"] if p.get("category") == "moment"]
        if len(moment_photos) > 15:
            logger.error(f"[THEME_UPDATE] Too many precious moments: {len(moment_photos)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 15 precious moments allowed"
            )
    
    # Validate the final theme before saving
    try:
        logger.info(f"[THEME_UPDATE] Validating final theme settings...")
        
        # CRITICAL FIX: Convert theme_assets to proper model structure before validation
        theme_for_validation = current_theme.copy()
        if "theme_assets" in theme_for_validation and theme_for_validation["theme_assets"]:
            # Convert dict to WeddingThemeAssets model
            theme_assets_dict = theme_for_validation["theme_assets"]
            theme_for_validation["theme_assets"] = WeddingThemeAssets(**theme_assets_dict)
        
        validated_theme = ThemeSettings(**theme_for_validation)
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
        
        # Resolve theme asset URLs before saving - CRITICAL FIX
        theme_dict = validated_theme.model_dump()
        if "theme_assets" in theme_dict and theme_dict["theme_assets"]:
            logger.info(f"[THEME_UPDATE] Resolving theme asset URLs...")
            resolved_assets = await resolve_theme_asset_urls(db, theme_dict["theme_assets"])
            theme_dict["theme_assets"].update(resolved_assets)
            # CRITICAL FIX: Also add resolved URLs to top level for layout components
            theme_dict.update(resolved_assets)
            validated_theme = ThemeSettings(**theme_dict)
            logger.info(f"[THEME_UPDATE] Theme assets resolved successfully")
        
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


# ========================================
# Cover Photos Management (NEW)
# ========================================

from pydantic import BaseModel

class AddCoverPhotoRequest(BaseModel):
    media_id: str
    category: str  # "bride", "groom", "couple", "moment"

class RemoveCoverPhotoRequest(BaseModel):
    category: str
    index: Optional[int] = 0  # For moments (multiple), index of photo to remove

@router.post("/{wedding_id}/cover-photos/add")
async def add_cover_photo_from_media(
    wedding_id: str,
    request: AddCoverPhotoRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Add a photo from media gallery to cover_photos for layout use
    This is the MISSING LINK between Media tab and Layouts
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"[ADD_COVER_PHOTO] Wedding: {wedding_id}, Media: {request.media_id}, Category: {request.category}")
        
        db = get_db()
        
        # Verify wedding exists and ownership
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get media from media collection
        media = await db.media.find_one({"id": request.media_id})
        if not media:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media not found"
            )
        
        # Verify media belongs to this wedding
        if media["wedding_id"] != wedding_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Media does not belong to this wedding"
            )
        
        # Get file URL from Telegram
        from app.services.telegram_service import TelegramCDNService
        telegram_service = TelegramCDNService()
        cdn_url = await telegram_service.get_file_url(media["file_id"])
        
        # TASK 5 FIX: Auto-update media category when assigned to layout
        await db.media.update_one(
            {"id": request.media_id},
            {"$set": {"category": request.category}}
        )
        logger.info(f"[ADD_COVER_PHOTO] Updated media {request.media_id} category to: {request.category}")
        
        # Create CoverPhoto object
        cover_photo = {
            "url": cdn_url,
            "cdn_url": cdn_url,  # Duplicate for compatibility
            "file_url": cdn_url,  # Duplicate for compatibility
            "media_id": request.media_id,
            "category": request.category,
            "type": media.get("media_type", "photo"),
            "width": media.get("width"),
            "height": media.get("height")
        }
        
        # Get current theme_settings
        theme_settings = wedding.get("theme_settings", {})
        if not theme_settings:
            theme_settings = ThemeSettings().model_dump()
        
        # Initialize cover_photos array if not exists
        if "cover_photos" not in theme_settings or not isinstance(theme_settings["cover_photos"], list):
            theme_settings["cover_photos"] = []
        
        # Add photo - for bride/groom/couple, remove existing ones first (single photo per category)
        if request.category in ["bride", "groom", "couple"]:
            # Remove existing photos of this category
            theme_settings["cover_photos"] = [
                p for p in theme_settings["cover_photos"] 
                if not (isinstance(p, dict) and p.get("category") == request.category)
            ]
        
        # TASK 7 FIX: Validate max 5 precious moments
        if request.category == "moment":
            moment_photos = [p for p in theme_settings["cover_photos"] if isinstance(p, dict) and p.get("category") == "moment"]
            if len(moment_photos) >= 5:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Maximum 5 precious moments allowed. Please remove one before adding another."
                )
        
        # Add new photo
        theme_settings["cover_photos"].append(cover_photo)
        
        # Save updated theme_settings
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {"theme_settings": theme_settings, "updated_at": datetime.utcnow()}}
        )
        
        logger.info(f"[ADD_COVER_PHOTO] Successfully added {request.category} photo from media {request.media_id}")
        
        return {
            "success": True,
            "message": f"{request.category.capitalize()} photo added to layout",
            "cover_photo": cover_photo,
            "total_cover_photos": len(theme_settings["cover_photos"])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ADD_COVER_PHOTO] Error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add cover photo: {str(e)}"
        )

@router.post("/{wedding_id}/cover-photos/remove")
async def remove_cover_photo(
    wedding_id: str,
    request: RemoveCoverPhotoRequest,
    current_user: dict = Depends(get_current_user)
):
    """Remove a photo from cover_photos array"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"[REMOVE_COVER_PHOTO] Wedding: {wedding_id}, Category: {request.category}, Index: {request.index}")
        
        db = get_db()
        
        # Verify wedding exists and ownership
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get current theme_settings
        theme_settings = wedding.get("theme_settings", {})
        cover_photos = theme_settings.get("cover_photos", [])
        
        if not cover_photos:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No cover photos found"
            )
        
        # Filter out photos of the specified category
        if request.category == "moment":
            # For moments, remove by index
            filtered_moments = [p for p in cover_photos if isinstance(p, dict) and p.get("category") == "moment"]
            if request.index >= len(filtered_moments):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Photo index not found"
                )
            
            # Remove the specific moment photo
            photo_to_remove = filtered_moments[request.index]
            cover_photos = [p for p in cover_photos if p != photo_to_remove]
        else:
            # For bride/groom/couple, remove all of that category
            original_count = len(cover_photos)
            cover_photos = [
                p for p in cover_photos 
                if not (isinstance(p, dict) and p.get("category") == request.category)
            ]
            
            if len(cover_photos) == original_count:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No {request.category} photo found"
                )
        
        # Update theme_settings
        theme_settings["cover_photos"] = cover_photos
        
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {"theme_settings": theme_settings, "updated_at": datetime.utcnow()}}
        )
        
        logger.info(f"[REMOVE_COVER_PHOTO] Successfully removed {request.category} photo")
        
        return {
            "success": True,
            "message": f"{request.category.capitalize()} photo removed",
            "remaining_cover_photos": len(cover_photos)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REMOVE_COVER_PHOTO] Error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove cover photo: {str(e)}"
        )

@router.get("/{wedding_id}/cover-photos")
async def get_cover_photos(wedding_id: str):
    """Get current cover photos configuration (public access)"""
    db = get_db()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    theme_settings = wedding.get("theme_settings", {})
    cover_photos = theme_settings.get("cover_photos", [])
    
    # Group by category for easier frontend consumption
    grouped = {
        "bride": [],
        "groom": [],
        "couple": [],
        "moment": []
    }
    
    for photo in cover_photos:
        if isinstance(photo, dict) and "category" in photo:
            category = photo.get("category", "moment")
            if category in grouped:
                grouped[category].append(photo)
    
    return {
        "cover_photos": cover_photos,
        "grouped": grouped,
        "total": len(cover_photos)
    }


# ========================================
# Streaming Type Management
# ========================================

@router.put("/{wedding_id}/streaming-type")
async def update_streaming_type(
    wedding_id: str,
    streaming_type: str,
    current_user: dict = Depends(get_current_user)
):
    """Update streaming type (weblive or youtube)
    
    Prevents switching during active stream.
    Auto-creates YouTube broadcast when switching to YouTube mode.
    """
    import logging
    logger = logging.getLogger(__name__)
    try:
        db = get_db()
        
        # Validate streaming type
        from app.models import StreamingType, YouTubeAuthTokens
        from app.services.youtube_service import YouTubeService
        
        try:
            streaming_type_enum = StreamingType(streaming_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid streaming type. Must be 'weblive' or 'youtube'"
            )
        
        # Get wedding
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        # Check ownership
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Prevent switching during active stream
        current_status = wedding.get("status", "scheduled")
        if current_status in ["live", "paused"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change streaming type during an active stream. Please end the current stream first."
            )
        
        # If switching to YouTube, auto-create broadcast if authenticated
        broadcast_created = False
        youtube_broadcast_info = None
        
        if streaming_type_enum == StreamingType.YOUTUBE:
            youtube_settings = wedding.get("youtube_settings", {})
            
            # Check if YouTube is connected
            if youtube_settings.get("auth_connected") and youtube_settings.get("auth_tokens"):
                # Check if broadcast already exists
                if not youtube_settings.get("broadcast_id"):
                    try:
                        logger.info(f"Auto-creating YouTube broadcast for wedding {wedding_id}...")
                        
                        auth_tokens_dict = youtube_settings.get("auth_tokens")
                        auth_tokens = YouTubeAuthTokens(
                            access_token=auth_tokens_dict["access_token"],
                            refresh_token=auth_tokens_dict["refresh_token"],
                            expires_at=datetime.fromisoformat(auth_tokens_dict["expires_at"]),
                            token_type=auth_tokens_dict["token_type"]
                        )
                        
                        youtube_service = YouTubeService()
                        broadcast_data = await youtube_service.create_broadcast(
                            auth_tokens=auth_tokens,
                            title=wedding.get("title", "Wedding Live Stream"),
                            description=f"Live streaming the wedding of {wedding.get('bride_name', '')} and {wedding.get('groom_name', '')}",
                            scheduled_time=wedding.get("scheduled_date", datetime.utcnow()),
                            privacy_status="unlisted"
                        )
                        
                        # Update wedding with broadcast details
                        youtube_settings["broadcast_id"] = broadcast_data["broadcast_id"]
                        youtube_settings["stream_id"] = broadcast_data["stream_id"]
                        youtube_settings["youtube_video_url"] = broadcast_data["video_url"]
                        youtube_settings["youtube_embed_url"] = broadcast_data["embed_url"]
                        
                        # Store RTMP credentials
                        stream_credentials = {
                            "rtmp_url": broadcast_data["rtmp_url"],
                            "stream_key": broadcast_data["stream_key"],
                            "playback_url": broadcast_data["video_url"]
                        }
                        
                        await db.weddings.update_one(
                            {"id": wedding_id},
                            {"$set": {
                                "youtube_settings": youtube_settings,
                                "stream_credentials": stream_credentials
                            }}
                        )
                        
                        broadcast_created = True
                        youtube_broadcast_info = {
                            "broadcast_id": broadcast_data["broadcast_id"],
                            "video_url": broadcast_data["video_url"]
                        }
                        
                        logger.info(f"✅ Auto-created YouTube broadcast: {broadcast_data['broadcast_id']}")
                        
                    except Exception as e:
                        logger.error(f"⚠️ Failed to auto-create YouTube broadcast: {str(e)}")
                        # Don't fail the streaming type switch, just log the error
        
        # Update streaming type
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {
                "streaming_type": streaming_type_enum.value,
                "updated_at": datetime.utcnow()
            }}
        )
        
        logger.info(f"✅ Updated streaming type to {streaming_type} for wedding {wedding_id}")
        
        response = {
            "success": True,
            "streaming_type": streaming_type_enum.value,
            "message": f"Streaming type updated to {streaming_type_enum.value}"
        }
        
        if broadcast_created:
            response["broadcast_created"] = True
            response["broadcast_info"] = youtube_broadcast_info
            response["message"] += " and YouTube broadcast created automatically"
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating streaming type: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update streaming type: {str(e)}"
        )

@router.put("/{wedding_id}/backgrounds")
async def update_wedding_backgrounds(
    wedding_id: str,
    backgrounds_update: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update wedding backgrounds"""
    import logging
    logger = logging.getLogger(__name__)
    db = get_db()
    
    # Verify wedding exists and user is creator
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != current_user.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only wedding creator can update backgrounds"
        )
    
    try:
        # FIX: Get backgrounds from the correct location (wedding.backgrounds)
        current_backgrounds = wedding.get("backgrounds", {}) if isinstance(wedding.get("backgrounds"), dict) else {}

        merged_backgrounds = current_backgrounds.copy()
        if isinstance(backgrounds_update, dict):
            merged_backgrounds.update(backgrounds_update)

        # FIX: Resolve background URLs from photo_borders collection
        async def _resolve_bg(bg_id: str):
            if not bg_id:
                return None
            # Look in photo_borders collection where backgrounds are stored
            doc = await db.photo_borders.find_one({"id": bg_id, "category": "background"})
            return doc.get("cdn_url") if doc else None

        # Add resolved URLs to the merged backgrounds
        merged_backgrounds["layout_page_background_url"] = await _resolve_bg(
            merged_backgrounds.get("layout_page_background_id")
        )
        merged_backgrounds["stream_page_background_url"] = await _resolve_bg(
            merged_backgrounds.get("stream_page_background_id")
        )

        # FIX: Persist to wedding.backgrounds (not theme_settings.theme_assets.backgrounds)
        result = await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {
                "backgrounds": merged_backgrounds,
                "updated_at": datetime.utcnow()
            }}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )

        # Return ids + resolved preview URLs (for ThemeManager preview)
        response = {
            "layout_page_background_id": merged_backgrounds.get("layout_page_background_id"),
            "stream_page_background_id": merged_backgrounds.get("stream_page_background_id"),
            "layout_page_background_url": merged_backgrounds.get("layout_page_background_url"),
            "stream_page_background_url": merged_backgrounds.get("stream_page_background_url"),
        }

        logger.info(f"[BACKGROUNDS_UPDATE] Updated backgrounds for wedding: {wedding_id}")
        return response

    except Exception as e:
        logger.error(f"[BACKGROUNDS_UPDATE] Error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update backgrounds: {str(e)}"
        )


@router.get("/{wedding_id}/backgrounds")
async def get_wedding_backgrounds(
    wedding_id: str,
):
    """Get wedding background selections + resolved preview URLs (public)"""
    import logging
    logger = logging.getLogger(__name__)
    db = get_db()

    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )

    # FIX: Get backgrounds from the correct location (wedding.backgrounds, not theme_assets)
    backgrounds = wedding.get("backgrounds", {}) if isinstance(wedding.get("backgrounds"), dict) else {}

    # FIX: Resolve background from photo_borders collection with category="background"
    async def _resolve_bg(bg_id: str):
        if not bg_id:
            return None
        # Look in photo_borders collection where backgrounds are stored
        doc = await db.photo_borders.find_one({"id": bg_id, "category": "background"})
        return doc.get("cdn_url") if doc else None

    response = {
        "layout_page_background_id": backgrounds.get("layout_page_background_id"),
        "stream_page_background_id": backgrounds.get("stream_page_background_id"),
        "layout_page_background_url": await _resolve_bg(backgrounds.get("layout_page_background_id")),
        "stream_page_background_url": await _resolve_bg(backgrounds.get("stream_page_background_id")),
    }
    logger.info(f"[GET_BACKGROUNDS] {wedding_id} -> {response}")
    return response
