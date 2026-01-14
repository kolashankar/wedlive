"""
Cleanup Script: Remove Invalid File IDs
Removes media entries and layout_photos with invalid/placeholder file_ids
Run this to clean up broken photo references before testing new uploads
"""
import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "record_db")

async def cleanup_invalid_file_ids():
    """Clean up invalid file_id references from database"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    print("=" * 60)
    print("CLEANUP: Invalid File ID References")
    print("=" * 60)
    
    try:
        # 1. Clean up media collection
        print("\n[MEDIA COLLECTION]")
        print("Looking for invalid file_ids in media collection...")
        
        # Find media with invalid file_ids
        invalid_media_cursor = db.media.find({
            "$or": [
                {"file_id": {"$regex": "^file_[0-9]+"}},  # Matches file_XX format
                {"file_id": {"$exists": True, "$eq": ""}},  # Empty file_id
                {"file_id": {"$exists": True, "$regex": "^.{0,19}$"}}  # Too short (< 20 chars)
            ]
        })
        
        invalid_media = await invalid_media_cursor.to_list(length=None)
        
        if invalid_media:
            print(f"Found {len(invalid_media)} invalid media entries:")
            for media in invalid_media:
                print(f"  - ID: {media.get('id')}, file_id: {media.get('file_id')}, wedding: {media.get('wedding_id')}")
            
            # Delete invalid media
            result = await db.media.delete_many({
                "_id": {"$in": [media["_id"] for media in invalid_media]}
            })
            print(f"✓ Deleted {result.deleted_count} invalid media entries")
        else:
            print("✓ No invalid media entries found")
        
        # 2. Clean up layout_photos in weddings collection
        print("\n[WEDDING LAYOUT_PHOTOS]")
        print("Looking for invalid file_ids in wedding layout_photos...")
        
        # Get all weddings with layout_photos
        weddings_cursor = db.weddings.find({"layout_photos": {"$exists": True, "$ne": {}}})
        weddings = await weddings_cursor.to_list(length=None)
        
        cleaned_weddings = 0
        total_photos_cleaned = 0
        
        for wedding in weddings:
            wedding_id = wedding.get("id")
            layout_photos = wedding.get("layout_photos", {})
            cleaned_layout_photos = {}
            photos_removed = 0
            
            for placeholder, photos_data in layout_photos.items():
                # Handle array placeholders (like preciousMoments)
                if isinstance(photos_data, list):
                    valid_photos = []
                    for photo in photos_data:
                        if isinstance(photo, dict):
                            file_id = photo.get("file_id", "")
                            # Check if file_id is valid
                            if file_id and not (
                                file_id.startswith("file_") and 
                                file_id.replace("file_", "").replace(".jpg", "").replace(".png", "").isdigit()
                            ) and len(file_id) >= 20:
                                valid_photos.append(photo)
                            else:
                                photos_removed += 1
                                print(f"  - Removing invalid photo from {wedding_id}/{placeholder}: file_id={file_id}")
                        else:
                            valid_photos.append(photo)  # Keep non-dict entries
                    
                    if valid_photos:
                        cleaned_layout_photos[placeholder] = valid_photos
                
                # Handle single photo placeholders
                elif isinstance(photos_data, dict):
                    file_id = photos_data.get("file_id", "")
                    # Check if file_id is valid
                    if file_id and not (
                        file_id.startswith("file_") and 
                        file_id.replace("file_", "").replace(".jpg", "").replace(".png", "").isdigit()
                    ) and len(file_id) >= 20:
                        cleaned_layout_photos[placeholder] = photos_data
                    else:
                        photos_removed += 1
                        print(f"  - Removing invalid photo from {wedding_id}/{placeholder}: file_id={file_id}")
            
            # Update wedding if any photos were removed
            if photos_removed > 0:
                await db.weddings.update_one(
                    {"id": wedding_id},
                    {"$set": {
                        "layout_photos": cleaned_layout_photos,
                        "updated_at": datetime.utcnow()
                    }}
                )
                cleaned_weddings += 1
                total_photos_cleaned += photos_removed
                print(f"✓ Cleaned {photos_removed} photos from wedding {wedding_id}")
        
        if cleaned_weddings > 0:
            print(f"\n✓ Cleaned {total_photos_cleaned} invalid photos from {cleaned_weddings} weddings")
        else:
            print("✓ No invalid photos found in wedding layout_photos")
        
        # 3. Summary
        print("\n" + "=" * 60)
        print("CLEANUP COMPLETE")
        print("=" * 60)
        print(f"Media entries removed: {len(invalid_media) if invalid_media else 0}")
        print(f"Weddings cleaned: {cleaned_weddings}")
        print(f"Invalid photos removed: {total_photos_cleaned}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_invalid_file_ids())
