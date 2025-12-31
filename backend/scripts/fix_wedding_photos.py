"""
Fix photo categories for wedding f163dcc6-0751-4c84-9b7b-f06be3d1e761
Convert "general" category photos to proper categories
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

async def fix_wedding_photos():
    client = AsyncIOMotorClient(os.getenv('MONGODB_URI'))
    db = client[os.getenv('DB_NAME', 'record_db')]
    
    wedding_id = 'f163dcc6-0751-4c84-9b7b-f06be3d1e761'
    
    wedding = await db.weddings.find_one({'id': wedding_id})
    if not wedding:
        print(f"❌ Wedding {wedding_id} not found")
        return
    
    theme_settings = wedding.get('theme_settings', {})
    cover_photos = theme_settings.get('cover_photos', [])
    
    print(f"📸 Found {len(cover_photos)} cover photos")
    print(f"Current categories: ", end="")
    categories = {}
    for photo in cover_photos:
        if isinstance(photo, dict):
            cat = photo.get('category', 'unknown')
            categories[cat] = categories.get(cat, 0) + 1
    print(categories)
    
    # Strategy: Keep existing categorized photos, convert "general" ones
    # Assign: 1 bride, 1 groom (replace existing if general), 1 couple (keep existing), rest as moments
    
    bride_photos = [p for p in cover_photos if isinstance(p, dict) and p.get('category') == 'bride']
    groom_photos = [p for p in cover_photos if isinstance(p, dict) and p.get('category') == 'groom']
    couple_photos = [p for p in cover_photos if isinstance(p, dict) and p.get('category') == 'couple']
    moment_photos = [p for p in cover_photos if isinstance(p, dict) and p.get('category') == 'moment']
    general_photos = [p for p in cover_photos if isinstance(p, dict) and p.get('category') == 'general']
    
    print(f"\n📊 Current distribution:")
    print(f"  Bride: {len(bride_photos)}")
    print(f"  Groom: {len(groom_photos)}")
    print(f"  Couple: {len(couple_photos)}")
    print(f"  Moment: {len(moment_photos)}")
    print(f"  General: {len(general_photos)}")
    
    # Build new cover_photos array
    new_cover_photos = []
    
    # Keep existing bride photo or assign first general as bride
    if bride_photos:
        new_cover_photos.append(bride_photos[0])
        print(f"✅ Kept existing bride photo")
    elif general_photos:
        photo = general_photos.pop(0)
        photo['category'] = 'bride'
        new_cover_photos.append(photo)
        print(f"✅ Assigned general photo as bride")
    
    # Keep existing groom photo or assign second general as groom
    if groom_photos:
        new_cover_photos.append(groom_photos[0])
        print(f"✅ Kept existing groom photo")
    elif general_photos:
        photo = general_photos.pop(0)
        photo['category'] = 'groom'
        new_cover_photos.append(photo)
        print(f"✅ Assigned general photo as groom")
    
    # Keep existing couple photo or assign third general as couple
    if couple_photos:
        new_cover_photos.append(couple_photos[0])
        print(f"✅ Kept existing couple photo")
    elif general_photos:
        photo = general_photos.pop(0)
        photo['category'] = 'couple'
        new_cover_photos.append(photo)
        print(f"✅ Assigned general photo as couple")
    
    # Add existing moment photos
    new_cover_photos.extend(moment_photos)
    print(f"✅ Added {len(moment_photos)} existing moment photos")
    
    # Convert remaining general photos to moments (limit to 10 total moments)
    max_moments = 10
    remaining_general = general_photos[:(max_moments - len(moment_photos))]
    for photo in remaining_general:
        photo['category'] = 'moment'
        new_cover_photos.append(photo)
    print(f"✅ Converted {len(remaining_general)} general photos to moments")
    
    # Update wedding
    theme_settings['cover_photos'] = new_cover_photos
    
    await db.weddings.update_one(
        {'id': wedding_id},
        {
            '$set': {
                'theme_settings': theme_settings,
                'updated_at': datetime.utcnow()
            }
        }
    )
    
    print(f"\n✅ Updated wedding with {len(new_cover_photos)} photos")
    print(f"Final distribution:")
    final_categories = {}
    for photo in new_cover_photos:
        cat = photo.get('category', 'unknown')
        final_categories[cat] = final_categories.get(cat, 0) + 1
    print(f"  {final_categories}")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(fix_wedding_photos())
