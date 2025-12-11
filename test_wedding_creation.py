#!/usr/bin/env python3
"""
Test wedding creation with the fixed Stream.io integration
"""
import requests
import json

# Test configuration
BASE_URL = "http://localhost:8001"

def test_wedding_creation():
    """Test complete wedding creation flow"""
    
    print("=" * 70)
    print("TESTING WEDDING CREATION WITH STREAM.IO INTEGRATION")
    print("=" * 70)
    
    # Step 1: Register a test user
    print("\n1. Registering test user...")
    register_data = {
        "email": "testuser@example.com",
        "password": "Test123!@#",
        "name": "Test User"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
    if response.status_code in [200, 201]:
        user_data = response.json()
        token = user_data.get("access_token")
        user_info = user_data.get("user", {})
        print(f"   ✅ User registered: {user_info.get('email')}")
        print(f"   Token: {token[:50]}...")
    elif "already" in response.text.lower():
        print("   ℹ️  User already exists, attempting login...")
        # Try to login instead
        from requests.auth import HTTPBasicAuth
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": register_data["email"], "password": register_data["password"]}
        )
        if login_response.status_code == 200:
            user_data = login_response.json()
            token = user_data.get("access_token")
            print(f"   ✅ User logged in: {register_data['email']}")
        else:
            print(f"   ❌ Login failed: {login_response.text}")
            return False
    else:
        print(f"   ❌ Registration failed: {response.text}")
        return False
    
    # Step 2: Create a wedding
    print("\n2. Creating wedding...")
    wedding_data = {
        "title": "John & Jane's Wedding",
        "bride_name": "Jane Test",
        "groom_name": "John Test",
        "scheduled_date": "2025-12-25T14:00:00",
        "venue": "Test Venue Hall",
        "description": "Testing Stream.io integration"
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/api/weddings/",
        json=wedding_data,
        headers=headers
    )
    
    if response.status_code in [200, 201]:
        wedding = response.json()
        print(f"   ✅ Wedding created successfully!")
        print(f"   Wedding ID: {wedding.get('id')}")
        print(f"   Couple: {wedding.get('bride_name')} & {wedding.get('groom_name')}")
        print(f"   Join Code: {wedding.get('short_code')}")
        
        # Check RTMP credentials
        rtmp_creds = wedding.get('stream_credentials', {})
        if rtmp_creds:
            print(f"\n3. RTMP Credentials:")
            print(f"   ✅ RTMP URL: {rtmp_creds.get('rtmp_url')}")
            print(f"   ✅ Stream Key: {rtmp_creds.get('stream_key')[:50]}...")
            print(f"   ✅ Call ID: {rtmp_creds.get('call_id')}")
            print(f"   ✅ Playback URL: {rtmp_creds.get('playback_url')}")
            
            # Validate RTMP URL format
            if rtmp_creds.get('rtmp_url', '').startswith('rtmp'):
                print("\n   ✅ RTMP URL format is valid!")
            else:
                print("\n   ❌ RTMP URL format is invalid!")
                
            print("\n" + "=" * 70)
            print("✅ STREAM.IO INTEGRATION IS WORKING!")
            print("Wedding creation with live streaming credentials successful!")
            print("=" * 70)
            return True
        else:
            print("   ❌ No RTMP credentials in response")
            print(f"   Response: {json.dumps(wedding, indent=2)}")
            return False
    else:
        print(f"   ❌ Wedding creation failed!")
        print(f"   Status: {response.status_code}")
        print(f"   Error: {response.text}")
        return False

if __name__ == "__main__":
    import sys
    result = test_wedding_creation()
    sys.exit(0 if result else 1)
