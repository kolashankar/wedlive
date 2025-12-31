#!/usr/bin/env python3
"""
Check specific wedding ownership
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv('/app/backend/.env')

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "record_db")

async def check_wedding(wedding_id: str):
    """Check wedding ownership"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    try:
        print("=" * 60)
        print(f"CHECKING WEDDING: {wedding_id}")
        print("=" * 60)
        
        wedding = await db.weddings.find_one({"id": wedding_id})
        
        if not wedding:
            print(f"\n❌ Wedding not found: {wedding_id}")
            return
        
        print(f"\n✅ Wedding Found:")
        print(f"  Title: {wedding.get('title')}")
        print(f"  ID: {wedding.get('id')}")
        print(f"  Creator ID: {wedding.get('creator_id')}")
        print(f"  Status: {wedding.get('status')}")
        print(f"  Created: {wedding.get('created_at')}")
        
        # Find creator
        creator_id = wedding.get('creator_id')
        creator = await db.users.find_one({"id": creator_id})
        
        if creator:
            print(f"\n👤 Creator Info:")
            print(f"  User ID: {creator.get('id')}")
            print(f"  Email: {creator.get('email')}")
            print(f"  Name: {creator.get('full_name')}")
            print(f"  Auth Provider: {creator.get('auth_provider', 'email')}")
            print(f"  Google ID: {creator.get('google_id', 'N/A')}")
        else:
            print(f"\n⚠️ Creator not found in database!")
            print(f"  Looking for user_id: {creator_id}")
        
        # Check all users with this email
        if creator and creator.get('email'):
            users_with_email = await db.users.find({"email": creator.get('email')}).to_list(length=10)
            print(f"\n📧 All accounts with email {creator.get('email')}:")
            for idx, user in enumerate(users_with_email, 1):
                print(f"  Account #{idx}:")
                print(f"    User ID: {user.get('id')}")
                print(f"    Name: {user.get('full_name')}")
                print(f"    Auth: {user.get('auth_provider', 'email')}")
                wedding_count = await db.weddings.count_documents({"creator_id": user.get('id')})
                print(f"    Weddings: {wedding_count}")
        
        print("\n" + "=" * 60)
        
    finally:
        client.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python check_wedding.py <wedding_id>")
        print("\nExample:")
        print("  python check_wedding.py f163dcc6-0751-4c84-9b7b-f06be3d1e761")
        sys.exit(1)
    
    wedding_id = sys.argv[1]
    asyncio.run(check_wedding(wedding_id))
