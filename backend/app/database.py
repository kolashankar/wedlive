from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "record_db")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def init_db():
    """Initialize database connection"""
    db_instance.client = AsyncIOMotorClient(MONGODB_URI)
    db_instance.db = db_instance.client[DB_NAME]
    print(f"Connected to MongoDB: {DB_NAME}")

async def close_db():
    """Close database connection"""
    if db_instance.client:
        db_instance.client.close()
        print("MongoDB connection closed")

def get_db():
    """Get database instance"""
    return db_instance.db

async def get_db_dependency():
    """Database dependency for FastAPI routes"""
    if db_instance.db is None:
        await init_db()
    return db_instance.db

# Alias for compatibility
async def get_database():
    """Get database instance (async alias)"""
    return db_instance.db
