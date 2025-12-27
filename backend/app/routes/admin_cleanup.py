"""
Admin Cleanup Routes
Provides endpoints to clean up invalid data like placeholder file_ids
"""
from fastapi import APIRouter, HTTPException, Depends
from app.auth import get_current_user
from app.database import get_db
from app.utils.file_id_validator import is_valid_telegram_file_id, is_placeholder_file_id
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/admin/cleanup/placeholder-file-ids")
async def cleanup_placeholder_file_ids(
    current_user: dict = Depends(get_current_user),
    dry_run: bool = True
):
    """
    Clean up placeholder file_ids from the database
    
    This endpoint will:
    1. Find all media items with placeholder file_ids (file_XX pattern)
    2. Find all layout_photos with placeholder file_ids
    3. Either delete them (dry_run=False) or just report them (dry_run=True)
    
    Only admins can run this endpoint.
    """
    # Verify admin access
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    
    db = get_db()
    results = {
        "dry_run": dry_run,
        "timestamp": datetime.utcnow().isoformat(),
        "media_collection": {
            "found": 0,
            "deleted": 0,
            "items": []
        },
        "layout_photos": {
            "found": 0,
            "fixed": 0,
            "items": []
        },
        "cover_photos": {
            "found": 0,
            "fixed": 0,
            "items": []
        }
    }
    
    logger.info(f"[CLEANUP] Starting placeholder file_id cleanup (dry_run={dry_run})")
    
    # 1. Clean up media collection
    logger.info("[CLEANUP] Checking media collection...")
    cursor = db.media.find({})
    async for media in cursor:
        file_id = media.get('file_id', '')
        media_id = media.get('id', 'unknown')
        wedding_id = media.get('wedding_id', 'unknown')
        
        if file_id and (is_placeholder_file_id(file_id) or not is_valid_telegram_file_id(file_id)):
            results["media_collection"]["found"] += 1
            item_info = {
                "media_id": media_id,
                "wedding_id": wedding_id,
                "file_id": file_id,
                "media_type": media.get('media_type', 'unknown'),
                "uploaded_at": str(media.get('uploaded_at', 'unknown'))
            }
            results["media_collection"]["items"].append(item_info)
            
            logger.warning(f"[CLEANUP] Found invalid file_id in media {media_id}: {file_id}")
            
            if not dry_run:
                # Delete the media item
                await db.media.delete_one({"id": media_id})
                results["media_collection"]["deleted"] += 1
                logger.info(f"[CLEANUP] Deleted media {media_id}")
    
    # 2. Clean up layout_photos in weddings
    logger.info("[CLEANUP] Checking wedding.layout_photos...")
    cursor = db.weddings.find({"layout_photos": {"$exists": True}})
    async for wedding in cursor:
        wedding_id = wedding.get('id', 'unknown')
        layout_photos = wedding.get('layout_photos', {})
        modified = False
        cleaned_photos = {}
        
        for placeholder, photo_data in layout_photos.items():
            if isinstance(photo_data, dict):
                file_id = photo_data.get('file_id', '')
                if file_id and (is_placeholder_file_id(file_id) or not is_valid_telegram_file_id(file_id)):
                    results["layout_photos"]["found"] += 1
                    results["layout_photos"]["items"].append({
                        "wedding_id": wedding_id,
                        "placeholder": placeholder,
                        "file_id": file_id
                    })
                    logger.warning(f"[CLEANUP] Found invalid file_id in wedding {wedding_id}, placeholder {placeholder}: {file_id}")
                    modified = True
                    # Don't include this photo in cleaned_photos
                else:
                    cleaned_photos[placeholder] = photo_data
                    
            elif isinstance(photo_data, list):
                cleaned_array = []
                for idx, item in enumerate(photo_data):
                    if isinstance(item, dict):
                        file_id = item.get('file_id', '')
                        if file_id and (is_placeholder_file_id(file_id) or not is_valid_telegram_file_id(file_id)):
                            results["layout_photos"]["found"] += 1
                            results["layout_photos"]["items"].append({
                                "wedding_id": wedding_id,
                                "placeholder": f"{placeholder}[{idx}]",
                                "file_id": file_id
                            })
                            logger.warning(f"[CLEANUP] Found invalid file_id in wedding {wedding_id}, {placeholder}[{idx}]: {file_id}")
                            modified = True
                            # Don't include this item
                        else:
                            cleaned_array.append(item)
                if cleaned_array:
                    cleaned_photos[placeholder] = cleaned_array
            else:
                cleaned_photos[placeholder] = photo_data
        
        if modified and not dry_run:
            # Update wedding with cleaned photos
            await db.weddings.update_one(
                {"id": wedding_id},
                {"$set": {
                    "layout_photos": cleaned_photos,
                    "updated_at": datetime.utcnow()
                }}
            )
            results["layout_photos"]["fixed"] += 1
            logger.info(f"[CLEANUP] Fixed layout_photos for wedding {wedding_id}")
    
    # 3. Clean up theme_settings.cover_photos
    logger.info("[CLEANUP] Checking theme_settings.cover_photos...")
    cursor = db.weddings.find({"theme_settings.cover_photos": {"$exists": True}})
    async for wedding in cursor:
        wedding_id = wedding.get('id', 'unknown')
        theme_settings = wedding.get('theme_settings', {})
        cover_photos = theme_settings.get('cover_photos', [])
        cleaned_cover_photos = []
        modified = False
        
        for idx, photo in enumerate(cover_photos):
            if isinstance(photo, dict):
                file_id = photo.get('file_id', '')
                if file_id and (is_placeholder_file_id(file_id) or not is_valid_telegram_file_id(file_id)):
                    results["cover_photos"]["found"] += 1
                    results["cover_photos"]["items"].append({
                        "wedding_id": wedding_id,
                        "index": idx,
                        "file_id": file_id,
                        "category": photo.get('category', 'unknown')
                    })
                    logger.warning(f"[CLEANUP] Found invalid file_id in wedding {wedding_id}, cover_photos[{idx}]: {file_id}")
                    modified = True
                    # Don't include this photo
                else:
                    cleaned_cover_photos.append(photo)
            else:
                cleaned_cover_photos.append(photo)
        
        if modified and not dry_run:
            # Update wedding with cleaned cover_photos
            theme_settings['cover_photos'] = cleaned_cover_photos
            await db.weddings.update_one(
                {"id": wedding_id},
                {"$set": {
                    "theme_settings": theme_settings,
                    "updated_at": datetime.utcnow()
                }}
            )
            results["cover_photos"]["fixed"] += 1
            logger.info(f"[CLEANUP] Fixed cover_photos for wedding {wedding_id}")
    
    # Summary
    logger.info(f"[CLEANUP] Cleanup complete (dry_run={dry_run})")
    logger.info(f"[CLEANUP]   Media items: {results['media_collection']['found']} found, {results['media_collection']['deleted']} deleted")
    logger.info(f"[CLEANUP]   Layout photos: {results['layout_photos']['found']} found, {results['layout_photos']['fixed']} weddings fixed")
    logger.info(f"[CLEANUP]   Cover photos: {results['cover_photos']['found']} found, {results['cover_photos']['fixed']} weddings fixed")
    
    return results

