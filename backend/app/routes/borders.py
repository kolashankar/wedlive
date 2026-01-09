"""
Border Management Routes
Handles dynamic photo borders with mask data for auto-crop system
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from app.models import (
    PhotoBorderResponse as BorderResponse, PhotoBorder as PhotoBorderFull,
    MaskData
)
from app.auth import get_current_admin, get_current_user
from app.database import get_db_dependency
from app.services.telegram_service import TelegramCDNService
from app.utils.telegram_url_proxy import telegram_file_id_to_proxy_url
from typing import List, Optional
from datetime import datetime
import uuid
import os
import logging
import tempfile
import aiofiles
from PIL import Image
import json

logger = logging.getLogger(__name__)
router = APIRouter()
telegram_service = TelegramCDNService()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def get_image_dimensions(file_path: str) -> tuple:
    """Get image width and height"""
    try:
        with Image.open(file_path) as img:
            return img.size  # (width, height)
    except Exception as e:
        logger.error(f"Error getting image dimensions: {e}")
        return (0, 0)

def determine_orientation(width: int, height: int) -> str:
    """Determine image orientation"""
    if width > height:
        return "landscape"
    elif height > width:
        return "portrait"
    else:
        return "square"

# ==================== ADMIN: BORDER UPLOAD & MANAGEMENT ====================

@router.get("/admin/borders", response_model=List[BorderResponse])
async def list_admin_borders(
    db = Depends(get_db_dependency)
):
    """List all borders for admin (including both borders and backgrounds)"""
    try:
        cursor = db.photo_borders.find({}).sort("created_at", -1)
        borders = []
        
        async for border in cursor:
            # FIX 1: Ensure category is properly set, default to "border" if missing
            border_category = border.get("category", "border")
            
            # Log for debugging category issues
            logger.debug(f"[ADMIN_BORDERS] Border '{border.get('name')}' has category: {border_category}")
            
            # CRITICAL FIX: Use telegram_file_id to generate fresh proxy URL instead of stale cdn_url
            # This ensures the URL always works even if the stored cdn_url is expired
            proxy_url = telegram_file_id_to_proxy_url(border.get("telegram_file_id"), media_type="documents")
            
            borders.append(BorderResponse(
                id=border["id"],
                name=border["name"],
                cdn_url=proxy_url or border["cdn_url"],  # Fallback to stored URL if proxy fails
                telegram_file_id=border["telegram_file_id"],
                orientation=border.get("orientation", "square"),
                width=border.get("width", 0),
                height=border.get("height", 0),
                file_size=border.get("file_size", 0),
                tags=border.get("tags", []),
                mask_data=border.get("mask_data"),
                category=border_category,
                has_transparency=border.get("has_transparency", False),
                remove_background=border.get("remove_background", False),
                created_at=border["created_at"]
            ))
        
        logger.info(f"[ADMIN_BORDERS] Returning {len(borders)} borders")
        return borders
        
    except Exception as e:
        logger.error(f"[ADMIN_BORDERS_LIST] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve borders"
        )

@router.post("/admin/borders/upload", response_model=BorderResponse)
async def upload_border(
    file: UploadFile = File(...),
    name: str = Form(...),
    tags: str = Form(""),
    mask_svg_path: str = Form(""),
    mask_polygon_points: str = Form("[]"),
    feather_radius: int = Form(8),
    mask_x: float = Form(0),
    mask_y: float = Form(0),
    mask_width: float = Form(0),
    mask_height: float = Form(0),
    supports_mirror: bool = Form(True),
    category: str = Form("border"),
    mask_slots_json: str = Form("[]"),  # Multiple masks for precious_moments
    remove_background: bool = Form(False),  # NEW: Background removal flag
    has_transparency: bool = Form(False),  # NEW: Transparency flag
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Upload a photo border with mask data (Admin only)
    
    Mask can be provided as:
    - SVG path string (preferred for scalability)
    - Polygon points (JSON array of {x, y} objects)
    """
    temp_path = None
    
    try:
        logger.info(f"[BORDER_UPLOAD] Starting border upload: {name}")
        
        # Validate category
        if category not in ["border", "background"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category must be either 'border' or 'background'"
            )
        
        # Validate file size
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds {MAX_FILE_SIZE / (1024*1024)}MB limit"
            )
        
        # Validate image format - ENFORCE PNG for transparency
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed"
            )
        
        # CRITICAL: Enforce PNG format if transparency is required
        if (has_transparency or remove_background) and file.content_type != 'image/png':
            logger.warning(f"[BORDER_UPLOAD] Non-PNG format detected for transparent border: {file.content_type}")
            # We'll still allow it but log a warning - client should convert to PNG
        
        # Save to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
        async with aiofiles.open(temp_file.name, 'wb') as f:
            await f.write(file_content)
        temp_path = temp_file.name
        
        # Get image dimensions and verify transparency
        width, height = get_image_dimensions(temp_path)
        orientation = determine_orientation(width, height)
        
        # Verify PNG format for transparent borders
        if has_transparency or remove_background:
            with Image.open(temp_path) as img:
                if img.mode not in ('RGBA', 'LA', 'PA'):
                    logger.warning(f"[BORDER_UPLOAD] Image does not have alpha channel. Mode: {img.mode}")
                else:
                    logger.info(f"[BORDER_UPLOAD] PNG with alpha channel confirmed. Mode: {img.mode}")
        
        # Upload to Telegram CDN as DOCUMENT (not photo) to preserve PNG transparency
        # CRITICAL: Use document upload for transparent images to prevent compression
        upload_method = "document" if (has_transparency or remove_background) else "photo"
        logger.info(f"[BORDER_UPLOAD] Using {upload_method} upload method for transparency preservation")
        
        # Upload to Telegram CDN - USE CORRECT METHOD BASED ON TRANSPARENCY
        if upload_method == "document":
            # CRITICAL FIX: Use upload_document() to preserve PNG transparency
            # sendDocument preserves alpha channel, sendPhoto strips it
            logger.info(f"[BORDER_UPLOAD] Uploading as DOCUMENT to preserve transparency")
            upload_result = await telegram_service.upload_document(
                file_path=temp_path,
                caption=f"Photo Border: {name} (Transparent PNG)",
                wedding_id="photo-borders"
            )
        else:
            # Regular photo upload for non-transparent images
            logger.info(f"[BORDER_UPLOAD] Uploading as PHOTO (no transparency)")
            upload_result = await telegram_service.upload_photo(
                file_path=temp_path,
                caption=f"Photo Border: {name}",
                wedding_id="photo-borders"
            )
        
        if not upload_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload to CDN: {upload_result.get('error')}"
            )
        
        # Parse mask polygon points if provided
        polygon_points_list = []
        if mask_polygon_points and mask_polygon_points != "[]":
            try:
                points_data = json.loads(mask_polygon_points)
                # Convert to List[List[float]] format for MaskData
                polygon_points_list = [[p.get("x", 0), p.get("y", 0)] for p in points_data]
            except Exception as e:
                logger.warning(f"[BORDER_UPLOAD] Error parsing polygon points: {e}")
        
        # Create mask object using MaskData
        mask = MaskData(
            svg_path=mask_svg_path,
            polygon_points=polygon_points_list,
            feather_radius=feather_radius,
            inner_x=mask_x,
            inner_y=mask_y,
            inner_width=0,  # Will be calculated from image dimensions
            inner_height=0,
            slots_count=1
        )
        
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []
        
        # Parse multiple mask slots for precious_moments category
        mask_slots_list = []
        if category == "precious_moments" and mask_slots_json and mask_slots_json != "[]":
            try:
                from app.models_sections import MaskSlot
                slots_data = json.loads(mask_slots_json)
                mask_slots_list = [MaskSlot(**slot).model_dump() for slot in slots_data]
                logger.info(f"[BORDER_UPLOAD] Parsed {len(mask_slots_list)} mask slots for precious_moments")
            except Exception as e:
                logger.warning(f"[BORDER_UPLOAD] Error parsing mask slots: {e}")
        
        # Create border document
        border_id = str(uuid.uuid4())
        user_id = current_user.get("id") or current_user.get("user_id") or "unknown"
        
        border_doc = {
            "id": border_id,
            "name": name,
            "cdn_url": upload_result["cdn_url"],
            "telegram_file_id": upload_result["file_id"],
            "mask": mask.model_dump(),
            "mask_slots": mask_slots_list,  # Multiple masks for precious_moments
            "width": width,
            "height": height,
            "file_size": upload_result.get("file_size", len(file_content)),
            "orientation": orientation,
            "tags": tag_list,
            "supports_mirror": supports_mirror,
            "category": category,
            "has_transparency": has_transparency or remove_background,  # NEW: Store transparency flag
            "remove_background": remove_background,  # NEW: Store background removal flag
            "created_at": datetime.utcnow(),
            "uploaded_by": user_id
        }
        
        # Save to database
        await db.photo_borders.insert_one(border_doc)
        
        logger.info(f"[BORDER_UPLOAD] Successfully uploaded border: {name} ({border_id})")
        
        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        from app.models_sections import MaskSlot
        return BorderResponse(
            id=border_doc["id"],
            name=border_doc["name"],
            cdn_url=border_doc["cdn_url"],
            mask_data=MaskData(**border_doc.get("mask", {})),
            mask_slots=[MaskSlot(**slot) for slot in border_doc.get("mask_slots", [])],
            width=border_doc["width"],
            height=border_doc["height"],
            orientation=border_doc["orientation"],
            tags=border_doc["tags"],
            supports_mirror=border_doc["supports_mirror"],
            category=border_doc["category"],
            has_transparency=border_doc.get("has_transparency", False),  # NEW
            remove_background=border_doc.get("remove_background", False),  # NEW
            created_at=border_doc["created_at"]
        )
        
    except HTTPException:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise
    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        logger.error(f"[BORDER_UPLOAD] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Border upload failed: {str(e)}"
        )

