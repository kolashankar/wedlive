"""
Video Template Routes
Handles video template creation, management, and assignment
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from app.models_video_templates import (
    VideoTemplate, VideoTemplateCreate, VideoTemplateUpdate,
    TextOverlay, TextOverlayCreate, TextOverlayUpdate,
    WeddingTemplateAssignment, TemplateAssignmentCreate,
    TemplatePreviewRequest, VideoData, PreviewThumbnail, TemplateMetadata
)
from app.auth import get_current_admin, get_current_user
from app.database import get_db, get_db_dependency
from app.services.telegram_service import TelegramCDNService
from app.services.video_processing_service import VideoProcessingService
from app.services.wedding_data_mapper import WeddingDataMapper
from app.services.render_service import VideoRenderService
from app.utils.overlay_utils import OverlayCoordinateSystem
from app.utils.telegram_url_proxy import telegram_url_to_proxy, telegram_file_id_to_proxy_url
from typing import List, Optional, Dict
from datetime import datetime
import uuid
import os
import logging
import tempfile
import aiofiles
import json
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter()
telegram_service = TelegramCDNService()
video_service = VideoProcessingService()
wedding_mapper = WeddingDataMapper()
render_service = VideoRenderService()

# Maximum file size: 50MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024


def convert_template_urls_to_proxy(template: dict) -> dict:
    """
    Convert all Telegram URLs in a video template to proxy URLs.
    Uses telegram_file_id to generate fresh proxy URLs instead of stale stored URLs.
    
    Args:
        template: Template dictionary from database
    
    Returns:
        Template with proxied URLs
    """
    template_copy = template.copy()
    template_id = template_copy.get("id", "unknown")
    
    # Convert video URL
    if "video_data" in template_copy:
        video_data = template_copy["video_data"]
        video_file_id = video_data.get("telegram_file_id")
        if video_file_id:
            video_data["original_url"] = telegram_file_id_to_proxy_url(video_file_id, "videos")
            logger.debug(f"[TEMPLATE_PROXY] {template_id}: Converted video file_id to proxy URL")
        elif video_data.get("original_url"):
            video_data["original_url"] = telegram_url_to_proxy(video_data["original_url"])
            logger.debug(f"[TEMPLATE_PROXY] {template_id}: Converted video URL to proxy URL")
    
    # Convert thumbnail URL
    if "preview_thumbnail" in template_copy and template_copy["preview_thumbnail"]:
        thumb_data = template_copy["preview_thumbnail"]
        thumb_file_id = thumb_data.get("telegram_file_id")
        if thumb_file_id:
            proxy_url = telegram_file_id_to_proxy_url(thumb_file_id, "photos")
            thumb_data["url"] = proxy_url
            logger.info(f"[TEMPLATE_PROXY] {template_id}: Converted thumbnail file_id to proxy URL: {proxy_url}")
        elif thumb_data.get("url"):
            proxy_url = telegram_url_to_proxy(thumb_data["url"])
            thumb_data["url"] = proxy_url
            logger.info(f"[TEMPLATE_PROXY] {template_id}: Converted thumbnail URL to proxy URL: {proxy_url}")
        else:
            logger.warning(f"[TEMPLATE_PROXY] {template_id}: Thumbnail data exists but has no url or file_id: {thumb_data}")
    else:
        logger.warning(f"[TEMPLATE_PROXY] {template_id}: No preview_thumbnail data found")
    
    return template_copy


def deep_merge_dict(base: dict, update: dict) -> dict:
    """
    Deep merge two dictionaries, preserving nested structures.
    This ensures that nested objects like 'styling' and 'animation' 
    are merged field-by-field instead of being completely replaced.
    
    Example:
        base = {'styling': {'font_size': 48, 'color': '#fff', 'font_family': 'Arial'}}
        update = {'styling': {'font_size': 72}}
        result = {'styling': {'font_size': 72, 'color': '#fff', 'font_family': 'Arial'}}
    """
    result = base.copy()
    
    for key, value in update.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            # Recursively merge nested dictionaries
            result[key] = deep_merge_dict(result[key], value)
        else:
            # Direct assignment for non-dict values or new keys
            result[key] = value
    
    return result


async def validate_and_save_video(file: UploadFile, max_size: int = MAX_VIDEO_SIZE) -> str:
    """
    Validate video file and save to temp location
    Returns: temp file path
    """
    # Check file size
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {max_size / (1024*1024)}MB limit"
        )
    
    # Validate video format
    if not file.content_type or not file.content_type.startswith('video/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only video files are allowed"
        )
    
    # Save to temp file
    file_ext = os.path.splitext(file.filename)[1] or '.mp4'
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
    
    async with aiofiles.open(temp_file.name, 'wb') as f:
        await f.write(file_content)
    
    return temp_file.name


# ==================== ADMIN ENDPOINTS ====================

@router.post("/admin/video-templates/upload", response_model=VideoTemplate)
async def upload_video_template(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
    category: str = Form("general"),
    aspect_ratio: str = Form("16:9"),
    tags: str = Form(""),
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Upload a video template (Admin only)
    Step 1: Upload video and generate thumbnail
    Step 2: Configure overlays in separate endpoint
    """
    temp_video_path = None
    temp_thumb_path = None
    
    try:
        logger.info(f"[VIDEO_TEMPLATE_UPLOAD] Starting upload: {name} with aspect ratio {aspect_ratio}")
        
        # Validate and save video file
        temp_video_path = await validate_and_save_video(file)
        
        # Validate video using FFmpeg
        validation_result = await video_service.validate_video(temp_video_path)
        
        if not validation_result.get("valid"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=validation_result.get("error", "Invalid video file")
            )
        
        metadata = validation_result["metadata"]
        logger.info(f"[VIDEO_TEMPLATE_UPLOAD] Video validated: {metadata}")
        
        # Validate aspect ratio matches video dimensions
        video_width = metadata["width"]
        video_height = metadata["height"]
        video_aspect = video_width / video_height
        
        if aspect_ratio == "16:9":
            expected_aspect = 16 / 9  # ~1.78
            tolerance = 0.1
            if not (expected_aspect - tolerance <= video_aspect <= expected_aspect + tolerance):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Video aspect ratio ({video_width}x{video_height}, ratio: {video_aspect:.2f}) does not match selected 16:9. Please upload a 16:9 landscape video."
                )
        elif aspect_ratio == "9:16":
            expected_aspect = 9 / 16  # ~0.56
            tolerance = 0.1
            if not (expected_aspect - tolerance <= video_aspect <= expected_aspect + tolerance):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Video aspect ratio ({video_width}x{video_height}, ratio: {video_aspect:.2f}) does not match selected 9:16. Please upload a 9:16 portrait video."
                )
        
        logger.info(f"[VIDEO_TEMPLATE_UPLOAD] Aspect ratio validation passed: {aspect_ratio}")
        
        # Generate thumbnail
        temp_thumb_path = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg').name
        thumb_result = await video_service.generate_thumbnail(
            temp_video_path,
            temp_thumb_path,
            timestamp=1.0
        )
        
        if not thumb_result.get("success"):
            logger.warning(f"[VIDEO_TEMPLATE_UPLOAD] Thumbnail generation failed: {thumb_result.get('error')}")
        
        # Upload video to Telegram CDN
        logger.info(f"[VIDEO_TEMPLATE_UPLOAD] Uploading video to Telegram CDN...")
        video_upload_result = await telegram_service.upload_video(
            file_path=temp_video_path,
            caption=f"Template: {name}",
            wedding_id="video_templates",
            thumb_path=temp_thumb_path if thumb_result.get("success") else None
        )
        
        if not video_upload_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload video: {video_upload_result.get('error')}"
            )
        
        logger.info(f"[VIDEO_TEMPLATE_UPLOAD] Video uploaded successfully")
        
        # Upload thumbnail to Telegram CDN
        thumbnail_data = None
        if thumb_result.get("success"):
            thumb_upload_result = await telegram_service.upload_photo(
                file_path=temp_thumb_path,
                caption=f"Thumbnail: {name}",
                wedding_id="video_templates"
            )
            
            if thumb_upload_result.get("success"):
                thumbnail_data = PreviewThumbnail(
                    url=thumb_upload_result["cdn_url"],
                    telegram_file_id=thumb_upload_result["file_id"]
                )
                logger.info(f"[VIDEO_TEMPLATE_UPLOAD] Thumbnail uploaded successfully")
        
        # Parse tags
        tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        # Create template document
        template_id = str(uuid.uuid4())
        
        video_data = VideoData(
            original_url=video_upload_result["cdn_url"],
            telegram_file_id=video_upload_result["file_id"],
            duration_seconds=metadata["duration"],
            width=metadata["width"],
            height=metadata["height"],
            format=metadata["format"],
            file_size_mb=metadata["file_size_mb"],
            aspect_ratio=aspect_ratio
        )
        
        template_metadata = TemplateMetadata(
            created_by=current_user["user_id"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        template = VideoTemplate(
            id=template_id,
            name=name,
            description=description,
            category=category,
            tags=tags_list,
            video_data=video_data,
            preview_thumbnail=thumbnail_data,
            text_overlays=[],
            metadata=template_metadata
        )
        
        # Save to database
        await db.video_templates.insert_one(template.dict())
        
        logger.info(f"[VIDEO_TEMPLATE_UPLOAD] Template created successfully: {template_id}")
        return template
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[VIDEO_TEMPLATE_UPLOAD] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload template: {str(e)}"
        )
    finally:
        # Cleanup temp files
        if temp_video_path and os.path.exists(temp_video_path):
            os.unlink(temp_video_path)
        if temp_thumb_path and os.path.exists(temp_thumb_path):
            os.unlink(temp_thumb_path)


@router.post("/admin/video-templates/{template_id}/overlays", response_model=VideoTemplate)
async def add_text_overlay(
    template_id: str,
    overlay: TextOverlayCreate,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Add text overlay to video template
    Normalizes position coordinates to percentage-based system
    """
    try:
        # Get template
        template = await db.video_templates.find_one({"id": template_id})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Get reference resolution from video_data
        video_data = template.get("video_data", {})
        reference_resolution = video_data.get("reference_resolution", {
            "width": 1920,
            "height": 1080
        })
        
        # Convert overlay to dict and normalize position
        overlay_dict = overlay.dict()
        
        # Normalize position to percentage-based coordinates
        if "position" in overlay_dict:
            overlay_dict["position"] = OverlayCoordinateSystem.normalize_position_dict(
                overlay_dict["position"],
                reference_resolution["width"],
                reference_resolution["height"]
            )
        
        # Create overlay with unique ID
        overlay_id = str(uuid.uuid4())
        new_overlay = TextOverlay(
            id=overlay_id,
            **overlay_dict
        )
        
        # Add to template
        overlays = template.get("text_overlays", [])
        overlays.append(new_overlay.dict())
        
        # Update template
        await db.video_templates.update_one(
            {"id": template_id},
            {
                "$set": {
                    "text_overlays": overlays,
                    "metadata.updated_at": datetime.utcnow()
                }
            }
        )
        
        # Return updated template
        updated_template = await db.video_templates.find_one({"id": template_id})
        return VideoTemplate(**updated_template)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ADD_OVERLAY] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add overlay: {str(e)}"
        )


@router.get("/admin/video-templates", response_model=List[VideoTemplate])
async def list_video_templates_admin(
    current_user: dict = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 50,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db = Depends(get_db_dependency)
):
    """
    List all video templates (Admin only)
    """
    try:
        # Build query
        query = {}
        
        if category:
            query["category"] = category
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$regex": search, "$options": "i"}}
            ]
        
        # Get templates
        cursor = db.video_templates.find(query).sort("metadata.created_at", -1).skip(skip).limit(limit)
        templates = await cursor.to_list(length=limit)
        
        # Convert URLs to proxy URLs using file_ids
        converted_templates = [convert_template_urls_to_proxy(t) for t in templates]
        
        return [VideoTemplate(**template) for template in converted_templates]
        
    except Exception as e:
        logger.error(f"[LIST_TEMPLATES_ADMIN] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list templates"
        )


@router.put("/admin/video-templates/{template_id}/aspect-ratio")
async def update_template_aspect_ratio(
    template_id: str,
    aspect_ratio_data: Dict[str, str],
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Update video template aspect ratio
    """
    try:
        # Get template
        template = await db.video_templates.find_one({"id": template_id})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        new_aspect_ratio = aspect_ratio_data.get("aspect_ratio")
        if new_aspect_ratio not in ["16:9", "9:16"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid aspect ratio. Must be '16:9' or '9:16'"
            )
        
        # Update aspect ratio in video_data
        await db.video_templates.update_one(
            {"id": template_id},
            {
                "$set": {
                    "video_data.aspect_ratio": new_aspect_ratio,
                    "metadata.updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"[UPDATE_ASPECT_RATIO] Template {template_id} aspect ratio changed to {new_aspect_ratio}")
        
        return {
            "success": True,
            "message": f"Aspect ratio updated to {new_aspect_ratio}",
            "aspect_ratio": new_aspect_ratio
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPDATE_ASPECT_RATIO] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update aspect ratio"
        )


@router.put("/admin/video-templates/{template_id}", response_model=VideoTemplate)
async def update_video_template(
    template_id: str,
    update_data: VideoTemplateUpdate,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Update video template metadata
    """
    try:
        # Get template
        template = await db.video_templates.find_one({"id": template_id})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Build update document
        update_doc = {"metadata.updated_at": datetime.utcnow()}
        
        if update_data.name is not None:
            update_doc["name"] = update_data.name
        if update_data.description is not None:
            update_doc["description"] = update_data.description
        if update_data.category is not None:
            update_doc["category"] = update_data.category
        if update_data.tags is not None:
            update_doc["tags"] = update_data.tags
        if update_data.is_featured is not None:
            update_doc["metadata.is_featured"] = update_data.is_featured
        if update_data.is_active is not None:
            update_doc["metadata.is_active"] = update_data.is_active
        
        # Update template
        await db.video_templates.update_one(
            {"id": template_id},
            {"$set": update_doc}
        )
        
        # Return updated template
        updated_template = await db.video_templates.find_one({"id": template_id})
        return VideoTemplate(**updated_template)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPDATE_TEMPLATE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update template"
        )


@router.delete("/admin/video-templates/{template_id}")
async def delete_video_template(
    template_id: str,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Delete video template
    """
    try:
        result = await db.video_templates.delete_one({"id": template_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Also delete any assignments
        await db.wedding_template_assignments.delete_many({"template_id": template_id})
        
        return {"success": True, "message": "Template deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DELETE_TEMPLATE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete template"
        )


@router.put("/admin/video-templates/{template_id}/overlays/{overlay_id}", response_model=VideoTemplate)
async def update_text_overlay(
    template_id: str,
    overlay_id: str,
    update_data: TextOverlayUpdate,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Update specific text overlay
    Normalizes position coordinates to percentage-based system
    """
    try:
        # Get template
        template = await db.video_templates.find_one({"id": template_id})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Get reference resolution from video_data
        video_data = template.get("video_data", {})
        reference_resolution = video_data.get("reference_resolution", {
            "width": 1920,
            "height": 1080
        })
        
        # Find and update overlay
        overlays = template.get("text_overlays", [])
        overlay_found = False
        
        for i, overlay in enumerate(overlays):
            if overlay.get("id") == overlay_id:
                overlay_found = True
                
                logger.info(f"[UPDATE_OVERLAY] Before update - overlay {overlay_id} styling: {overlay.get('styling', {})}")
                logger.info(f"[UPDATE_OVERLAY] Before update - overlay {overlay_id} animation: {overlay.get('animation', {})}")
                
                # Update fields using deep merge to preserve nested structures
                update_dict = update_data.dict(exclude_unset=True)
                
                logger.info(f"[UPDATE_OVERLAY] Update dict keys: {list(update_dict.keys())}")
                if 'styling' in update_dict:
                    logger.info(f"[UPDATE_OVERLAY] Update styling: {update_dict['styling']}")
                if 'animation' in update_dict:
                    logger.info(f"[UPDATE_OVERLAY] Update animation: {update_dict['animation']}")
                
                # Normalize position if it's being updated
                if "position" in update_dict:
                    update_dict["position"] = OverlayCoordinateSystem.normalize_position_dict(
                        update_dict["position"],
                        reference_resolution["width"],
                        reference_resolution["height"]
                    )
                
                # Deep merge to preserve all nested fields (styling, animation, etc.)
                overlays[i] = deep_merge_dict(overlays[i], update_dict)
                
                logger.info(f"[UPDATE_OVERLAY] After merge - overlay {overlay_id} styling: {overlays[i].get('styling', {})}")
                logger.info(f"[UPDATE_OVERLAY] After merge - overlay {overlay_id} animation: {overlays[i].get('animation', {})}")
                logger.info(f"[UPDATE_OVERLAY] Deep merged overlay {overlay_id}. Updated fields: {list(update_dict.keys())}")
                break
        
        if not overlay_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Overlay not found"
            )
        
        # Update template
        await db.video_templates.update_one(
            {"id": template_id},
            {
                "$set": {
                    "text_overlays": overlays,
                    "metadata.updated_at": datetime.utcnow()
                }
            }
        )
        
        # Return updated template
        updated_template = await db.video_templates.find_one({"id": template_id})
        return VideoTemplate(**updated_template)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPDATE_OVERLAY] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update overlay"
        )


@router.delete("/admin/video-templates/{template_id}/overlays/{overlay_id}", response_model=VideoTemplate)
async def delete_text_overlay(
    template_id: str,
    overlay_id: str,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Delete specific text overlay
    """
    try:
        # Get template
        template = await db.video_templates.find_one({"id": template_id})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Remove overlay
        overlays = template.get("text_overlays", [])
        overlays = [o for o in overlays if o.get("id") != overlay_id]
        
        # Update template
        await db.video_templates.update_one(
            {"id": template_id},
            {
                "$set": {
                    "text_overlays": overlays,
                    "metadata.updated_at": datetime.utcnow()
                }
            }
        )
        
        # Return updated template
        updated_template = await db.video_templates.find_one({"id": template_id})
        return VideoTemplate(**updated_template)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DELETE_OVERLAY] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete overlay"
        )


@router.put("/admin/video-templates/{template_id}/overlays/reorder")
async def reorder_overlays(
    template_id: str,
    overlay_ids: List[str],
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Reorder text overlays
    """
    try:
        # Get template
        template = await db.video_templates.find_one({"id": template_id})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Create ordered overlay list
        overlays = template.get("text_overlays", [])
        overlay_map = {o["id"]: o for o in overlays}
        
        reordered_overlays = []
        for idx, overlay_id in enumerate(overlay_ids):
            if overlay_id in overlay_map:
                overlay = overlay_map[overlay_id]
                overlay["layer_index"] = idx
                reordered_overlays.append(overlay)
        
        # Update template
        await db.video_templates.update_one(
            {"id": template_id},
            {
                "$set": {
                    "text_overlays": reordered_overlays,
                    "metadata.updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"success": True, "message": "Overlays reordered successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REORDER_OVERLAYS] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reorder overlays"
        )


# ==================== USER ENDPOINTS ====================

@router.get("/video-templates", response_model=List[VideoTemplate])
async def list_video_templates(
    skip: int = 0,
    limit: int = 50,
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    db = Depends(get_db_dependency)
):
    """
    List available video templates (Public access)
    """
    try:
        # Build query - only show active templates
        query = {"metadata.is_active": True}
        
        if category:
            query["category"] = category
        
        if featured is not None:
            query["metadata.is_featured"] = featured
        
        # Get templates
        cursor = db.video_templates.find(query).sort("metadata.created_at", -1).skip(skip).limit(limit)
        templates = await cursor.to_list(length=limit)
        
        # Convert URLs to proxy URLs using file_ids
        converted_templates = [convert_template_urls_to_proxy(t) for t in templates]
        
        return [VideoTemplate(**template) for template in converted_templates]
        
    except Exception as e:
        logger.error(f"[LIST_TEMPLATES] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list templates"
        )


@router.get("/video-templates/{template_id}", response_model=VideoTemplate)
async def get_video_template(
    template_id: str,
    db = Depends(get_db_dependency)
):
    """
    Get video template details (Public access)
    """
    try:
        template = await db.video_templates.find_one({"id": template_id})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Convert URLs to proxy URLs using file_ids
        template = convert_template_urls_to_proxy(template)
        
        return VideoTemplate(**template)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_TEMPLATE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get template"
        )


@router.post("/weddings/{wedding_id}/assign-template")
async def assign_template_to_wedding(
    wedding_id: str,
    assignment: TemplateAssignmentCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Assign video template to wedding
    """
    try:
        # Verify wedding exists and user owns it
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding.get("creator_id") != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Verify template exists
        template = await db.video_templates.find_one({"id": assignment.template_id})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Check if assignment already exists
        existing = await db.wedding_template_assignments.find_one({
            "wedding_id": wedding_id,
            "slot": assignment.slot
        })
        
        if existing:
            # Update existing assignment
            await db.wedding_template_assignments.update_one(
                {"id": existing["id"]},
                {
                    "$set": {
                        "template_id": assignment.template_id,
                        "customizations": assignment.customizations,
                        "assigned_at": datetime.utcnow()
                    }
                }
            )
            assignment_id = existing["id"]
        else:
            # Create new assignment
            assignment_id = str(uuid.uuid4())
            assignment_doc = WeddingTemplateAssignment(
                id=assignment_id,
                wedding_id=wedding_id,
                template_id=assignment.template_id,
                slot=assignment.slot,
                customizations=assignment.customizations,
                assigned_at=datetime.utcnow()
            )
            await db.wedding_template_assignments.insert_one(assignment_doc.dict())
        
        # Increment template usage count
        await db.video_templates.update_one(
            {"id": assignment.template_id},
            {"$inc": {"metadata.usage_count": 1}}
        )
        
        return {
            "success": True,
            "assignment_id": assignment_id,
            "message": "Template assigned successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ASSIGN_TEMPLATE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign template"
        )


@router.get("/weddings/{wedding_id}/template-assignment")
async def get_wedding_template_assignment(
    wedding_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Get template assignment for wedding with populated data
    """
    try:
        # Get assignment
        assignment = await db.wedding_template_assignments.find_one({"wedding_id": wedding_id})
        if not assignment:
            return {"assignment": None, "populated_overlays": []}
        
        # Get template
        template = await db.video_templates.find_one({"id": assignment["template_id"]})
        if not template:
            return {"assignment": None, "populated_overlays": []}
        
        # Get wedding data
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        # Map wedding data
        wedding_data = wedding_mapper.map_wedding_data(wedding)
        
        # Populate overlays
        populated_overlays = []
        for overlay in template.get("text_overlays", []):
            text_value = wedding_mapper.populate_overlay_text(overlay, wedding_data)
            populated_overlays.append({
                **overlay,
                "text_value": text_value
            })
        
        # Convert template Telegram URLs to proxied URLs using file_id for reliability
        template_dict = convert_template_urls_to_proxy(dict(template))
        
        return {
            "assignment_id": assignment["id"],
            "template": VideoTemplate(**template_dict),
            "populated_overlays": populated_overlays,
            "customizations": assignment.get("customizations", {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_ASSIGNMENT] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get assignment"
        )


@router.post("/video-templates/{template_id}/preview")
async def preview_template_with_wedding_data(
    template_id: str,
    preview_request: TemplatePreviewRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Preview template with wedding data populated
    """
    try:
        # Get template
        template = await db.video_templates.find_one({"id": template_id})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Get wedding data
        wedding = await db.weddings.find_one({"id": preview_request.wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        # Map wedding data
        wedding_data = wedding_mapper.map_wedding_data(wedding)
        
        # Populate overlays
        populated_overlays = []
        for overlay in template.get("text_overlays", []):
            text_value = wedding_mapper.populate_overlay_text(overlay, wedding_data)
            populated_overlays.append({
                **overlay,
                "text": text_value
            })
        
        return {
            "preview_data": {
                "video_url": template["video_data"]["original_url"],
                "duration": template["video_data"]["duration_seconds"],
                "overlays": populated_overlays
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[PREVIEW_TEMPLATE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to preview template"
        )


@router.delete("/weddings/{wedding_id}/template-assignment")
async def remove_template_from_wedding(
    wedding_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Remove template assignment from wedding
    """
    try:
        # Verify wedding ownership
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding.get("creator_id") != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Delete assignment
        result = await db.wedding_template_assignments.delete_one({"wedding_id": wedding_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No template assignment found"
            )
        
        return {"success": True, "message": "Template removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REMOVE_TEMPLATE] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove template"
        )


# ==================== UTILITY ENDPOINTS ====================

@router.get("/video-templates/endpoints/list")
async def list_available_endpoints():
    """
    Get list of available wedding data endpoints
    Used for template editor UI
    """
    return {
        "endpoints": wedding_mapper.get_available_endpoints()
    }


# ==================== VIDEO RENDERING ENDPOINTS ====================

@router.post("/weddings/{wedding_id}/render-template-video")
async def render_template_video(
    wedding_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Start rendering video with burned-in overlays
    Returns render job ID for status tracking
    """
    try:
        # Get wedding
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding.get("creator_id") != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get template assignment
        assignment = await db.wedding_template_assignments.find_one({"wedding_id": wedding_id})
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No template assigned to this wedding"
            )
        
        # Get template
        template = await db.video_templates.find_one({"id": assignment["template_id"]})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Map wedding data to overlays
        wedding_data = wedding_mapper.map_wedding_data(wedding)
        
        # Populate overlays with wedding data
        populated_overlays = []
        for overlay in template.get("text_overlays", []):
            text_value = wedding_mapper.populate_overlay_text(overlay, wedding_data)
            populated_overlays.append({
                **overlay,
                "text": text_value
            })
        
        # Create render job
        quality = 'hd'  # Default to HD
        job = render_service.create_render_job(wedding_id, template["id"], quality)
        
        # Start rendering in background
        video_url = template["video_data"]["original_url"]
        output_path = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4').name
        
        # Run render async in background
        asyncio.create_task(
            _process_render_job(
                job.job_id,
                video_url,
                populated_overlays,
                output_path,
                quality,
                wedding_id,
                db
            )
        )
        
        return {
            "success": True,
            "render_job_id": job.job_id,
            "status": "queued",
            "estimated_time": 120,
            "message": "Render job started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[RENDER_VIDEO] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start render job: {str(e)}"
        )


async def _process_render_job(
    job_id: str,
    video_url: str,
    overlays: List[Dict],
    output_path: str,
    quality: str,
    wedding_id: str,
    db
):
    """Process render job in background"""
    try:
        # Render video
        result = await render_service.render_video_async(
            job_id,
            video_url,
            overlays,
            output_path,
            quality
        )
        
        if result['success']:
            # Upload rendered video to Telegram CDN
            upload_result = await telegram_service.upload_video(
                file_path=output_path,
                caption=f"Rendered video for wedding {wedding_id}",
                wedding_id=wedding_id
            )
            
            if upload_result.get('success'):
                job = render_service.get_render_job(job_id)
                job.rendered_video_url = upload_result['cdn_url']
                job.rendered_file_id = upload_result['file_id']
                
                # Update assignment with rendered video
                await db.wedding_template_assignments.update_one(
                    {"wedding_id": wedding_id},
                    {
                        "$set": {
                            "rendered_video": {
                                "url": upload_result['cdn_url'],
                                "file_id": upload_result['file_id'],
                                "rendered_at": datetime.utcnow().isoformat(),
                                "status": "completed"
                            }
                        }
                    }
                )
                logger.info(f"[RENDER_JOB] Uploaded rendered video for job {job_id}")
        
        # Cleanup temp file
        if os.path.exists(output_path):
            os.unlink(output_path)
            
    except Exception as e:
        logger.error(f"[RENDER_JOB_BACKGROUND] Error: {str(e)}")


@router.get("/weddings/{wedding_id}/render-jobs/{job_id}")
async def get_render_job_status(
    wedding_id: str,
    job_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Get render job status
    """
    try:
        # Verify wedding ownership
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding.get("creator_id") != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get job status
        job_status = render_service.get_job_status(job_id)
        if not job_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Render job not found"
            )
        
        return job_status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GET_RENDER_STATUS] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get render status"
        )


@router.get("/weddings/{wedding_id}/render-jobs/{job_id}/download")
async def download_rendered_video(
    wedding_id: str,
    job_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """
    Get download URL for rendered video
    """
    try:
        # Verify wedding ownership
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding.get("creator_id") != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get job
        job = render_service.get_render_job(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Render job not found"
            )
        
        if job.status != 'completed':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Video not ready. Status: {job.status}"
            )
        
        if not job.rendered_video_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Rendered video URL not available"
            )
        
        return {
            "success": True,
            "download_url": job.rendered_video_url,
            "file_id": job.rendered_file_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DOWNLOAD_RENDER] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get download URL"
        )



@router.post("/admin/video-templates/{template_id}/regenerate-thumbnail")
async def regenerate_template_thumbnail(
    template_id: str,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Regenerate thumbnail for a video template.
    Useful when thumbnails are missing or failed to load.
    """
    temp_video_path = None
    temp_thumb_path = None
    
    try:
        # Get template
        template = await db.video_templates.find_one({"id": template_id})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        video_data = template.get("video_data", {})
        video_file_id = video_data.get("telegram_file_id")
        
        if not video_file_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Template has no video file_id - cannot regenerate thumbnail"
            )
        
        logger.info(f"[REGENERATE_THUMBNAIL] Starting thumbnail regeneration for template {template_id}")
        
        # Download video from Telegram
        file_url = await telegram_service.get_file_url(video_file_id)
        if not file_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video file not found on Telegram"
            )
        
        # Download video to temp file
        import httpx
        temp_video_path = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4').name
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(file_url)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to download video from Telegram"
                )
            
            async with aiofiles.open(temp_video_path, 'wb') as f:
                await f.write(response.content)
        
        logger.info(f"[REGENERATE_THUMBNAIL] Video downloaded successfully")
        
        # Generate thumbnail
        temp_thumb_path = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg').name
        thumb_result = await video_service.generate_thumbnail(
            temp_video_path,
            temp_thumb_path,
            timestamp=1.0
        )
        
        if not thumb_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate thumbnail: {thumb_result.get('error')}"
            )
        
        logger.info(f"[REGENERATE_THUMBNAIL] Thumbnail generated successfully")
        
        # Upload thumbnail to Telegram CDN
        thumb_upload_result = await telegram_service.upload_photo(
            file_path=temp_thumb_path,
            caption=f"Thumbnail: {template.get('name')}",
            wedding_id="video_templates"
        )
        
        if not thumb_upload_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload thumbnail: {thumb_upload_result.get('error')}"
            )
        
        logger.info(f"[REGENERATE_THUMBNAIL] Thumbnail uploaded to Telegram successfully")
        
        # Update template with new thumbnail
        thumbnail_data = {
            "url": thumb_upload_result["cdn_url"],
            "telegram_file_id": thumb_upload_result["file_id"]
        }
        
        await db.video_templates.update_one(
            {"id": template_id},
            {
                "$set": {
                    "preview_thumbnail": thumbnail_data,
                    "metadata.updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"[REGENERATE_THUMBNAIL] Template updated with new thumbnail")
        
        # Return success with thumbnail URL
        proxy_url = telegram_file_id_to_proxy_url(thumb_upload_result["file_id"], "photos")
        
        return {
            "success": True,
            "message": "Thumbnail regenerated successfully",
            "thumbnail_url": proxy_url,
            "telegram_file_id": thumb_upload_result["file_id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REGENERATE_THUMBNAIL] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate thumbnail: {str(e)}"
        )
    finally:
        # Cleanup temp files
        if temp_video_path and os.path.exists(temp_video_path):
            os.unlink(temp_video_path)
        if temp_thumb_path and os.path.exists(temp_thumb_path):
            os.unlink(temp_thumb_path)

