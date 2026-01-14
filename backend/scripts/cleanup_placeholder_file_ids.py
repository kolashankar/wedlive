"""
Cleanup script to remove invalid placeholder file_ids from all weddings
This script validates and cleans up file_ids in layout_photos
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.utils.file_id_validator import is_placeholder_file_id, is_valid_telegram_file_id
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

async def cleanup_invalid_file_ids():
    """Remove invalid file_ids from all weddings"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client.record_db
    
    print("🔍 Scanning for invalid file_ids in weddings...\n")
    
    weddings = await db.weddings.find({}).to_list(length=None)
    print(f"📊 Found {len(weddings)} weddings to check\n")
    
    updates_made = 0
    weddings_updated = []
    
    for wedding in weddings:
        wedding_id = wedding.get('id', 'unknown')
        wedding_title = wedding.get('title', 'Untitled')
        layout_photos = wedding.get('layout_photos', {})
        
        if not layout_photos:
            continue
        
        updated_layout_photos = {}
        wedding_had_issues = False
        
        for placeholder, photo_data in layout_photos.items():
            # Handle single photo placeholders (dict)
            if isinstance(photo_data, dict):
                file_id = photo_data.get('file_id', '')
                url = photo_data.get('url', '')
                
                # Check if file_id is invalid
                if file_id:
                    if is_placeholder_file_id(file_id):
                        print(f"  ❌ Found placeholder in {wedding_title}")
                        print(f"     Placeholder: {placeholder}")
                        print(f"     Invalid file_id: {file_id}")
                        print(f"     Removing this photo")
                        wedding_had_issues = True
                        # Skip this photo - don't add to updated_layout_photos
                        continue
                    elif not is_valid_telegram_file_id(file_id, strict=False):
                        print(f"  ⚠️  Found invalid file_id in {wedding_title}")
                        print(f"     Placeholder: {placeholder}")
                        print(f"     Invalid file_id: {file_id}")
                        print(f"     Removing this photo")
                        wedding_had_issues = True
                        continue
                
                # Valid photo - keep it
                updated_layout_photos[placeholder] = photo_data
            
            # Handle array photo placeholders (list)
            elif isinstance(photo_data, list):
                valid_photos = []
                
                for idx, photo in enumerate(photo_data):
                    if isinstance(photo, dict):
                        file_id = photo.get('file_id', '')
                        
                        if file_id:
                            if is_placeholder_file_id(file_id):
                                print(f"  ❌ Found placeholder in {wedding_title}")
                                print(f"     Placeholder: {placeholder}[{idx}]")
                                print(f"     Invalid file_id: {file_id}")
                                print(f"     Removing this photo")
                                wedding_had_issues = True
                                continue
                            elif not is_valid_telegram_file_id(file_id, strict=False):
                                print(f"  ⚠️  Found invalid file_id in {wedding_title}")
                                print(f"     Placeholder: {placeholder}[{idx}]")
                                print(f"     Invalid file_id: {file_id}")
                                print(f"     Removing this photo")
                                wedding_had_issues = True
                                continue
                        
                        # Valid photo - keep it
                        valid_photos.append(photo)
                
                # Only keep the placeholder if it has valid photos
                if valid_photos:
                    updated_layout_photos[placeholder] = valid_photos
        
        # Update the wedding if issues were found
        if wedding_had_issues:
            result = await db.weddings.update_one(
                {"id": wedding_id},
                {
                    "$set": {
                        "layout_photos": updated_layout_photos,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                updates_made += 1
                weddings_updated.append({
                    'id': wedding_id,
                    'title': wedding_title
                })
                print(f"  ✅ Updated wedding: {wedding_title}\n")
    
    client.close()
    
    print(f"\n{'='*60}")
    print(f"🎉 Cleanup Complete!")
    print(f"{'='*60}")
    print(f"📊 Weddings scanned: {len(weddings)}")
    print(f"✅ Weddings updated: {updates_made}")
    
    if weddings_updated:
        print(f"\n📋 Updated weddings:")
        for w in weddings_updated:
            print(f"  - {w['title']} ({w['id']})")
    
    print(f"\n💡 Next steps:")
    print(f"  1. Users should re-upload photos for these weddings")
    print(f"  2. Future uploads will be validated to prevent this")
    
    return updates_made

if __name__ == "__main__":
    print("="*60)
    print("🧹 Invalid File ID Cleanup Script")
    print("="*60)
    print("This script will:")
    print("  1. Scan all weddings for invalid/placeholder file_ids")
    print("  2. Remove photos with invalid file_ids")
    print("  3. Keep only photos with valid Telegram file_ids")
    print("="*60)
    
    response = input("\nProceed with cleanup? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Cleanup cancelled")
        sys.exit(0)
    
    print()
    updates = asyncio.run(cleanup_invalid_file_ids())
    
    if updates > 0:
        print(f"\n✅ Cleanup successful! {updates} wedding(s) were cleaned.")
    else:
        print(f"\n✨ No invalid file_ids found. Database is clean!")
