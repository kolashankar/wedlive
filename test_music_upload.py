#!/usr/bin/env python3
"""
Quick test for music upload functionality
"""

import requests
import os

# Get backend URL
try:
    with open('/app/frontend/.env', 'r') as f:
        env_content = f.read()
        
    backend_url = None
    for line in env_content.split('\n'):
        if line.startswith('REACT_APP_BACKEND_URL=') and '=' in line:
            backend_url = line.split('=', 1)[1].strip()
            break
    
    if not backend_url:
        with open('/app/backend/.env', 'r') as f:
            backend_env = f.read()
        for line in backend_env.split('\n'):
            if line.startswith('BACKEND_URL=') and '=' in line:
                backend_url = line.split('=', 1)[1].strip()
                break
    
    if not backend_url:
        backend_url = "http://localhost:8001"
        
    BASE_URL = f"{backend_url}/api"
    print(f"🔗 Using Backend URL: {BASE_URL}")
    
except Exception as e:
    print(f"⚠️  Could not read .env files: {e}")
    BASE_URL = "http://localhost:8001/api"

def test_music_upload():
    # Login first
    try:
        with open('/app/backend/.env', 'r') as f:
            env_content = f.read()
        
        admin_email = None
        admin_password = None
        
        for line in env_content.split('\n'):
            if line.startswith('ADMIN_EMAIL='):
                admin_email = line.split('=', 1)[1].strip()
            elif line.startswith('ADMIN_PASSWORD='):
                admin_password = line.split('=', 1)[1].strip()
        
        if not admin_email or not admin_password:
            print("❌ Admin credentials not found")
            return
        
        # Login
        session = requests.Session()
        login_data = {"email": admin_email, "password": admin_password}
        response = session.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code}")
            return
        
        data = response.json()
        token = data.get("access_token")
        if not token:
            print("❌ No access token received")
            return
        
        session.headers.update({"Authorization": f"Bearer {token}"})
        print("✅ Logged in successfully")
        
        # Download sample music
        print("📥 Downloading sample music...")
        sample_url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        music_response = requests.get(sample_url, timeout=30)
        
        if music_response.status_code != 200:
            print(f"❌ Failed to download music: {music_response.status_code}")
            return
        
        print(f"✅ Downloaded {len(music_response.content)} bytes")
        
        # Test upload
        print("🎵 Testing music upload...")
        files = {"file": ("test_music.mp3", music_response.content, "audio/mpeg")}
        data = {
            "title": "Test Music Upload",
            "artist": "Test Artist",
            "category": "background_music",
            "is_public": "true"
        }
        
        response = session.post(f"{BASE_URL}/admin/music/upload", files=files, data=data)
        
        print(f"📊 Upload Response: {response.status_code}")
        print(f"📄 Response Body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Music upload successful!")
        else:
            print("❌ Music upload failed!")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_music_upload()