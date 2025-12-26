"""
Layout Background Management Routes
Handles separate backgrounds for Layout Page and Stream Page
"""
from fastapi import APIRouter, HTTPException, status, Depends
from app.auth import get_current_user
from app.database import get_db_dependency
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# ==================== REQUEST/RESPONSE MODELS ====================

class UpdateBackgroundsRequest(BaseModel):
    """Request model for updating backgrounds"""
    layout_page_background_id: Optional[str] = None
    stream_page_background_id: Optional[str] = None

class BackgroundsResponse(BaseModel):
    """Response model for backgrounds"""
    layout_page_background_id: Optional[str] = None
    layout_page_background_url: Optional[str] = None
    stream_page_background_id: Optional[str] = None
    stream_page_background_url: Optional[str] = None

# ==================== UPDATE BACKGROUNDS ====================

@router.put("/weddings/{wedding_id}/backgrounds")
async def update_wedding_backgrounds(
    wedding_id: str,
    backgrounds: UpdateBackgroundsRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Update backgrounds for layout page and stream page separately
    Task 4: Simplified background system with 2 dropdowns
    """
    try:
        logger.info(f"[UPDATE_BACKGROUNDS] Wedding: {wedding_id}")
        
        # Get wedding and verify ownership
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
        
        # Get current backgrounds
        current_backgrounds = wedding.get("backgrounds", {})
        
        # Update backgrounds
        update_data = {}
        
        if backgrounds.layout_page_background_id is not None:
            # Validate background exists
            if backgrounds.layout_page_background_id:
                bg = await db.background_images.find_one({"id": backgrounds.layout_page_background_id})
                if not bg:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Background image {backgrounds.layout_page_background_id} not found"
                    )
                current_backgrounds["layout_page_background_id"] = backgrounds.layout_page_background_id
                current_backgrounds["layout_page_background_url"] = bg.get("cdn_url", "")
            else:
                current_backgrounds["layout_page_background_id"] = None
                current_backgrounds["layout_page_background_url"] = None
        
        if backgrounds.stream_page_background_id is not None:
            # Validate background exists
            if backgrounds.stream_page_background_id:
                bg = await db.background_images.find_one({"id": backgrounds.stream_page_background_id})
                if not bg:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Background image {backgrounds.stream_page_background_id} not found"
                    )
                current_backgrounds["stream_page_background_id"] = backgrounds.stream_page_background_id
                current_backgrounds["stream_page_background_url"] = bg.get("cdn_url", "")
            else:
                current_backgrounds["stream_page_background_id"] = None
                current_backgrounds["stream_page_background_url"] = None
        
        # Update wedding
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {
                "backgrounds": current_backgrounds,
                "updated_at": datetime.utcnow()
            }}
        )
        
        logger.info(f"[UPDATE_BACKGROUNDS] Successfully updated backgrounds for wedding: {wedding_id}")
        
        return {
            "message": "Backgrounds updated successfully",
            "backgrounds": current_backgrounds
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPDATE_BACKGROUNDS] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update backgrounds: {str(e)}"
        )

# ==================== GET BACKGROUNDS ====================

@router.get("/weddings/{wedding_id}/backgrounds")
async def get_wedding_backgrounds(
    wedding_id: str,
    db = Depends(get_db_dependency)
):
    """Get backgrounds for a wedding (public access)"""
    try:
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        backgrounds = wedding.get("backgrounds", {})
        
        return {
            "wedding_id": wedding_id,
            "layout_page_background_id": backgrounds.get("layout_page_background_id"),
            "layout_page_background_url": backgrounds.get("layout_page_background_url"),
            "stream_page_background_id": backgrounds.get("stream_page_background_id"),
            "stream_page_background_url": backgrounds.get("stream_page_background_url")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_BACKGROUNDS] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get backgrounds"
        )
