#!/usr/bin/env python3
"""
Wedding User ID Mismatch Fix Script
This script diagnoses and fixes user_id mismatches between authentication and wedding records
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv('/app/backend/.env')

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "record_db")

async def diagnose_issue():
    """Diagnose the user ID mismatch issue"""
    print("=" * 60)
    print("WEDDING USER ID MISMATCH DIAGNOSTIC")
    print("=" * 60)
    
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    try:
        # Check email accounts
        email = "kolashankar113@gmail.com"
        print(f"\n📧 Searching for users with email: {email}")
        
        users = await db.users.find({"email": email}).to_list(length=10)
        
        if not users:
            print(f"❌ No users found with email: {email}")
            return
        
        print(f"✅ Found {len(users)} user account(s):\n")
        
        for idx, user in enumerate(users, 1):
            print(f"Account #{idx}:")
            print(f"  User ID: {user['id']}")
            print(f"  Name: {user.get('full_name', 'N/A')}")
            print(f"  Auth Provider: {user.get('auth_provider', 'email')}")
            print(f"  Google ID: {user.get('google_id', 'N/A')}")
            print(f"  Created: {user.get('created_at', 'N/A')}")
            
            # Check how many weddings this user has
            wedding_count = await db.weddings.count_documents({"creator_id": user['id']})
            print(f"  Weddings: {wedding_count}")
            print()
        
        # Check total weddings
        total_weddings = await db.weddings.count_documents({})
        print(f"📊 Total weddings in database: {total_weddings}")
        
        # Get unique creator_ids
        pipeline = [
            {"$group": {"_id": "$creator_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        creators = await db.weddings.aggregate(pipeline).to_list(length=10)
        
        print("\n👥 Weddings by creator:")
        for creator in creators:
            creator_id = creator['_id']
            count = creator['count']
            
            # Find user info
            user = await db.users.find_one({"id": creator_id})
            if user:
                print(f"  {creator_id}: {count} weddings (User: {user.get('full_name', 'N/A')})")
            else:
                print(f"  {creator_id}: {count} weddings (⚠️ User not found in users collection!)")
        
        print("\n" + "=" * 60)
        print("DIAGNOSIS COMPLETE")
        print("=" * 60)
        
    finally:
        client.close()

async def fix_issue(old_user_id: str, new_user_id: str, dry_run: bool = True):
    """Fix the user ID mismatch by updating wedding creator_ids"""
    print("=" * 60)
    print("WEDDING USER ID FIX SCRIPT")
    print("=" * 60)
    
    if dry_run:
        print("\n⚠️  DRY RUN MODE - No changes will be made\n")
    else:
        print("\n🔴 LIVE MODE - Changes will be applied!\n")
    
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    try:
        # Verify old user exists
        old_user = await db.users.find_one({"id": old_user_id})
        if not old_user:
            print(f"❌ Old user ID not found: {old_user_id}")
            return
        
        # Verify new user exists
        new_user = await db.users.find_one({"id": new_user_id})
        if not new_user:
            print(f"❌ New user ID not found: {new_user_id}")
            return
        
        print(f"✅ Old User: {old_user.get('full_name')} ({old_user.get('email')})")
        print(f"✅ New User: {new_user.get('full_name')} ({new_user.get('email')})")
        
        # Count weddings to be updated
        wedding_count = await db.weddings.count_documents({"creator_id": old_user_id})
        print(f"\n📊 Weddings to reassign: {wedding_count}")
        
        if wedding_count == 0:
            print("❌ No weddings found for old user ID")
            return
        
        # Get sample weddings
        sample_weddings = await db.weddings.find({"creator_id": old_user_id}).limit(3).to_list(length=3)
        print("\n📋 Sample weddings:")
        for wedding in sample_weddings:
            print(f"  - {wedding.get('title')} (ID: {wedding.get('id')})")
        
        if not dry_run:
            # Perform the update
            print("\n🔄 Updating weddings...")
            result = await db.weddings.update_many(
                {"creator_id": old_user_id},
                {
                    "$set": {
                        "creator_id": new_user_id,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            print(f"✅ Updated {result.modified_count} weddings")
            print(f"\n🎉 SUCCESS! All weddings have been reassigned to new user ID")
        else:
            print("\n⚠️  This was a dry run. To apply changes, run with --apply flag")
        
        print("\n" + "=" * 60)
        
    finally:
        client.close()

async def main():
    if len(sys.argv) == 1 or sys.argv[1] == "diagnose":
        await diagnose_issue()
    elif sys.argv[1] == "fix":
        if len(sys.argv) < 4:
            print("Usage: python fix_user_mismatch.py fix <old_user_id> <new_user_id> [--apply]")
            print("\nExample:")
            print("  python fix_user_mismatch.py fix 35e6ddce-1931-47fd-a308-ef54fe355277 new-user-id-here --apply")
            return
        
        old_user_id = sys.argv[2]
        new_user_id = sys.argv[3]
        dry_run = "--apply" not in sys.argv
        
        await fix_issue(old_user_id, new_user_id, dry_run)
    else:
        print("Usage:")
        print("  python fix_user_mismatch.py diagnose")
        print("  python fix_user_mismatch.py fix <old_user_id> <new_user_id> [--apply]")

if __name__ == "__main__":
    asyncio.run(main())