@router.get("/borders", response_model=List[BorderResponse])
async def list_borders(
    category: Optional[str] = None,
    db = Depends(get_db_dependency)
):
    """List all borders with optional category filtering"""
    try:
        query = {}
        
        # CRITICAL FIX: Only return borders, not backgrounds
        query["category"] = "border"
        
        # Log the query for debugging
        logger.info(f"[BORDERS_LIST] Query: {query}")
        
        cursor = db.photo_borders.find(query).sort("created_at", -1)
        borders = []
        
        async for border in cursor:
            # Use telegram_file_id to generate fresh proxy URL
            proxy_url = telegram_file_id_to_proxy_url(border.get("telegram_file_id"), media_type="documents")
            
            borders.append(BorderResponse(
                id=border["id"],
                name=border["name"],
                cdn_url=proxy_url or border["cdn_url"],
                telegram_file_id=border["telegram_file_id"],
                orientation=border.get("orientation", "square"),
                width=border.get("width", 0),
                height=border.get("height", 0),
                file_size=border.get("file_size", 0),
                tags=border.get("tags", []),
                mask_data=border.get("mask_data"),
                category=border.get("category", "border"),
                has_transparency=border.get("has_transparency", False),
                remove_background=border.get("remove_background", False),
                created_at=border["created_at"]
            ))
        
        logger.info(f"[BORDERS_LIST] Found {len(borders)} borders")
        return borders
        
    except Exception as e:
        logger.error(f"[BORDERS_LIST] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve borders"
        )

