#!/usr/bin/env python3
"""
Focused test for the specific review request endpoints
"""

import asyncio
import aiohttp
import json
import os
import sys
import tempfile
from datetime import datetime, timedelta

# Add backend to path
sys.path.append('/app/backend')
from app.database import get_db, init_db, close_db

# Import PIL for creating test images
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("⚠️  PIL not available - image upload tests will be skipped")

# Get backend URL from environment
BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL", "https://youstream-91.preview.emergentagent.com")
API_BASE = f"{BACKEND_URL}/api"

class FocusedTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_user_id = None
        self.test_wedding_id = None
        self.test_studio_id = None
    
    async def setup(self):
        """Initialize HTTP session and database connection"""
        self.session = aiohttp.ClientSession()
        print(f"🔧 Testing backend at: {API_BASE}")
        
        try:
            await init_db()
            print("✅ Database connection initialized for testing")
        except Exception as e:
            print(f"⚠️  Database connection failed: {e}")
    
    async def cleanup(self):
        """Close HTTP session and database connection"""
        if self.session:
            await self.session.close()
        
        try:
            await close_db()
            print("✅ Database connection closed")
        except Exception as e:
            print(f"⚠️  Database cleanup failed: {e}")
    
    async def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None) -> tuple:
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
    
    async def register_and_login(self):
        """Register a test user and get auth token"""
        test_email = f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
        user_data = {
            "email": test_email,
            "password": "SecurePassword123!",
            "full_name": "Test User"
        }
        
        success, response, status = await self.make_request("POST", "/auth/register", user_data)
        
        if success and status == 201:
            if "access_token" in response and "user" in response:
                self.auth_token = response["access_token"]
                self.test_user_id = response["user"]["id"]
                print(f"✅ User registered and logged in: {test_email}")
                return True
        
        print(f"❌ Failed to register user: Status {status}: {response}")
        return False
    
    async def create_test_wedding(self):
        """Create a test wedding"""
        wedding_data = {
            "title": "Sarah & John's Wedding",
            "description": "A beautiful celebration of love",
            "bride_name": "Sarah Johnson",
            "groom_name": "John Smith",
            "scheduled_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "location": "Central Park, New York",
            "cover_image": "https://example.com/wedding-cover.jpg"
        }
        
        success, response, status = await self.make_request("POST", "/weddings/", wedding_data)
        
        if success and status == 201:
            self.test_wedding_id = response["id"]
            print(f"✅ Test wedding created: {self.test_wedding_id}")
            return True
        
        print(f"❌ Failed to create wedding: Status {status}: {response}")
        return False
    
    async def create_test_studio(self):
        """Create a test studio"""
        # First upgrade user to premium
        db = get_db()
        await db.users.update_one(
            {"id": self.test_user_id},
            {"$set": {"subscription_plan": "monthly"}}
        )
        
        studio_data = {
            "name": "Test Studio for Logo Upload",
            "email": "test@studio.com",
            "phone": "555-0123",
            "address": "123 Studio St"
        }
        
        success, response, status = await self.make_request("POST", "/profile/studios", studio_data)
        
        if success and status == 201:
            self.test_studio_id = response["id"]
            print(f"✅ Test studio created: {self.test_studio_id}")
            return True
        
        print(f"❌ Failed to create studio: Status {status}: {response}")
        return False
    
    async def test_theme_update_endpoint(self):
        """Test PUT /api/weddings/{wedding_id}/theme - was returning 422"""
        print("\n🎯 Testing Theme Update Endpoint")
        print("=" * 40)
        
        if not self.test_wedding_id:
            print("❌ No wedding ID available")
            return False
        
        # Test 1: Update theme with studio_details containing empty strings (should work now)
        print("Test 1: Empty strings in studio_details (should be allowed)")
        theme_data = {
            "theme_name": "FloralGarden",
            "primary_color": "#ff6b9d",
            "secondary_color": "#4ecdc4",
            "font_family": "Playfair Display",
            "studio_details": {
                "name": "",  # Empty string should be allowed for clearing
                "email": "",  # Empty string should be allowed for clearing
                "phone": "555-0123",
                "address": "123 Wedding St"
            }
        }
        
        success, response, status = await self.make_request("PUT", f"/weddings/{self.test_wedding_id}/theme", theme_data)
        
        if status == 422:
            print(f"❌ 422 VALIDATION ERROR (should be fixed): {response}")
            return False
        elif status == 500:
            print(f"❌ 500 SERVER ERROR: {response}")
            return False
        elif success and status == 200:
            print("✅ Empty strings allowed for clearing studio details")
            
            # Test 2: Update theme with valid studio_details
            print("Test 2: Valid studio_details")
            theme_data2 = {
                "theme_name": "FloralGarden",
                "studio_details": {
                    "name": "Beautiful Weddings Studio",
                    "email": "contact@beautifulweddings.com",
                    "phone": "555-0123",
                    "address": "456 Photography Lane"
                }
            }
            
            success2, response2, status2 = await self.make_request("PUT", f"/weddings/{self.test_wedding_id}/theme", theme_data2)
            
            if success2 and status2 == 200:
                print("✅ Valid studio details update working")
                
                # Test 3: Update theme colors and fonts
                print("Test 3: Theme colors and fonts")
                theme_data3 = {
                    "primary_color": "#e74c3c",
                    "secondary_color": "#3498db",
                    "font_family": "Roboto",
                    "cover_photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
                }
                
                success3, response3, status3 = await self.make_request("PUT", f"/weddings/{self.test_wedding_id}/theme", theme_data3)
                
                if success3 and status3 == 200:
                    print("✅ Theme colors and fonts update working")
                    print("🎉 THEME UPDATE ENDPOINT - ALL TESTS PASSED")
                    return True
                else:
                    print(f"❌ Theme colors update failed: Status {status3}: {response3}")
            else:
                print(f"❌ Valid studio details update failed: Status {status2}: {response2}")
        else:
            print(f"❌ Status {status}: {response}")
        
        return False
    
    async def test_avatar_upload_endpoint(self):
        """Test POST /api/profile/avatar - was returning 500"""
        print("\n🎯 Testing Avatar Upload Endpoint")
        print("=" * 40)
        
        if not PIL_AVAILABLE:
            print("⚠️  Skipping - PIL not available")
            return False
        
        # Create a small test image file
        try:
            # Create a small test image
            img = Image.new('RGB', (100, 100), color='red')
            
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
                img.save(tmp_file.name, 'JPEG')
                tmp_path = tmp_file.name
            
            # Test avatar upload using aiohttp FormData
            with open(tmp_path, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename='test_avatar.jpg', content_type='image/jpeg')
                
                url = f"{API_BASE}/profile/avatar"
                headers = {"Authorization": f"Bearer {self.auth_token}"}
                
                async with self.session.post(url, data=data, headers=headers) as response:
                    try:
                        response_data = await response.json()
                    except:
                        response_data = await response.text()
                    
                    if response.status == 500:
                        print(f"❌ 500 SERVER ERROR (should be fixed): {response_data}")
                        return False
                    elif response.status == 200:
                        if "avatar_url" in response_data or "cdn_url" in response_data:
                            cdn_url = response_data.get("avatar_url") or response_data.get("cdn_url")
                            print("✅ Avatar uploaded successfully")
                            print(f"✅ CDN URL returned: {cdn_url}")
                            print("🎉 AVATAR UPLOAD ENDPOINT - TEST PASSED")
                            return True
                        else:
                            print(f"❌ Missing avatar_url/cdn_url in response: {response_data}")
                    else:
                        print(f"❌ Status {response.status}: {response_data}")
            
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                
        except Exception as e:
            print(f"❌ Error creating test image: {str(e)}")
        
        return False
    
    async def test_studio_logo_upload_endpoint(self):
        """Test POST /api/profile/studios/{studio_id}/logo - was returning 500"""
        print("\n🎯 Testing Studio Logo Upload Endpoint")
        print("=" * 40)
        
        if not PIL_AVAILABLE:
            print("⚠️  Skipping - PIL not available")
            return False
        
        if not self.test_studio_id:
            print("❌ No studio ID available")
            return False
        
        # Create a small test image file
        try:
            # Create a small test image
            img = Image.new('RGB', (100, 100), color='blue')
            
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
                img.save(tmp_file.name, 'PNG')
                tmp_path = tmp_file.name
            
            # Test studio logo upload using aiohttp FormData
            with open(tmp_path, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename='test_logo.png', content_type='image/png')
                
                url = f"{API_BASE}/profile/studios/{self.test_studio_id}/logo"
                headers = {"Authorization": f"Bearer {self.auth_token}"}
                
                async with self.session.post(url, data=data, headers=headers) as response:
                    try:
                        response_data = await response.json()
                    except:
                        response_data = await response.text()
                    
                    if response.status == 500:
                        print(f"❌ 500 SERVER ERROR (should be fixed): {response_data}")
                        return False
                    elif response.status == 200:
                        if "logo_url" in response_data or "cdn_url" in response_data:
                            cdn_url = response_data.get("logo_url") or response_data.get("cdn_url")
                            print("✅ Studio logo uploaded successfully")
                            print(f"✅ CDN URL returned: {cdn_url}")
                            print("🎉 STUDIO LOGO UPLOAD ENDPOINT - TEST PASSED")
                            return True
                        else:
                            print(f"❌ Missing logo_url/cdn_url in response: {response_data}")
                    else:
                        print(f"❌ Status {response.status}: {response_data}")
            
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                
        except Exception as e:
            print(f"❌ Error creating test image: {str(e)}")
        
        return False
    
    async def run_focused_tests(self):
        """Run focused tests for review request endpoints"""
        print("🎯 FOCUSED TESTING - REVIEW REQUEST ENDPOINTS")
        print("=" * 60)
        print("Testing previously failing endpoints:")
        print("• PUT /api/weddings/{wedding_id}/theme (was 422)")
        print("• POST /api/profile/avatar (was 500)")
        print("• POST /api/profile/studios/{studio_id}/logo (was 500)")
        print("=" * 60)
        
        await self.setup()
        
        try:
            # Setup test data
            if not await self.register_and_login():
                print("❌ Failed to setup test user")
                return
            
            if not await self.create_test_wedding():
                print("❌ Failed to setup test wedding")
                return
            
            if not await self.create_test_studio():
                print("❌ Failed to setup test studio")
                return
            
            # Run the specific tests
            results = []
            results.append(await self.test_theme_update_endpoint())
            results.append(await self.test_avatar_upload_endpoint())
            results.append(await self.test_studio_logo_upload_endpoint())
            
            # Summary
            print("\n" + "=" * 60)
            print("📊 FOCUSED TEST RESULTS")
            print("=" * 60)
            
            passed = sum(results)
            total = len(results)
            
            if passed == total:
                print(f"🎉 ALL {total} TESTS PASSED!")
                print("✅ Theme Update Endpoint - FIXED")
                print("✅ Avatar Upload Endpoint - FIXED") 
                print("✅ Studio Logo Upload Endpoint - FIXED")
                print("\n🎯 REVIEW REQUEST COMPLETE - ALL ISSUES RESOLVED")
            else:
                print(f"⚠️  {passed}/{total} tests passed")
                if not results[0]:
                    print("❌ Theme Update Endpoint - STILL FAILING")
                if not results[1]:
                    print("❌ Avatar Upload Endpoint - STILL FAILING")
                if not results[2]:
                    print("❌ Studio Logo Upload Endpoint - STILL FAILING")
        
        finally:
            await self.cleanup()

async def main():
    """Main test runner"""
    tester = FocusedTester()
    await tester.run_focused_tests()

if __name__ == "__main__":
    asyncio.run(main())