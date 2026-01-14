"""
Storage Management Routes
Handles storage tracking, add-ons, and usage statistics
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.auth import get_current_user
from app.database import get_db
from app.services.storage_service import StorageService
from app.plan_restrictions import get_storage_limit, format_bytes, has_feature
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter()
storage_service = StorageService()

class StorageAddonPurchase(BaseModel):
    addon_size_gb: int  # 50, 100, 200, etc.
    payment_id: str

class StorageResponse(BaseModel):
    plan: str
    storage_used: int
    storage_used_formatted: str
    storage_limit: int
    storage_limit_formatted: str
    storage_remaining: int
    storage_remaining_formatted: str
    percentage_used: float
    is_over_limit: bool
    can_upload: bool
    breakdown: dict

@router.get("/stats", response_model=StorageResponse)
async def get_storage_stats(current_user: dict = Depends(get_current_user)):
    """
    Get comprehensive storage statistics for current user
    """
    try:
        stats = await storage_service.get_storage_stats(current_user["user_id"])
        
        # Check if user can upload based on plan and storage
        db = get_db()
        user = await db.users.find_one({"id": current_user["user_id"]})
        plan = user.get("subscription_plan", "free")
        can_upload = has_feature(plan, "media_upload") and not stats["is_over_limit"]
        
        return StorageResponse(
            plan=stats["plan"],
            storage_used=stats["storage_used"],
            storage_used_formatted=stats["storage_used_formatted"],
            storage_limit=stats["storage_limit"],
            storage_limit_formatted=stats["storage_limit_formatted"],
            storage_remaining=stats["storage_remaining"],
            storage_remaining_formatted=stats["storage_remaining_formatted"],
            percentage_used=stats["percentage_used"],
            is_over_limit=stats["is_over_limit"],
            can_upload=can_upload,
            breakdown=stats["breakdown"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch storage stats: {str(e)}"
        )

@router.post("/recalculate")
async def recalculate_storage(current_user: dict = Depends(get_current_user)):
    """
    Recalculate user's storage usage from all media sources
    Useful for fixing any discrepancies
    """
    try:
        updated_stats = await storage_service.update_user_storage(current_user["user_id"])
        return {
            "message": "Storage recalculated successfully",
            "storage": updated_stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to recalculate storage: {str(e)}"
        )

@router.post("/addon/purchase")
async def purchase_storage_addon(
    purchase: StorageAddonPurchase,
    current_user: dict = Depends(get_current_user)
):
    """
    Purchase additional storage add-on (Premium only)
    Pricing: ₹500 per 50GB/month
    """
    db = get_db()
    user = await db.users.find_one({"id": current_user["user_id"]})
    plan = user.get("subscription_plan", "free")
    
    # Only premium users can buy add-ons
    if plan == "free":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Storage add-ons are only available for Premium subscribers. Please upgrade first."
        )
    
    # Validate addon size
    valid_sizes = [50, 100, 200, 500]
    if purchase.addon_size_gb not in valid_sizes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid addon size. Choose from: {valid_sizes} GB"
        )
    
    # Calculate addon storage in bytes
    addon_bytes = purchase.addon_size_gb * 1024 * 1024 * 1024
    
    # Create addon record
    addon_id = str(uuid.uuid4())
    addon = {
        "id": addon_id,
        "user_id": current_user["user_id"],
        "size_gb": purchase.addon_size_gb,
        "size_bytes": addon_bytes,
        "payment_id": purchase.payment_id,
        "price": (purchase.addon_size_gb // 50) * 500,  # ₹500 per 50GB
        "status": "active",
        "purchased_at": datetime.utcnow(),
        "expires_at": None  # Monthly recurring
    }
    
    await db.storage_addons.insert_one(addon)
    
    # Update user's storage limit
    current_limit = user.get("storage_limit", get_storage_limit(plan))
    new_limit = current_limit + addon_bytes
    
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"storage_limit": new_limit}}
    )
    
    return {
        "message": f"Successfully added {purchase.addon_size_gb}GB storage",
        "addon": {
            "id": addon_id,
            "size_gb": purchase.addon_size_gb,
            "price": addon["price"],
            "new_total_limit": format_bytes(new_limit)
        }
    }

@router.get("/addons")
async def get_storage_addons(current_user: dict = Depends(get_current_user)):
    """
    Get all purchased storage add-ons for current user
    """
    db = get_db()
    addons = await db.storage_addons.find(
        {"user_id": current_user["user_id"], "status": "active"}
    ).to_list(None)
    
    return {
        "addons": [
            {
                "id": addon["id"],
                "size_gb": addon["size_gb"],
                "size_formatted": format_bytes(addon["size_bytes"]),
                "price": addon["price"],
                "purchased_at": addon["purchased_at"],
                "status": addon["status"]
            }
            for addon in addons
        ],
        "total_addon_storage_gb": sum(a["size_gb"] for a in addons)
    }

@router.get("/breakdown/{wedding_id}")
async def get_wedding_storage_breakdown(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed storage breakdown for a specific wedding
    """
    db = get_db()
    
    # Verify wedding ownership
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this wedding's storage"
        )
    
    # Calculate storage for this wedding
    media_items = await db.media_gallery.find({"wedding_id": wedding_id}).to_list(None)
    total_media_size = sum(item.get("file_size", 0) for item in media_items)
    
    photobooth = await db.photo_booth.find({"wedding_id": wedding_id}).to_list(None)
    total_photobooth_size = sum(photo.get("file_size", 0) for photo in photobooth)
    
    recording_size = wedding.get("recording_size", 0)
    
    total_wedding_storage = total_media_size + total_photobooth_size + recording_size
    
    return {
        "wedding_id": wedding_id,
        "wedding_title": wedding["title"],
        "total_storage": total_wedding_storage,
        "total_storage_formatted": format_bytes(total_wedding_storage),
        "breakdown": {
            "media_gallery": {
                "size": total_media_size,
                "size_formatted": format_bytes(total_media_size),
                "count": len(media_items)
            },
            "photo_booth": {
                "size": total_photobooth_size,
                "size_formatted": format_bytes(total_photobooth_size),
                "count": len(photobooth)
            },
            "recording": {
                "size": recording_size,
                "size_formatted": format_bytes(recording_size)
            }
        }
    }
