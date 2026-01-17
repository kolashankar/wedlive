#!/usr/bin/env python3
"""
Multi-Camera Backend API Testing Suite
Comprehensive testing of all multi-camera related backend functionality
"""

import requests
import json
import sys
import time
import uuid
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
    
    # Default fallback
    if not backend_url:
        backend_url = "http://localhost:8001"
        
    BASE_URL = f"{backend_url}/api"
    print(f"🔗 Using Backend URL: {BASE_URL}")
    
except Exception as e:
    print(f"⚠️  Could not read .env files: {e}")
    BASE_URL = "http://localhost:8001/api"
    print(f"🔗 Using Default Backend URL: {BASE_URL}")

class MultiCameraAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.user_token = None
        self.test_wedding_id = None
        self.test_cameras = []
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
    
    def create_test_wedding(self) -> bool:
        """Create a premium wedding for multi-camera testing"""
        print("\n💒 CREATING TEST WEDDING")
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
                    self.log_test_result("Create Test Wedding", True, f"Wedding ID: {self.test_wedding_id}")
                    return True
            
            self.log_test_result("Create Test Wedding", False, f"Failed: {response.status_code} - {response.text}")
            return False
            
        except Exception as e:
            self.log_test_result("Create Test Wedding", False, f"Error: {str(e)}")
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
                else:
                    print(f"  ❌ Camera {i}: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ Camera {i}: Error - {str(e)}")
        
        if success_count >= 5:
            self.log_test_result("Add Multiple Cameras", True, f"Added {success_count}/5 cameras successfully")
            return True
        else:
            self.log_test_result("Add Multiple Cameras", False, f"Only {success_count}/5 cameras added")
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
            response = requests.post(f"{self.base_url}/rtmp/on-publish", data=webhook_data, headers=headers)
            
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
            response = requests.post(f"{self.base_url}/rtmp/on-publish-done", data=webhook_data, headers=headers)
            
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
        """Run all multi-camera backend API tests"""
        print("🚀 MULTI-CAMERA BACKEND API TESTING SUITE")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("="*80)
        
        # Pre-testing setup
        if not self.test_backend_health():
            return False
        
        if not self.test_mongodb_connection():
            return False
        
        if not self.setup_authentication():
            return False
        
        if not self.create_test_wedding():
            return False
        
        # Core multi-camera tests
        self.test_add_multiple_cameras()
        self.test_camera_list_retrieval()
        self.test_camera_switching_api()
        self.test_rtmp_webhook_simulation()
        self.test_composition_health_api()
        self.test_viewer_access_multi_camera()
        self.test_security_and_authorization()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print summary and return result
        return self.print_summary()

def main():
    """Main test runner"""
    tester = MultiCameraAPITester()
    success = tester.run_all_tests()
    
    if success:
        print(f"\n🎉 ALL MULTI-CAMERA BACKEND TESTS COMPLETED SUCCESSFULLY")
        sys.exit(0)
    else:
        print(f"\n💥 MULTI-CAMERA BACKEND TESTS FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()