"""
Theme Assets Management Routes
Handles admin uploads and creator access to dynamic borders, precious moment styles, and backgrounds
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from app.models import (
    PhotoBorderResponse, PreciousMomentStyleResponse, BackgroundImageResponse,
    BackgroundTemplateResponse, WeddingThemeAssets, UpdateWeddingThemeAssets, MaskData,
    MaskSlot, AnimationType
)
from app.auth import get_current_admin, get_current_user
from app.database import get_db, get_db_dependency
from app.services.telegram_service import TelegramCDNService
from app.utils.telegram_url_proxy import telegram_file_id_to_proxy_url
from typing import List, Optional, Dict
from datetime import datetime
import uuid
import os
import logging
import tempfile
import aiofiles
from PIL import Image

logger = logging.getLogger(__name__)
router = APIRouter()
telegram_service = TelegramCDNService()

# Maximum file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024

async def validate_and_save_file(file: UploadFile, max_size: int = MAX_FILE_SIZE) -> str:
    """Validate file and save to temp location"""
    # Check file size
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {max_size / (1024*1024)}MB limit"
        )
    
    # Validate image format - explicitly allow PNG for transparency
    allowed_mime_types = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if not file.content_type or file.content_type not in allowed_mime_types:
        logger.error(f"[FILE_VALIDATION] Invalid MIME type: {file.content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only PNG, JPEG, WebP, and GIF images are allowed. Got: {file.content_type}"
        )
    
    # Log file format for debugging transparency issues
    file_ext = os.path.splitext(file.filename)[1].lower()
    logger.info(f"[FILE_VALIDATION] Processing {file.filename} - MIME: {file.content_type}, Extension: {file_ext}")
    
    # Ensure PNG files maintain their format for transparency
    if file_ext == '.png' and file.content_type != 'image/png':
        logger.warning(f"[FILE_VALIDATION] PNG file with wrong MIME type: {file.content_type}")
    
    # Save to temp file preserving original extension
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
    async with aiofiles.open(temp_file.name, 'wb') as f:
        await f.write(file_content)
    
    return temp_file.name

def get_image_dimensions(file_path: str) -> tuple:
    """Get image width and height"""
    try:
        with Image.open(file_path) as img:
            return img.size  # (width, height)
    except Exception as e:
        logger.error(f"Error getting image dimensions: {e}")
        return (0, 0)

def calculate_aspect_ratio(width: int, height: int) -> str:
    """Calculate aspect ratio as string"""
    if width == 0 or height == 0:
        return "1:1"
    
    # Calculate GCD for simplification
    from math import gcd
    divisor = gcd(width, height)
    return f"{width//divisor}:{height//divisor}"

def determine_orientation(width: int, height: int) -> str:
    """Determine image orientation"""
    if width > height:
        return "landscape"
    elif height > width:
        return "portrait"
    else:
        return "square"

# ==================== PHOTO BORDERS ====================

@router.post("/admin/theme-assets/borders/upload", response_model=List[PhotoBorderResponse])
async def upload_photo_borders(
    files: List[UploadFile] = File(...),
    names: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Upload multiple photo borders (max 10MB each)
    """
    uploaded_borders = []
    
    # Parse names if provided (comma-separated)
    name_list = names.split(",") if names else []
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []
    
    logger.info(f"[BORDER_UPLOAD] Starting upload of {len(files)} border files")
    
    for idx, file in enumerate(files):
        temp_path = None
        try:
            logger.info(f"[BORDER_UPLOAD] Processing file {idx+1}: {file.filename}")
            
            # Validate and save file
            temp_path = await validate_and_save_file(file)
            
            # Get image dimensions
            width, height = get_image_dimensions(temp_path)
            orientation = determine_orientation(width, height)
            
            # Upload to Telegram CDN
            border_name = name_list[idx] if idx < len(name_list) else f"Border {idx+1}"
            upload_result = await telegram_service.upload_photo(
                file_path=temp_path,
                caption=f"Photo Border: {border_name}",
                wedding_id="photo-borders"
            )
            
            if not upload_result.get("success"):
                logger.error(f"[BORDER_UPLOAD] Telegram upload failed for {file.filename}: {upload_result.get('error')}")
                continue
            
            # Create border document
            border_id = str(uuid.uuid4())
            
            # Debug: Check current_user structure
            logger.info(f"[BORDER_UPLOAD] Current user keys: {list(current_user.keys())}")
            logger.info(f"[BORDER_UPLOAD] Current user: {current_user}")
            
            # Validate upload_result has required keys
            if "cdn_url" not in upload_result or "file_id" not in upload_result:
                logger.error(f"[BORDER_UPLOAD] Invalid upload_result for {file.filename}: {upload_result}")
                continue
            
            # Get user ID safely
            user_id = current_user.get("id") or current_user.get("user_id") or "unknown"
            
            border_doc = {
                "id": border_id,
                "name": border_name,
                "cdn_url": upload_result["cdn_url"],
                "telegram_file_id": upload_result["file_id"],
                "orientation": orientation,
                "width": width,
                "height": height,
                "file_size": upload_result.get("file_size", len(await file.read())),
                "tags": tag_list,
                "created_at": datetime.utcnow(),
                "uploaded_by": user_id
            }
            
            # Save to database
            await db.photo_borders.insert_one(border_doc)
            
            uploaded_borders.append(PhotoBorderResponse(**border_doc))
            logger.info(f"[BORDER_UPLOAD] Successfully uploaded border: {border_name}")
            
        except Exception as e:
            logger.error(f"[BORDER_UPLOAD] Error uploading {file.filename}: {str(e)}")
            continue
        finally:
            # Cleanup temp file
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
    
    if not uploaded_borders:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload any borders"
        )
    
    logger.info(f"[BORDER_UPLOAD] Successfully uploaded {len(uploaded_borders)} borders")
    return uploaded_borders

