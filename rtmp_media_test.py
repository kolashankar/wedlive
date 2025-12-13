#!/usr/bin/env python3
"""
Focused Testing for RTMP Stream Key Format and Media Upload 500 Error
Tests the two critical fixes requested in the review
"""

import asyncio
import aiohttp
import json
import os
import base64
import tempfile
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from environment
BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL", "https://photo-borders.preview.emergentagent.com")
API_BASE = f"{BACKEND_URL}/api"

class RTMPMediaTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_user_id = None
        self.test_wedding_id = None
        self.results = {
            "rtmp_format": {"passed": 0, "failed": 0, "errors": []},
            "media_upload": {"passed": 0, "failed": 0, "errors": []}
        }
    
    async def setup(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        print(f"🔧 Testing backend at: {API_BASE}")
    
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
                for key, (filename, file_data, content_type) in files.items():
                    form_data.add_field(key, file_data, filename=filename, content_type=content_type)
            
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
    
    async def register_and_login(self):
        """Register a test user and login"""
        test_email = f"rtmptest_{datetime.now().strftime('%Y%m%d_%H%M%S')}@wedlive.app"
        user_data = {
            "email": test_email,
            "password": "WedLiveTest2024!",
            "full_name": "RTMP Test User"
        }
        
        success, response, status = await self.make_request("POST", "/auth/register", user_data)
        
        if success and status == 201:
            if "access_token" in response and "user" in response:
                self.auth_token = response["access_token"]
                self.test_user_id = response["user"]["id"]
                print(f"✅ User registered and logged in: {test_email}")
                return True
            else:
                print(f"❌ Registration failed: Missing access_token or user in response")
        else:
            print(f"❌ Registration failed: Status {status}: {response}")
        
        return False
    
    async def create_test_wedding(self):
        """Create a test wedding event"""
        if not self.auth_token:
            print("❌ Cannot create wedding: No auth token")
            return False
        
        wedding_data = {
            "title": "Emma & Michael's Wedding",
            "description": "Testing RTMP stream key format",
            "bride_name": "Emma Wilson",
            "groom_name": "Michael Johnson",
            "scheduled_date": "2024-12-25T15:00:00Z",
            "location": "Grand Ballroom, Hotel Paradise",
            "cover_image": "https://example.com/wedding-cover.jpg"
        }
        
        success, response, status = await self.make_request("POST", "/weddings/", wedding_data)
        
        if success and status == 201:
            if "id" in response and "stream_credentials" in response:
                self.test_wedding_id = response["id"]
                print(f"✅ Wedding created: {response['title']}")
                return response
            else:
                print(f"❌ Wedding creation failed: Missing id or stream_credentials")
        else:
            print(f"❌ Wedding creation failed: Status {status}: {response}")
        
        return False
    
    # ==================== TEST 1: RTMP STREAM KEY FORMAT ====================
    
    async def test_rtmp_stream_key_format(self):
        """Test 1: Verify RTMP stream key is in YouTube-style format"""
        print("\n🔍 TEST 1: RTMP Stream Key Format")
        print("=" * 50)
        
        # Step 1: Register and login
        if not await self.register_and_login():
            self.log_result("rtmp_format", "User Registration/Login", False, "Failed to register test user")
            return
        
        # Step 2: Create wedding event
        wedding_response = await self.create_test_wedding()
        if not wedding_response:
            self.log_result("rtmp_format", "Wedding Creation", False, "Failed to create test wedding")
            return
        
        # Step 3: Verify stream credentials format
        stream_creds = wedding_response.get("stream_credentials", {})
        rtmp_url = stream_creds.get("rtmp_url")
        stream_key = stream_creds.get("stream_key")
        
        print(f"📋 RTMP URL: {rtmp_url}")
        print(f"📋 Stream Key: {stream_key}")
        
        # Test 3.1: RTMP URL format
        expected_rtmp_url = "rtmp://live.wedlive.app/live"
        if rtmp_url == expected_rtmp_url:
            self.log_result("rtmp_format", "RTMP URL Format", True)
        else:
            self.log_result("rtmp_format", "RTMP URL Format", False, 
                          f"Expected '{expected_rtmp_url}', got '{rtmp_url}'")
        
        # Test 3.2: Stream Key Format (xxxxx-xxxx-xxxx-xxxx-xxxxx)
        if stream_key:
            # Check YouTube-style format: 5-4-4-4-5 characters with hyphens
            parts = stream_key.split('-')
            if (len(parts) == 5 and 
                len(parts[0]) == 5 and len(parts[1]) == 4 and len(parts[2]) == 4 and 
                len(parts[3]) == 4 and len(parts[4]) == 5 and
                all(part.isalnum() for part in parts)):
                
                self.log_result("rtmp_format", "Stream Key Format (YouTube-style)", True)
                print(f"   ✅ Format: {len(parts[0])}-{len(parts[1])}-{len(parts[2])}-{len(parts[3])}-{len(parts[4])} characters")
            else:
                # Show detailed format analysis
                if len(parts) == 5:
                    actual_format = f"{len(parts[0])}-{len(parts[1])}-{len(parts[2])}-{len(parts[3])}-{len(parts[4])}"
                    self.log_result("rtmp_format", "Stream Key Format (YouTube-style)", False, 
                                  f"Wrong character count. Expected 5-4-4-4-5, got {actual_format} in '{stream_key}'")
                else:
                    self.log_result("rtmp_format", "Stream Key Format (YouTube-style)", False, 
                                  f"Wrong segment count. Expected 5 segments, got {len(parts)} in '{stream_key}'")
        else:
            self.log_result("rtmp_format", "Stream Key Format (YouTube-style)", False, "Stream key is empty")
        
        # Test 3.3: No query parameters in stream key
        if stream_key and ('?' not in stream_key and '&' not in stream_key and 'api_key=' not in stream_key):
            self.log_result("rtmp_format", "Stream Key No Query Parameters", True)
        else:
            self.log_result("rtmp_format", "Stream Key No Query Parameters", False, 
                          f"Stream key contains query parameters: {stream_key}")
        
        # Test 3.4: Stream key is not JWT format
        if stream_key and not (stream_key.count('.') >= 2 and len(stream_key) > 50):
            self.log_result("rtmp_format", "Stream Key Not JWT Format", True)
        else:
            self.log_result("rtmp_format", "Stream Key Not JWT Format", False, 
                          f"Stream key appears to be JWT format: {stream_key}")
    
    # ==================== TEST 2: MEDIA UPLOAD 500 ERROR DEBUGGING ====================
    
    def create_test_image_base64(self) -> bytes:
        """Create a small test image (1x1 pixel JPEG) from base64"""
        # Minimal 1x1 JPEG image (base64 encoded) - properly padded
        jpeg_base64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A=="
        return base64.b64decode(jpeg_base64)
    
    async def test_media_upload_500_error(self):
        """Test 2: Debug media upload 500 error"""
        print("\n🔍 TEST 2: Media Upload 500 Error Debugging")
        print("=" * 50)
        
        if not self.auth_token or not self.test_wedding_id:
            print("❌ Cannot test media upload: Missing auth token or wedding ID")
            return
        
        # Step 1: Create small test image
        print("📋 Creating test image file...")
        image_data = self.create_test_image_base64()
        print(f"📋 Test image size: {len(image_data)} bytes")
        
        # Step 2: Attempt photo upload
        print("📋 Attempting photo upload...")
        files = {'file': ('test_upload.jpg', image_data, 'image/jpeg')}
        data = {
            'wedding_id': self.test_wedding_id,
            'caption': 'Test upload for Emma & Michael\'s Wedding'
        }
        
        success, response, status = await self.make_multipart_request("POST", "/media/upload/photo", files=files, data=data)
        
        print(f"📋 Upload Response Status: {status}")
        print(f"📋 Upload Response: {response}")
        
        # Step 3: Analyze response
        if status == 500:
            self.log_result("media_upload", "500 Error Detected", True)
            print("   ✅ 500 error confirmed - analyzing error details...")
            
            # Check for specific error patterns
            response_str = str(response).lower()
            
            if "telegram" in response_str:
                self.log_result("media_upload", "Telegram-related Error", True)
                print("   ✅ Error is Telegram-related")
                
                if "bot token" in response_str or "unauthorized" in response_str:
                    self.log_result("media_upload", "Telegram Bot Token Issue", True)
                    print("   ✅ Issue: Telegram bot token authentication")
                elif "channel" in response_str or "chat" in response_str:
                    self.log_result("media_upload", "Telegram Channel Issue", True)
                    print("   ✅ Issue: Telegram channel access")
                elif "file size" in response_str or "too large" in response_str:
                    self.log_result("media_upload", "File Size Issue", True)
                    print("   ✅ Issue: File size restrictions")
                else:
                    self.log_result("media_upload", "Other Telegram Issue", True)
                    print("   ✅ Issue: Other Telegram API problem")
            
            elif "permission" in response_str or "forbidden" in response_str:
                self.log_result("media_upload", "Permission Error", True)
                print("   ✅ Issue: Permission/authorization problem")
            
            elif "database" in response_str or "mongo" in response_str:
                self.log_result("media_upload", "Database Error", True)
                print("   ✅ Issue: Database connection/operation problem")
            
            else:
                self.log_result("media_upload", "Unknown 500 Error", True)
                print("   ✅ Issue: Unknown server error")
            
        elif status == 201:
            self.log_result("media_upload", "Upload Successful", True)
            print("   ✅ Upload completed successfully!")
            
            # Verify response structure
            if isinstance(response, dict) and "file_id" in response and "file_url" in response:
                self.log_result("media_upload", "Response Structure Valid", True)
                print(f"   ✅ File ID: {response.get('file_id')}")
                print(f"   ✅ File URL: {response.get('file_url')}")
            else:
                self.log_result("media_upload", "Response Structure Invalid", False, 
                              "Missing file_id or file_url in successful response")
        
        elif status == 400:
            self.log_result("media_upload", "400 Bad Request", True)
            print("   ✅ 400 error - likely validation issue")
            print(f"   📋 Error details: {response}")
        
        elif status == 403:
            self.log_result("media_upload", "403 Forbidden", True)
            print("   ✅ 403 error - authorization issue")
            print(f"   📋 Error details: {response}")
        
        elif status == 404:
            self.log_result("media_upload", "404 Not Found", True)
            print("   ✅ 404 error - wedding not found")
            print(f"   📋 Error details: {response}")
        
        else:
            self.log_result("media_upload", f"Unexpected Status {status}", True)
            print(f"   ✅ Unexpected status code: {status}")
            print(f"   📋 Response: {response}")
    
    async def check_backend_logs(self):
        """Check backend logs for upload errors"""
        print("\n📋 Checking backend logs for [UPLOAD] messages...")
        
        try:
            # Check supervisor backend logs
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
                capture_output=True, text=True, timeout=10
            )
            
            if result.returncode == 0:
                log_lines = result.stdout.strip().split('\n')
                upload_logs = [line for line in log_lines if '[UPLOAD]' in line]
                
                if upload_logs:
                    print("📋 Recent [UPLOAD] log entries:")
                    for log in upload_logs[-10:]:  # Show last 10 upload logs
                        print(f"   {log}")
                else:
                    print("📋 No [UPLOAD] log entries found in recent logs")
            else:
                print("📋 Could not read backend error logs")
                
        except Exception as e:
            print(f"📋 Error reading logs: {str(e)}")
    
    async def run_tests(self):
        """Run all tests"""
        print("🚀 Starting RTMP Stream Key & Media Upload Tests")
        print("=" * 60)
        
        await self.setup()
        
        try:
            # Test 1: RTMP Stream Key Format
            await self.test_rtmp_stream_key_format()
            
            # Test 2: Media Upload 500 Error
            await self.test_media_upload_500_error()
            
            # Check backend logs
            await self.check_backend_logs()
            
        finally:
            await self.cleanup()
        
        # Print summary
        print("\n📊 TEST SUMMARY")
        print("=" * 30)
        
        for category, results in self.results.items():
            total = results["passed"] + results["failed"]
            print(f"{category.upper()}: {results['passed']}/{total} passed")
            
            if results["errors"]:
                print(f"  Errors:")
                for error in results["errors"]:
                    print(f"    - {error}")
        
        # Overall result
        total_passed = sum(r["passed"] for r in self.results.values())
        total_tests = sum(r["passed"] + r["failed"] for r in self.results.values())
        
        if total_passed == total_tests:
            print(f"\n✅ ALL TESTS PASSED ({total_passed}/{total_tests})")
        else:
            print(f"\n❌ SOME TESTS FAILED ({total_passed}/{total_tests})")
            
        return total_passed == total_tests

async def main():
    """Main test runner"""
    tester = RTMPMediaTester()
    success = await tester.run_tests()
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(asyncio.run(main()))