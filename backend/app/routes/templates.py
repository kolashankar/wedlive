"""
Template Management Routes
Handles freehand template creation, shape management, and mask generation
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from pydantic import BaseModel
from app.auth import get_current_admin, get_current_user
from app.database import get_db, get_db_dependency
from app.services.telegram_service import TelegramCDNService
from app.services.image_processing import ImageProcessingService
from typing import List, Optional, Dict
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
image_processor = ImageProcessingService()

# Maximum file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024

class TemplateShape(BaseModel):
    id: str
    points: List[List[float]]
    path: str
    feather: int = 8
    shadow: bool = True
    shadow_depth: int = 4
    bounding_box: Dict[str, float]

class TemplateCreate(BaseModel):
    name: str
    description: str = ""
    category: str = "general"
    shapes: List[TemplateShape]
    tags: List[str] = []

class TemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    template_url: str
    telegram_file_id: str
    shapes: List[TemplateShape]
    tags: List[str]
    created_at: datetime
    uploaded_by: str

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

@router.post("/admin/templates/upload", response_model=TemplateResponse)
async def upload_template(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
    category: str = Form("general"),
    shapes_json: str = Form(""),
    tags: str = Form(""),
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """
    Upload a template with freehand drawn shapes
    """
    temp_path = None
    
    try:
        logger.info(f"[TEMPLATE_UPLOAD] Creating template: {name}")
        
        # Validate and save file
        temp_path = await validate_and_save_file(file)
        
        # Parse shapes
        shapes_data = json.loads(shapes_json) if shapes_json else []
        
        # Upload template image to Telegram CDN
        upload_result = await telegram_service.upload_photo(
            file_path=temp_path,
            caption=f"Template: {name}",
            wedding_id="templates"
        )
        
        if not upload_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload template: {upload_result.get('error')}"
            )
        
        # Generate masks for each shape
        processed_shapes = []
        for shape_data in shapes_data:
            # Generate mask from shape path
            mask_url = await image_processor.generate_mask_from_shape(
                shape_data, 
                upload_result["cdn_url"],
                temp_path
            )
            
            shape_data["mask_url"] = mask_url
            processed_shapes.append(shape_data)
        
        # Create template document
        template_id = str(uuid.uuid4())
        tags_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        template_doc = {
            "id": template_id,
            "name": name,
            "description": description,
            "category": category,
            "template_url": upload_result["cdn_url"],
            "telegram_file_id": upload_result["file_id"],
            "shapes": processed_shapes,
            "tags": tags_list,
            "created_at": datetime.utcnow(),
            "uploaded_by": current_user["user_id"]
        }
        
        # Save to database
        await db.templates.insert_one(template_doc)
        
        logger.info(f"[TEMPLATE_UPLOAD] Successfully created template: {name}")
        return TemplateResponse(**template_doc)
        
    except Exception as e:
        logger.error(f"[TEMPLATE_UPLOAD] Error creating template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create template: {str(e)}"
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

@router.get("/admin/templates", response_model=List[TemplateResponse])
async def list_templates(
    current_user: dict = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 100,
    db = Depends(get_db_dependency)
):
    """List all templates (admin only)"""
    cursor = db.templates.find().sort("created_at", -1).skip(skip).limit(limit)
    templates = await cursor.to_list(length=limit)
    return [TemplateResponse(**template) for template in templates]

@router.delete("/admin/templates/{template_id}")
async def delete_template(
    template_id: str,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """Delete a template"""
    result = await db.templates.delete_one({"id": template_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return {"message": "Template deleted successfully"}

@router.get("/templates", response_model=List[TemplateResponse])
async def get_available_templates(
    skip: int = 0, 
    limit: int = 100,
    db = Depends(get_db_dependency)
):
    """Get all available templates (public access)"""
    cursor = db.templates.find().sort("created_at", -1).skip(skip).limit(limit)
    templates = await cursor.to_list(length=limit)
    return [TemplateResponse(**template) for template in templates]

@router.get("/templates/{template_id}")
async def get_template(
    template_id: str,
    db = Depends(get_db_dependency)
):
    """Get template details by ID"""
    template = await db.templates.find_one({"id": template_id})
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return TemplateResponse(**template)

@router.get("/templates/default")
async def get_default_template(db = Depends(get_db)):
    """Get default template for new users"""
    # Try to find a template marked as default, or return the first one
    default_template = await db.templates.find_one({"category": "default"})
    
    if not default_template:
        # If no default template, get the first available template
        cursor = db.templates.find().limit(1)
        templates = await cursor.to_list(length=1)
        if templates:
            default_template = templates[0]
    
    if not default_template:
        # If no templates exist, return a default template structure
        return {
            "id": "default",
            "name": "Default Template",
            "description": "Default wedding template",
            "category": "default",
            "template_url": "",
            "telegram_file_id": "",
            "shapes": [],
            "tags": ["default"],
            "created_at": datetime.utcnow(),
            "uploaded_by": "system"
        }
    
    return TemplateResponse(**default_template)

@router.post("/templates/{template_id}/apply-photos")
async def apply_photos_to_template(
    template_id: str,
    photos: List[str] = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Apply user photos to template shapes and generate final composite
    """
    db = get_db()
    
    # Get template
    template = await db.templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    try:
        logger.info(f"[TEMPLATE_APPLY] Applying {len(photos)} photos to template: {template_id}")
        
        # Generate composite image
        composite_url = await image_processor.generate_composite(
            template,
            photos,
            template["template_url"]
        )
        
        return {
            "composite_url": composite_url,
            "template_id": template_id,
            "applied_photos": len(photos)
        }
        
    except Exception as e:
        logger.error(f"[TEMPLATE_APPLY] Error applying photos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply photos: {str(e)}"
        )
