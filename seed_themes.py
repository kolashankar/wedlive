#!/usr/bin/env python3
"""
Seed default wedding themes into MongoDB
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os

# MongoDB connection
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017')
DATABASE_NAME = 'wedlive'

async def seed_themes():
    """Seed default themes into database"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    
    # Check if themes already exist
    existing_count = await db.themes.count_documents({})
    print(f"Existing themes count: {existing_count}")
    
    default_themes = [
        {
            "id": "floral_garden",
            "name": "Floral Garden",
            "description": "Elegant floral theme with romantic garden vibes. Soft & Romantic style with beautiful floral decorations.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": True,
                "groom_photo": True,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 3,
                    "max_photos": 6
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["default", "split"],
            "supported_animations": ["fade", "floral_float"],
            "is_premium": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "royal_palace",
            "name": "Royal Palace",
            "description": "Luxurious palace-inspired theme with golden accents. Traditional Luxury with regal elegance.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": True,
                "groom_photo": True,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 4,
                    "max_photos": 8
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["default", "overlay"],
            "supported_animations": ["zoom", "light_shimmer"],
            "is_premium": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "modern_minimalist",
            "name": "Modern Minimalist",
            "description": "Clean and contemporary design. Clean & Simple style for modern couples.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": False,
                "groom_photo": False,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 2,
                    "max_photos": 4
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["default"],
            "supported_animations": ["fade", "slow_pan"],
            "is_premium": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "cinema_scope",
            "name": "Cinema Scope",
            "description": "Cinematic widescreen theme for modern weddings. Video First experience with film-inspired visuals.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": True,
                "groom_photo": True,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 3,
                    "max_photos": 5
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["default", "widescreen"],
            "supported_animations": ["zoom", "parallax"],
            "is_premium": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "romantic_pastel",
            "name": "Romantic Pastel",
            "description": "Soft pastel colors with dreamy romantic feel. Sweet & Lovely aesthetic with gentle tones.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": True,
                "groom_photo": True,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 4,
                    "max_photos": 6
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["default"],
            "supported_animations": ["fade", "floral_float"],
            "is_premium": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "premium_wedding_card",
            "name": "Premium Wedding Card",
            "description": "Traditional wedding card design. Elegant Invitation style with classic sophistication.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": True,
                "groom_photo": True,
                "couple_photo": False,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 2,
                    "max_photos": 4
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["default", "card"],
            "supported_animations": ["fade", "light_shimmer"],
            "is_premium": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "traditional_south_indian",
            "name": "Traditional South Indian",
            "description": "Classic South Indian wedding theme. Cultural Heritage celebration with traditional elements.",
            "preview_image": "",
            "required_sections": {
                "bride_photo": True,
                "groom_photo": True,
                "couple_photo": True,
                "precious_moments": {
                    "enabled": True,
                    "min_photos": 5,
                    "max_photos": 8
                }
            },
            "default_borders": {
                "cover": None,
                "precious_moments": None
            },
            "supported_layouts": ["default", "traditional"],
            "supported_animations": ["fade", "light_shimmer"],
            "is_premium": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    if existing_count == 0:
        # Insert all themes
        await db.themes.insert_many(default_themes)
        print(f"✅ Successfully seeded {len(default_themes)} themes")
        for theme in default_themes:
            print(f"   - {theme['name']} ({theme['id']})")
    else:
        # Update existing themes
        for theme in default_themes:
            await db.themes.update_one(
                {"id": theme["id"]},
                {"$set": theme},
                upsert=True
            )
        print(f"✅ Successfully updated/inserted {len(default_themes)} themes")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_themes())
