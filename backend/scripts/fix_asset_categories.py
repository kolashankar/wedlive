"""
Script to fix miscategorized assets in database
Ensures borders are ONLY in photo_borders collection
Ensures backgrounds are ONLY in background_images collection
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

async def fix_asset_categories():
    """Fix miscategorized assets"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client.wedlive
    
    print("=" * 60)
    print("ASSET CATEGORY FIX SCRIPT")
    print("=" * 60)
    
    # Check photo_borders collection
    print("\n[1] Checking photo_borders collection...")
    borders = await db.photo_borders.find({}).to_list(length=1000)
    print(f"Found {len(borders)} borders")
    
    # Check for any borders that might actually be backgrounds
    suspicious_borders = []
    for border in borders:
        name = border.get("name", "").lower()
        if "background" in name and "border" not in name:
            suspicious_borders.append(border)
            print(f"  ⚠️  Suspicious border: {border['name']} (ID: {border['id']})")
    
    if suspicious_borders:
        print(f"\n  Found {len(suspicious_borders)} suspicious items in borders collection")
        response = input("  Move these to background_images collection? (yes/no): ")
        if response.lower() == "yes":
            for item in suspicious_borders:
                # Add to background_images
                bg_doc = {
                    "id": item["id"],
                    "name": item["name"],
                    "cdn_url": item["cdn_url"],
                    "telegram_file_id": item.get("telegram_file_id", ""),
                    "category": "general",
                    "width": item.get("width", 0),
                    "height": item.get("height", 0),
                    "file_size": item.get("file_size", 0),
                    "tags": item.get("tags", []),
                    "created_at": item.get("created_at"),
                    "uploaded_by": item.get("uploaded_by", "")
                }
                await db.background_images.insert_one(bg_doc)
                # Remove from borders
                await db.photo_borders.delete_one({"id": item["id"]})
                print(f"  ✅ Moved '{item['name']}' to background_images")
    else:
        print("  ✅ No suspicious items found in borders")
    
    # Check background_images collection
    print("\n[2] Checking background_images collection...")
    backgrounds = await db.background_images.find({}).to_list(length=1000)
    print(f"Found {len(backgrounds)} backgrounds")
    
    # Check for any backgrounds that might actually be borders
    suspicious_backgrounds = []
    for bg in backgrounds:
        name = bg.get("name", "").lower()
        if "border" in name and "background" not in name:
            suspicious_backgrounds.append(bg)
            print(f"  ⚠️  Suspicious background: {bg['name']} (ID: {bg['id']})")
    
    if suspicious_backgrounds:
        print(f"\n  Found {len(suspicious_backgrounds)} suspicious items in backgrounds collection")
        response = input("  Move these to photo_borders collection? (yes/no): ")
        if response.lower() == "yes":
            for item in suspicious_backgrounds:
                # Add to photo_borders
                border_doc = {
                    "id": item["id"],
                    "name": item["name"],
                    "cdn_url": item["cdn_url"],
                    "telegram_file_id": item.get("telegram_file_id", ""),
                    "orientation": "landscape",  # Default
                    "width": item.get("width", 0),
                    "height": item.get("height", 0),
                    "file_size": item.get("file_size", 0),
                    "tags": item.get("tags", []),
                    "created_at": item.get("created_at"),
                    "uploaded_by": item.get("uploaded_by", ""),
                    "mask_data": None
                }
                await db.photo_borders.insert_one(border_doc)
                # Remove from backgrounds
                await db.background_images.delete_one({"id": item["id"]})
                print(f"  ✅ Moved '{item['name']}' to photo_borders")
    else:
        print("  ✅ No suspicious items found in backgrounds")
    
    print("\n" + "=" * 60)
    print("ASSET CATEGORY FIX COMPLETE")
    print("=" * 60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_asset_categories())
