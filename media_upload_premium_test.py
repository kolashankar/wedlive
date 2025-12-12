#!/usr/bin/env python3
"""
Media Upload Test with Premium User
Tests media upload functionality with a premium user to bypass plan restrictions
"""

import asyncio
import aiohttp
import json
import os
import base64
import sys
sys.path.append('/app/backend')
from app.database import get_db, init_db, close_db
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL", "https://wedadmin-assets.preview.emergentagent.com")
API_BASE = f"{BACKEND_URL}/api"

class MediaUploadPremiumTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_user_id = None
        self.test_wedding_id = None
    
    async def setup(self):
        """Initialize HTTP session and database"""
        self.session = aiohttp.ClientSession()
        await init_db()
        print(f"🔧 Testing backend at: {API_BASE}")
    
    async def cleanup(self):
        """Close HTTP session and database"""
        if self.session:
            await self.session.close()
        await close_db()
    
    async def make_request(self, method: str, endpoint: str, data: dict = None) -> tuple:
        """Make HTTP request"""
        url = f"{API_BASE}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            async with self.session.request(
                method, url, 
                json=data if data else None,
                headers=headers,
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
        headers = {}
        
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
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
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                try:
                    response_data = await response.json()
                except:
                    response_data = await response.text()
                
                return response.status < 400, response_data, response.status
        except Exception as e:
            return False, str(e), 0
    
    def create_test_image(self) -> bytes:
        """Create a small test image (1x1 pixel JPEG)"""
        # Minimal 1x1 JPEG image (base64 encoded)
        jpeg_base64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A=="
        return base64.b64decode(jpeg_base64)
    
    async def register_and_login(self):
        """Register a test user and login"""
        test_email = f"premiumtest_{datetime.now().strftime('%Y%m%d_%H%M%S')}@wedlive.app"
        user_data = {
            "email": test_email,
            "password": "WedLivePremium2024!",
            "full_name": "Premium Test User"
        }
        
        success, response, status = await self.make_request("POST", "/auth/register", user_data)
        
        if success and status == 201:
            if "access_token" in response and "user" in response:
                self.auth_token = response["access_token"]
                self.test_user_id = response["user"]["id"]
                print(f"✅ User registered and logged in: {test_email}")
                return True
        
        print(f"❌ Registration failed: Status {status}: {response}")
        return False
    
    async def upgrade_to_premium(self):
        """Upgrade user to premium plan directly in database"""
        try:
            db = get_db()
            result = await db.users.update_one(
                {"id": self.test_user_id},
                {"$set": {"subscription_plan": "monthly"}}
            )
            
            if result.modified_count > 0:
                print("✅ User upgraded to premium plan")
                return True
            else:
                print("❌ Failed to upgrade user to premium")
                return False
        except Exception as e:
            print(f"❌ Error upgrading user: {str(e)}")
            return False
    
    async def create_test_wedding(self):
        """Create a test wedding event"""
        wedding_data = {
            "title": "Premium User Wedding Test",
            "description": "Testing media upload with premium user",
            "bride_name": "Alice Premium",
            "groom_name": "Bob Premium",
            "scheduled_date": "2024-12-25T15:00:00Z",
            "location": "Premium Venue",
            "cover_image": "https://example.com/premium-wedding.jpg"
        }
        
        success, response, status = await self.make_request("POST", "/weddings/", wedding_data)
        
        if success and status == 201:
            if "id" in response:
                self.test_wedding_id = response["id"]
                print(f"✅ Wedding created: {response['title']}")
                return True
        
        print(f"❌ Wedding creation failed: Status {status}: {response}")
        return False
    
    async def test_media_upload_with_premium(self):
        """Test media upload with premium user"""
        print("\n🔍 Testing Media Upload with Premium User")
        print("=" * 50)
        
        # Create test image
        print("📋 Creating test image...")
        image_data = self.create_test_image()
        print(f"📋 Test image size: {len(image_data)} bytes")
        
        # Attempt photo upload
        print("📋 Attempting photo upload...")
        files = {'file': ('premium_test.jpg', image_data, 'image/jpeg')}
        data = {
            'wedding_id': self.test_wedding_id,
            'caption': 'Premium user test upload'
        }
        
        success, response, status = await self.make_multipart_request("POST", "/media/upload/photo", files=files, data=data)
        
        print(f"📋 Upload Response Status: {status}")
        print(f"📋 Upload Response: {response}")
        
        if status == 500:
            print("❌ 500 Internal Server Error detected!")
            
            # Analyze the error
            response_str = str(response).lower()
            
            if "telegram" in response_str:
                print("   🔍 Error is Telegram-related")
                
                if "unauthorized" in response_str or "bot token" in response_str:
                    print("   ❌ Issue: Telegram bot token is invalid or unauthorized")
                elif "chat not found" in response_str or "channel" in response_str:
                    print("   ❌ Issue: Telegram channel ID is invalid or bot not added to channel")
                elif "file too large" in response_str:
                    print("   ❌ Issue: File size exceeds Telegram limits")
                else:
                    print("   ❌ Issue: Other Telegram API error")
                    
            elif "database" in response_str or "mongo" in response_str:
                print("   ❌ Issue: Database connection or operation error")
            else:
                print("   ❌ Issue: Unknown server error")
                
            print(f"   📋 Full error details: {response}")
            
        elif status == 201:
            print("✅ Upload successful!")
            
            if isinstance(response, dict):
                print(f"   ✅ Media ID: {response.get('id')}")
                print(f"   ✅ File ID: {response.get('file_id')}")
                print(f"   ✅ File URL: {response.get('file_url')}")
                print(f"   ✅ File Size: {response.get('file_size')} bytes")
            
        else:
            print(f"❌ Unexpected status code: {status}")
            print(f"   📋 Response: {response}")
    
    async def check_backend_logs(self):
        """Check backend logs for detailed error information"""
        print("\n📋 Checking backend logs for [UPLOAD] messages...")
        
        try:
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "100", "/var/log/supervisor/backend.err.log"],
                capture_output=True, text=True, timeout=10
            )
            
            if result.returncode == 0:
                log_lines = result.stdout.strip().split('\n')
                upload_logs = [line for line in log_lines if '[UPLOAD]' in line]
                
                if upload_logs:
                    print("📋 Recent [UPLOAD] log entries:")
                    for log in upload_logs[-15:]:  # Show last 15 upload logs
                        print(f"   {log}")
                else:
                    print("📋 No [UPLOAD] log entries found")
                    
                # Also check for any Telegram-related errors
                telegram_logs = [line for line in log_lines if 'telegram' in line.lower()]
                if telegram_logs:
                    print("\n📋 Recent Telegram-related log entries:")
                    for log in telegram_logs[-10:]:
                        print(f"   {log}")
            else:
                print("📋 Could not read backend error logs")
                
        except Exception as e:
            print(f"📋 Error reading logs: {str(e)}")
    
    async def run_test(self):
        """Run the media upload test"""
        print("🚀 Starting Media Upload Test with Premium User")
        print("=" * 60)
        
        await self.setup()
        
        try:
            # Step 1: Register and login
            if not await self.register_and_login():
                return False
            
            # Step 2: Upgrade to premium
            if not await self.upgrade_to_premium():
                return False
            
            # Step 3: Create wedding
            if not await self.create_test_wedding():
                return False
            
            # Step 4: Test media upload
            await self.test_media_upload_with_premium()
            
            # Step 5: Check logs
            await self.check_backend_logs()
            
        finally:
            await self.cleanup()
        
        return True

async def main():
    """Main test runner"""
    tester = MediaUploadPremiumTester()
    await tester.run_test()
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(asyncio.run(main()))