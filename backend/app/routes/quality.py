from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from app.models import QualitySettings, QualityChangeRequest, QualityChangeResponse, QualityOption
from app.services.socket_service import broadcast_quality_changed
from app.database import get_database
from app.auth import get_current_user, get_current_user_optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/quality", tags=["Quality Control"])

# Default quality options
DEFAULT_QUALITY_OPTIONS = [
    {"label": "Auto", "value": "auto", "bitrate": 0, "enabled": True},
    {"label": "360p", "value": "360p", "bitrate": 800, "enabled": True},
    {"label": "480p", "value": "480p", "bitrate": 1500, "enabled": True},
    {"label": "720p", "value": "720p", "bitrate": 2500, "enabled": True},
    {"label": "1080p", "value": "1080p", "bitrate": 4500, "enabled": True},
]


@router.get("/options/{wedding_id}", response_model=QualitySettings)
async def get_quality_options(
    wedding_id: str,
    db=Depends(get_database)
):
    """
    Get available quality options for a wedding
    Returns creator-configured quality options
    """
    try:
        # Get wedding settings
        weddings_collection = db.weddings
        
        wedding = await weddings_collection.find_one({"id": wedding_id})
        
        if not wedding:
            raise HTTPException(status_code=404, detail="Wedding not found")
        
        settings = wedding.get("settings", {})
        available_qualities = settings.get("available_qualities", DEFAULT_QUALITY_OPTIONS)
        default_quality = settings.get("playback_quality", "auto")
        
        return QualitySettings(
            wedding_id=wedding_id,
            available_qualities=[QualityOption(**q) for q in available_qualities],
            default_quality=default_quality
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get quality options: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/set-options/{wedding_id}")
async def set_quality_options(
    wedding_id: str,
    quality_settings: QualitySettings,
    db=Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """
    Set available quality options for a wedding (creator only)
    """
    try:
        weddings_collection = db.weddings
        
        # Verify wedding ownership
        wedding = await weddings_collection.find_one({"id": wedding_id})
        
        if not wedding:
            raise HTTPException(status_code=404, detail="Wedding not found")
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Update wedding settings
        result = await weddings_collection.update_one(
            {"id": wedding_id},
            {"$set": {
                "settings.available_qualities": [q.dict() for q in quality_settings.available_qualities],
                "settings.playback_quality": quality_settings.default_quality,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update quality settings")
        
        return {
            "success": True,
            "message": "Quality options updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to set quality options: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/change", response_model=QualityChangeResponse)
async def change_quality(
    quality_request: QualityChangeRequest,
    db=Depends(get_database),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    Change stream quality for a viewer or creator
    Broadcasts quality_changed event to Socket.IO
    """
    try:
        # Validate quality value
        valid_qualities = ["auto", "360p", "480p", "720p", "1080p"]
        if quality_request.quality not in valid_qualities:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid quality. Must be one of: {', '.join(valid_qualities)}"
            )
        
        # Determine who changed quality
        changed_by = quality_request.changed_by
        if current_user:
            changed_by = "creator" if current_user.get("role") == "creator" else "viewer"
        
        # Broadcast quality changed event
        quality_data = {
            "wedding_id": quality_request.wedding_id,
            "quality": quality_request.quality,
            "changed_by": changed_by,
            "viewer_id": quality_request.viewer_id or (current_user.get("id") if current_user else None),
            "bitrate": _get_quality_bitrate(quality_request.quality),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await broadcast_quality_changed(
            wedding_id=quality_request.wedding_id,
            quality_data=quality_data
        )
        
        logger.info(f"Quality changed to {quality_request.quality} for wedding {quality_request.wedding_id} by {changed_by}")
        
        return QualityChangeResponse(
            wedding_id=quality_request.wedding_id,
            quality=quality_request.quality,
            success=True,
            message=f"Quality changed to {quality_request.quality}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to change quality: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def _get_quality_bitrate(quality: str) -> int:
    """Get bitrate for quality level"""
    bitrates = {
        "auto": 0,
        "360p": 800,
        "480p": 1500,
        "720p": 2500,
        "1080p": 4500
    }
    return bitrates.get(quality, 0)
