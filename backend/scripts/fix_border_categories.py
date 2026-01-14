"""
Fix Border Categories Script
Ensures all borders in the database have the correct category field set.
Run this to migrate existing borders that might be missing the category field.
"""
import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def fix_border_categories():
    """Fix border categories in MongoDB"""
    
    # Get MongoDB connection string from environment
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    
    try:
        # Connect to MongoDB
        print(f"[FIX_CATEGORIES] Connecting to MongoDB...")
        client = AsyncIOMotorClient(mongodb_uri)
        db = client.get_database()
        
        # Check connection
        await client.admin.command('ping')
        print(f"[FIX_CATEGORIES] Connected successfully!")
        
        # Get all borders without category field or with null category
        borders_collection = db.photo_borders
        
        # Count total borders
        total_borders = await borders_collection.count_documents({})
        print(f"[FIX_CATEGORIES] Total borders in database: {total_borders}")
        
        # Find borders missing category field
        missing_category = await borders_collection.count_documents({
            "$or": [
                {"category": {"$exists": False}},
                {"category": None},
                {"category": ""}
            ]
        })
        print(f"[FIX_CATEGORIES] Borders missing category: {missing_category}")
        
        if missing_category == 0:
            print("[FIX_CATEGORIES] All borders already have category field set!")
            return
        
        # Update all borders missing category to default "border"
        result = await borders_collection.update_many(
            {
                "$or": [
                    {"category": {"$exists": False}},
                    {"category": None},
                    {"category": ""}
                ]
            },
            {
                "$set": {
                    "category": "border",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        print(f"[FIX_CATEGORIES] Updated {result.modified_count} borders with default category 'border'")
        
        # Show category distribution
        pipeline = [
            {
                "$group": {
                    "_id": "$category",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        category_stats = []
        async for stat in borders_collection.aggregate(pipeline):
            category_stats.append(stat)
        
        print("\n[FIX_CATEGORIES] Category distribution:")
        for stat in category_stats:
            category = stat["_id"] or "null"
            count = stat["count"]
            print(f"  - {category}: {count}")
        
        print("\n[FIX_CATEGORIES] Migration completed successfully!")
        
    except Exception as e:
        print(f"[FIX_CATEGORIES] Error: {str(e)}")
        raise
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Border Categories Fix Script")
    print("=" * 60)
    asyncio.run(fix_border_categories())
