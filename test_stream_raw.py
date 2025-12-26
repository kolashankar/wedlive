#!/usr/bin/env python3
"""
Test raw HTTP requests to Stream.io API
"""
import requests
import json
import time
import jwt

API_KEY = 'hhdxgg9s2qq2'
API_SECRET = '5yp6t23dw6szzqj9tmeaddp5jqxra4ut2fmkm4f4huf7quc56uqjyb74jyngxjnk'

def test_stream_api():
    """Test Stream.io API with raw HTTP requests"""
    
    print("=" * 70)
    print("STREAM.IO RAW API TEST")
    print("=" * 70)
    
    # Test 1: Simple API health check
    print("\n1. Testing API endpoint...")
    
    # Create JWT token
    user_id = "test_user_123"
    payload = {
        'user_id': user_id,
        'exp': int(time.time()) + 3600,
        'iat': int(time.time())
    }
    token = jwt.encode(payload, API_SECRET, algorithm='HS256')
    print(f"   Generated JWT token: {token[:50]}...")
    
    # Test the video API endpoint
    base_url = "https://video.stream-io-api.com"
    
    # Try GetOrCreateCall endpoint
    print("\n2. Testing GetOrCreateCall endpoint...")
    endpoint = f"{base_url}/video/call/livestream/test-call-123"
    
    headers = {
        'Authorization': f'{API_KEY}',
        'Stream-Auth-Type': 'jwt',
        'Content-Type': 'application/json',
        'X-Stream-Client': 'stream-video-python-0.0.6'
    }
    
    payload_data = {
        "type": "livestream",
        "id": "test-call-123"
    }
    
    print(f"   URL: {endpoint}")
    print(f"   Headers: {headers}")
    
    try:
        response = requests.post(endpoint, json=payload_data, headers=headers)
        print(f"\n   Response Status: {response.status_code}")
        print(f"   Response Headers: {dict(response.headers)}")
        print(f"   Response Body: {response.text[:500]}")
        
        if response.status_code == 200:
            print("\n   ✅ API is accessible!")
            data = response.json()
            print(f"   Response data: {json.dumps(data, indent=2)[:500]}")
        else:
            print(f"\n   ❌ API returned error {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   Raw error: {response.text}")
                
    except Exception as e:
        print(f"\n   ❌ Request failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 2: Try with Twirp protocol
    print("\n3. Testing with Twirp protocol...")
    twirp_endpoint = f"{base_url}/twirp/stream.video.coordinator.v1.ClientRPC/GetOrCreateCall"
    
    twirp_headers = {
        'Content-Type': 'application/json',
        'Authorization': API_KEY
    }
    
    twirp_payload = {
        "type": "livestream",
        "id": "test-call-456",
        "input": {
            "call": {
                "custom_json": json.dumps({"created_by_id": user_id}),
                "settings_overrides": {
                    "broadcasting": {
                        "enabled": True
                    }
                }
            }
        }
    }
    
    print(f"   URL: {twirp_endpoint}")
    print(f"   Payload: {json.dumps(twirp_payload, indent=2)[:300]}")
    
    try:
        response = requests.post(twirp_endpoint, json=twirp_payload, headers=twirp_headers)
        print(f"\n   Response Status: {response.status_code}")
        print(f"   Response Body: {response.text[:500]}")
        
        if response.status_code == 200:
            print("\n   ✅ Twirp API is working!")
        else:
            print(f"\n   ❌ Twirp API returned error")
            try:
                error_data = response.json()
                print(f"   Error details: {json.dumps(error_data, indent=2)}")
            except:
                pass
                
    except Exception as e:
        print(f"\n   ❌ Twirp request failed: {e}")

if __name__ == "__main__":
    test_stream_api()
