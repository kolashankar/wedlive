#!/usr/bin/env python3
"""
Script to fix studio logo URLs that are Google redirect URLs instead of direct image URLs
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from motor.motor_asyncio import AsyncIOMotorClient
from app.database import get_db
from app.services.telegram_service import TelegramCDNService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fix_studio_logos():
    """Fix studio logos that have Google redirect URLs"""
    try:
        # Initialize database connection
        db = get_db()
        telegram_service = TelegramCDNService()
        
        # Find all studios with Google redirect URLs
        studios_with_bad_urls = []
        cursor = db.studios.find({
            "$or": [
                {"logo_url": {"$regex": "google\\.com/url"}},
                {"default_image_url": {"$regex": "google\\.com/url"}}
            ]
        })
        
        async for studio in cursor:
            studios_with_bad_urls.append(studio)
        
        logger.info(f"Found {len(studios_with_bad_urls)} studios with invalid logo URLs")
        
        for studio in studios_with_bad_urls:
            logger.info(f"Processing studio: {studio['name']} ({studio['id']})")
            
            # Clear invalid logo URL
            if "logo_url" in studio and "google.com/url" in studio.get("logo_url", ""):
                logger.info(f"Clearing invalid logo_url for studio {studio['id']}")
                await db.studios.update_one(
                    {"id": studio["id"]},
                    {"$set": {"logo_url": "", "updated_at": datetime.utcnow()}}
                )
            
            # Clear invalid default image URL
            if "default_image_url" in studio and "google.com/url" in studio.get("default_image_url", ""):
                logger.info(f"Clearing invalid default_image_url for studio {studio['id']}")
                await db.studios.update_one(
                    {"id": studio["id"]},
                    {"$set": {"default_image_url": "", "default_image_file_id": "", "updated_at": datetime.utcnow()}}
                )
        
        logger.info("Studio logo cleanup completed")
        
    except Exception as e:
        logger.error(f"Error fixing studio logos: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(fix_studio_logos())