@router.get("/backgrounds", response_model=List[BorderResponse])
async def list_backgrounds(
    db = Depends(get_db_dependency)
):
    """List all backgrounds only"""
    try:
        query = {}
        
        # CRITICAL FIX: Only return backgrounds, not borders
        query["category"] = "background"
        
        # Log the query for debugging
        logger.info(f"[BACKGROUNDS_LIST] Query: {query}")
        
        cursor = db.photo_borders.find(query).sort("created_at", -1)
        backgrounds = []
        
        async for background in cursor:
            # CRITICAL FIX: Use telegram_file_id to generate fresh proxy URL instead of stale cdn_url
            # This ensures the URL always works even if the stored cdn_url is expired
            proxy_url = telegram_file_id_to_proxy_url(background.get("telegram_file_id"), media_type="documents")
            
            backgrounds.append(BorderResponse(
                id=background["id"],
                name=background["name"],
                cdn_url=proxy_url or background["cdn_url"],  # Fallback to stored URL if proxy fails
                telegram_file_id=background["telegram_file_id"],
                orientation=background.get("orientation", "square"),
                width=background.get("width", 0),
                height=background.get("height", 0),
                file_size=background.get("file_size", 0),
                tags=background.get("tags", []),
                mask_data=background.get("mask_data"),
                category=background.get("category", "background"),
                has_transparency=background.get("has_transparency", False),
                remove_background=background.get("remove_background", False),
                created_at=background["created_at"]
            ))
        
        logger.info(f"[BACKGROUNDS_LIST] Found {len(backgrounds)} backgrounds")
        return backgrounds
        
    except Exception as e:
        logger.error(f"[BACKGROUNDS_LIST] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve backgrounds"
        )