@router.get("/admin/validate/file-ids")
async def validate_all_file_ids(
    current_user: dict = Depends(get_current_user)
):
    """
    Validate all file_ids in the database
    Returns a report of all invalid file_ids found
    
    Only admins can run this endpoint.
    """
    # Verify admin access
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    
    db = get_db()
    report = {
        "timestamp": datetime.utcnow().isoformat(),
        "validation_results": {
            "total_media": 0,
            "invalid_media": 0,
            "total_weddings": 0,
            "weddings_with_invalid_photos": 0
        },
        "invalid_items": []
    }
    
    logger.info("[VALIDATION] Starting file_id validation")
    
    # Validate media collection
    cursor = db.media.find({})
    async for media in cursor:
        report["validation_results"]["total_media"] += 1
        file_id = media.get('file_id', '')
        
        if file_id and not is_valid_telegram_file_id(file_id):
            report["validation_results"]["invalid_media"] += 1
            report["invalid_items"].append({
                "type": "media",
                "media_id": media.get('id'),
                "wedding_id": media.get('wedding_id'),
                "file_id": file_id,
                "reason": "Invalid or placeholder file_id"
            })
    
    # Validate wedding photos
    cursor = db.weddings.find({})
    async for wedding in cursor:
        report["validation_results"]["total_weddings"] += 1
        wedding_id = wedding.get('id', 'unknown')
        has_invalid = False
        
        # Check layout_photos
        layout_photos = wedding.get('layout_photos', {})
        for placeholder, photo_data in layout_photos.items():
            if isinstance(photo_data, dict):
                file_id = photo_data.get('file_id', '')
                if file_id and not is_valid_telegram_file_id(file_id):
                    has_invalid = True
                    report["invalid_items"].append({
                        "type": "layout_photo",
                        "wedding_id": wedding_id,
                        "placeholder": placeholder,
                        "file_id": file_id,
                        "reason": "Invalid or placeholder file_id"
                    })
            elif isinstance(photo_data, list):
                for idx, item in enumerate(photo_data):
                    if isinstance(item, dict):
                        file_id = item.get('file_id', '')
                        if file_id and not is_valid_telegram_file_id(file_id):
                            has_invalid = True
                            report["invalid_items"].append({
                                "type": "layout_photo_array",
                                "wedding_id": wedding_id,
                                "placeholder": f"{placeholder}[{idx}]",
                                "file_id": file_id,
                                "reason": "Invalid or placeholder file_id"
                            })
        
        # Check cover_photos
        cover_photos = wedding.get('theme_settings', {}).get('cover_photos', [])
        for idx, photo in enumerate(cover_photos):
            if isinstance(photo, dict):
                file_id = photo.get('file_id', '')
                if file_id and not is_valid_telegram_file_id(file_id):
                    has_invalid = True
                    report["invalid_items"].append({
                        "type": "cover_photo",
                        "wedding_id": wedding_id,
                        "index": idx,
                        "file_id": file_id,
                        "category": photo.get('category'),
                        "reason": "Invalid or placeholder file_id"
                    })
        
        if has_invalid:
            report["validation_results"]["weddings_with_invalid_photos"] += 1
    
    logger.info(f"[VALIDATION] Validation complete. Found {len(report['invalid_items'])} invalid file_ids")
    
    return report
