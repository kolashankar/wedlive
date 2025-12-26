#!/usr/bin/env python3
"""
Debug script to check photo and border display issues
"""
import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.database import get_db
from app.routes.weddings import resolve_theme_asset_urls

async def debug_photo_border_issue():
    """Debug the photo and border display issue"""
    print("=== DEBUGGING PHOTO & BORDER DISPLAY ISSUE ===\n")
    
    db = get_db()
    
    # 1. Check if collections have data
    print("1. Checking database collections...")
    
    try:
        # Check photo_borders collection
        border_count = await db.photo_borders.count_documents({})
        print(f"   photo_borders collection: {border_count} documents")
        
        if border_count > 0:
            sample_border = await db.photo_borders.find_one({})
            print(f"   Sample border ID: {sample_border.get('id')}")
            print(f"   Sample border URL: {sample_border.get('cdn_url')}")
        
        # Check background_images collection
        bg_count = await db.background_images.count_documents({})
        print(f"   background_images collection: {bg_count} documents")
        
        if bg_count > 0:
            sample_bg = await db.background_images.find_one({})
            print(f"   Sample background ID: {sample_bg.get('id')}")
            print(f"   Sample background URL: {sample_bg.get('cdn_url')}")
            
    except Exception as e:
        print(f"   Error checking collections: {e}")
    
    # 2. Test border resolution function
    print("\n2. Testing border resolution...")
    
    test_assets = {
        'borders': {
            'bride_groom_border_id': 'test-border-id-123',
            'couple_border_id': 'test-border-id-456'
        },
        'background_image_id': 'test-bg-id-789'
    }
    
    try:
        resolved = await resolve_theme_asset_urls(db, test_assets)
        print(f"   Input assets: {test_assets}")
        print(f"   Resolved assets: {resolved}")
    except Exception as e:
        print(f"   Error in border resolution: {e}")
    
    # 3. Check a sample wedding
    print("\n3. Checking sample wedding data...")
    
    try:
        wedding = await db.weddings.find_one({})
        if wedding:
            print(f"   Found wedding: {wedding.get('id')}")
            theme_settings = wedding.get('theme_settings', {})
            print(f"   Layout ID: {theme_settings.get('layout_id')}")
            print(f"   Cover photos: {len(theme_settings.get('cover_photos', []))}")
            print(f"   Theme assets: {theme_settings.get('theme_assets', {})}")
        else:
            print("   No weddings found in database")
    except Exception as e:
        print(f"   Error checking wedding: {e}")

if __name__ == "__main__":
    asyncio.run(debug_photo_border_issue())