@router.put("/admin/borders/{border_id}/mask", response_model=BorderResponse)
async def update_border_mask(
    border_id: str,
    mask_svg_path: str = Form(""),
    mask_polygon_points: str = Form("[]"),
    feather_radius: int = Form(8),
    mask_x: float = Form(0),
    mask_y: float = Form(0),
    mask_width: float = Form(0),
    mask_height: float = Form(0),
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """Update mask data for an existing border"""
    try:
        border = await db.photo_borders.find_one({"id": border_id})
        if not border:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Border not found"
            )
        
        # Parse polygon points
        polygon_points_list = []
        if mask_polygon_points and mask_polygon_points != "[]":
            try:
                points_data = json.loads(mask_polygon_points)
                # Convert to List[List[float]] format for MaskData
                polygon_points_list = [[p.get("x", 0), p.get("y", 0)] for p in points_data]
            except Exception as e:
                logger.warning(f"[MASK_UPDATE] Error parsing polygon points: {e}")
        
        # Create updated mask using MaskData
        updated_mask = MaskData(
            svg_path=mask_svg_path,
            polygon_points=polygon_points_list,
            feather_radius=feather_radius,
            inner_x=mask_x,
            inner_y=mask_y,
            inner_width=0,
            inner_height=0,
            slots_count=1
        )
        
        # Update in database
        await db.photo_borders.update_one(
            {"id": border_id},
            {"$set": {"mask": updated_mask.model_dump()}}
        )
        
        updated_border = await db.photo_borders.find_one({"id": border_id})
        
        logger.info(f"[MASK_UPDATE] Updated mask for border: {border_id}")
        
        # CRITICAL FIX: Use telegram_file_id to generate fresh proxy URL
        proxy_url = telegram_file_id_to_proxy_url(updated_border.get("telegram_file_id"), media_type="documents")
        
        from app.models_sections import MaskSlot
        return BorderResponse(
            id=updated_border["id"],
            name=updated_border["name"],
            cdn_url=proxy_url or updated_border["cdn_url"],  # Fallback to stored URL if proxy fails
            mask_data=MaskData(**updated_border.get("mask", {})),
            mask_slots=[MaskSlot(**slot) for slot in updated_border.get("mask_slots", [])],
            width=updated_border["width"],
            height=updated_border["height"],
            orientation=updated_border["orientation"],
            tags=updated_border["tags"],
            supports_mirror=updated_border.get("supports_mirror", True),
            category=updated_border.get("category", "general"),
            has_transparency=updated_border.get("has_transparency", False),
            remove_background=updated_border.get("remove_background", False),
            created_at=updated_border["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[MASK_UPDATE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Mask update failed: {str(e)}"
        )

@router.delete("/admin/borders/{border_id}")
async def delete_border(
    border_id: str,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """Delete a border"""
    try:
        result = await db.photo_borders.delete_one({"id": border_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Border not found"
            )
        
        logger.info(f"[BORDER_DELETE] Deleted border: {border_id}")
        return {"success": True, "message": "Border deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[BORDER_DELETE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Border deletion failed"
        )

# ==================== CREATOR: BORDER BROWSING ====================

@router.get("/borders", response_model=List[BorderResponse])
async def list_borders(
    tags: Optional[str] = None,
    orientation: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    List available borders for creators
    Optional filtering by tags, orientation, and category
    """
    try:
        from app.models_sections import MaskSlot
        query = {}
        
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            query["tags"] = {"$in": tag_list}
        
        if orientation and orientation in ["portrait", "landscape", "square"]:
            query["orientation"] = orientation
        
        if category:
            query["category"] = category
        
        cursor = db.photo_borders.find(query).sort("created_at", -1)
        borders = await cursor.to_list(length=100)
        
        return [
            BorderResponse(
                id=border["id"],
                name=border["name"],
                cdn_url=telegram_file_id_to_proxy_url(border.get("telegram_file_id"), media_type="documents") or border["cdn_url"],
                mask_data=MaskData(**border.get("mask", {})),
                mask_slots=[MaskSlot(**slot) for slot in border.get("mask_slots", [])],
                width=border["width"],
                height=border["height"],
                orientation=border["orientation"],
                tags=border["tags"],
                supports_mirror=border.get("supports_mirror", True),
                category=border.get("category", "general"),
                has_transparency=border.get("has_transparency", False),
                remove_background=border.get("remove_background", False),
                created_at=border["created_at"]
            )
            for border in borders
        ]
        
    except Exception as e:
        logger.error(f"[BORDER_LIST] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list borders"
        )

@router.get("/borders/{border_id}", response_model=BorderResponse)
async def get_border(
    border_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Get a specific border with mask data"""
    try:
        from app.models_sections import MaskSlot
        border = await db.photo_borders.find_one({"id": border_id})
        
        if not border:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Border not found"
            )
        
        return BorderResponse(
            id=border["id"],
            name=border["name"],
            cdn_url=telegram_file_id_to_proxy_url(border.get("telegram_file_id"), media_type="documents") or border["cdn_url"],
            mask_data=MaskData(**border.get("mask", {})),
            mask_slots=[MaskSlot(**slot) for slot in border.get("mask_slots", [])],
            width=border["width"],
            height=border["height"],
            orientation=border["orientation"],
            tags=border["tags"],
            supports_mirror=border.get("supports_mirror", True),
            category=border.get("category", "general"),
            has_transparency=border.get("has_transparency", False),
            remove_background=border.get("remove_background", False),
            created_at=border["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[BORDER_GET] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get border"
        )
