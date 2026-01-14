"""
Plan management and storage API endpoints
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.auth import get_current_user
from app.database import get_db
from app.services.storage_service import StorageService
from app.plan_restrictions import (
    get_storage_info,
    get_plan_comparison,
    get_allowed_resolutions,
    has_feature,
    should_show_upgrade_banner,
    PLAN_FEATURES
)
from typing import Dict

router = APIRouter()
storage_service = StorageService()


@router.get("/storage/stats")
async def get_storage_stats(current_user: dict = Depends(get_current_user)):
    """
    Get comprehensive storage statistics for current user
    """
    try:
        stats = await storage_service.get_storage_stats(current_user["user_id"])
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get storage stats: {str(e)}"
        )


@router.post("/storage/recalculate")
async def recalculate_storage(current_user: dict = Depends(get_current_user)):
    """
    Recalculate user's storage usage from all media
    Useful for fixing storage discrepancies
    """
    try:
        stats = await storage_service.update_user_storage(current_user["user_id"])
        return {
            "message": "Storage recalculated successfully",
            **stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to recalculate storage: {str(e)}"
        )


@router.get("/plan/info")
async def get_plan_info(current_user: dict = Depends(get_current_user)):
    """
    Get current user's plan information and features
    """
    db = get_db()
    user = await db.users.find_one({"id": current_user["user_id"]})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    plan = user.get("subscription_plan", "free")
    storage_used = user.get("storage_used", 0)
    
    # Get plan features
    features = PLAN_FEATURES.get(plan, PLAN_FEATURES["free"])
    
    # Get storage info
    storage_info = get_storage_info(storage_used, plan)
    
    # Get allowed resolutions
    resolutions = get_allowed_resolutions(plan)
    
    # Check if upgrade banner should be shown
    show_banner, banner_message = should_show_upgrade_banner(user)
    
    # Count user's weddings
    weddings_count = await db.weddings.count_documents({"creator_id": user["id"]})
    
    return {
        "plan": plan,
        "plan_name": plan.capitalize(),
        "features": features,
        "storage": storage_info,
        "allowed_resolutions": resolutions,
        "weddings_count": weddings_count,
        "upgrade_banner": {
            "show": show_banner,
            "message": banner_message
        }
    }


@router.get("/plan/comparison")
async def get_plan_comparison_info():
    """
    Get detailed comparison of all available plans
    Public endpoint - no authentication required
    """
    return get_plan_comparison()


@router.get("/plan/features/{feature}")
async def check_feature_access(
    feature: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Check if current user has access to a specific feature
    """
    db = get_db()
    user = await db.users.find_one({"id": current_user["user_id"]})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    plan = user.get("subscription_plan", "free")
    has_access = has_feature(plan, feature)
    
    return {
        "feature": feature,
        "has_access": has_access,
        "plan": plan,
        "message": f"Feature '{feature}' is {'available' if has_access else 'not available'} on {plan} plan"
    }


@router.get("/plan/resolutions")
async def get_available_resolutions(current_user: dict = Depends(get_current_user)):
    """
    Get list of available streaming resolutions for current user's plan
    """
    db = get_db()
    user = await db.users.find_one({"id": current_user["user_id"]})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    plan = user.get("subscription_plan", "free")
    resolutions = get_allowed_resolutions(plan)
    
    return {
        "plan": plan,
        "allowed_resolutions": resolutions,
        "max_resolution": resolutions[-1] if resolutions else "480p"
    }
