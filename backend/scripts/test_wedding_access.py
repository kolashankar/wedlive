#!/usr/bin/env python3
"""
Test wedding settings endpoint directly
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import jwt
from datetime import datetime, timedelta

load_dotenv('/app/backend/.env')

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "record_db")
JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

def create_test_token(user_id: str, email: str):
    """Create a test JWT token"""
    expire = datetime.utcnow() + timedelta(days=7)
    payload = {
        "user_id": user_id,
        "email": email,
        "role": "admin",
        "exp": expire
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)
    print(f"\n🔑 Test Token Created:")
    print(f"Bearer {token}\n")
    return token

async def test_wedding_access(wedding_id: str):
    """Test if user can access wedding settings"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    try:
        print("=" * 60)
        print(f"TESTING WEDDING ACCESS: {wedding_id}")
        print("=" * 60)
        
        # Get wedding
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            print(f"\n❌ Wedding not found!")
            return
        
        print(f"\n✅ Wedding: {wedding.get('title')}")
        print(f"   Creator ID: {wedding.get('creator_id')}")
        
        # Get creator
        creator = await db.users.find_one({"id": wedding.get('creator_id')})
        if not creator:
            print(f"\n❌ Creator not found!")
            return
        
        print(f"\n👤 Creator:")
        print(f"   User ID: {creator.get('id')}")
        print(f"   Email: {creator.get('email')}")
        print(f"   Name: {creator.get('full_name')}")
        
        # Create test token
        token = create_test_token(creator.get('id'), creator.get('email'))
        
        print("\n📋 Test this token with curl:")
        print(f"curl -H 'Authorization: Bearer {token}' \\")
        print(f"     https://wedlive.onrender.com/api/weddings/{wedding_id}/settings")
        
        print("\n" + "=" * 60)
        
    finally:
        client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_wedding_access.py <wedding_id>")
        sys.exit(1)
    
    wedding_id = sys.argv[1]
    asyncio.run(test_wedding_access(wedding_id))
