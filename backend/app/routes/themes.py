"""
Theme Management Routes
Handles CRUD operations for wedding themes
"""
from fastapi import APIRouter, HTTPException, status, Depends
from app.models import (
    Theme, ThemeResponse, CreateThemeRequest, UpdateThemeRequest,
    ThemeRequiredSections, ThemeDefaultBorders, AnimationType
)
from app.auth import get_current_admin, get_current_user
from app.database import get_db_dependency
from typing import List, Optional
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# ==================== ADMIN: THEME CRUD ====================

@router.post("/admin/themes", response_model=ThemeResponse)
async def create_theme(
    theme_data: CreateThemeRequest,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """Create a new theme (admin only)"""
    theme_id = str(uuid.uuid4())
    
    theme_doc = {
        "id": theme_id,
        "name": theme_data.name,
        "description": theme_data.description,
        "preview_image": theme_data.preview_image,
        "required_sections": theme_data.required_sections.model_dump(),
        "default_borders": theme_data.default_borders.model_dump(),
        "supported_layouts": theme_data.supported_layouts,
        "supported_animations": theme_data.supported_animations,
        "is_premium": theme_data.is_premium,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.themes.insert_one(theme_doc)
    logger.info(f"[THEME_CREATE] Created theme: {theme_data.name} ({theme_id})")
    
    return ThemeResponse(**theme_doc)

@router.get("/admin/themes", response_model=List[ThemeResponse])
async def list_all_themes(
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """List all themes (admin only)"""
    cursor = db.themes.find().sort("created_at", -1)
    themes = await cursor.to_list(length=100)
    return [ThemeResponse(**theme) for theme in themes]

@router.put("/admin/themes/{theme_id}", response_model=ThemeResponse)
async def update_theme(
    theme_id: str,
    update_data: UpdateThemeRequest,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """Update a theme (admin only)"""
    theme = await db.themes.find_one({"id": theme_id})
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found"
        )
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # Convert Pydantic models to dicts for nested objects
    if "required_sections" in update_dict:
        update_dict["required_sections"] = update_dict["required_sections"].model_dump()
    if "default_borders" in update_dict:
        update_dict["default_borders"] = update_dict["default_borders"].model_dump()
    
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.themes.update_one({"id": theme_id}, {"$set": update_dict})
    
    updated_theme = await db.themes.find_one({"id": theme_id})
    logger.info(f"[THEME_UPDATE] Updated theme: {theme_id}")
    
    return ThemeResponse(**updated_theme)

@router.delete("/admin/themes/{theme_id}")
async def delete_theme(
    theme_id: str,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """Delete a theme (admin only)"""
    result = await db.themes.delete_one({"id": theme_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found"
        )
    
    logger.info(f"[THEME_DELETE] Deleted theme: {theme_id}")
    return {"success": True, "message": "Theme deleted successfully"}

# ==================== PUBLIC: THEME ACCESS ====================

@router.get("/themes", response_model=List[ThemeResponse])
async def list_themes(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """List available themes for creators"""
    # Filter based on user subscription
    user_plan = current_user.get("subscription_plan", "free")
    
    if user_plan == "free":
        # Free users only see free themes
        cursor = db.themes.find({"is_premium": False}).sort("created_at", -1)
    else:
        # Premium users see all themes
        cursor = db.themes.find().sort("created_at", -1)
    
    themes = await cursor.to_list(length=100)
    return [ThemeResponse(**theme) for theme in themes]

@router.get("/themes/{theme_id}", response_model=ThemeResponse)
async def get_theme(
    theme_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    """Get a specific theme"""
    theme = await db.themes.find_one({"id": theme_id})
    
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found"
        )
    
    # Check access for premium themes
    if theme.get("is_premium", False):
        user_plan = current_user.get("subscription_plan", "free")
        if user_plan == "free":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This theme requires a premium subscription"
            )
    
    return ThemeResponse(**theme)

# ==================== SEED DEFAULT THEMES ====================

@router.post("/admin/themes/seed-defaults")
async def seed_default_themes(
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_db_dependency)
):
    """Seed the database with default themes"""
    
    default_themes = [
        {
            "id": "layout_1",
            "name": "Classic Split Hero",
            "description": "Side-by-side bride and groom photos with centered couple photo below. Perfect for showcasing both individuals and the couple.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": False,
                "groom_photo": False,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 0,
                    "max_photos": 20
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["split", "default"],
            "supported_animations": ["fade"],
            "is_premium": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "layout_2",
            "name": "Center Focus",
            "description": "Large centered couple photo as hero with gallery below. Emphasizes the couple's unity.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": False,
                "groom_photo": False,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 0,
                    "max_photos": 20
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["center", "carousel"],
            "supported_animations": ["fade"],
            "is_premium": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "layout_3",
            "name": "Horizontal Timeline",
            "description": "Journey-style layout with bride and groom photos connected by a timeline. Perfect for telling your love story.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": False,
                "groom_photo": False,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 0,
                    "max_photos": 20
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["timeline", "horizontal"],
            "supported_animations": ["fade"],
            "is_premium": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "layout_4",
            "name": "Magazine Style",
            "description": "Editorial magazine-inspired layout with multi-column design. Modern and artistic.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": False,
                "groom_photo": False,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 0,
                    "max_photos": 20
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["editorial", "grid"],
            "supported_animations": ["fade", "zoom"],
            "is_premium": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "layout_5",
            "name": "Minimalist Card",
            "description": "Ultra-clean card-based design with maximum negative space. Modern minimalism.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": False,
                "groom_photo": False,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 0,
                    "max_photos": 9
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["minimalist"],
            "supported_animations": ["fade"],
            "is_premium": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "layout_6",
            "name": "Romantic Overlay",
            "description": "Full-screen couple photo with elegant text overlay. Dreamy and romantic aesthetic.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": False,
                "groom_photo": False,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 0,
                    "max_photos": 6
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["overlay", "fullscreen"],
            "supported_animations": ["fade", "parallax"],
            "is_premium": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "layout_7",
            "name": "Editorial Grid",
            "description": "Asymmetric grid layout with bold typography. Modern and artistic composition.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": False,
                "groom_photo": False,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 0,
                    "max_photos": 20
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["grid", "editorial"],
            "supported_animations": ["fade"],
            "is_premium": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "layout_8",
            "name": "Zen Minimalist",
            "description": "Ultra-minimalist vertical flow with maximum white space. Extreme simplicity and elegance.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": False,
                "groom_photo": False,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 0,
                    "max_photos": 3
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["minimalist", "zen"],
            "supported_animations": ["fade"],
            "is_premium": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    # Check if themes already exist
    existing_count = await db.themes.count_documents({})
    if existing_count > 0:
        return {
            "success": False,
            "message": f"Database already contains {existing_count} themes. Clear them first if you want to reseed."
        }
    
    # Insert all themes
    await db.themes.insert_many(default_themes)
    
    logger.info(f"[THEME_SEED] Seeded {len(default_themes)} default themes")
    return {
        "success": True,
        "message": f"Successfully seeded {len(default_themes)} default themes",
        "themes": [t["name"] for t in default_themes]
    }
