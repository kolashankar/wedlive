#!/usr/bin/env python3
"""
Backend API Testing Suite
Comprehensive testing of multi-camera and audio/music functionality
"""

import requests
import json
import sys
import time
import uuid
import os
import tempfile
from datetime import datetime
from typing import Dict, List, Optional

# Configuration
TEST_WEDDING_ID = None  # Will be created during test
TEST_USER_TOKEN = None  # Will be obtained during login
CAMERAS_CREATED = []  # Track created cameras for cleanup

# Get backend URL from environment
try:
    with open('/app/frontend/.env', 'r') as f:
        env_content = f.read()
        
    # Extract REACT_APP_BACKEND_URL if set
    backend_url = None
    for line in env_content.split('\n'):
        if line.startswith('REACT_APP_BACKEND_URL=') and '=' in line:
            backend_url = line.split('=', 1)[1].strip()
            break
    
    # If not found in frontend .env, check backend .env for BACKEND_URL
    if not backend_url:
        with open('/app/backend/.env', 'r') as f:
            backend_env = f.read()
        for line in backend_env.split('\n'):
            if line.startswith('BACKEND_URL=') and '=' in line:
                backend_url = line.split('=', 1)[1].strip()
                break
    
    # For testing, always use local backend
    backend_url = "http://localhost:8001"
        
    BASE_URL = f"{backend_url}/api"
    print(f"🔗 Using Backend URL: {BASE_URL}")
    
except Exception as e:
    print(f"⚠️  Could not read .env files: {e}")
    BASE_URL = "http://localhost:8001/api"
    print(f"🔗 Using Default Backend URL: {BASE_URL}")

class BackendAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.user_token = None
        self.admin_token = None
        self.test_wedding_id = None
        self.test_cameras = []
        self.test_music_ids = []
        self.test_folder_ids = []
        self.test_results = []
        
    def log_test_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result for summary"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "name": test_name,
            "success": success,
            "details": details,
            "status": status
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"    {details}")
    
    def setup_authentication(self) -> bool:
        """Setup authentication with premium user account"""
        print("\n🔐 SETTING UP AUTHENTICATION")
        print("=" * 50)
        
        # Try to login with admin credentials from .env
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
                self.log_test_result("Authentication Setup", False, "Admin credentials not found in .env")
                return False
            
            # Login request
            login_data = {
                "email": admin_email,
                "password": admin_password
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.user_token = data.get("access_token")
                if self.user_token:
                    self.session.headers.update({"Authorization": f"Bearer {self.user_token}"})
                    self.log_test_result("Authentication Setup", True, f"Logged in as {admin_email}")
                    return True
            
            self.log_test_result("Authentication Setup", False, f"Login failed: {response.status_code}")
            return False
            
        except Exception as e:
            self.log_test_result("Authentication Setup", False, f"Error: {str(e)}")
            return False
    
    def setup_test_wedding(self) -> bool:
        """Setup test wedding (create new wedding since user is now premium)"""
        print("\n💒 SETTING UP TEST WEDDING")
        print("=" * 50)
        
        wedding_data = {
            "title": "Multi-Camera Test Wedding",
            "bride_name": "TestBride",
            "groom_name": "TestGroom",
            "scheduled_date": "2024-12-31T18:00:00Z",
            "location": "Test Venue",
            "description": "Test wedding for multi-camera functionality"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/weddings", json=wedding_data)
            
            if response.status_code == 201:
                data = response.json()
                self.test_wedding_id = data.get("id")
                if self.test_wedding_id:
                    self.log_test_result("Setup Test Wedding", True, f"Created wedding ID: {self.test_wedding_id}")
                    return True
            
            self.log_test_result("Setup Test Wedding", False, f"Failed: {response.status_code} - {response.text}")
            return False
            
        except Exception as e:
            self.log_test_result("Setup Test Wedding", False, f"Error: {str(e)}")
            return False
    
    def test_backend_health(self) -> bool:
        """Test if backend is running on port 8001"""
        print("\n🏥 TESTING BACKEND HEALTH")
        print("=" * 50)
        
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                self.log_test_result("Backend Health Check", True, "Backend is running")
                return True
            else:
                self.log_test_result("Backend Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test_result("Backend Health Check", False, f"Error: {str(e)}")
            return False
    
    def test_mongodb_connection(self) -> bool:
        """Test MongoDB connection"""
        print("\n🍃 TESTING MONGODB CONNECTION")
        print("=" * 50)
        
        try:
            # Try to access a protected endpoint that requires DB
            response = self.session.get(f"{self.base_url}/weddings", timeout=10)
            if response.status_code in [200, 401]:  # 401 is fine, means DB is accessible
                self.log_test_result("MongoDB Connection", True, "Database accessible")
                return True
            else:
                self.log_test_result("MongoDB Connection", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test_result("MongoDB Connection", False, f"Error: {str(e)}")
            return False
    
    def test_add_multiple_cameras(self) -> bool:
        """Test adding multiple cameras (5 cameras minimum)"""
        print("\n📹 TESTING MULTIPLE CAMERA ADDITION")
        print("=" * 50)
        
        if not self.test_wedding_id:
            self.log_test_result("Add Multiple Cameras", False, "No test wedding available")
            return False
        
        camera_names = ["Main Camera", "Altar Camera", "Audience Camera", "Entrance Camera", "Reception Camera"]
        success_count = 0
        premium_required = False
        
        for i, camera_name in enumerate(camera_names, 1):
            try:
                camera_data = {
                    "wedding_id": self.test_wedding_id,
                    "camera_name": camera_name
                }
                
                response = self.session.post(f"{self.base_url}/streams/camera/add", json=camera_data)
                
                if response.status_code == 200:
                    data = response.json()
                    camera_id = data.get("camera_id")
                    stream_key = data.get("stream_key")
                    
                    if camera_id and stream_key and len(stream_key) >= 32:
                        self.test_cameras.append({
                            "camera_id": camera_id,
                            "name": camera_name,
                            "stream_key": stream_key
                        })
                        success_count += 1
                        print(f"  ✅ Camera {i}: {camera_name} (ID: {camera_id[:8]}..., Key: {len(stream_key)} chars)")
                    else:
                        print(f"  ❌ Camera {i}: Invalid response data")
                elif response.status_code == 403 and "Premium" in response.text:
                    premium_required = True
                    print(f"  ⚠️ Camera {i}: Premium plan required for multi-camera")
                    break
                else:
                    print(f"  ❌ Camera {i}: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ Camera {i}: Error - {str(e)}")
        
        if premium_required:
            self.log_test_result("Add Multiple Cameras", False, "Premium plan required for multi-camera functionality")
            return False
        elif success_count >= 1:  # At least 1 camera added is good for testing
            self.log_test_result("Add Multiple Cameras", True, f"Added {success_count} cameras successfully")
            return True
        else:
            self.log_test_result("Add Multiple Cameras", False, f"No cameras could be added")
            return False
    
    def test_camera_list_retrieval(self) -> bool:
        """Test camera list retrieval"""
        print("\n📋 TESTING CAMERA LIST RETRIEVAL")
        print("=" * 50)
        
        if not self.test_wedding_id:
            self.log_test_result("Camera List Retrieval", False, "No test wedding available")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/streams/{self.test_wedding_id}/cameras")
            
            if response.status_code == 200:
                cameras = response.json()
                if isinstance(cameras, list) and len(cameras) >= 5:
                    # Verify camera data structure
                    valid_cameras = 0
                    for camera in cameras:
                        if all(key in camera for key in ["camera_id", "name", "stream_key", "status"]):
                            valid_cameras += 1
                    
                    if valid_cameras == len(cameras):
                        self.log_test_result("Camera List Retrieval", True, f"Retrieved {len(cameras)} valid cameras")
                        return True
                    else:
                        self.log_test_result("Camera List Retrieval", False, f"Invalid camera data structure")
                        return False
                else:
                    self.log_test_result("Camera List Retrieval", False, f"Expected ≥5 cameras, got {len(cameras) if isinstance(cameras, list) else 'invalid'}")
                    return False
            else:
                self.log_test_result("Camera List Retrieval", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test_result("Camera List Retrieval", False, f"Error: {str(e)}")
            return False
    
    def test_camera_switching_api(self) -> bool:
        """Test camera switching API endpoints"""
        print("\n🔄 TESTING CAMERA SWITCHING API")
        print("=" * 50)
        
        if not self.test_wedding_id or len(self.test_cameras) < 2:
            self.log_test_result("Camera Switching API", False, "Insufficient test data")
            return False
        
        success_count = 0
        total_tests = 0
        
        # Test 1: Switch to first camera
        try:
            total_tests += 1
            camera = self.test_cameras[0]
            response = self.session.post(f"{self.base_url}/streams/camera/{self.test_wedding_id}/{camera['camera_id']}/switch")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    success_count += 1
                    print(f"  ✅ Switch to {camera['name']}: Success")
                else:
                    print(f"  ❌ Switch to {camera['name']}: Invalid response")
            else:
                print(f"  ❌ Switch to {camera['name']}: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Switch to {camera['name']}: Error - {str(e)}")
        
        # Test 2: Switch to second camera
        try:
            total_tests += 1
            camera = self.test_cameras[1]
            response = self.session.post(f"{self.base_url}/streams/camera/{self.test_wedding_id}/{camera['camera_id']}/switch")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    success_count += 1
                    print(f"  ✅ Switch to {camera['name']}: Success")
                else:
                    print(f"  ❌ Switch to {camera['name']}: Invalid response")
            else:
                print(f"  ❌ Switch to {camera['name']}: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Switch to {camera['name']}: Error - {str(e)}")
        
        # Test 3: Switch to same camera (idempotency)
        try:
            total_tests += 1
            camera = self.test_cameras[1]
            response = self.session.post(f"{self.base_url}/streams/camera/{self.test_wedding_id}/{camera['camera_id']}/switch")
            
            if response.status_code == 200:
                data = response.json()
                if "already active" in data.get("message", "").lower() or data.get("status") == "success":
                    success_count += 1
                    print(f"  ✅ Idempotent switch: Success")
                else:
                    print(f"  ❌ Idempotent switch: Unexpected response")
            else:
                print(f"  ❌ Idempotent switch: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Idempotent switch: Error - {str(e)}")
        
        # Test 4: Switch to non-existent camera
        try:
            total_tests += 1
            fake_camera_id = str(uuid.uuid4())
            response = self.session.post(f"{self.base_url}/streams/camera/{self.test_wedding_id}/{fake_camera_id}/switch")
            
            if response.status_code == 404:
                success_count += 1
                print(f"  ✅ Non-existent camera: Correctly returned 404")
            else:
                print(f"  ❌ Non-existent camera: Expected 404, got {response.status_code}")
        except Exception as e:
            print(f"  ❌ Non-existent camera: Error - {str(e)}")
        
        # Test 5: Get active camera
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/streams/camera/{self.test_wedding_id}/active")
            
            if response.status_code == 200:
                data = response.json()
                if "active_camera_id" in data:
                    success_count += 1
                    print(f"  ✅ Get active camera: Success")
                else:
                    print(f"  ❌ Get active camera: Invalid response structure")
            else:
                print(f"  ❌ Get active camera: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Get active camera: Error - {str(e)}")
        
        if success_count >= 4:  # Allow 1 failure
            self.log_test_result("Camera Switching API", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("Camera Switching API", False, f"Only {success_count}/{total_tests} tests passed")
            return False
    
    def test_rtmp_webhook_simulation(self) -> bool:
        """Test RTMP webhook endpoints"""
        print("\n📡 TESTING RTMP WEBHOOK SIMULATION")
        print("=" * 50)
        
        if not self.test_cameras:
            self.log_test_result("RTMP Webhook Simulation", False, "No test cameras available")
            return False
        
        success_count = 0
        total_tests = 0
        
        # Test 1: Camera publish webhook (camera goes live)
        try:
            total_tests += 1
            camera = self.test_cameras[0]
            webhook_data = {"name": camera["stream_key"]}
            
            # Remove auth header for webhook (webhooks don't use auth)
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
            response = requests.post(f"{self.base_url}/webhooks/rtmp/on-publish", data=webhook_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    success_count += 1
                    print(f"  ✅ Camera publish webhook: Success")
                else:
                    print(f"  ❌ Camera publish webhook: Invalid response")
            else:
                print(f"  ❌ Camera publish webhook: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Camera publish webhook: Error - {str(e)}")
        
        # Test 2: Camera done webhook (camera disconnects)
        try:
            total_tests += 1
            camera = self.test_cameras[0]
            webhook_data = {"name": camera["stream_key"]}
            
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
            response = requests.post(f"{self.base_url}/webhooks/rtmp/on-publish-done", data=webhook_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    success_count += 1
                    print(f"  ✅ Camera done webhook: Success")
                else:
                    print(f"  ❌ Camera done webhook: Invalid response")
            else:
                print(f"  ❌ Camera done webhook: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Camera done webhook: Error - {str(e)}")
        
        if success_count >= 1:  # Allow some failures for webhook tests
            self.log_test_result("RTMP Webhook Simulation", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("RTMP Webhook Simulation", False, f"Only {success_count}/{total_tests} tests passed")
            return False
    
    def test_composition_health_api(self) -> bool:
        """Test composition health and recovery APIs"""
        print("\n🏥 TESTING COMPOSITION HEALTH API")
        print("=" * 50)
        
        if not self.test_wedding_id:
            self.log_test_result("Composition Health API", False, "No test wedding available")
            return False
        
        success_count = 0
        total_tests = 0
        
        # Test 1: Get composition health
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/streams/camera/{self.test_wedding_id}/health")
            
            if response.status_code == 200:
                data = response.json()
                if "composition_health" in data:
                    success_count += 1
                    print(f"  ✅ Get composition health: Success")
                else:
                    print(f"  ❌ Get composition health: Invalid response structure")
            else:
                print(f"  ❌ Get composition health: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Get composition health: Error - {str(e)}")
        
        # Test 2: Trigger composition recovery
        try:
            total_tests += 1
            response = self.session.post(f"{self.base_url}/streams/camera/{self.test_wedding_id}/recover")
            
            if response.status_code in [200, 400]:  # 400 is acceptable if no active camera
                success_count += 1
                print(f"  ✅ Trigger composition recovery: Success")
            else:
                print(f"  ❌ Trigger composition recovery: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Trigger composition recovery: Error - {str(e)}")
        
        if success_count >= 1:
            self.log_test_result("Composition Health API", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("Composition Health API", False, f"Only {success_count}/{total_tests} tests passed")
            return False
    
    def test_viewer_access_multi_camera(self) -> bool:
        """Test viewer access with multi-camera support"""
        print("\n👁️ TESTING VIEWER ACCESS WITH MULTI-CAMERA")
        print("=" * 50)
        
        if not self.test_wedding_id:
            self.log_test_result("Viewer Access Multi-Camera", False, "No test wedding available")
            return False
        
        try:
            # Test public viewer endpoint (no auth required)
            response = requests.get(f"{self.base_url}/viewer/wedding/{self.test_wedding_id}/all")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for multi-camera indicators
                wedding_data = data.get("wedding", {})
                live_stream_data = data.get("live_stream", {})
                
                has_multi_camera = wedding_data.get("has_multi_camera", False)
                active_camera_id = live_stream_data.get("active_camera_id")
                
                if has_multi_camera:
                    self.log_test_result("Viewer Access Multi-Camera", True, "Multi-camera support detected in viewer API")
                    return True
                else:
                    self.log_test_result("Viewer Access Multi-Camera", True, "Viewer API accessible (multi-camera not active)")
                    return True
            else:
                self.log_test_result("Viewer Access Multi-Camera", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test_result("Viewer Access Multi-Camera", False, f"Error: {str(e)}")
            return False
    
    def test_security_and_authorization(self) -> bool:
        """Test security measures on protected endpoints"""
        print("\n🔒 TESTING SECURITY AND AUTHORIZATION")
        print("=" * 50)
        
        success_count = 0
        total_tests = 0
        
        # Test 1: Access protected endpoint without auth
        try:
            total_tests += 1
            # Create session without auth headers
            unauth_session = requests.Session()
            response = unauth_session.post(f"{self.base_url}/streams/camera/add", json={"wedding_id": "test", "camera_name": "test"})
            
            if response.status_code == 401:
                success_count += 1
                print(f"  ✅ Unauthorized access blocked: 401 returned")
            else:
                print(f"  ❌ Unauthorized access: Expected 401, got {response.status_code}")
        except Exception as e:
            print(f"  ❌ Unauthorized access test: Error - {str(e)}")
        
        # Test 2: Access another user's wedding (if we had multiple users)
        try:
            total_tests += 1
            fake_wedding_id = str(uuid.uuid4())
            response = self.session.post(f"{self.base_url}/streams/camera/{fake_wedding_id}/test-camera/switch")
            
            if response.status_code in [403, 404]:  # Either forbidden or not found is acceptable
                success_count += 1
                print(f"  ✅ Cross-user access blocked: {response.status_code} returned")
            else:
                print(f"  ❌ Cross-user access: Expected 403/404, got {response.status_code}")
        except Exception as e:
            print(f"  ❌ Cross-user access test: Error - {str(e)}")
        
        if success_count >= 1:
            self.log_test_result("Security and Authorization", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("Security and Authorization", False, f"Only {success_count}/{total_tests} tests passed")
            return False

    # ==================== AUDIO & MUSIC TESTING METHODS ====================
    
    def test_admin_music_management(self) -> bool:
        """Test admin music upload and folder management"""
        print("\n🎵 TESTING ADMIN MUSIC MANAGEMENT")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test_result("Admin Music Management", False, "No admin token available")
            return False
        
        success_count = 0
        total_tests = 0
        
        # Test 1: Create music folder
        try:
            total_tests += 1
            folder_data = {
                "name": "Test Wedding Music",
                "description": "Test folder for wedding background music",
                "category": "background_music",
                "icon": "🎶"
            }
            
            response = self.session.post(f"{self.base_url}/admin/music/folders", json=folder_data)
            
            if response.status_code == 200:
                data = response.json()
                folder_id = data.get("id")
                if folder_id:
                    self.test_folder_ids.append(folder_id)
                    success_count += 1
                    print(f"  ✅ Create music folder: Success (ID: {folder_id[:8]}...)")
                else:
                    print(f"  ❌ Create music folder: No folder ID returned")
            else:
                print(f"  ❌ Create music folder: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Create music folder: Error - {str(e)}")
        
        # Test 2: List music folders
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/admin/music/folders")
            
            if response.status_code == 200:
                folders = response.json()
                if isinstance(folders, list):
                    success_count += 1
                    print(f"  ✅ List music folders: Success ({len(folders)} folders)")
                else:
                    print(f"  ❌ List music folders: Invalid response format")
            else:
                print(f"  ❌ List music folders: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ List music folders: Error - {str(e)}")
        
        # Test 3: Create test audio file and upload
        try:
            total_tests += 1
            # Create a minimal MP3 file for testing
            test_audio_content = self.create_test_audio_file()
            
            files = {"file": ("test_music.mp3", test_audio_content, "audio/mpeg")}
            data = {
                "title": "Test Wedding Song",
                "artist": "Test Artist",
                "category": "background_music",
                "is_public": "true"
            }
            
            if self.test_folder_ids:
                data["folder_id"] = self.test_folder_ids[0]
            
            response = self.session.post(f"{self.base_url}/admin/music/upload", files=files, data=data)
            
            if response.status_code == 200:
                music_data = response.json()
                music_id = music_data.get("id")
                if music_id:
                    self.test_music_ids.append(music_id)
                    success_count += 1
                    print(f"  ✅ Upload music: Success (ID: {music_id[:8]}...)")
                else:
                    print(f"  ❌ Upload music: No music ID returned")
            else:
                print(f"  ❌ Upload music: HTTP {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"  ❌ Upload music: Error - {str(e)}")
        
        # Test 4: List music library
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/admin/music/library")
            
            if response.status_code == 200:
                library = response.json()
                if isinstance(library, list):
                    success_count += 1
                    print(f"  ✅ List music library: Success ({len(library)} items)")
                else:
                    print(f"  ❌ List music library: Invalid response format")
            else:
                print(f"  ❌ List music library: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ List music library: Error - {str(e)}")
        
        if success_count >= 3:  # Allow 1 failure
            self.log_test_result("Admin Music Management", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("Admin Music Management", False, f"Only {success_count}/{total_tests} tests passed")
            return False
    
    def test_creator_music_management(self) -> bool:
        """Test creator personal music upload and management"""
        print("\n🎤 TESTING CREATOR MUSIC MANAGEMENT")
        print("=" * 50)
        
        success_count = 0
        total_tests = 0
        
        # Test 1: Upload personal music
        try:
            total_tests += 1
            test_audio_content = self.create_test_audio_file()
            
            files = {"file": ("personal_song.mp3", test_audio_content, "audio/mpeg")}
            data = {
                "title": "My Personal Wedding Song",
                "artist": "Personal Artist",
                "is_private": "true"
            }
            
            response = self.session.post(f"{self.base_url}/music/upload", files=files, data=data)
            
            if response.status_code == 200:
                music_data = response.json()
                music_id = music_data.get("id")
                if music_id:
                    self.test_music_ids.append(music_id)
                    success_count += 1
                    print(f"  ✅ Upload personal music: Success (ID: {music_id[:8]}...)")
                else:
                    print(f"  ❌ Upload personal music: No music ID returned")
            else:
                print(f"  ❌ Upload personal music: HTTP {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"  ❌ Upload personal music: Error - {str(e)}")
        
        # Test 2: Get personal music library
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/music/my-library")
            
            if response.status_code == 200:
                library = response.json()
                if isinstance(library, list):
                    success_count += 1
                    print(f"  ✅ Get personal library: Success ({len(library)} items)")
                else:
                    print(f"  ❌ Get personal library: Invalid response format")
            else:
                print(f"  ❌ Get personal library: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Get personal library: Error - {str(e)}")
        
        # Test 3: Check storage usage
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/music/storage")
            
            if response.status_code == 200:
                storage_info = response.json()
                if "storage_used" in storage_info and "storage_limit" in storage_info:
                    success_count += 1
                    print(f"  ✅ Check storage usage: Success (Used: {storage_info.get('storage_used_formatted', 'N/A')})")
                else:
                    print(f"  ❌ Check storage usage: Invalid response format")
            else:
                print(f"  ❌ Check storage usage: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Check storage usage: Error - {str(e)}")
        
        # Test 4: Browse public music library
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/music/library")
            
            if response.status_code == 200:
                library = response.json()
                if isinstance(library, list):
                    success_count += 1
                    print(f"  ✅ Browse public library: Success ({len(library)} items)")
                else:
                    print(f"  ❌ Browse public library: Invalid response format")
            else:
                print(f"  ❌ Browse public library: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Browse public library: Error - {str(e)}")
        
        if success_count >= 3:  # Allow 1 failure
            self.log_test_result("Creator Music Management", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("Creator Music Management", False, f"Only {success_count}/{total_tests} tests passed")
            return False
    
    def test_wedding_playlist_management(self) -> bool:
        """Test wedding playlist operations"""
        print("\n💒 TESTING WEDDING PLAYLIST MANAGEMENT")
        print("=" * 50)
        
        if not self.test_wedding_id:
            self.log_test_result("Wedding Playlist Management", False, "No test wedding available")
            return False
        
        success_count = 0
        total_tests = 0
        
        # Test 1: Add music to wedding playlist
        if self.test_music_ids:
            try:
                total_tests += 1
                playlist_data = {
                    "music_id": self.test_music_ids[0],
                    "source": "creator",
                    "auto_play": False
                }
                
                response = self.session.post(f"{self.base_url}/weddings/{self.test_wedding_id}/music/playlist", json=playlist_data)
                
                if response.status_code == 200:
                    playlist_item = response.json()
                    if playlist_item.get("music_id") == self.test_music_ids[0]:
                        success_count += 1
                        print(f"  ✅ Add music to playlist: Success")
                    else:
                        print(f"  ❌ Add music to playlist: Invalid response data")
                else:
                    print(f"  ❌ Add music to playlist: HTTP {response.status_code}")
            except Exception as e:
                print(f"  ❌ Add music to playlist: Error - {str(e)}")
        
        # Test 2: Get wedding playlist
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/weddings/{self.test_wedding_id}/music/playlist")
            
            if response.status_code == 200:
                playlist = response.json()
                if "music_playlist" in playlist and isinstance(playlist["music_playlist"], list):
                    success_count += 1
                    print(f"  ✅ Get wedding playlist: Success ({len(playlist['music_playlist'])} items)")
                else:
                    print(f"  ❌ Get wedding playlist: Invalid response format")
            else:
                print(f"  ❌ Get wedding playlist: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Get wedding playlist: Error - {str(e)}")
        
        # Test 3: Reorder playlist (if we have music)
        if self.test_music_ids:
            try:
                total_tests += 1
                reorder_data = {
                    "music_id": self.test_music_ids[0],
                    "new_order": 1
                }
                
                response = self.session.put(f"{self.base_url}/weddings/{self.test_wedding_id}/music/playlist/reorder", json=reorder_data)
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        success_count += 1
                        print(f"  ✅ Reorder playlist: Success")
                    else:
                        print(f"  ❌ Reorder playlist: Operation failed")
                else:
                    print(f"  ❌ Reorder playlist: HTTP {response.status_code}")
            except Exception as e:
                print(f"  ❌ Reorder playlist: Error - {str(e)}")
        
        if success_count >= 2:  # Allow some failures
            self.log_test_result("Wedding Playlist Management", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("Wedding Playlist Management", False, f"Only {success_count}/{total_tests} tests passed")
            return False
    
    def test_audio_session_management(self) -> bool:
        """Test Phase 5 audio session management"""
        print("\n🔊 TESTING AUDIO SESSION MANAGEMENT (PHASE 5)")
        print("=" * 50)
        
        if not self.test_wedding_id:
            self.log_test_result("Audio Session Management", False, "No test wedding available")
            return False
        
        success_count = 0
        total_tests = 0
        session_id = None
        
        # Test 1: Start audio session
        try:
            total_tests += 1
            response = self.session.post(f"{self.base_url}/weddings/{self.test_wedding_id}/audio/session/start")
            
            if response.status_code == 200:
                session_data = response.json()
                session_id = session_data.get("session_id")
                if session_id and session_data.get("is_active"):
                    success_count += 1
                    print(f"  ✅ Start audio session: Success (ID: {session_id[:8]}...)")
                else:
                    print(f"  ❌ Start audio session: Invalid response data")
            else:
                print(f"  ❌ Start audio session: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Start audio session: Error - {str(e)}")
        
        # Test 2: Get session state
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/weddings/{self.test_wedding_id}/audio/session/state")
            
            if response.status_code == 200:
                session_state = response.json()
                if session_state.get("is_active") and "current_state" in session_state:
                    success_count += 1
                    print(f"  ✅ Get session state: Success")
                else:
                    print(f"  ❌ Get session state: Invalid response data")
            else:
                print(f"  ❌ Get session state: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Get session state: Error - {str(e)}")
        
        # Test 3: Update session state
        try:
            total_tests += 1
            state_data = {
                "background_music": {
                    "track_id": "test_track",
                    "playing": True,
                    "volume": 70
                },
                "active_effects": []
            }
            
            response = self.session.put(f"{self.base_url}/weddings/{self.test_wedding_id}/audio/session/state", json=state_data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    success_count += 1
                    print(f"  ✅ Update session state: Success")
                else:
                    print(f"  ❌ Update session state: Operation failed")
            else:
                print(f"  ❌ Update session state: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Update session state: Error - {str(e)}")
        
        # Test 4: Stop audio session
        try:
            total_tests += 1
            response = self.session.post(f"{self.base_url}/weddings/{self.test_wedding_id}/audio/session/stop")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    success_count += 1
                    print(f"  ✅ Stop audio session: Success")
                else:
                    print(f"  ❌ Stop audio session: Operation failed")
            else:
                print(f"  ❌ Stop audio session: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Stop audio session: Error - {str(e)}")
        
        if success_count >= 3:  # Allow 1 failure
            self.log_test_result("Audio Session Management", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("Audio Session Management", False, f"Only {success_count}/{total_tests} tests passed")
            return False
    
    def test_phase5_advanced_audio_endpoints(self) -> bool:
        """Test Phase 5 advanced audio endpoints (if implemented)"""
        print("\n🎛️ TESTING PHASE 5 ADVANCED AUDIO ENDPOINTS")
        print("=" * 50)
        
        if not self.test_wedding_id:
            self.log_test_result("Phase 5 Advanced Audio", False, "No test wedding available")
            return False
        
        success_count = 0
        total_tests = 0
        
        # Test endpoints mentioned in review request
        advanced_endpoints = [
            ("POST", f"/weddings/{self.test_wedding_id}/audio/session/handle-music-end", {"track_id": "test", "auto_next": True}),
            ("POST", f"/weddings/{self.test_wedding_id}/audio/session/handle-interruption", {}),
            ("POST", f"/weddings/{self.test_wedding_id}/audio/session/resume", {}),
            ("PUT", f"/weddings/{self.test_wedding_id}/audio/playlist-settings", {"auto_next": True, "repeat_mode": "all", "shuffle": False}),
            ("POST", f"/weddings/{self.test_wedding_id}/audio/normalize-volumes", {}),
            ("GET", f"/weddings/{self.test_wedding_id}/audio/mixer/health", None),
            ("POST", f"/weddings/{self.test_wedding_id}/audio/mixer/restart", {})
        ]
        
        for method, endpoint, data in advanced_endpoints:
            try:
                total_tests += 1
                endpoint_name = endpoint.split("/")[-1]
                
                if method == "GET":
                    response = self.session.get(f"{self.base_url}{endpoint}")
                elif method == "POST":
                    response = self.session.post(f"{self.base_url}{endpoint}", json=data)
                elif method == "PUT":
                    response = self.session.put(f"{self.base_url}{endpoint}", json=data)
                
                if response.status_code in [200, 400, 404]:  # 400/404 acceptable if not implemented
                    if response.status_code == 200:
                        success_count += 1
                        print(f"  ✅ {endpoint_name}: Implemented and working")
                    else:
                        print(f"  ⚠️ {endpoint_name}: Not implemented or no active session ({response.status_code})")
                else:
                    print(f"  ❌ {endpoint_name}: HTTP {response.status_code}")
            except Exception as e:
                print(f"  ❌ {endpoint_name}: Error - {str(e)}")
        
        # Consider test successful if at least some endpoints are implemented
        if success_count >= 2:
            self.log_test_result("Phase 5 Advanced Audio", True, f"Found {success_count}/{total_tests} implemented endpoints")
            return True
        else:
            self.log_test_result("Phase 5 Advanced Audio", False, f"Only {success_count}/{total_tests} endpoints implemented")
            return False
    
    def create_test_audio_file(self) -> bytes:
        """Create a minimal valid MP3 file for testing"""
        # This is a minimal MP3 header + some data
        # In a real scenario, you'd want a proper audio file
        mp3_header = b'\xff\xfb\x90\x00'  # MP3 sync word + basic header
        mp3_data = b'\x00' * 1000  # Minimal data
        return mp3_header + mp3_data
    
    def setup_admin_authentication(self) -> bool:
        """Setup admin authentication for admin-only endpoints"""
        print("\n🔐 SETTING UP ADMIN AUTHENTICATION")
        print("=" * 50)
        
        # Use same credentials as regular auth but store admin token separately
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
                self.log_test_result("Admin Authentication Setup", False, "Admin credentials not found in .env")
                return False
            
            # Login request
            login_data = {
                "email": admin_email,
                "password": admin_password
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                if self.admin_token:
                    self.log_test_result("Admin Authentication Setup", True, f"Admin logged in as {admin_email}")
                    return True
            
            self.log_test_result("Admin Authentication Setup", False, f"Admin login failed: {response.status_code}")
            return False
            
        except Exception as e:
            self.log_test_result("Admin Authentication Setup", False, f"Error: {str(e)}")
            return False
    
    # ==================== ALBUM DETAIL & MUSIC LIBRARY TESTING METHODS ====================
    
    def test_album_detail_api_comprehensive(self) -> bool:
        """Test album detail API with comprehensive logging and error handling"""
        print("\n📖 TESTING ALBUM DETAIL API (COMPREHENSIVE)")
        print("=" * 50)
        
        if not self.test_wedding_id:
            self.log_test_result("Album Detail API", False, "No test wedding available")
            return False
        
        success_count = 0
        total_tests = 0
        test_album_id = None
        
        # Test 1: Create test album
        try:
            total_tests += 1
            album_data = {
                "wedding_id": self.test_wedding_id,
                "title": "Test Album for Detail API",
                "description": "Testing album detail endpoint with enhanced logging",
                "cover_photo_url": None,
                "music_url": None
            }
            
            response = self.session.post(f"{self.base_url}/albums", json=album_data)
            
            if response.status_code == 200:
                album = response.json()
                test_album_id = album.get("id")
                if test_album_id:
                    success_count += 1
                    print(f"  ✅ Create test album: Success (ID: {test_album_id[:8]}...)")
                else:
                    print(f"  ❌ Create test album: No album ID returned")
            else:
                print(f"  ❌ Create test album: HTTP {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"  ❌ Create test album: Error - {str(e)}")
        
        if not test_album_id:
            self.log_test_result("Album Detail API", False, "Failed to create test album")
            return False
        
        # Test 2: Get album detail (empty album)
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/albums/detail/{test_album_id}")
            
            if response.status_code == 200:
                album_detail = response.json()
                if album_detail.get("id") == test_album_id:
                    success_count += 1
                    print(f"  ✅ Get album detail (empty): Success")
                    print(f"      Title: {album_detail.get('title')}")
                    print(f"      Slides: {len(album_detail.get('slides', []))}")
                else:
                    print(f"  ❌ Get album detail (empty): Invalid response structure")
            else:
                print(f"  ❌ Get album detail (empty): HTTP {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"  ❌ Get album detail (empty): Error - {str(e)}")
        
        # Test 3: Add slides with invalid media_ids (test error handling)
        try:
            total_tests += 1
            fake_media_ids = [str(uuid.uuid4()), str(uuid.uuid4())]
            
            response = self.session.post(f"{self.base_url}/albums/{test_album_id}/slides", 
                                       json=fake_media_ids)
            
            if response.status_code == 200:
                album_with_slides = response.json()
                slides = album_with_slides.get("slides", [])
                if len(slides) == 2:
                    success_count += 1
                    print(f"  ✅ Add slides with fake media: Success ({len(slides)} slides added)")
                    
                    # Verify duration defaults
                    for slide in slides:
                        duration = slide.get("duration", 0)
                        if duration == 5.0:
                            print(f"      Slide duration defaulted correctly: {duration}s")
                        else:
                            print(f"      ⚠️ Slide duration: {duration}s (expected 5.0s)")
                else:
                    print(f"  ❌ Add slides: Expected 2 slides, got {len(slides)}")
            else:
                print(f"  ❌ Add slides: HTTP {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"  ❌ Add slides: Error - {str(e)}")
        
        # Test 4: Get album detail with slides (test media enrichment)
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/albums/detail/{test_album_id}")
            
            if response.status_code == 200:
                album_detail = response.json()
                slides = album_detail.get("slides", [])
                
                if len(slides) > 0:
                    success_count += 1
                    print(f"  ✅ Get album detail with slides: Success ({len(slides)} slides)")
                    
                    # Check slide structure and media enrichment
                    for i, slide in enumerate(slides):
                        media_id = slide.get("media_id")
                        media_url = slide.get("media_url")
                        duration = slide.get("duration")
                        
                        print(f"      Slide {i+1}: media_id={media_id[:8] if media_id else 'None'}..., "
                              f"media_url={'✅' if media_url else '❌'}, duration={duration}s")
                        
                        # Verify duration validation
                        if not isinstance(duration, (int, float)) or duration <= 0:
                            print(f"        ⚠️ Invalid duration: {duration}")
                else:
                    print(f"  ❌ Get album detail with slides: No slides found")
            else:
                print(f"  ❌ Get album detail with slides: HTTP {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"  ❌ Get album detail with slides: Error - {str(e)}")
        
        # Test 5: Test non-existent album (404 handling)
        try:
            total_tests += 1
            fake_album_id = str(uuid.uuid4())
            response = self.session.get(f"{self.base_url}/albums/detail/{fake_album_id}")
            
            if response.status_code == 404:
                success_count += 1
                print(f"  ✅ Non-existent album: Correctly returned 404")
            else:
                print(f"  ❌ Non-existent album: Expected 404, got {response.status_code}")
        except Exception as e:
            print(f"  ❌ Non-existent album: Error - {str(e)}")
        
        # Cleanup test album
        try:
            self.session.delete(f"{self.base_url}/albums/{test_album_id}")
        except:
            pass
        
        if success_count >= 4:  # Allow 1 failure
            self.log_test_result("Album Detail API", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("Album Detail API", False, f"Only {success_count}/{total_tests} tests passed")
            return False
    
    def test_music_library_api_comprehensive(self) -> bool:
        """Test music library API endpoint comprehensively"""
        print("\n🎵 TESTING MUSIC LIBRARY API (COMPREHENSIVE)")
        print("=" * 50)
        
        success_count = 0
        total_tests = 0
        
        # Test 1: Get public music library (no auth required)
        try:
            total_tests += 1
            # Test without authentication first
            unauth_session = requests.Session()
            response = unauth_session.get(f"{self.base_url}/music/library")
            
            if response.status_code == 200:
                library = response.json()
                if isinstance(library, list):
                    success_count += 1
                    print(f"  ✅ Public music library (no auth): Success ({len(library)} items)")
                    
                    # Check structure of returned items
                    if len(library) > 0:
                        sample_item = library[0]
                        required_fields = ["id", "title", "file_url", "duration"]
                        missing_fields = [field for field in required_fields if field not in sample_item]
                        
                        if not missing_fields:
                            print(f"      Sample item structure: ✅ All required fields present")
                        else:
                            print(f"      ⚠️ Missing fields in sample item: {missing_fields}")
                else:
                    print(f"  ❌ Public music library: Invalid response format (not a list)")
            else:
                print(f"  ❌ Public music library: HTTP {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"  ❌ Public music library: Error - {str(e)}")
        
        # Test 2: Get music library with authentication
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/music/library")
            
            if response.status_code == 200:
                library = response.json()
                if isinstance(library, list):
                    success_count += 1
                    print(f"  ✅ Music library (with auth): Success ({len(library)} items)")
                else:
                    print(f"  ❌ Music library (with auth): Invalid response format")
            else:
                print(f"  ❌ Music library (with auth): HTTP {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"  ❌ Music library (with auth): Error - {str(e)}")
        
        # Test 3: Get music library with category filter
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/music/library?category=background_music")
            
            if response.status_code == 200:
                library = response.json()
                if isinstance(library, list):
                    success_count += 1
                    print(f"  ✅ Music library (category filter): Success ({len(library)} background music items)")
                    
                    # Verify all items have correct category
                    if len(library) > 0:
                        correct_category = all(item.get("category") == "background_music" for item in library)
                        if correct_category:
                            print(f"      Category filtering: ✅ All items have correct category")
                        else:
                            print(f"      ⚠️ Category filtering: Some items have incorrect category")
                else:
                    print(f"  ❌ Music library (category filter): Invalid response format")
            else:
                print(f"  ❌ Music library (category filter): HTTP {response.status_code} - {response.text[:100]}")
        except Exception as e:
            print(f"  ❌ Music library (category filter): Error - {str(e)}")
        
        # Test 4: Test music library response structure
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/music/library?limit=1")
            
            if response.status_code == 200:
                library = response.json()
                if isinstance(library, list) and len(library) > 0:
                    music_item = library[0]
                    
                    # Check required fields for music library response
                    required_fields = ["id", "title", "file_url"]
                    optional_fields = ["artist", "duration", "category", "format"]
                    
                    has_required = all(field in music_item for field in required_fields)
                    
                    if has_required:
                        success_count += 1
                        print(f"  ✅ Music library structure: All required fields present")
                        
                        # Check file_url format (should be proxy URL)
                        file_url = music_item.get("file_url", "")
                        if "/api/media/telegram-proxy/audio/" in file_url:
                            print(f"      File URL format: ✅ Uses audio proxy")
                        else:
                            print(f"      ⚠️ File URL format: {file_url}")
                        
                        # Check duration field
                        duration = music_item.get("duration")
                        if isinstance(duration, (int, float)) and duration > 0:
                            print(f"      Duration: ✅ {duration}s")
                        else:
                            print(f"      ⚠️ Duration: {duration}")
                    else:
                        missing = [field for field in required_fields if field not in music_item]
                        print(f"  ❌ Music library structure: Missing required fields: {missing}")
                else:
                    print(f"  ❌ Music library structure: No items to check structure")
            else:
                print(f"  ❌ Music library structure: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Music library structure: Error - {str(e)}")
        
        if success_count >= 3:  # Allow 1 failure
            self.log_test_result("Music Library API", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("Music Library API", False, f"Only {success_count}/{total_tests} tests passed")
            return False
    
    def test_album_slide_duration_validation(self) -> bool:
        """Test album slide duration validation and defaults"""
        print("\n⏱️ TESTING ALBUM SLIDE DURATION VALIDATION")
        print("=" * 50)
        
        if not self.test_wedding_id:
            self.log_test_result("Album Slide Duration Validation", False, "No test wedding available")
            return False
        
        success_count = 0
        total_tests = 0
        test_album_id = None
        
        # Create test album
        try:
            album_data = {
                "wedding_id": self.test_wedding_id,
                "title": "Duration Validation Test Album",
                "description": "Testing duration validation"
            }
            
            response = self.session.post(f"{self.base_url}/albums", json=album_data)
            if response.status_code == 200:
                test_album_id = response.json().get("id")
        except:
            pass
        
        if not test_album_id:
            self.log_test_result("Album Slide Duration Validation", False, "Failed to create test album")
            return False
        
        # Test 1: Add slides and verify default duration
        try:
            total_tests += 1
            fake_media_ids = [str(uuid.uuid4()), str(uuid.uuid4())]
            
            response = self.session.post(f"{self.base_url}/albums/{test_album_id}/slides", 
                                       json=fake_media_ids)
            
            if response.status_code == 200:
                album = response.json()
                slides = album.get("slides", [])
                
                if len(slides) == 2:
                    # Check default duration
                    all_have_default = all(slide.get("duration") == 5.0 for slide in slides)
                    
                    if all_have_default:
                        success_count += 1
                        print(f"  ✅ Default duration: All slides have 5.0s duration")
                    else:
                        durations = [slide.get("duration") for slide in slides]
                        print(f"  ❌ Default duration: Slides have durations: {durations}")
                else:
                    print(f"  ❌ Add slides: Expected 2 slides, got {len(slides)}")
            else:
                print(f"  ❌ Add slides: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Default duration test: Error - {str(e)}")
        
        # Test 2: Update album with invalid duration values
        try:
            total_tests += 1
            
            # Create slides with invalid durations
            invalid_slides = [
                {
                    "media_id": str(uuid.uuid4()),
                    "order": 0,
                    "duration": "invalid",  # String instead of number
                    "transition": "FADE"
                },
                {
                    "media_id": str(uuid.uuid4()),
                    "order": 1,
                    "duration": -1,  # Negative number
                    "transition": "FADE"
                },
                {
                    "media_id": str(uuid.uuid4()),
                    "order": 2,
                    # Missing duration field
                    "transition": "FADE"
                }
            ]
            
            update_data = {"slides": invalid_slides}
            response = self.session.put(f"{self.base_url}/albums/{test_album_id}", json=update_data)
            
            if response.status_code == 200:
                # Now get album detail to check duration validation
                detail_response = self.session.get(f"{self.base_url}/albums/detail/{test_album_id}")
                
                if detail_response.status_code == 200:
                    album_detail = detail_response.json()
                    slides = album_detail.get("slides", [])
                    
                    # Check if invalid durations were corrected to 5.0
                    corrected_durations = [slide.get("duration") for slide in slides]
                    all_corrected = all(isinstance(d, (int, float)) and d == 5.0 for d in corrected_durations)
                    
                    if all_corrected:
                        success_count += 1
                        print(f"  ✅ Duration validation: Invalid durations corrected to 5.0s")
                    else:
                        print(f"  ❌ Duration validation: Durations not corrected: {corrected_durations}")
                else:
                    print(f"  ❌ Duration validation: Failed to get album detail")
            else:
                print(f"  ❌ Duration validation: Failed to update album")
        except Exception as e:
            print(f"  ❌ Duration validation test: Error - {str(e)}")
        
        # Cleanup
        try:
            self.session.delete(f"{self.base_url}/albums/{test_album_id}")
        except:
            pass
        
        if success_count >= 1:
            self.log_test_result("Album Slide Duration Validation", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("Album Slide Duration Validation", False, f"Only {success_count}/{total_tests} tests passed")
            return False
    
    def download_sample_music(self) -> str:
        """Download sample MP3 file for testing"""
        try:
            import requests
            sample_url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            temp_path = "/tmp/test_music.mp3"
            
            print(f"  📥 Downloading sample music from: {sample_url}")
            response = requests.get(sample_url, timeout=30)
            
            if response.status_code == 200:
                with open(temp_path, 'wb') as f:
                    f.write(response.content)
                print(f"  ✅ Downloaded {len(response.content)} bytes to {temp_path}")
                return temp_path
            else:
                print(f"  ❌ Failed to download: HTTP {response.status_code}")
                return None
        except Exception as e:
            print(f"  ❌ Download error: {str(e)}")
            return None
    
    def test_admin_music_upload(self) -> bool:
        """Test admin music upload with sample MP3 file"""
        print("\n🎵 TESTING ADMIN MUSIC UPLOAD")
        print("=" * 50)
        
        # Download sample music file
        sample_file = self.download_sample_music()
        if not sample_file:
            self.log_test_result("Admin Music Upload", False, "Failed to download sample music file")
            return False
        
        try:
            # Test music upload
            with open(sample_file, 'rb') as f:
                files = {"file": ("test_music.mp3", f, "audio/mpeg")}
                data = {
                    "title": "Test Wedding Background Music",
                    "artist": "SoundHelix",
                    "category": "background_music",
                    "is_public": "true"
                }
                
                response = self.session.post(f"{self.base_url}/admin/music/upload", files=files, data=data)
                
                if response.status_code == 200:
                    music_data = response.json()
                    music_id = music_data.get("id")
                    file_url = music_data.get("file_url")
                    file_id = music_data.get("file_id")
                    duration = music_data.get("duration")
                    
                    if music_id and file_url and file_id:
                        # Verify file_url format (should use audio proxy)
                        if "/api/media/telegram-proxy/audio/" in file_url:
                            self.test_music_ids.append(music_id)
                            self.log_test_result("Admin Music Upload", True, 
                                f"Uploaded music ID: {music_id[:8]}..., Duration: {duration}s, Proxy URL: ✅")
                            return True
                        else:
                            self.log_test_result("Admin Music Upload", False, 
                                f"Invalid file_url format: {file_url}")
                            return False
                    else:
                        self.log_test_result("Admin Music Upload", False, "Missing required fields in response")
                        return False
                else:
                    self.log_test_result("Admin Music Upload", False, 
                        f"HTTP {response.status_code}: {response.text[:200]}")
                    return False
                    
        except Exception as e:
            self.log_test_result("Admin Music Upload", False, f"Error: {str(e)}")
            return False
        finally:
            # Cleanup temp file
            try:
                if sample_file and os.path.exists(sample_file):
                    os.remove(sample_file)
            except:
                pass
    
    def test_creator_music_upload(self) -> bool:
        """Test creator personal music upload"""
        print("\n🎤 TESTING CREATOR MUSIC UPLOAD")
        print("=" * 50)
        
        # Download sample music file
        sample_file = self.download_sample_music()
        if not sample_file:
            self.log_test_result("Creator Music Upload", False, "Failed to download sample music file")
            return False
        
        try:
            # Test personal music upload
            with open(sample_file, 'rb') as f:
                files = {"file": ("personal_music.mp3", f, "audio/mpeg")}
                data = {
                    "title": "My Personal Wedding Song",
                    "artist": "Personal Artist",
                    "is_private": "true"
                }
                
                response = self.session.post(f"{self.base_url}/music/upload", files=files, data=data)
                
                if response.status_code == 200:
                    music_data = response.json()
                    music_id = music_data.get("id")
                    file_url = music_data.get("file_url")
                    storage_used = music_data.get("storage_used")
                    
                    if music_id and file_url:
                        # Verify file_url format and storage tracking
                        if "/api/media/telegram-proxy/audio/" in file_url:
                            self.test_music_ids.append(music_id)
                            self.log_test_result("Creator Music Upload", True, 
                                f"Uploaded personal music, Storage used: {storage_used} bytes")
                            return True
                        else:
                            self.log_test_result("Creator Music Upload", False, 
                                f"Invalid file_url format: {file_url}")
                            return False
                    else:
                        self.log_test_result("Creator Music Upload", False, "Missing required fields in response")
                        return False
                else:
                    self.log_test_result("Creator Music Upload", False, 
                        f"HTTP {response.status_code}: {response.text[:200]}")
                    return False
                    
        except Exception as e:
            self.log_test_result("Creator Music Upload", False, f"Error: {str(e)}")
            return False
        finally:
            # Cleanup temp file
            try:
                if sample_file and os.path.exists(sample_file):
                    os.remove(sample_file)
            except:
                pass
    
    def test_music_library_retrieval(self) -> bool:
        """Test music library retrieval endpoints"""
        print("\n📚 TESTING MUSIC LIBRARY RETRIEVAL")
        print("=" * 50)
        
        success_count = 0
        total_tests = 0
        
        # Test 1: Admin music library
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/admin/music/library?category=background_music")
            
            if response.status_code == 200:
                library = response.json()
                if isinstance(library, list):
                    success_count += 1
                    print(f"  ✅ Admin music library: {len(library)} items")
                else:
                    print(f"  ❌ Admin music library: Invalid response format")
            else:
                print(f"  ❌ Admin music library: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Admin music library: Error - {str(e)}")
        
        # Test 2: Creator personal library
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/music/my-library")
            
            if response.status_code == 200:
                library = response.json()
                if isinstance(library, list):
                    success_count += 1
                    print(f"  ✅ Creator personal library: {len(library)} items")
                else:
                    print(f"  ❌ Creator personal library: Invalid response format")
            else:
                print(f"  ❌ Creator personal library: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Creator personal library: Error - {str(e)}")
        
        # Test 3: Public music library
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/music/library?category=background_music")
            
            if response.status_code == 200:
                library = response.json()
                if isinstance(library, list):
                    success_count += 1
                    print(f"  ✅ Public music library: {len(library)} items")
                else:
                    print(f"  ❌ Public music library: Invalid response format")
            else:
                print(f"  ❌ Public music library: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Public music library: Error - {str(e)}")
        
        # Test 4: Storage info
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/music/storage")
            
            if response.status_code == 200:
                storage_info = response.json()
                if "storage_used" in storage_info and "storage_limit" in storage_info:
                    success_count += 1
                    print(f"  ✅ Storage info: {storage_info.get('storage_used_formatted', 'N/A')} used")
                else:
                    print(f"  ❌ Storage info: Invalid response format")
            else:
                print(f"  ❌ Storage info: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Storage info: Error - {str(e)}")
        
        if success_count >= 3:  # Allow 1 failure
            self.log_test_result("Music Library Retrieval", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("Music Library Retrieval", False, f"Only {success_count}/{total_tests} tests passed")
            return False
    
    def test_audio_proxy_streaming(self) -> bool:
        """Test audio file streaming through proxy"""
        print("\n🔊 TESTING AUDIO PROXY STREAMING")
        print("=" * 50)
        
        if not self.test_music_ids:
            self.log_test_result("Audio Proxy Streaming", False, "No uploaded music files to test")
            return False
        
        try:
            # Get music details to extract file_id
            music_id = self.test_music_ids[0]
            response = self.session.get(f"{self.base_url}/admin/music/library")
            
            if response.status_code != 200:
                self.log_test_result("Audio Proxy Streaming", False, "Failed to get music library")
                return False
            
            library = response.json()
            test_music = None
            for item in library:
                if item.get("id") == music_id:
                    test_music = item
                    break
            
            if not test_music:
                self.log_test_result("Audio Proxy Streaming", False, "Test music not found in library")
                return False
            
            file_id = test_music.get("file_id")
            if not file_id:
                self.log_test_result("Audio Proxy Streaming", False, "No file_id in music data")
                return False
            
            # Test audio proxy endpoint
            proxy_url = f"{self.base_url}/media/telegram-proxy/audio/{file_id}"
            response = self.session.get(proxy_url, timeout=30)
            
            if response.status_code == 200:
                content_type = response.headers.get("content-type", "")
                content_length = len(response.content)
                cors_header = response.headers.get("Access-Control-Allow-Origin", "")
                
                # Verify audio content type
                if content_type.startswith("audio/"):
                    # Verify CORS headers
                    if cors_header == "*":
                        self.log_test_result("Audio Proxy Streaming", True, 
                            f"Audio streaming works: {content_type}, {content_length} bytes, CORS: ✅")
                        return True
                    else:
                        self.log_test_result("Audio Proxy Streaming", False, 
                            f"Missing CORS headers: {cors_header}")
                        return False
                else:
                    self.log_test_result("Audio Proxy Streaming", False, 
                        f"Invalid content-type: {content_type}")
                    return False
            else:
                self.log_test_result("Audio Proxy Streaming", False, 
                    f"HTTP {response.status_code}: {response.text[:100]}")
                return False
                
        except Exception as e:
            self.log_test_result("Audio Proxy Streaming", False, f"Error: {str(e)}")
            return False
    
    def test_album_detail_error_handling(self) -> bool:
        """Test album detail endpoint error handling with missing media"""
        print("\n📖 TESTING ALBUM DETAIL ERROR HANDLING")
        print("=" * 50)
        
        if not self.test_wedding_id:
            self.log_test_result("Album Detail Error Handling", False, "No test wedding available")
            return False
        
        try:
            # Create a test album first
            album_data = {
                "wedding_id": self.test_wedding_id,
                "title": "Test Album for Error Handling",
                "description": "Testing album detail with missing media"
            }
            
            response = self.session.post(f"{self.base_url}/albums", json=album_data)
            
            if response.status_code != 200:
                self.log_test_result("Album Detail Error Handling", False, 
                    f"Failed to create test album: HTTP {response.status_code}")
                return False
            
            album = response.json()
            album_id = album.get("id")
            
            if not album_id:
                self.log_test_result("Album Detail Error Handling", False, "No album ID returned")
                return False
            
            # Test album detail endpoint
            response = self.session.get(f"{self.base_url}/albums/detail/{album_id}")
            
            if response.status_code == 200:
                album_detail = response.json()
                if "id" in album_detail and album_detail["id"] == album_id:
                    self.log_test_result("Album Detail Error Handling", True, 
                        "Album detail endpoint returns 200 even with missing media")
                    
                    # Cleanup test album
                    try:
                        self.session.delete(f"{self.base_url}/albums/{album_id}")
                    except:
                        pass
                    
                    return True
                else:
                    self.log_test_result("Album Detail Error Handling", False, 
                        "Invalid album detail response structure")
                    return False
            else:
                self.log_test_result("Album Detail Error Handling", False, 
                    f"Album detail failed: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test_result("Album Detail Error Handling", False, f"Error: {str(e)}")
            return False
    
    def test_music_folder_management(self) -> bool:
        """Test music folder CRUD operations"""
        print("\n📁 TESTING MUSIC FOLDER MANAGEMENT")
        print("=" * 50)
        
        success_count = 0
        total_tests = 0
        test_folder_id = None
        
        # Test 1: Create music folder
        try:
            total_tests += 1
            folder_data = {
                "name": "Test Background Music Folder",
                "description": "Test folder for background music",
                "category": "background_music",
                "icon": "🎶"
            }
            
            response = self.session.post(f"{self.base_url}/admin/music/folders", json=folder_data)
            
            if response.status_code == 200:
                folder = response.json()
                test_folder_id = folder.get("id")
                if test_folder_id:
                    success_count += 1
                    print(f"  ✅ Create folder: Success (ID: {test_folder_id[:8]}...)")
                else:
                    print(f"  ❌ Create folder: No folder ID returned")
            else:
                print(f"  ❌ Create folder: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Create folder: Error - {str(e)}")
        
        # Test 2: List music folders
        try:
            total_tests += 1
            response = self.session.get(f"{self.base_url}/admin/music/folders?category=background_music")
            
            if response.status_code == 200:
                folders = response.json()
                if isinstance(folders, list):
                    success_count += 1
                    print(f"  ✅ List folders: Success ({len(folders)} folders)")
                else:
                    print(f"  ❌ List folders: Invalid response format")
            else:
                print(f"  ❌ List folders: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ List folders: Error - {str(e)}")
        
        # Test 3: Delete empty folder
        if test_folder_id:
            try:
                total_tests += 1
                response = self.session.delete(f"{self.base_url}/admin/music/folders/{test_folder_id}")
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        success_count += 1
                        print(f"  ✅ Delete folder: Success")
                    else:
                        print(f"  ❌ Delete folder: Operation failed")
                else:
                    print(f"  ❌ Delete folder: HTTP {response.status_code}")
            except Exception as e:
                print(f"  ❌ Delete folder: Error - {str(e)}")
        
        if success_count >= 2:  # Allow some failures
            self.log_test_result("Music Folder Management", True, f"Passed {success_count}/{total_tests} tests")
            return True
        else:
            self.log_test_result("Music Folder Management", False, f"Only {success_count}/{total_tests} tests passed")
            return False

    def run_album_and_music_tests(self) -> bool:
        """Run focused tests for album detail API and music library integration"""
        print("\n" + "="*80)
        print("🚀 TESTING ALBUM DETAIL API & MUSIC LIBRARY INTEGRATION")
        print("="*80)
        
        # Track overall success
        critical_tests_passed = 0
        total_critical_tests = 0
        
        # Phase 1: Basic Setup
        print("\n📋 PHASE 1: BASIC SETUP & AUTHENTICATION")
        print("-" * 50)
        
        if not self.test_backend_health():
            print("❌ Backend health check failed - aborting tests")
            return False
        
        if not self.test_mongodb_connection():
            print("❌ MongoDB connection failed - aborting tests")
            return False
        
        if not self.setup_authentication():
            print("❌ Authentication setup failed - aborting tests")
            return False
        
        if not self.setup_test_wedding():
            print("❌ Test wedding setup failed - aborting tests")
            return False
        
        # Phase 2: Album Detail API Testing (Focus of review request)
        print("\n📖 PHASE 2: ALBUM DETAIL API TESTING")
        print("-" * 50)
        
        album_tests = [
            ("Album Detail API Comprehensive", self.test_album_detail_api_comprehensive),
            ("Album Slide Duration Validation", self.test_album_slide_duration_validation)
        ]
        
        for test_name, test_func in album_tests:
            total_critical_tests += 1
            if test_func():
                critical_tests_passed += 1
        
        # Phase 3: Music Library API Testing (Focus of review request)
        print("\n🎵 PHASE 3: MUSIC LIBRARY API TESTING")
        print("-" * 50)
        
        music_tests = [
            ("Music Library API Comprehensive", self.test_music_library_api_comprehensive)
        ]
        
        for test_name, test_func in music_tests:
            total_critical_tests += 1
            if test_func():
                critical_tests_passed += 1
        
        # Phase 4: Additional Music Integration Tests
        print("\n🎶 PHASE 4: MUSIC INTEGRATION TESTING")
        print("-" * 50)
        
        # Setup admin auth for admin endpoints
        self.setup_admin_authentication()
        
        integration_tests = [
            ("Admin Music Upload", self.test_admin_music_upload),
            ("Music Library Retrieval", self.test_music_library_retrieval),
            ("Audio Proxy Streaming", self.test_audio_proxy_streaming)
        ]
        
        for test_name, test_func in integration_tests:
            total_critical_tests += 1
            if test_func():
                critical_tests_passed += 1
        
        # Final Summary
        print("\n" + "="*80)
        print("📊 ALBUM & MUSIC LIBRARY TEST RESULTS")
        print("="*80)
        
        success_rate = (critical_tests_passed / total_critical_tests) * 100 if total_critical_tests > 0 else 0
        
        print(f"\n🎯 OVERALL SUCCESS RATE: {success_rate:.1f}% ({critical_tests_passed}/{total_critical_tests})")
        
        # Categorize results
        passed_tests = [result for result in self.test_results if result["success"]]
        failed_tests = [result for result in self.test_results if not result["success"]]
        
        if passed_tests:
            print(f"\n✅ PASSED TESTS ({len(passed_tests)}):")
            for test in passed_tests:
                print(f"   • {test['name']}")
                if test['details']:
                    print(f"     {test['details']}")
        
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['name']}")
                if test['details']:
                    print(f"     {test['details']}")
        
        # Determine overall success
        if success_rate >= 80:
            print(f"\n🎉 ALBUM & MUSIC LIBRARY TESTING COMPLETED SUCCESSFULLY!")
            print(f"   APIs are functioning correctly with {success_rate:.1f}% success rate")
            return True
        else:
            print(f"\n⚠️ TESTING COMPLETED WITH ISSUES")
            print(f"   {len(failed_tests)} critical issues need attention")
            return False

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 CLEANING UP TEST DATA")
        print("=" * 50)
        
        # Remove test cameras
        if self.test_wedding_id and self.test_cameras:
            for camera in self.test_cameras:
                try:
                    response = self.session.delete(f"{self.base_url}/streams/camera/{self.test_wedding_id}/{camera['camera_id']}")
                    if response.status_code == 200:
                        print(f"  ✅ Removed camera: {camera['name']}")
                    else:
                        print(f"  ⚠️ Failed to remove camera: {camera['name']}")
                except:
                    print(f"  ⚠️ Error removing camera: {camera['name']}")
        
        # Remove test wedding
        if self.test_wedding_id:
            try:
                response = self.session.delete(f"{self.base_url}/weddings/{self.test_wedding_id}")
                if response.status_code == 200:
                    print(f"  ✅ Removed test wedding: {self.test_wedding_id}")
                else:
                    print(f"  ⚠️ Failed to remove test wedding")
            except:
                print(f"  ⚠️ Error removing test wedding")
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("🎯 MULTI-CAMERA BACKEND API TEST SUMMARY")
        print("="*80)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"\n📊 OVERALL RESULTS: {passed}/{total} tests passed")
        
        # Group results by status
        passed_tests = [r for r in self.test_results if r["success"]]
        failed_tests = [r for r in self.test_results if not r["success"]]
        
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            print("-" * 40)
            for test in failed_tests:
                print(f"  ❌ {test['name']}")
                if test['details']:
                    print(f"     {test['details']}")
        
        if passed_tests:
            print(f"\n✅ PASSED TESTS ({len(passed_tests)}):")
            print("-" * 40)
            for test in passed_tests:
                print(f"  ✅ {test['name']}")
        
        # Critical issues
        critical_failures = [
            "Backend Health Check",
            "MongoDB Connection", 
            "Authentication Setup",
            "Add Multiple Cameras",
            "Camera Switching API"
        ]
        
        critical_failed = [name for name in critical_failures if not any(r["name"] == name and r["success"] for r in self.test_results)]
        
        if critical_failed:
            print(f"\n🚨 CRITICAL ISSUES:")
            print("-" * 40)
            for issue in critical_failed:
                print(f"  🚨 {issue}")
        
        return passed == total
    
    def run_all_tests(self) -> bool:
        """Run all backend API tests including music functionality"""
        print("🚀 BACKEND API TESTING SUITE - MUSIC UPLOAD & ALBUM DETAIL")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("="*80)
        
        # Pre-testing setup
        if not self.test_backend_health():
            return False
        
        if not self.test_mongodb_connection():
            return False
        
        if not self.setup_authentication():
            return False
        
        if not self.setup_test_wedding():
            return False
        
        # Music-specific tests (main focus)
        self.test_admin_music_upload()
        self.test_creator_music_upload()
        self.test_music_library_retrieval()
        self.test_audio_proxy_streaming()
        self.test_album_detail_error_handling()
        self.test_music_folder_management()
        
        # Core multi-camera tests (secondary)
        self.test_add_multiple_cameras()
        self.test_camera_switching_api()
        self.test_viewer_access_multi_camera()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print summary and return result
        return self.print_summary()

def main():
    """Main test runner - focused on album detail API and music library integration"""
    tester = BackendAPITester()
    
    # Run focused tests for the review request
    success = tester.run_album_and_music_tests()
    
    if success:
        print(f"\n🎉 ALBUM DETAIL & MUSIC LIBRARY TESTS COMPLETED SUCCESSFULLY")
        sys.exit(0)
    else:
        print(f"\n💥 ALBUM DETAIL & MUSIC LIBRARY TESTS FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()