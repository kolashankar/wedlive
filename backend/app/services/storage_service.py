"""
Storage management service for WedLive
Tracks user storage usage across all media uploads
"""

from typing import Dict, Optional
from app.database import get_db
from app.plan_restrictions import get_storage_limit, format_bytes


class StorageService:
    """Service to manage user storage tracking"""
    
    @staticmethod
    async def calculate_user_storage(user_id: str) -> int:
        """
        Calculate total storage used by a user across all media
        Returns storage in bytes
        """
        db = get_db()
        total_size = 0
        
        # Calculate from all media collections
        # 1. Media gallery items
        media_items = await db.media_gallery.find({"user_id": user_id}).to_list(None)
        for item in media_items:
            total_size += item.get("file_size", 0)
        
        # 2. Photo booth images
        photobooth = await db.photo_booth.find({"user_id": user_id}).to_list(None)
        for photo in photobooth:
            total_size += photo.get("file_size", 0)
        
        # 3. Recording files (if stored locally)
        recordings = await db.weddings.find({"creator_id": user_id, "recording_url": {"$ne": None}}).to_list(None)
        for recording in recordings:
            # Estimate recording size if not stored
            total_size += recording.get("recording_size", 0)
        
        return total_size
    
    @staticmethod
    async def update_user_storage(user_id: str) -> Dict:
        """
        Recalculate and update user's storage usage
        Returns updated storage info
        """
        db = get_db()
        
        # Calculate total storage
        total_storage = await StorageService.calculate_user_storage(user_id)
        
        # Update user document
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"storage_used": total_storage}}
        )
        
        # Get user's plan
        user = await db.users.find_one({"id": user_id})
        plan = user.get("subscription_plan", "free")
        storage_limit = get_storage_limit(plan)
        
        return {
            "storage_used": total_storage,
            "storage_used_formatted": format_bytes(total_storage),
            "storage_limit": storage_limit,
            "storage_limit_formatted": format_bytes(storage_limit),
            "percentage": round((total_storage / storage_limit * 100), 2) if storage_limit > 0 else 0
        }
    
    @staticmethod
    async def add_file_to_storage(user_id: str, file_size: int) -> Dict:
        """
        Add a file to user's storage tracking
        Returns updated storage info
        """
        db = get_db()
        
        # Increment storage_used
        result = await db.users.find_one_and_update(
            {"id": user_id},
            {"$inc": {"storage_used": file_size}},
            return_document=True
        )
        
        if not result:
            raise ValueError(f"User {user_id} not found")
        
        plan = result.get("subscription_plan", "free")
        storage_used = result.get("storage_used", 0)
        storage_limit = get_storage_limit(plan)
        
        return {
            "storage_used": storage_used,
            "storage_used_formatted": format_bytes(storage_used),
            "storage_limit": storage_limit,
            "storage_limit_formatted": format_bytes(storage_limit),
            "percentage": round((storage_used / storage_limit * 100), 2) if storage_limit > 0 else 0,
            "is_over_limit": storage_used > storage_limit
        }
    
    @staticmethod
    async def remove_file_from_storage(user_id: str, file_size: int) -> Dict:
        """
        Remove a file from user's storage tracking
        Returns updated storage info
        """
        db = get_db()
        
        # Decrement storage_used (prevent negative values)
        user = await db.users.find_one({"id": user_id})
        current_storage = user.get("storage_used", 0)
        new_storage = max(0, current_storage - file_size)
        
        result = await db.users.find_one_and_update(
            {"id": user_id},
            {"$set": {"storage_used": new_storage}},
            return_document=True
        )
        
        plan = result.get("subscription_plan", "free")
        storage_limit = get_storage_limit(plan)
        
        return {
            "storage_used": new_storage,
            "storage_used_formatted": format_bytes(new_storage),
            "storage_limit": storage_limit,
            "storage_limit_formatted": format_bytes(storage_limit),
            "percentage": round((new_storage / storage_limit * 100), 2) if storage_limit > 0 else 0
        }
    
    @staticmethod
    async def get_storage_stats(user_id: str) -> Dict:
        """
        Get comprehensive storage statistics for a user
        """
        db = get_db()
        user = await db.users.find_one({"id": user_id})
        
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        plan = user.get("subscription_plan", "free")
        storage_used = user.get("storage_used", 0)
        storage_limit = get_storage_limit(plan)
        percentage = round((storage_used / storage_limit * 100), 2) if storage_limit > 0 else 0
        remaining = max(0, storage_limit - storage_used)
        
        # Get breakdown by type
        media_count = await db.media_gallery.count_documents({"user_id": user_id})
        photobooth_count = await db.photo_booth.count_documents({"user_id": user_id})
        recordings_count = await db.weddings.count_documents({
            "creator_id": user_id,
            "recording_url": {"$ne": None}
        })
        
        return {
            "plan": plan,
            "storage_used": storage_used,
            "storage_used_formatted": format_bytes(storage_used),
            "storage_limit": storage_limit,
            "storage_limit_formatted": format_bytes(storage_limit),
            "storage_remaining": remaining,
            "storage_remaining_formatted": format_bytes(remaining),
            "percentage_used": percentage,
            "is_over_limit": storage_used > storage_limit,
            "breakdown": {
                "media_items": media_count,
                "photobooth_photos": photobooth_count,
                "recordings": recordings_count
            }
        }
