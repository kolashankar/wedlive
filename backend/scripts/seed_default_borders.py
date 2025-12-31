#!/usr/bin/env python3
"""
Seed Default Borders Script
Creates sample border assets in the database with CDN URLs
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime
import uuid

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DB_NAME = 'wedlive'

# Sample border data (using placeholder URLs - in production these would be from Telegram CDN)
SAMPLE_BORDERS = [
    {
        "id": "f629f33a-ad1b-46a1-bf6f-dd8b2d98da71",  # Match existing couple_border_id
        "name": "Classic Gold Border - Couple",
        "cdn_url": "https://via.placeholder.com/800x600/FFD700/000000?text=Gold+Border",
        "telegram_file_id": "sample_couple_border",
        "mask": {
            "svg_path": "",
            "polygon_points": [],
            "feather_radius": 8,
            "x": 50,
            "y": 50,
            "width": 700,
            "height": 500,
            "suggested_aspect_ratio": "16:9"
        },
        "mask_slots": [],
        "width": 800,
        "height": 600,
        "file_size": 150000,
        "orientation": "landscape",
        "tags": ["couple", "gold", "classic"],
        "supports_mirror": True,
        "category": "border",
        "created_at": datetime.utcnow(),
        "uploaded_by": "system"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Elegant Rose Border - Bride",
        "cdn_url": "https://via.placeholder.com/600x800/FFB6C1/000000?text=Rose+Border",
        "telegram_file_id": "sample_bride_border",
        "mask": {
            "svg_path": "",
            "polygon_points": [],
            "feather_radius": 8,
            "x": 50,
            "y": 50,
            "width": 500,
            "height": 700,
            "suggested_aspect_ratio": "3:4"
        },
        "mask_slots": [],
        "width": 600,
        "height": 800,
        "file_size": 180000,
        "orientation": "portrait",
        "tags": ["bride", "rose", "elegant"],
        "supports_mirror": True,
        "category": "border",
        "created_at": datetime.utcnow(),
        "uploaded_by": "system"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Sharp Suit Border - Groom",
        "cdn_url": "https://via.placeholder.com/600x800/4169E1/000000?text=Suit+Border",
        "telegram_file_id": "sample_groom_border",
        "mask": {
            "svg_path": "",
            "polygon_points": [],
            "feather_radius": 8,
            "x": 50,
            "y": 50,
            "width": 500,
            "height": 700,
            "suggested_aspect_ratio": "3:4"
        },
        "mask_slots": [],
        "width": 600,
        "height": 800,
        "file_size": 180000,
        "orientation": "portrait",
        "tags": ["groom", "suit", "sharp"],
        "supports_mirror": True,
        "category": "border",
        "created_at": datetime.utcnow(),
        "uploaded_by": "system"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Heart Frame - Precious Moments",
        "cdn_url": "https://via.placeholder.com/500x500/FF69B4/000000?text=Heart+Frame",
        "telegram_file_id": "sample_moment_border",
        "mask": {
            "svg_path": "",
            "polygon_points": [],
            "feather_radius": 8,
            "x": 50,
            "y": 50,
            "width": 400,
            "height": 400,
            "suggested_aspect_ratio": "1:1"
        },
        "mask_slots": [],
        "width": 500,
        "height": 500,
        "file_size": 120000,
        "orientation": "square",
        "tags": ["moment", "heart", "romantic"],
        "supports_mirror": False,
        "category": "border",
        "created_at": datetime.utcnow(),
        "uploaded_by": "system"
    }
]

async def seed_borders():
    """Seed default borders into database"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    try:
        print("🌱 Seeding default borders...")
        
        # Check if borders already exist
        existing_count = await db.photo_borders.count_documents({})
        print(f"📊 Existing borders: {existing_count}")
        
        if existing_count > 0:
            print("⚠️  Borders already exist. Adding new borders...")
        
        # Insert sample borders
        inserted_count = 0
        for border in SAMPLE_BORDERS:
            # Check if this specific border already exists
            existing = await db.photo_borders.find_one({"id": border["id"]})
            if existing:
                print(f"⊙ Border already exists: {border['name']} ({border['id']})")
                continue
            
            await db.photo_borders.insert_one(border)
            print(f"✓ Added border: {border['name']} ({border['id']})")
            inserted_count += 1
        
        print(f"\n✅ Seeding complete! Added {inserted_count} borders")
        
        # Verify
        total_count = await db.photo_borders.count_documents({})
        print(f"📊 Total borders in database: {total_count}")
        
    except Exception as e:
        print(f"❌ Error seeding borders: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_borders())
