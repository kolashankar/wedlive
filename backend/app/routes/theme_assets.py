"""
Theme Assets Management Routes
Handles admin uploads and creator access to dynamic borders, precious moment styles, and backgrounds
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from app.models import (
    PhotoBorderResponse, PreciousMomentStyleResponse, BackgroundImageResponse,
    WeddingThemeAssets, UpdateWeddingThemeAssets
)
from app.auth import get_current_admin, get_current_user
from app.database import get_db, get_db_dependency
from app.services.telegram_service import TelegramCDNService
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
    
    # Validate image format
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )
    
    # Save to temp file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
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
            aspect_ratio = calculate_aspect_ratio(width, height)
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
                "aspect_ratio": aspect_ratio,
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
            "uploaded_by": current_user["id"]
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
                "uploaded_by": current_user["id"]
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
    return [PhotoBorderResponse(**border) for border in borders]

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
    
    if wedding["creator_id"] != current_user["id"]:
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
