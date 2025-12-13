#!/usr/bin/env python3
"""
WedLive Backend Fixes Testing - December 2024
Tests specific fixes for RTMP credentials, API routing, and media upload
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import sys
sys.path.append('/app/backend')

# Get backend URL from environment
BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL", "https://photo-borders.preview.emergentagent.com")
API_BASE = f"{BACKEND_URL}/api"

class WedLiveFixesTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_user_id = None
        self.test_wedding_id = None
        self.results = {
            "rtmp_credentials": {"passed": 0, "failed": 0, "errors": []},
            "plan_endpoints": {"passed": 0, "failed": 0, "errors": []},
            "cameras_endpoint": {"passed": 0, "failed": 0, "errors": []},
            "media_upload": {"passed": 0, "failed": 0, "errors": []},
            "obs_rtmp": {"passed": 0, "failed": 0, "errors": []}
        }
    
    async def setup(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        print(f"🔧 Testing WedLive fixes at: {API_BASE}")
    
    async def cleanup(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
    
    def log_result(self, category: str, test_name: str, success: bool, error: str = None):
        """Log test result"""
        if success:
            self.results[category]["passed"] += 1
            print(f"✅ {test_name}")
        else:
            self.results[category]["failed"] += 1
            self.results[category]["errors"].append(f"{test_name}: {error}")
            print(f"❌ {test_name}: {error}")
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{API_BASE}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if headers:
            request_headers.update(headers)
        
        if self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            async with self.session.request(
                method, url, 
                json=data if data else None,
                headers=request_headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                try:
                    response_data = await response.json()
                except:
                    response_data = await response.text()
                
                return response.status < 400, response_data, response.status
        except Exception as e:
            return False, str(e), 0
    
    async def setup_test_user_and_wedding(self):
        """Create test user and wedding for testing"""
        # Register test user
        test_email = f"wedlive_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
        user_data = {
            "email": test_email,
            "password": "WedLiveTest123!",
            "full_name": "WedLive Test User"
        }
        
        success, response, status = await self.make_request("POST", "/auth/register", user_data)
        
        if success and status == 201:
            self.auth_token = response["access_token"]
            self.test_user_id = response["user"]["id"]
            print(f"✅ Test user created: {test_email}")
        else:
            print(f"❌ Failed to create test user: {response}")
            return False
        
        # Create test wedding
        wedding_data = {
            "title": "Emma & Michael's Wedding",
            "description": "A beautiful celebration of love and commitment",
            "bride_name": "Emma Thompson",
            "groom_name": "Michael Johnson",
            "scheduled_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "location": "Grand Ballroom, Marriott Hotel",
            "cover_image": "https://example.com/wedding-cover.jpg"
        }
        
        success, response, status = await self.make_request("POST", "/weddings/", wedding_data)
        
        if success and status == 201:
            self.test_wedding_id = response["id"]
            print(f"✅ Test wedding created: {self.test_wedding_id}")
            return True
        else:
            print(f"❌ Failed to create test wedding: {response}")
            return False
    
    # ==================== RTMP CREDENTIALS TESTS ====================
    
    async def test_wedding_rtmp_credentials_in_get_wedding(self):
        """Test GET /api/weddings/{wedding_id} returns stream_credentials for creator"""
        if not self.auth_token or not self.test_wedding_id:
            self.log_result("rtmp_credentials", "Wedding RTMP Credentials in GET", False, "Missing auth or wedding")
            return False
        
        success, response, status = await self.make_request("GET", f"/weddings/{self.test_wedding_id}")
        
        if success and status == 200:
            if "stream_credentials" in response:
                creds = response["stream_credentials"]
                if ("rtmp_url" in creds and "stream_key" in creds and "playback_url" in creds):
                    if creds["rtmp_url"] and creds["stream_key"]:
                        self.log_result("rtmp_credentials", "Wedding RTMP Credentials in GET", True)
                        print(f"   ✅ RTMP URL: {creds['rtmp_url']}")
                        print(f"   ✅ Stream Key: {creds['stream_key'][:20]}...")
                        print(f"   ✅ Playback URL: {creds.get('playback_url', 'None')}")
                        return True
                    else:
                        self.log_result("rtmp_credentials", "Wedding RTMP Credentials in GET", False, 
                                      "Empty RTMP credentials")
                else:
                    self.log_result("rtmp_credentials", "Wedding RTMP Credentials in GET", False, 
                                  f"Missing RTMP fields: {list(creds.keys())}")
            else:
                self.log_result("rtmp_credentials", "Wedding RTMP Credentials in GET", False, 
                              "No stream_credentials in response")
        else:
            self.log_result("rtmp_credentials", "Wedding RTMP Credentials in GET", False, 
                          f"Status {status}: {response}")
        
        return False
    
    async def test_main_camera_rtmp_endpoint(self):
        """Test NEW endpoint GET /api/weddings/{wedding_id}/main-camera/rtmp"""
        if not self.test_wedding_id:
            self.log_result("rtmp_credentials", "Main Camera RTMP Endpoint", False, "No wedding ID")
            return False
        
        success, response, status = await self.make_request("GET", f"/weddings/{self.test_wedding_id}/main-camera/rtmp")
        
        if success and status == 200:
            if ("server" in response and "streamKey" in response and "playbackUrl" in response):
                if response["server"] and response["streamKey"]:
                    self.log_result("rtmp_credentials", "Main Camera RTMP Endpoint", True)
                    print(f"   ✅ Server: {response['server']}")
                    print(f"   ✅ Stream Key: {response['streamKey'][:20]}...")
                    print(f"   ✅ Playback URL: {response.get('playbackUrl', 'None')}")
                    return True
                else:
                    self.log_result("rtmp_credentials", "Main Camera RTMP Endpoint", False, 
                                  "Empty server or streamKey")
            else:
                self.log_result("rtmp_credentials", "Main Camera RTMP Endpoint", False, 
                              f"Missing required fields: {list(response.keys())}")
        else:
            self.log_result("rtmp_credentials", "Main Camera RTMP Endpoint", False, 
                          f"Status {status}: {response}")
        
        return False
    
    # ==================== PLAN ENDPOINTS TESTS ====================
    
    async def test_plan_storage_stats(self):
        """Test GET /api/plan/storage/stats"""
        if not self.auth_token:
            self.log_result("plan_endpoints", "Plan Storage Stats", False, "No auth token")
            return False
        
        success, response, status = await self.make_request("GET", "/plan/storage/stats")
        
        if success and status == 200:
            if isinstance(response, dict) and ("plan" in response or "storage_limit" in response):
                self.log_result("plan_endpoints", "Plan Storage Stats", True)
                print(f"   ✅ Response keys: {list(response.keys())}")
                return True
            else:
                self.log_result("plan_endpoints", "Plan Storage Stats", False, 
                              f"Invalid response structure: {response}")
        else:
            self.log_result("plan_endpoints", "Plan Storage Stats", False, 
                          f"Status {status}: {response}")
        
        return False
    
    async def test_plan_plan_info(self):
        """Test GET /api/plan/plan/info"""
        if not self.auth_token:
            self.log_result("plan_endpoints", "Plan Plan Info", False, "No auth token")
            return False
        
        success, response, status = await self.make_request("GET", "/plan/plan/info")
        
        if success and status == 200:
            if isinstance(response, dict):
                self.log_result("plan_endpoints", "Plan Plan Info", True)
                print(f"   ✅ Response keys: {list(response.keys())}")
                return True
            else:
                self.log_result("plan_endpoints", "Plan Plan Info", False, 
                              f"Invalid response structure: {response}")
        else:
            self.log_result("plan_endpoints", "Plan Plan Info", False, 
                          f"Status {status}: {response}")
        
        return False
    
    async def test_plans_info(self):
        """Test GET /api/plans/info"""
        if not self.auth_token:
            self.log_result("plan_endpoints", "Plans Info", False, "No auth token")
            return False
        
        success, response, status = await self.make_request("GET", "/plans/info")
        
        if success and status == 200:
            if isinstance(response, dict):
                self.log_result("plan_endpoints", "Plans Info", True)
                print(f"   ✅ Response keys: {list(response.keys())}")
                return True
            else:
                self.log_result("plan_endpoints", "Plans Info", False, 
                              f"Invalid response structure: {response}")
        else:
            self.log_result("plan_endpoints", "Plans Info", False, 
                          f"Status {status}: {response}")
        
        return False
    
    # ==================== CAMERAS ENDPOINT TEST ====================
    
    async def test_cameras_endpoint(self):
        """Test GET /api/streams/{wedding_id}/cameras"""
        if not self.auth_token or not self.test_wedding_id:
            self.log_result("cameras_endpoint", "Cameras Endpoint", False, "Missing auth or wedding")
            return False
        
        success, response, status = await self.make_request("GET", f"/streams/{self.test_wedding_id}/cameras")
        
        if success and status == 200:
            if isinstance(response, list):
                self.log_result("cameras_endpoint", "Cameras Endpoint", True)
                print(f"   ✅ Cameras array returned: {len(response)} cameras")
                return True
            else:
                self.log_result("cameras_endpoint", "Cameras Endpoint", False, 
                              f"Response is not an array: {type(response)}")
        else:
            self.log_result("cameras_endpoint", "Cameras Endpoint", False, 
                          f"Status {status}: {response}")
        
        return False
    
    # ==================== MEDIA UPLOAD TEST ====================
    
    async def create_test_image_file(self) -> bytes:
        """Create a small test image file (1x1 pixel PNG)"""
        # Minimal 1x1 PNG file (67 bytes)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc```\x00\x04\x00\x01\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
        return png_data
    
    async def make_multipart_request(self, method: str, endpoint: str, files: dict = None, data: dict = None) -> tuple:
        """Make multipart/form-data HTTP request for file uploads"""
        url = f"{API_BASE}{endpoint}"
        request_headers = {}
        
        if self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            form_data = aiohttp.FormData()
            
            # Add form fields
            if data:
                for key, value in data.items():
                    form_data.add_field(key, str(value))
            
            # Add files
            if files:
                for field_name, (filename, file_data, content_type) in files.items():
                    form_data.add_field(field_name, file_data, filename=filename, content_type=content_type)
            
            async with self.session.request(
                method, url,
                data=form_data,
                headers=request_headers,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                try:
                    response_data = await response.json()
                except:
                    response_data = await response.text()
                
                return response.status < 400, response_data, response.status
        except Exception as e:
            return False, str(e), 0
    
    async def test_media_upload_photo(self):
        """Test POST /api/media/upload/photo with test image"""
        if not self.auth_token or not self.test_wedding_id:
            self.log_result("media_upload", "Photo Upload Test", False, "Missing auth or wedding")
            return False
        
        try:
            image_data = await self.create_test_image_file()
            files = {'file': ('wedding_photo.png', image_data, 'image/png')}
            data = {
                'wedding_id': self.test_wedding_id,
                'caption': 'Beautiful moment from Emma & Michael\'s wedding'
            }
            
            success, response, status = await self.make_multipart_request("POST", "/media/upload/photo", files=files, data=data)
            
            if status == 201:
                # Success - Telegram credentials are working
                if "file_id" in response and "file_url" in response:
                    self.log_result("media_upload", "Photo Upload Test", True)
                    print(f"   ✅ Photo uploaded successfully - file_id: {response.get('file_id')}")
                    return True
                else:
                    self.log_result("media_upload", "Photo Upload Test", False, 
                                  "Missing file_id or file_url in response")
            elif status == 500:
                # Expected failure - capture exact error message
                error_msg = str(response)
                self.log_result("media_upload", "Photo Upload Test", False, 
                              f"500 ERROR - {error_msg}")
                print(f"   📋 EXACT ERROR MESSAGE: {error_msg}")
                return False
            else:
                self.log_result("media_upload", "Photo Upload Test", False, 
                              f"Status {status}: {response}")
        except Exception as e:
            self.log_result("media_upload", "Photo Upload Test", False, f"Exception: {str(e)}")
        
        return False
    
    # ==================== OBS RTMP VALIDATION ====================
    
    async def test_obs_rtmp_format_validation(self):
        """Test RTMP URL format and JWT token validation for OBS"""
        if not self.test_wedding_id:
            self.log_result("obs_rtmp", "OBS RTMP Format Validation", False, "No wedding ID")
            return False
        
        # Get RTMP credentials from wedding
        success, response, status = await self.make_request("GET", f"/weddings/{self.test_wedding_id}")
        
        if success and status == 200 and "stream_credentials" in response:
            creds = response["stream_credentials"]
            rtmp_url = creds.get("rtmp_url", "")
            stream_key = creds.get("stream_key", "")
            
            # Validate RTMP URL format
            expected_rtmp_format = "rtmp://stream-io-rtmp.stream-io-api.com/live"
            if rtmp_url == expected_rtmp_format or "stream-io" in rtmp_url:
                # Validate stream key is JWT format (has 3 parts separated by dots)
                if stream_key and len(stream_key.split('.')) == 3:
                    self.log_result("obs_rtmp", "OBS RTMP Format Validation", True)
                    print(f"   ✅ RTMP URL format correct: {rtmp_url}")
                    print(f"   ✅ Stream key is valid JWT format")
                    return True
                else:
                    self.log_result("obs_rtmp", "OBS RTMP Format Validation", False, 
                                  f"Stream key is not JWT format: {stream_key[:20]}...")
            else:
                self.log_result("obs_rtmp", "OBS RTMP Format Validation", False, 
                              f"Wrong RTMP URL format: {rtmp_url}")
        else:
            self.log_result("obs_rtmp", "OBS RTMP Format Validation", False, 
                          "Could not get wedding credentials")
        
        return False
    
    # ==================== MAIN TEST RUNNER ====================
    
    async def run_all_tests(self):
        """Run all WedLive fixes tests"""
        print("🚀 Starting WedLive Fixes Testing - December 2024")
        print("=" * 60)
        
        # Setup test environment
        if not await self.setup_test_user_and_wedding():
            print("❌ Failed to setup test environment")
            return
        
        print("\n🔑 RTMP CREDENTIALS TESTS")
        print("-" * 40)
        await self.test_wedding_rtmp_credentials_in_get_wedding()
        await self.test_main_camera_rtmp_endpoint()
        
        print("\n📋 PLAN ENDPOINTS TESTS")
        print("-" * 40)
        await self.test_plan_storage_stats()
        await self.test_plan_plan_info()
        await self.test_plans_info()
        
        print("\n📹 CAMERAS ENDPOINT TEST")
        print("-" * 40)
        await self.test_cameras_endpoint()
        
        print("\n📸 MEDIA UPLOAD TEST")
        print("-" * 40)
        await self.test_media_upload_photo()
        
        print("\n🎥 OBS RTMP VALIDATION")
        print("-" * 40)
        await self.test_obs_rtmp_format_validation()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            status_icon = "✅" if failed == 0 else "❌"
            print(f"{status_icon} {category.upper().replace('_', ' ')}: {passed} passed, {failed} failed")
            
            if results["errors"]:
                for error in results["errors"]:
                    print(f"   • {error}")
        
        print("-" * 60)
        print(f"TOTAL: {total_passed} passed, {total_failed} failed")
        
        if total_failed > 0:
            print(f"\n⚠️  {total_failed} tests failed. Please review the issues above.")
        else:
            print(f"\n🎉 All tests passed! WedLive fixes are working correctly.")

async def main():
    tester = WedLiveFixesTester()
    await tester.setup()
    
    try:
        await tester.run_all_tests()
    finally:
        await tester.cleanup()

if __name__ == "__main__":
    asyncio.run(main())