import sys
sys.path.insert(0, '/app/backend')
from app.database import get_db
import asyncio

async def test():
    db = get_db()
    album = await db.albums.find_one({'id': '758cce8e-8ac2-442e-9a92-d634a6fa8c1c'})
    print('Album found:', album is not None)
    if album:
        print('Album title:', album.get('title'))
        print('Slides count:', len(album.get('slides', [])))
        print('Album keys:', list(album.keys()))
        
        # Check if there are slides with media_ids
        if album.get('slides'):
            media_ids = [s.get('media_id') for s in album['slides'] if s.get('media_id')]
            print(f'Media IDs count: {len(media_ids)}')
            
            if media_ids:
                media_list = await db.media.find({"id": {"$in": media_ids}}).to_list(length=len(media_ids))
                print(f'Media found: {len(media_list)}')
                for m in media_list[:3]:  # Print first 3
                    print(f"  Media {m.get('id')}: has file_id = {m.get('file_id') is not None}")

asyncio.run(test())
