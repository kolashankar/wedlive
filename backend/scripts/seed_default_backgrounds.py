#!/usr/bin/env python3
"""
Seed Default Backgrounds Script
Creates sample background assets in the database with CDN URLs
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime
import uuid

# Load environment
ROOT_DIR = Path(__file__).parent.parent  # Go up to backend directory
load_dotenv(ROOT_DIR / '.env')

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'record_db')

# Sample background data
SAMPLE_BACKGROUNDS = [
    {
        "id": "9aaf862b-32a3-4558-aa82-1b91ff2eeb86",  # Match existing background_image_id
        "name": "Elegant Floral Background",
        "cdn_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80",
        "telegram_file_id": "sample_floral_bg",
        "category": "hero",
        "width": 1920,
        "height": 1080,
        "file_size": 250000,
        "tags": ["floral", "elegant", "wedding"],
        "created_at": datetime.utcnow(),
        "uploaded_by": "system"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Romantic Sunset Background",
        "cdn_url": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1920&q=80",
        "telegram_file_id": "sample_sunset_bg",
        "category": "hero",
        "width": 1920,
        "height": 1080,
        "file_size": 220000,
        "tags": ["sunset", "romantic", "outdoor"],
        "created_at": datetime.utcnow(),
        "uploaded_by": "system"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Classic White Marble",
        "cdn_url": "https://images.unsplash.com/photo-1615799998603-7c6270a45196?w=1920&q=80",
        "telegram_file_id": "sample_marble_bg",
        "category": "full-page",
        "width": 1920,
        "height": 1080,
        "file_size": 200000,
        "tags": ["marble", "classic", "elegant"],
        "created_at": datetime.utcnow(),
        "uploaded_by": "system"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Golden Hour Garden",
        "cdn_url": "https://images.unsplash.com/photo-1464047736614-af63643285bf?w=1920&q=80",
        "telegram_file_id": "sample_garden_bg",
        "category": "hero",
        "width": 1920,
        "height": 1080,
        "file_size": 280000,
        "tags": ["garden", "golden", "outdoor"],
        "created_at": datetime.utcnow(),
        "uploaded_by": "system"
    }
]

async def seed_backgrounds():
    """Seed default backgrounds into database"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    try:
        print("🌱 Seeding default backgrounds...")
        
        # Check if backgrounds already exist
        existing_count = await db.background_images.count_documents({})
        print(f"📊 Existing backgrounds: {existing_count}")
        
        if existing_count > 0:
            print("⚠️  Backgrounds already exist. Adding new backgrounds...")
        
        # Insert sample backgrounds
        inserted_count = 0
        for background in SAMPLE_BACKGROUNDS:
            # Check if this specific background already exists
            existing = await db.background_images.find_one({"id": background["id"]})
            if existing:
                print(f"⊙ Background already exists: {background['name']} ({background['id']})")
                continue
            
            await db.background_images.insert_one(background)
            print(f"✓ Added background: {background['name']} ({background['id']})")
            inserted_count += 1
        
        print(f"\n✅ Seeding complete! Added {inserted_count} backgrounds")
        
        # Verify
        total_count = await db.background_images.count_documents({})
        print(f"📊 Total backgrounds in database: {total_count}")
        
    except Exception as e:
        print(f"❌ Error seeding backgrounds: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_backgrounds())
