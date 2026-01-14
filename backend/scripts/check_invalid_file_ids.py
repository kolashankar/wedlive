"""
Check for invalid placeholder file_ids in the database
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.utils.file_id_validator import is_placeholder_file_id
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

async def check_invalid_file_ids():
    """Check for invalid file_ids in the database"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client.record_db
    
    print("🔍 Checking for invalid placeholder file_ids in database...\n")
    
    # Check weddings collection
    weddings = await db.weddings.find({}).to_list(length=None)
    print(f"📊 Found {len(weddings)} weddings in database\n")
    
    issues_found = []
    
    for wedding in weddings:
        wedding_id = wedding.get('id', 'unknown')
        wedding_title = wedding.get('title', 'Untitled')
        layout_photos = wedding.get('layout_photos', {})
        
        for placeholder, photo_data in layout_photos.items():
            if isinstance(photo_data, dict):
                file_id = photo_data.get('file_id', '')
                if file_id and is_placeholder_file_id(file_id):
                    issues_found.append({
                        'wedding_id': wedding_id,
                        'wedding_title': wedding_title,
                        'placeholder': placeholder,
                        'file_id': file_id,
                        'type': 'single',
                        'url': photo_data.get('url', '')
                    })
            elif isinstance(photo_data, list):
                for idx, photo in enumerate(photo_data):
                    if isinstance(photo, dict):
                        file_id = photo.get('file_id', '')
                        if file_id and is_placeholder_file_id(file_id):
                            issues_found.append({
                                'wedding_id': wedding_id,
                                'wedding_title': wedding_title,
                                'placeholder': placeholder,
                                'index': idx,
                                'file_id': file_id,
                                'type': 'array',
                                'url': photo.get('url', '')
                            })
    
    print(f"❌ Found {len(issues_found)} invalid placeholder file_ids:\n")
    
    for issue in issues_found:
        if issue['type'] == 'single':
            print(f"  Wedding: {issue['wedding_title']} ({issue['wedding_id']})")
            print(f"    Placeholder: {issue['placeholder']}")
            print(f"    Invalid file_id: {issue['file_id']}")
            print(f"    URL: {issue['url'][:80]}")
            print()
        else:
            print(f"  Wedding: {issue['wedding_title']} ({issue['wedding_id']})")
            print(f"    Placeholder: {issue['placeholder']}[{issue['index']}]")
            print(f"    Invalid file_id: {issue['file_id']}")
            print(f"    URL: {issue['url'][:80]}")
            print()
    
    client.close()
    return issues_found

if __name__ == "__main__":
    issues = asyncio.run(check_invalid_file_ids())
    print(f"\n📊 Total: {len(issues)} invalid file_ids found")
    
    if issues:
        print("\n⚠️  These need to be cleaned up. Users should re-upload these photos.")