@router.get("/admin/theme-assets/borders", response_model=List[PhotoBorderResponse])
async def list_photo_borders(
    current_user: dict = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 100,
    db = Depends(get_db_dependency)
):
    """List all photo borders (admin only)"""
    cursor = db.photo_borders.find().sort("created_at", -1).skip(skip).limit(limit)
    borders = await cursor.to_list(length=limit)
    return [PhotoBorderResponse(**border) for border in borders]

@router.delete("/admin/theme-assets/borders/{border_id}")
async def delete_photo_border(
    border_id: str,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """Delete a photo border"""
    result = await db.photo_borders.delete_one({"id": border_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Border not found"
        )
    
    return {"message": "Border deleted successfully"}


# ==================== MASK EDITING ====================

from pydantic import BaseModel as PydanticBaseModel

class UpdateMaskRequest(PydanticBaseModel):
    svg_path: Optional[str] = None
    polygon_points: Optional[List[List[float]]] = None
    feather_radius: Optional[int] = None
    inner_x: Optional[float] = None
    inner_y: Optional[float] = None
    inner_width: Optional[float] = None
    inner_height: Optional[float] = None
    slots_count: Optional[int] = None

@router.put("/admin/theme-assets/borders/{border_id}/mask", response_model=PhotoBorderResponse)
async def update_border_mask(
    border_id: str,
    mask_data: UpdateMaskRequest,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """Update mask data for a photo border"""
    border = await db.photo_borders.find_one({"id": border_id})
    
    if not border:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Border not found"
        )
    
    # Build mask data update
    mask_update = {}
    if mask_data.svg_path is not None:
        mask_update["mask_data.svg_path"] = mask_data.svg_path
    if mask_data.polygon_points is not None:
        mask_update["mask_data.polygon_points"] = mask_data.polygon_points
    if mask_data.feather_radius is not None:
        mask_update["mask_data.feather_radius"] = mask_data.feather_radius
    if mask_data.inner_x is not None:
        mask_update["mask_data.inner_x"] = mask_data.inner_x
    if mask_data.inner_y is not None:
        mask_update["mask_data.inner_y"] = mask_data.inner_y
    if mask_data.inner_width is not None:
        mask_update["mask_data.inner_width"] = mask_data.inner_width
    if mask_data.inner_height is not None:
        mask_update["mask_data.inner_height"] = mask_data.inner_height
    if mask_data.slots_count is not None:
        mask_update["mask_data.slots_count"] = mask_data.slots_count
    
    # Initialize mask_data if it doesn't exist
    if "mask_data" not in border or border["mask_data"] is None:
        await db.photo_borders.update_one(
            {"id": border_id},
            {"$set": {
                "mask_data": {
                    "svg_path": "",
                    "polygon_points": [],
                    "feather_radius": 0,
                    "inner_x": 0,
                    "inner_y": 0,
                    "inner_width": 0,
                    "inner_height": 0,
                    "slots_count": 1
                }
            }}
        )
    
    # Update mask data
    await db.photo_borders.update_one(
        {"id": border_id},
        {"$set": mask_update}
    )
    
    updated_border = await db.photo_borders.find_one({"id": border_id})
    logger.info(f"[MASK_UPDATE] Updated mask for border: {border_id}")
    
    return PhotoBorderResponse(**updated_border)

@router.post("/admin/theme-assets/borders/{border_id}/auto-detect-mask")
async def auto_detect_mask(
    border_id: str,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Auto-detect inner usable area of border image
    Uses image processing to find transparent/empty regions
    """
    border = await db.photo_borders.find_one({"id": border_id})
    
    if not border:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Border not found"
        )
    
    # TODO: Implement actual auto-detection using PIL/OpenCV
    # For now, return placeholder response
    # This would involve:
    # 1. Download image from CDN
    # 2. Detect transparent areas or areas with specific color
    # 3. Find bounding box of inner area
    # 4. Generate SVG path or polygon points
    
    logger.info(f"[MASK_AUTO_DETECT] Auto-detecting mask for border: {border_id}")
    
    return {
        "success": True,
        "message": "Auto-detection initiated. This feature will be fully implemented with image processing.",
        "suggested_mask": {
            "inner_x": border.get("width", 0) * 0.1,
            "inner_y": border.get("height", 0) * 0.1,
            "inner_width": border.get("width", 0) * 0.8,
            "inner_height": border.get("height", 0) * 0.8,
            "feather_radius": 5
        }
    }


# ==================== PRECIOUS MOMENT STYLES ====================

@router.post("/admin/theme-assets/precious-styles/upload", response_model=PreciousMomentStyleResponse)
async def upload_precious_style(
    name: str = Form(...),
    description: str = Form(""),
    layout_type: str = Form("grid"),
    photo_count: int = Form(6),
    frame_shapes: str = Form(""),
    tags: str = Form(""),
    preview_image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Upload a precious moment style configuration
    """
    temp_path = None
    
    try:
        logger.info(f"[STYLE_UPLOAD] Creating precious moment style: {name}")
        
        cdn_url = ""
        telegram_file_id = ""
        
        # Upload preview image if provided
        if preview_image:
            temp_path = await validate_and_save_file(preview_image)
            upload_result = await telegram_service.upload_photo(
                file_path=temp_path,
                caption=f"Precious Moment Style Preview: {name}",
                wedding_id="precious-moments-styles"
            )
            
            if upload_result.get("success"):
                cdn_url = upload_result["cdn_url"]
                telegram_file_id = upload_result["file_id"]
        
        # Create style document
        style_id = str(uuid.uuid4())
        frame_shapes_list = [shape.strip() for shape in frame_shapes.split(",") if shape.strip()]
        tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        style_doc = {
            "id": style_id,
            "name": name,
            "description": description,
            "cdn_url": cdn_url,
            "telegram_file_id": telegram_file_id,
            "layout_type": layout_type,
            "photo_count": photo_count,
            "frame_shapes": frame_shapes_list,
            "tags": tags_list,
            "created_at": datetime.utcnow(),
            "uploaded_by": current_user["user_id"]
        }
        
        # Save to database
        await db.precious_moment_styles.insert_one(style_doc)
        
        logger.info(f"[STYLE_UPLOAD] Successfully created style: {name}")
        return PreciousMomentStyleResponse(**style_doc)
        
    except Exception as e:
        logger.error(f"[STYLE_UPLOAD] Error creating style: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create style: {str(e)}"
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

@router.get("/admin/theme-assets/precious-styles", response_model=List[PreciousMomentStyleResponse])
async def list_precious_styles(
    current_user: dict = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 100,
    db = Depends(get_db_dependency)
):
    """List all precious moment styles (admin only)"""
    cursor = db.precious_moment_styles.find().sort("created_at", -1).skip(skip).limit(limit)
    styles = await cursor.to_list(length=limit)
    return [PreciousMomentStyleResponse(**style) for style in styles]

@router.delete("/admin/theme-assets/precious-styles/{style_id}")
async def delete_precious_style(
    style_id: str,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """Delete a precious moment style"""
    result = await db.precious_moment_styles.delete_one({"id": style_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Style not found"
        )
    
    return {"message": "Style deleted successfully"}

# ==================== BACKGROUND IMAGES ====================

@router.post("/admin/theme-assets/backgrounds/upload", response_model=List[BackgroundImageResponse])
async def upload_background_images(
    files: List[UploadFile] = File(...),
    names: Optional[str] = Form(None),
    category: str = Form("general"),
    tags: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Upload multiple background images (max 10MB each)
    """
    uploaded_backgrounds = []
    
    # Parse names if provided
    name_list = names.split(",") if names else []
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []
    
    logger.info(f"[BG_UPLOAD] Starting upload of {len(files)} background files")
    
    for idx, file in enumerate(files):
        temp_path = None
        try:
            logger.info(f"[BG_UPLOAD] Processing file {idx+1}: {file.filename}")
            
            # Validate and save file
            temp_path = await validate_and_save_file(file)
            
            # Get image dimensions
            width, height = get_image_dimensions(temp_path)
            
            # Upload to Telegram CDN
            bg_name = name_list[idx] if idx < len(name_list) else f"Background {idx+1}"
            upload_result = await telegram_service.upload_photo(
                file_path=temp_path,
                caption=f"Background Image: {bg_name}",
                wedding_id="background-images"
            )
            
            if not upload_result.get("success"):
                logger.error(f"[BG_UPLOAD] Telegram upload failed for {file.filename}: {upload_result.get('error')}")
                continue
            
            # Create background document
            bg_id = str(uuid.uuid4())
            
            # Validate upload_result has required keys
            if "cdn_url" not in upload_result or "file_id" not in upload_result:
                logger.error(f"[BG_UPLOAD] Invalid upload_result for {file.filename}: {upload_result}")
                continue
            
            bg_doc = {
                "id": bg_id,
                "name": bg_name,
                "cdn_url": upload_result["cdn_url"],
                "telegram_file_id": upload_result["file_id"],
                "category": category,
                "width": width,
                "height": height,
                "file_size": upload_result.get("file_size", len(await file.read())),
                "tags": tag_list,
                "created_at": datetime.utcnow(),
                "uploaded_by": current_user["user_id"]
            }
            
            # Save to database
            await db.background_images.insert_one(bg_doc)
            
            uploaded_backgrounds.append(BackgroundImageResponse(**bg_doc))
            logger.info(f"[BG_UPLOAD] Successfully uploaded background: {bg_name}")
            
        except Exception as e:
            logger.error(f"[BG_UPLOAD] Error uploading {file.filename}: {str(e)}")
            continue
        finally:
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
    
    if not uploaded_backgrounds:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload any backgrounds"
        )
    
    logger.info(f"[BG_UPLOAD] Successfully uploaded {len(uploaded_backgrounds)} backgrounds")
    return uploaded_backgrounds

@router.get("/admin/theme-assets/backgrounds", response_model=List[BackgroundImageResponse])
async def list_background_images(
    current_user: dict = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 100,
    db = Depends(get_db_dependency)
):
    """List all background images (admin only)"""
    cursor = db.background_images.find().sort("created_at", -1).skip(skip).limit(limit)
    backgrounds = await cursor.to_list(length=limit)
    return [BackgroundImageResponse(**bg) for bg in backgrounds]

@router.delete("/admin/theme-assets/backgrounds/{bg_id}")
async def delete_background_image(
    bg_id: str,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """Delete a background image"""
    result = await db.background_images.delete_one({"id": bg_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Background not found"
        )
    
    return {"message": "Background deleted successfully"}

# ==================== PUBLIC/CREATOR ENDPOINTS ====================

@router.get("/theme-assets/borders", response_model=List[PhotoBorderResponse])
async def get_available_borders(
    skip: int = 0, 
    limit: int = 100,
    db = Depends(get_db_dependency)
):
    """Get all available photo borders (public access)"""
    cursor = db.photo_borders.find().sort("created_at", -1).skip(skip).limit(limit)
    borders = await cursor.to_list(length=limit)
    
    # FIX: Map mask field to mask_data and transform polygon points format
    response_borders = []
    for border in borders:
        border_data = dict(border)
        
        # CRITICAL FIX: Convert cdn_url to proxy URL using telegram_file_id
        # This prevents CORS issues and avoids exposing bot token
        telegram_file_id = border_data.get("telegram_file_id")
        if telegram_file_id:
            # Use documents media type for photo borders
            proxy_url = telegram_file_id_to_proxy_url(telegram_file_id, media_type="documents")
            if proxy_url:
                border_data["cdn_url"] = proxy_url
                logger.debug(f"[BORDERS] Converted cdn_url to proxy for border {border_data.get('id')}: {proxy_url[:50]}...")
        
        # Map mask field to mask_data for response compatibility
        if "mask" in border_data and "mask_data" not in border_data:
            mask_data = border_data.pop("mask")
            
            # Transform polygon points from dict format to list format with better error handling
            if "polygon_points" in mask_data and mask_data["polygon_points"]:
                transformed_points = []
                for point in mask_data["polygon_points"]:
                    try:
                        if isinstance(point, dict) and "x" in point and "y" in point:
                            # Convert dict {"x": 1.0, "y": 2.0} to list [1.0, 2.0]
                            transformed_points.append([float(point["x"]), float(point["y"])])
                        elif isinstance(point, list) and len(point) == 2:
                            # Already in list format, ensure it's [float, float]
                            transformed_points.append([float(point[0]), float(point[1])])
                        else:
                            # Skip invalid point format
                            logger.warning(f"Skipping invalid polygon point format: {point}")
                    except (ValueError, TypeError) as e:
                        # Skip points that can't be converted to float
                        logger.warning(f"Skipping invalid polygon point {point}: {e}")
                        continue
                
                mask_data["polygon_points"] = transformed_points
            
            # Ensure all required mask_data fields exist with proper types
            if "feather_radius" not in mask_data:
                mask_data["feather_radius"] = 0
            else:
                mask_data["feather_radius"] = int(mask_data["feather_radius"])
            
            if "inner_x" not in mask_data:
                mask_data["inner_x"] = 0.0
            else:
                mask_data["inner_x"] = float(mask_data["inner_x"])
                
            if "inner_y" not in mask_data:
                mask_data["inner_y"] = 0.0
            else:
                mask_data["inner_y"] = float(mask_data["inner_y"])
                
            if "inner_width" not in mask_data:
                mask_data["inner_width"] = 0.0
            else:
                mask_data["inner_width"] = float(mask_data["inner_width"])
                
            if "inner_height" not in mask_data:
                mask_data["inner_height"] = 0.0
            else:
                mask_data["inner_height"] = float(mask_data["inner_height"])
                
            if "slots_count" not in mask_data:
                mask_data["slots_count"] = 1
            else:
                mask_data["slots_count"] = int(mask_data["slots_count"])
            
            border_data["mask_data"] = mask_data
        
        try:
            response_borders.append(PhotoBorderResponse(**border_data))
        except Exception as e:
            logger.error(f"Error creating PhotoBorderResponse for border {border_data.get('id', 'unknown')}: {e}")
            # Skip this border if validation fails
            continue
    
    return response_borders

@router.get("/theme-assets/borders/{border_id}", response_model=PhotoBorderResponse)
async def get_border_by_id(
    border_id: str,
    db = Depends(get_db_dependency)
):
    """Get a specific photo border by ID (public access)"""
    try:
        # Convert string ID to UUID for database query
        from uuid import UUID
        uuid.UUID(border_id)  # Validate UUID format
        
        border = await db.photo_borders.find_one({"id": border_id})
        if not border:
            logger.error(f"Error fetching border {border_id}: 404: Border not found")
            raise HTTPException(status_code=404, detail="Border not found")
        
        # FIX: Map mask field to mask_data and transform polygon points format
        border_data = dict(border)
        if "mask" in border_data and "mask_data" not in border_data:
            mask_data = border_data.pop("mask")
            
            # Transform polygon points from dict format to list format with better error handling
            if "polygon_points" in mask_data and mask_data["polygon_points"]:
                transformed_points = []
                for point in mask_data["polygon_points"]:
                    try:
                        if isinstance(point, dict) and "x" in point and "y" in point:
                            # Convert dict {"x": 1.0, "y": 2.0} to list [1.0, 2.0]
                            transformed_points.append([float(point["x"]), float(point["y"])])
                        elif isinstance(point, list) and len(point) == 2:
                            # Already in list format, ensure it's [float, float]
                            transformed_points.append([float(point[0]), float(point[1])])
                        else:
                            # Skip invalid point format
                            logger.warning(f"Skipping invalid polygon point format: {point}")
                    except (ValueError, TypeError) as e:
                        # Skip points that can't be converted to float
                        logger.warning(f"Skipping invalid polygon point {point}: {e}")
                        continue
                
                mask_data["polygon_points"] = transformed_points
            
            # Ensure all required mask_data fields exist with proper types
            if "feather_radius" not in mask_data:
                mask_data["feather_radius"] = 0
            else:
                mask_data["feather_radius"] = int(mask_data["feather_radius"])
            
            if "inner_x" not in mask_data:
                mask_data["inner_x"] = 0.0
            else:
                mask_data["inner_x"] = float(mask_data["inner_x"])
                
            if "inner_y" not in mask_data:
                mask_data["inner_y"] = 0.0
            else:
                mask_data["inner_y"] = float(mask_data["inner_y"])
                
            if "inner_width" not in mask_data:
                mask_data["inner_width"] = 0.0
            else:
                mask_data["inner_width"] = float(mask_data["inner_width"])
                
            if "inner_height" not in mask_data:
                mask_data["inner_height"] = 0.0
            else:
                mask_data["inner_height"] = float(mask_data["inner_height"])
                
            if "slots_count" not in mask_data:
                mask_data["slots_count"] = 1
            else:
                mask_data["slots_count"] = int(mask_data["slots_count"])
            
            border_data["mask_data"] = mask_data
        
        return PhotoBorderResponse(**border_data)
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid border ID format")
    except HTTPException:
        # Re-raise HTTP exceptions (including 404) without modification
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching border {border_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/theme-assets/precious-styles", response_model=List[PreciousMomentStyleResponse])
async def get_available_precious_styles(
    skip: int = 0, 
    limit: int = 100,
    db = Depends(get_db_dependency)
):
    """Get all available precious moment styles (public access)"""
    cursor = db.precious_moment_styles.find().sort("created_at", -1).skip(skip).limit(limit)
    styles = await cursor.to_list(length=limit)
    return [PreciousMomentStyleResponse(**style) for style in styles]

@router.get("/theme-assets/precious-moment-styles", response_model=List[PreciousMomentStyleResponse])
async def get_available_precious_moment_styles(
    skip: int = 0, 
    limit: int = 100,
    db = Depends(get_db_dependency)
):
    """Get all available precious moment styles (public access) - alias endpoint"""
    cursor = db.precious_moment_styles.find().sort("created_at", -1).skip(skip).limit(limit)
    styles = await cursor.to_list(length=limit)
    return [PreciousMomentStyleResponse(**style) for style in styles]

@router.get("/theme-assets/precious-styles/{style_id}", response_model=PreciousMomentStyleResponse)
async def get_precious_style(
    style_id: str,
    db = Depends(get_db_dependency)
):
    """Get a specific precious moment style by ID"""
    style = await db.precious_moment_styles.find_one({"id": style_id})
    if not style:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Precious moment style not found"
        )
    return PreciousMomentStyleResponse(**style)

@router.get("/theme-assets/backgrounds", response_model=List[BackgroundImageResponse])
async def get_available_backgrounds(
    skip: int = 0, 
    limit: int = 100,
    db = Depends(get_db_dependency)
):
    """Get all available background images (public access)"""
    cursor = db.background_images.find().sort("created_at", -1).skip(skip).limit(limit)
    backgrounds = await cursor.to_list(length=limit)
    return [BackgroundImageResponse(**bg) for bg in backgrounds]

@router.get("/theme-assets/random-defaults")
async def get_random_defaults(db = Depends(get_db_dependency)):
    """Get random default selections for borders, style, and background"""
    
    # Get random border
    borders_cursor = db.photo_borders.aggregate([{"$sample": {"size": 1}}])
    borders = await borders_cursor.to_list(length=1)
    random_border = PhotoBorderResponse(**borders[0]) if borders else None
    
    # Get random precious moment style
    styles_cursor = db.precious_moment_styles.aggregate([{"$sample": {"size": 1}}])
    styles = await styles_cursor.to_list(length=1)
    random_style = PreciousMomentStyleResponse(**styles[0]) if styles else None
    
    # Background is None by default (user must select)
    
    return {
        "border": random_border,
        "precious_moment_style": random_style,
        "background": None
    }

@router.get("/weddings/{wedding_id}/theme-assets", response_model=WeddingThemeAssets)
async def get_wedding_theme_assets(
    wedding_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Get theme assets selection for a wedding"""
    
    # Verify wedding exists and user is creator
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this wedding"
        )
    
    # Get theme_assets from theme_settings
    theme_settings = wedding.get("theme_settings", {})
    theme_assets = theme_settings.get("theme_assets", {})
    
    # Return theme_assets with default values if missing
    return WeddingThemeAssets(**theme_assets)

@router.put("/weddings/{wedding_id}/theme-assets")
async def update_wedding_theme_assets(
    wedding_id: str,
    theme_assets: UpdateWeddingThemeAssets,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Update theme assets selection for a wedding"""
    
    # Verify wedding exists and user is creator
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this wedding"
        )
    
    # Update theme_settings.theme_assets
    update_data = theme_assets.dict(exclude_unset=True)
    
    # Update in database
    await db.weddings.update_one(
        {"id": wedding_id},
        {
            "$set": {
                "theme_settings.theme_assets": update_data,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Theme assets updated successfully", "theme_assets": update_data}
