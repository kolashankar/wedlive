#!/usr/bin/env python3
"""
Create a test wedding to verify photo upload workflow
"""
import requests
import json

def create_test_wedding():
    """Create a test wedding for debugging photo display"""
    print("=== CREATING TEST WEDDING ===\n")
    
    base_url = "http://localhost:8001"
    
    # First, try to get auth token or use existing session
    # For now, let's try to create a wedding directly
    
    wedding_data = {
        "title": "Test Wedding for Photo Display",
        "description": "Test wedding to debug photo and border display issues",
        "bride_name": "Test Bride",
        "groom_name": "Test Groom",
        "scheduled_date": "2025-12-25T10:00:00",
        "location": "Test Location"
    }
    
    print("1. Creating test wedding...")
    try:
        response = requests.post(f"{base_url}/api/weddings", json=wedding_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200 or response.status_code == 201:
            wedding = response.json()
            wedding_id/-id = wedding.get('id')
            print(f"   Wedding ID: {wedding_id}")
            print(f"   Wedding created successfully!")
            
            # Initialize theme settings with some default data
            theme_data = {
                "theme_id": "floral_garden",
akh
                "custom_font": "Great Vibes",
                "primary_color": "#f43f5e",
                "secondary_color": "#a855f7",
                "cover_photos": [
                    {
                        "url": "https://api.telegram.org/file/bot8534420328:AAEB3NeeGZJZ53iLP1qK2EwK-5MSoEcWFPQ/photos/file_49.jpg",
                        "category": "bride",
                        "type": "photo"
                    },
                    {
                        "url": "https://api.telegram.org/file/bot8534420328:AAEB3NeeGZJZ53iLP1qK2EwK-5MSoEcWFPQ/photos/file_47.jpgjpg",
                        "category": "groom",
                        "type": "photo"
                    }
                ],
                "theme_assets": {
                    "borders": {
                        "bride_groom_border_id": "fab45d4a-97f4-499b-97ff-850612629b45",
                        "couple_border_id": "f629f33a-ad1b-46a1-bf6f-dd8b2d98da71"
                    }
                }
            }
            
            print("2. Setting up theme with photos and borders...")
            theme_response = requests.put(f"{base_url}/api/weddings/{wedding_id}/theme", json=theme_data)
            print(f"   Status: {theme_response.status_code}")
            if theme_response.status_code == 200:
                print("   Theme settings updated successfully!")
                
                # Verify the wedding data
                print("3. Verifying wedding data...")
                verify_response = requests.get(f"{base_url}/api/weddings/{wedding_id}")
                if verify_response.status_code == 200:
                    wedding_data = verify_response.json()
                    cover_photos = wedding_data.get('theme_settings', {}).get('cover_photos', [])
                    theme_assets = wedding_data.get('theme_settings', {}).get('theme_assets', {})
                    
                    print(f"   Cover photos found: {len(cover_photos)}")
                    for photo in cover_photos:
                        print(f"   - {photo.get('category')}: {photo.get('url')}")
                    
                    print(f"   Theme assets: {theme_assets}")
                    print(f"   Border URLs:")
                    for key, value in theme_assets.items():
                        if 'border_url' in key:
                            print(f"   - {key}: {value}")
                    
                    print(f"\n   Test wedding URL: http://localhost:3000/weddings/manage/{wedding_id}")
                    print("   You can now test the photo display in the browser!")
                    
                else:
                    print(f"   Error verifying wedding: {verify_response.status_code}")
                    print(f"   Response: {verify_response.text}")
            else:
                print(f"   Error updating theme: {theme_response.status_code}")
                print(f"   Response: {theme_response.text}")
        else:
            print(f"   Error creating wedding: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   Exception: {e}")

if __name__ == "__main__":
    create_test_wedding()
