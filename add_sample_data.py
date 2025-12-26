#!/usr/bin/env python3
"""
Test API endpoints to check if borders and backgrounds are available
"""
import requests
import json

def test_api_endpoints():
    """Test the API endpoints to see what data is available"""
    print("=== TESTING API ENDPOINTS ===\n")
    
    base_url = "http://localhost:8001"
    
    # Test borders endpoint
    print("1. Testing /api/theme-assets/borders...")
    try:
        response = requests.get(f"{base_url}/api/theme-assets/borders")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data)} borders")
            if data:
                print(f"   First border: {data[0].get('name', 'No name')} - {data[0].get('cdn_url', 'No URL')}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test backgrounds endpoint
    print("\n2. Testing /api/theme-assets/backgrounds...")
    try:
        response = requests.get(f"{base_url}/api/theme-assets/backgrounds")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data)} backgrounds")
            if data:
                print(f"   First background: {data[0].get('name', 'No name')} - {data[0].get('cdn_url', 'No URL')}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test a wedding endpoint
    print("\n3. Testing /api/weddings endpoint...")
    try:
        response = requests.get(f"{base_url}/api/weddings")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data)} weddings")
            if data:
                wedding_id = data[0].get('id')
                print(f"   First wedding ID: {wedding_id}")
                
                # Test specific wedding with theme
                response2 = requests.get(f"{base_url}/api/weddings/{wedding_id}")
                if response2.status_code == 200:
                    wedding_data = response2.json()
                    theme_settings = wedding_data.get('theme_settings', {})
                    cover_photos = theme_settings.get('cover_photos', [])
                    print(f"   Cover photos: {len(cover_photos)}")
                    if cover_photos:
                        print(f"   First photo: {cover_photos[0]}")
                else:
                    print(f"   Error getting wedding details: {response2.text}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Exception: {e}")

if __name__ == "__main__":
    test_api_endpoints()
