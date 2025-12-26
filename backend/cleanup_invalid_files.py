#!/usr/bin/env python3
"""
Database cleanup script to remove invalid file_XX references
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))

from app.database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def cleanup_invalid_file_references():
    """Remove invalid file_XX references from layout_photos"""
    db = get_db()
    if not db:
        logger.error("Failed to connect to database")
        return 0
    
    # Find all weddings with layout_photos containing invalid file references
    weddings = await db.weddings.find({"layout_photos": {"$exists": True}}).to_list(length=None)
    
    cleaned_count = 0
    invalid_files_found = []
    
    for wedding in weddings:
        wedding_id = wedding.get("id")
        layout_photos = wedding.get("layout_photos", {})
        modified = False
        
        logger.info(f"Processing wedding: {wedding_id}")
        
        for slot_name, slot_data in layout_photos.items():
            if isinstance(slot_data, list):
                # Handle array slots like preciousMoments
                valid_photos = []
                for i, photo in enumerate(slot_data):
                    if isinstance(photo, dict) and "file_id" in photo:
                        file_id = photo["file_id"]
                        if file_id.startswith("file_"):
                            # Check if this file_id exists in media collection
                            media_record = await db.media.find_one({"file_id": file_id})
                            if not media_record:
                                logger.warning(f"Removing invalid file reference {file_id} from {slot_name}[{i}]")
                                invalid_files_found.append(file_id)
                                continue  # Skip this photo
                        valid_photos.append(photo)
                if len(valid_photos) != len(slot_data):
                    layout_photos[slot_name] = valid_photos
                    modified = True
                    
            elif isinstance(slot_data, dict) and "file_id" in slot_data:
                # Handle single photo slots
                file_id = slot_data["file_id"]
                if file_id.startswith("file_"):
                    # Check if this file_id exists in media collection
                    media_record = await db.media.find_one({"file_id": file_id})
                    if not media_record:
                        logger.warning(f"Removing invalid file reference {file_id} from {slot_name}")
                        invalid_files_found.append(file_id)
                        layout_photos[slot_name] = {
                            "url": "",
                            "photo_id": slot_data.get("photo_id", ""),
                            "file_id": ""
                        }
                        modified = True
        
        if modified:
            await db.weddings.update_one(
                {"id": wedding_id},
                {"$set": {"layout_photos": layout_photos}}
            )
            cleaned_count += 1
            logger.info(f"Cleaned up wedding {wedding_id}")
    
    logger.info(f"Cleanup complete. Processed {cleaned_count} weddings")
    logger.info(f"Invalid files found: {set(invalid_files_found)}")
    return cleaned_count

async def main():
    """Main cleanup function"""
    try:
        cleaned = await cleanup_invalid_file_references()
        print(f"✅ Successfully cleaned up {cleaned} weddings")
    except Exception as e:
        logger.error(f"Cleanup failed: {str(e)}")
        print(f"❌ Cleanup failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
