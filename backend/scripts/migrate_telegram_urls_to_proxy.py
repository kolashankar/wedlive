"""
Migration script to convert direct Telegram API URLs to proxy URLs in the database.

This fixes CORS errors by replacing direct Telegram URLs with our backend proxy URLs.

Example:
  OLD: https://api.telegram.org/file/bot8534420328:AAEB.../documents/file_102.png
  NEW: /api/media/telegram-proxy/documents/BQACAgUAAyEGAATO7nwaAAOQaU...
"""

import asyncio
import os
import sys
import re
from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import quote

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_backend_url() -> str:
    """Get the backend URL from environment"""
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8001")
    return backend_url.rstrip("/")

def telegram_file_id_to_proxy_url(telegram_file_id: str, media_type: str = "photos") -> str:
    """
    Convert a Telegram file_id to a proxied URL through our backend.
    
    Args:
        telegram_file_id: The Telegram file_id (e.g., "BQACAgUAAyEGAATO...")
        media_type: Type of media - "photos", "videos", or "documents" (default: "photos")
    
    Returns:
        Proxied URL like "/api/media/telegram-proxy/{media_type}/{file_id}" or absolute URL
    """
    if not telegram_file_id:
        return None
    
    # Build the proxy path
    proxy_path = f"/api/media/telegram-proxy/{media_type}/{telegram_file_id}"
    
    # Get backend URL from environment
    backend_url = get_backend_url()
    
    # If BACKEND_URL is set and not localhost, use absolute URL for cross-origin scenarios
    if backend_url and "localhost" not in backend_url and "127.0.0.1" not in backend_url:
        return f"{backend_url}{proxy_path}"
    
    # For local development, use relative URL
    return proxy_path

def extract_telegram_file_id_from_url(telegram_url: str) -> str:
    """
    Extract Telegram file_id from a direct Telegram API URL.
    
    Example:
        Input:  https://api.telegram.org/file/bot8534420328:AAEB.../documents/file_102.png
        Output: BQACAgUAAyEGAATO7nwaAAOQaU... (from database telegram_file_id field)
    
    Note: This function doesn't extract from URL, it's used to identify if conversion is needed
    """
    # Check if it's a direct Telegram URL
    if telegram_url and telegram_url.startswith("https://api.telegram.org/file/bot"):
        return "NEEDS_CONVERSION"  # Signal that we need to use telegram_file_id from DB
    return None

async def migrate_photo_borders():
    """Migrate all photo_borders documents to use proxy URLs"""
    
    # Get MongoDB connection string
    mongodb_uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("DB_NAME", "record_db")
    
    if not mongodb_uri:
        print("❌ ERROR: MONGODB_URI environment variable not set")
        return
    
    print(f"🔌 Connecting to MongoDB: {db_name}")
    client = AsyncIOMotorClient(mongodb_uri)
    db = client[db_name]
    
    try:
        # Get all photo_borders
        collection = db.photo_borders
        total_docs = await collection.count_documents({})
        print(f"📊 Found {total_docs} documents in photo_borders collection")
        
        if total_docs == 0:
            print("✅ No documents to migrate")
            return
        
        # Find documents with direct Telegram URLs
        cursor = collection.find({
            "cdn_url": {"$regex": "^https://api.telegram.org/file/bot"}
        })
        
        docs_to_migrate = await cursor.to_list(length=None)
        print(f"🔄 Found {len(docs_to_migrate)} documents with direct Telegram URLs")
        
        if len(docs_to_migrate) == 0:
            print("✅ All documents already use proxy URLs")
            return
        
        # Migrate each document
        migrated_count = 0
        error_count = 0
        
        for doc in docs_to_migrate:
            try:
                doc_id = doc.get("id")
                doc_name = doc.get("name", "Unknown")
                old_cdn_url = doc.get("cdn_url")
                telegram_file_id = doc.get("telegram_file_id")
                
                if not telegram_file_id:
                    print(f"  ⚠️  Skipping '{doc_name}' - no telegram_file_id found")
                    error_count += 1
                    continue
                
                # Determine media type based on URL path or default to documents
                media_type = "documents"  # Most borders/backgrounds are documents
                if "photos/" in old_cdn_url:
                    media_type = "photos"
                elif "videos/" in old_cdn_url:
                    media_type = "videos"
                
                # Generate new proxy URL
                new_cdn_url = telegram_file_id_to_proxy_url(telegram_file_id, media_type)
                
                # Update the document
                result = await collection.update_one(
                    {"id": doc_id},
                    {"$set": {"cdn_url": new_cdn_url}}
                )
                
                if result.modified_count > 0:
                    print(f"  ✅ Migrated '{doc_name}'")
                    print(f"      OLD: {old_cdn_url[:80]}...")
                    print(f"      NEW: {new_cdn_url}")
                    migrated_count += 1
                else:
                    print(f"  ⚠️  No changes for '{doc_name}' (already up-to-date?)")
                
            except Exception as e:
                print(f"  ❌ Error migrating '{doc.get('name', 'Unknown')}': {str(e)}")
                error_count += 1
        
        print("\n" + "="*80)
        print(f"📊 Migration Summary:")
        print(f"   Total documents: {total_docs}")
        print(f"   Documents needing migration: {len(docs_to_migrate)}")
        print(f"   Successfully migrated: {migrated_count}")
        print(f"   Errors: {error_count}")
        print("="*80)
        
        # Verify the migration
        remaining_direct_urls = await collection.count_documents({
            "cdn_url": {"$regex": "^https://api.telegram.org/file/bot"}
        })
        
        if remaining_direct_urls == 0:
            print("\n✅ SUCCESS: All photo_borders now use proxy URLs!")
        else:
            print(f"\n⚠️  WARNING: {remaining_direct_urls} documents still have direct Telegram URLs")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()
        print("\n🔌 Disconnected from MongoDB")

async def main():
    """Main entry point"""
    print("="*80)
    print("🚀 Starting Telegram URL to Proxy URL Migration")
    print("="*80)
    print()
    
    await migrate_photo_borders()
    
    print()
    print("✅ Migration complete!")
    print()
    print("Next steps:")
    print("1. Restart the backend: sudo supervisorctl restart backend")
    print("2. Clear frontend cache and reload the page")
    print()

if __name__ == "__main__":
    asyncio.run(main())
