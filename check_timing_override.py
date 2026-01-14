#!/usr/bin/env python3
"""
Check timing override in video template overlays
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

async def check_timing_override():
    """Check if timing is being overridden in database vs API response"""
    
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(mongo_uri)
    db = client[os.getenv("DB_NAME", "record_db")]
    
    wedding_id = "b75e23c9-ca5e-4d10-bf20-065169d1a01e"
    
    print(f"🔍 CHECKING TIMING OVERRIDE FOR WEDDING: {wedding_id}")
    print("=" * 80)
    
    # 1. Get template assignment
    assignment = await db.wedding_template_assignments.find_one({"wedding_id": wedding_id})
    if not assignment:
        print("❌ No template assignment found")
        return
    
    template_id = assignment["template_id"]
    print(f"📋 Template ID: {template_id}")
    
    # 2. Get template from database
    template = await db.video_templates.find_one({"id": template_id})
    if not template:
        print("❌ Template not found")
        return
    
    print(f"📝 Template Name: {template.get('name')}")
    
    # 3. Check original timing values in database
    text_overlays = template.get("text_overlays", [])
    print(f"\n📊 ORIGINAL DATABASE TIMING VALUES:")
    print("-" * 50)
    
    for i, overlay in enumerate(text_overlays, 1):
        timing = overlay.get("timing", {})
        start_time = timing.get("start_time")
        end_time = timing.get("end_time")
        label = overlay.get("label", f"Overlay {i}")
        print(f"  {i}. {label}: start={start_time}s, end={end_time}s")
    
    # 4. Check if there's any timing override logic
    print(f"\n🔍 CHECKING FOR TIMING OVERRIDE LOGIC:")
    print("-" * 50)
    
    # Check if there are any timing overrides in the assignment
    if "timing_overrides" in assignment:
        print(f"⚠️  Found timing_overrides in assignment: {assignment['timing_overrides']}")
    else:
        print("✅ No timing_overrides found in assignment")
    
    # Check if there are any global timing settings
    if "global_timing" in assignment:
        print(f"⚠️  Found global_timing in assignment: {assignment['global_timing']}")
    else:
        print("✅ No global_timing found in assignment")
    
    # 5. Now make API call to see what's returned
    print(f"\n📡 MAKING API CALL TO CHECK RETURNED VALUES:")
    print("-" * 50)
    
    import requests
    
    # Get backend URL
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8001")
    api_url = f"{backend_url}/api/viewer/wedding/{wedding_id}/all"
    
    try:
        response = requests.get(api_url, timeout=30)
        if response.status_code == 200:
            data = response.json()
            video_template = data.get("video_template")
            if video_template:
                api_overlays = video_template.get("text_overlays", [])
                print(f"📊 API RETURNED TIMING VALUES:")
                for i, overlay in enumerate(api_overlays, 1):
                    timing = overlay.get("timing", {})
                    start_time = timing.get("start_time")
                    end_time = timing.get("end_time")
                    label = overlay.get("label", f"Overlay {i}")
                    print(f"  {i}. {label}: start={start_time}s, end={end_time}s")
                
                # Compare database vs API
                print(f"\n🔍 COMPARISON ANALYSIS:")
                print("-" * 50)
                
                db_start_times = [overlay.get("timing", {}).get("start_time") for overlay in text_overlays]
                api_start_times = [overlay.get("timing", {}).get("start_time") for overlay in api_overlays]
                
                if db_start_times != api_start_times:
                    print(f"❌ TIMING OVERRIDE DETECTED!")
                    print(f"   Database start times: {db_start_times}")
                    print(f"   API returned start times: {api_start_times}")
                    
                    # Check if all API times are 0
                    if all(t == 0 for t in api_start_times):
                        print(f"🔍 All API start times are 0 - this indicates intentional override to start at beginning")
                    
                else:
                    print(f"✅ No timing override - database and API values match")
                    print(f"   Start times: {db_start_times}")
            else:
                print("❌ No video_template in API response")
        else:
            print(f"❌ API call failed: {response.status_code}")
    except Exception as e:
        print(f"❌ API call error: {e}")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(check_timing_override())