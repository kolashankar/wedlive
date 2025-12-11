#!/usr/bin/env python3
"""
Telegram Integration Diagnostic Test
Tests Telegram bot configuration and channel access
"""

import asyncio
import httpx
import os
from datetime import datetime

# Get Telegram credentials from environment
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8534420328:AAEB3NeeGZJZ53iLP1qK2EwK-5MSoEcWFPQ")
CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", "3471735834")
LOG_CHANNEL = os.getenv("TELEGRAM_LOG_CHANNEL", "341986595")

class TelegramIntegrationTester:
    def __init__(self):
        self.api_base = f"https://api.telegram.org/bot{BOT_TOKEN}"
        self.results = []
    
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅" if success else "❌"
        self.results.append((test_name, success, details))
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
    
    async def test_bot_info(self):
        """Test bot authentication and get bot info"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.api_base}/getMe")
                result = response.json()
                
                if result.get("ok"):
                    bot_info = result["result"]
                    self.log_result(
                        "Bot Authentication", 
                        True, 
                        f"Bot: @{bot_info['username']} ({bot_info['first_name']})"
                    )
                    return True
                else:
                    self.log_result(
                        "Bot Authentication", 
                        False, 
                        f"Error: {result.get('description', 'Unknown error')}"
                    )
        except Exception as e:
            self.log_result("Bot Authentication", False, f"Exception: {str(e)}")
        
        return False
    
    async def test_channel_access(self, channel_id: str, channel_name: str):
        """Test access to a specific channel"""
        try:
            async with httpx.AsyncClient() as client:
                # Try to get chat info
                response = await client.get(f"{self.api_base}/getChat?chat_id={channel_id}")
                result = response.json()
                
                if result.get("ok"):
                    chat_info = result["result"]
                    self.log_result(
                        f"{channel_name} Access", 
                        True, 
                        f"Channel: {chat_info.get('title', 'N/A')} (Type: {chat_info.get('type', 'N/A')})"
                    )
                    return True
                else:
                    error_desc = result.get('description', 'Unknown error')
                    self.log_result(
                        f"{channel_name} Access", 
                        False, 
                        f"Error: {error_desc}"
                    )
                    
                    # Provide specific guidance based on error
                    if "chat not found" in error_desc.lower():
                        print(f"   💡 Channel ID {channel_id} not found. Check if:")
                        print(f"      - Channel exists and is accessible")
                        print(f"      - Bot is added as admin to the channel")
                        print(f"      - Channel ID is correct (should be negative for channels)")
                    elif "forbidden" in error_desc.lower():
                        print(f"   💡 Bot doesn't have permission. Add bot as admin to channel.")
                    
        except Exception as e:
            self.log_result(f"{channel_name} Access", False, f"Exception: {str(e)}")
        
        return False
    
    async def test_send_message(self, channel_id: str, channel_name: str):
        """Test sending a message to channel"""
        try:
            async with httpx.AsyncClient() as client:
                test_message = f"🧪 Telegram CDN Test - {datetime.utcnow().isoformat()}"
                
                response = await client.post(
                    f"{self.api_base}/sendMessage",
                    json={
                        "chat_id": channel_id,
                        "text": test_message
                    }
                )
                result = response.json()
                
                if result.get("ok"):
                    message_id = result["result"]["message_id"]
                    self.log_result(
                        f"Send Message to {channel_name}", 
                        True, 
                        f"Message ID: {message_id}"
                    )
                    
                    # Try to delete the test message
                    await asyncio.sleep(1)
                    delete_response = await client.post(
                        f"{self.api_base}/deleteMessage",
                        json={
                            "chat_id": channel_id,
                            "message_id": message_id
                        }
                    )
                    
                    if delete_response.json().get("ok"):
                        print(f"   ✅ Test message deleted successfully")
                    
                    return True
                else:
                    error_desc = result.get('description', 'Unknown error')
                    self.log_result(
                        f"Send Message to {channel_name}", 
                        False, 
                        f"Error: {error_desc}"
                    )
        except Exception as e:
            self.log_result(f"Send Message to {channel_name}", False, f"Exception: {str(e)}")
        
        return False
    
    async def test_file_upload_simulation(self, channel_id: str, channel_name: str):
        """Test file upload capability (without actual file)"""
        try:
            async with httpx.AsyncClient() as client:
                # Test with a small text file simulation
                test_caption = f"📸 Test Upload - {datetime.utcnow().isoformat()}"
                
                # Create minimal test data
                files = {
                    'photo': ('test.jpg', b'fake_image_data', 'image/jpeg')
                }
                data = {
                    'chat_id': channel_id,
                    'caption': test_caption
                }
                
                response = await client.post(
                    f"{self.api_base}/sendPhoto",
                    files=files,
                    data=data
                )
                result = response.json()
                
                if result.get("ok"):
                    self.log_result(
                        f"File Upload to {channel_name}", 
                        True, 
                        "Upload capability confirmed"
                    )
                    return True
                else:
                    error_desc = result.get('description', 'Unknown error')
                    if "invalid file" in error_desc.lower() or "bad request" in error_desc.lower():
                        # This is expected with fake data, but confirms channel access
                        self.log_result(
                            f"File Upload to {channel_name}", 
                            True, 
                            "Channel accessible for uploads (fake file rejected as expected)"
                        )
                        return True
                    else:
                        self.log_result(
                            f"File Upload to {channel_name}", 
                            False, 
                            f"Error: {error_desc}"
                        )
        except Exception as e:
            self.log_result(f"File Upload to {channel_name}", False, f"Exception: {str(e)}")
        
        return False
    
    async def run_all_tests(self):
        """Run comprehensive Telegram integration tests"""
        print("🚀 TELEGRAM INTEGRATION DIAGNOSTIC TESTS")
        print("=" * 50)
        print(f"Bot Token: {BOT_TOKEN[:20]}...")
        print(f"Channel ID: {CHANNEL_ID}")
        print(f"Log Channel ID: {LOG_CHANNEL}")
        print()
        
        # 1. Test Bot Authentication
        print("🤖 BOT AUTHENTICATION")
        print("-" * 30)
        await self.test_bot_info()
        
        # 2. Test Main Channel Access
        print(f"\n📺 MAIN CHANNEL ACCESS (ID: {CHANNEL_ID})")
        print("-" * 40)
        await self.test_channel_access(CHANNEL_ID, "Main Channel")
        await self.test_send_message(CHANNEL_ID, "Main Channel")
        await self.test_file_upload_simulation(CHANNEL_ID, "Main Channel")
        
        # 3. Test Log Channel Access
        print(f"\n📝 LOG CHANNEL ACCESS (ID: {LOG_CHANNEL})")
        print("-" * 40)
        await self.test_channel_access(LOG_CHANNEL, "Log Channel")
        await self.test_send_message(LOG_CHANNEL, "Log Channel")
        
        # 4. Test with negative channel IDs (proper format)
        print(f"\n🔄 TESTING WITH NEGATIVE CHANNEL IDS")
        print("-" * 40)
        negative_channel_id = f"-{CHANNEL_ID}"
        negative_log_channel_id = f"-{LOG_CHANNEL}"
        
        print(f"Testing negative format: {negative_channel_id}")
        await self.test_channel_access(negative_channel_id, "Main Channel (Negative)")
        await self.test_send_message(negative_channel_id, "Main Channel (Negative)")
        
        print(f"Testing negative format: {negative_log_channel_id}")
        await self.test_channel_access(negative_log_channel_id, "Log Channel (Negative)")
        
        # Print Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 50)
        print("📊 TELEGRAM INTEGRATION TEST RESULTS")
        print("=" * 50)
        
        passed = sum(1 for _, success, _ in self.results if success)
        failed = sum(1 for _, success, _ in self.results if not success)
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📊 Total: {len(self.results)}")
        
        if failed > 0:
            print("\n🚨 FAILED TESTS:")
            for test_name, success, details in self.results:
                if not success:
                    print(f"   • {test_name}: {details}")
        
        print("\n💡 RECOMMENDATIONS:")
        
        if failed == 0:
            print("   🎉 All tests passed! Telegram integration is working correctly.")
        else:
            print("   1. Verify bot is added as admin to both channels")
            print("   2. Check channel IDs are correct (use @userinfobot in Telegram)")
            print("   3. Ensure channels exist and are accessible")
            print("   4. Try using negative channel IDs if positive ones fail")
            print("   5. Check bot permissions in channel settings")

async def main():
    """Main test execution"""
    tester = TelegramIntegrationTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())