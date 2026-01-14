#!/usr/bin/env python3
"""
Fix Photo Categories Script
Updates photos in wedding f163dcc6-0751-4c84-9b7b-f06be3d1e761 to have correct categories
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DB_NAME = 'wedlive'
WEDDING_ID = 'f163dcc6-0751-4c84-9b7b-f06be3d1e761'

async def fix_photo_categories():
    """Fix photo categories for the test wedding"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    try:
        print(f"🔧 Fixing photo categories for wedding: {WEDDING_ID}")
        
        # Get wedding
        wedding = await db.weddings.find_one({"id": WEDDING_ID})
        if not wedding:
            print(f"❌ Wedding not found: {WEDDING_ID}")
            return
        
        theme_settings = wedding.get("theme_settings", {})
        cover_photos = theme_settings.get("cover_photos", [])
        
        print(f"📸 Found {len(cover_photos)} cover photos")
        
        # Count existing categories
        category_counts = {}
        for photo in cover_photos:
            if isinstance(photo, dict):
                cat = photo.get("category", "unknown")
                category_counts[cat] = category_counts.get(cat, 0) + 1
        
        print(f"📊 Current categories: {category_counts}")
        
        # Find photos with "general" category and update them
        general_photos = [p for p in cover_photos if isinstance(p, dict) and p.get("category") == "general"]
        
        if len(general_photos) == 0:
            print("✅ No 'general' category photos found - nothing to fix!")
            return
        
        print(f"🔄 Found {len(general_photos)} photos with 'general' category")
        
        # Update categories strategically:
        # - 1 photo to "couple"
        # - 1 photo to "bride" 
        # - 1 photo to "groom"
        # - 5 photos to "moment"
        # - Rest stay as "general"
        
        updated_count = 0
        new_categories = []
        
        # Check what's already assigned
        has_couple = any(p.get("category") == "couple" for p in cover_photos if isinstance(p, dict))
        has_bride = any(p.get("category") == "bride" for p in cover_photos if isinstance(p, dict))
        has_groom = any(p.get("category") == "groom" for p in cover_photos if isinstance(p, dict))
        moment_count = sum(1 for p in cover_photos if isinstance(p, dict) and p.get("category") == "moment")
        
        print(f"📋 Current status - Couple: {has_couple}, Bride: {has_bride}, Groom: {has_groom}, Moments: {moment_count}")
        
        # Assign categories to general photos
        for i, photo in enumerate(general_photos):
            if not has_couple:
                photo["category"] = "couple"
                has_couple = True
                updated_count += 1
                new_categories.append("couple")
            elif not has_bride:
                photo["category"] = "bride"
                has_bride = True
                updated_count += 1
                new_categories.append("bride")
            elif not has_groom:
                photo["category"] = "groom"
                has_groom = True
                updated_count += 1
                new_categories.append("groom")
            elif moment_count < 5:
                photo["category"] = "moment"
                moment_count += 1
                updated_count += 1
                new_categories.append("moment")
            else:
                # Keep as general
                break
        
        if updated_count == 0:
            print("✅ All required categories already assigned!")
            return
        
        # Update the wedding document
        result = await db.weddings.update_one(
            {"id": WEDDING_ID},
            {"$set": {"theme_settings.cover_photos": cover_photos}}
        )
        
        print(f"✅ Updated {updated_count} photos")
        print(f"📝 New categories assigned: {new_categories}")
        
        # Verify the update
        updated_wedding = await db.weddings.find_one({"id": WEDDING_ID})
        updated_cover_photos = updated_wedding.get("theme_settings", {}).get("cover_photos", [])
        
        # Count new categories
        new_category_counts = {}
        for photo in updated_cover_photos:
            if isinstance(photo, dict):
                cat = photo.get("category", "unknown")
                new_category_counts[cat] = new_category_counts.get(cat, 0) + 1
        
        print(f"📊 Updated categories: {new_category_counts}")
        print("✅ Photo categories fixed successfully!")
        
    except Exception as e:
        print(f"❌ Error fixing photo categories: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_photo_categories())
