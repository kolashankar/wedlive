"""
Plan Information Routes
Provides subscription plan details and features
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.auth import get_current_user
from app.database import get_db
from app.plan_restrictions import (
    get_storage_limit, 
    get_viewer_limit,
    get_quality_options,
    has_feature
)
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class QualityOption(BaseModel):
    resolution: str
    width: int
    height: int
    bitrate: int
    available: bool

class PlanFeatures(BaseModel):
    media_upload: bool
    custom_branding: bool
    api_access: bool
    webhooks: bool
    multi_camera: bool
    dvr_recording: bool
    advanced_analytics: bool

class PlanDetails(BaseModel):
    name: str
    tier: str
    price_monthly: Optional[float]
    price_yearly: Optional[float]
    max_weddings: Optional[int]
    storage_limit_gb: int
    viewer_limit: Optional[int]
    quality_options: List[QualityOption]
    features: PlanFeatures
    
class PlanInfoResponse(BaseModel):
    current_plan: PlanDetails
    available_upgrades: List[PlanDetails]

# Quality resolution mapping
QUALITY_RESOLUTIONS = {
    "240p": {"width": 426, "height": 240, "bitrate": 400},
    "360p": {"width": 640, "height": 360, "bitrate": 800},
    "480p": {"width": 854, "height": 480, "bitrate": 1200},
    "720p": {"width": 1280, "height": 720, "bitrate": 2500},
    "1080p": {"width": 1920, "height": 1080, "bitrate": 5000},
    "1440p": {"width": 2560, "height": 1440, "bitrate": 8000},
    "4K": {"width": 3840, "height": 2160, "bitrate": 15000}
}

def get_plan_details(plan: str, user_plan: str = None) -> PlanDetails:
    """Get detailed information about a plan"""
    
    # Determine if features are available based on comparison with user's plan
    is_user_plan = (plan == user_plan)
    
    if plan == "free":
        storage_gb = get_storage_limit("free") / (1024 * 1024 * 1024)
        quality_options_list = get_quality_options("free")
        
        return PlanDetails(
            name="Free Plan",
            tier="free",
            price_monthly=0.0,
            price_yearly=0.0,
            max_weddings=1,
            storage_limit_gb=int(storage_gb),
            viewer_limit=100,
            quality_options=[
                QualityOption(
                    resolution=q,
                    width=QUALITY_RESOLUTIONS[q]["width"],
                    height=QUALITY_RESOLUTIONS[q]["height"],
                    bitrate=QUALITY_RESOLUTIONS[q]["bitrate"],
                    available=True
                )
                for q in quality_options_list
            ],
            features=PlanFeatures(
                media_upload=False,
                custom_branding=False,
                api_access=False,
                webhooks=False,
                multi_camera=False,
                dvr_recording=False,
                advanced_analytics=False
            )
        )
    
    elif plan in ["monthly", "yearly"]:
        storage_gb = get_storage_limit(plan) / (1024 * 1024 * 1024)
        quality_options_list = get_quality_options(plan)
        
        return PlanDetails(
            name="Premium Monthly" if plan == "monthly" else "Premium Yearly",
            tier=plan,
            price_monthly=1799.0 if plan == "monthly" else None,
            price_yearly=17270.0 if plan == "yearly" else None,
            max_weddings=None,  # Unlimited
            storage_limit_gb=int(storage_gb),
            viewer_limit=None,  # Unlimited
            quality_options=[
                QualityOption(
                    resolution=q,
                    width=QUALITY_RESOLUTIONS[q]["width"],
                    height=QUALITY_RESOLUTIONS[q]["height"],
                    bitrate=QUALITY_RESOLUTIONS[q]["bitrate"],
                    available=True
                )
                for q in quality_options_list
            ],
            features=PlanFeatures(
                media_upload=True,
                custom_branding=True,
                api_access=True,
                webhooks=True,
                multi_camera=True,
                dvr_recording=True,
                advanced_analytics=True
            )
        )
    
    return None

@router.get("/info", response_model=PlanInfoResponse)
async def get_plan_info(current_user: dict = Depends(get_current_user)):
    """
    Get comprehensive plan information for current user
    Returns current plan details and available upgrade options
    """
    db = get_db()
    
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    current_plan = user.get("subscription_plan", "free")
    
    # Get current plan details
    current_plan_details = get_plan_details(current_plan, current_plan)
    
    # Get available upgrades
    available_upgrades = []
    if current_plan == "free":
        available_upgrades.append(get_plan_details("monthly", current_plan))
        available_upgrades.append(get_plan_details("yearly", current_plan))
    elif current_plan == "monthly":
        available_upgrades.append(get_plan_details("yearly", current_plan))
    
    return PlanInfoResponse(
        current_plan=current_plan_details,
        available_upgrades=available_upgrades
    )

@router.get("/features")
async def get_plan_features(current_user: dict = Depends(get_current_user)):
    """Get feature availability for current user's plan"""
    db = get_db()
    
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    plan = user.get("subscription_plan", "free")
    
    return {
        "plan": plan,
        "features": {
            "media_upload": has_feature(plan, "media_upload"),
            "custom_branding": has_feature(plan, "custom_branding"),
            "api_access": has_feature(plan, "api_access"),
            "webhooks": has_feature(plan, "webhooks"),
            "multi_camera": has_feature(plan, "multi_camera"),
            "dvr_recording": has_feature(plan, "dvr_recording"),
            "advanced_analytics": has_feature(plan, "advanced_analytics")
        },
        "limits": {
            "max_weddings": 1 if plan == "free" else None,
            "storage_limit_gb": int(get_storage_limit(plan) / (1024 * 1024 * 1024)),
            "viewer_limit": get_viewer_limit(plan),
            "quality_options": get_quality_options(plan)
        }
    }

@router.get("/all")
async def get_all_plans():
    """
    Get all available plans (public endpoint)
    """
    return {
        "plans": [
            get_plan_details("free"),
            get_plan_details("monthly"),
            get_plan_details("yearly")
        ]
    }

@router.get("/free")
async def get_free_plan_details():
    """
    Get free plan details (public endpoint)
    """
    return get_plan_details("free")

@router.get("/comparison")
async def get_plan_comparison():
    """
    Get comparison of all available plans (public endpoint)
    """
    return {
        "plans": [
            get_plan_details("free"),
            get_plan_details("monthly"),
            get_plan_details("yearly")
        ]
    }

@router.get("/features/{feature_name}")
async def check_feature_access(feature_name: str, current_user: dict = Depends(get_current_user)):
    """Check if user's plan has access to a specific feature"""
    db = get_db()
    
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    plan = user.get("subscription_plan", "free")
    
    return {
        "feature": feature_name,
        "has_access": has_feature(plan, feature_name),
        "plan": plan
    }

@router.get("/resolutions")
async def get_available_resolutions(current_user: dict = Depends(get_current_user)):
    """Get available resolutions for user's plan"""
    db = get_db()
    
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    plan = user.get("subscription_plan", "free")
    
    return {
        "plan": plan,
        "resolutions": get_quality_options(plan)
    }
