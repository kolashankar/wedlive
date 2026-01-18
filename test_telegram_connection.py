#!/usr/bin/env python3
"""
Test Telegram Bot API connection and permissions
"""
import os
import asyncio
import httpx
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID")

async def test_telegram_connection():
    print("🔍 Testing Telegram Bot API Connection...\n")
    print(f"Bot Token: {TELEGRAM_BOT_TOKEN[:20]}...")
    print(f"Channel ID: {TELEGRAM_CHANNEL_ID}\n")
    
    api_base = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"
    
    # Test 1: Get bot info
    print("📋 Test 1: Get Bot Info")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{api_base}/getMe")
            result = response.json()
            
            if result.get("ok"):
                bot_info = result["result"]
                print(f"✅ Bot is active: @{bot_info.get('username')}")
                print(f"   Bot Name: {bot_info.get('first_name')}")
                print(f"   Bot ID: {bot_info.get('id')}\n")
            else:
                print(f"❌ Failed to get bot info: {result}\n")
                return
    except Exception as e:
        print(f"❌ Error connecting to Telegram API: {str(e)}\n")
        return
    
    # Test 2: Check channel access
    print("📋 Test 2: Check Channel Access")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{api_base}/getChat?chat_id={TELEGRAM_CHANNEL_ID}")
            result = response.json()
            
            if result.get("ok"):
                chat_info = result["result"]
                print(f"✅ Channel accessible: {chat_info.get('title', 'Unknown')}")
                print(f"   Type: {chat_info.get('type')}")
                print(f"   Username: @{chat_info.get('username', 'N/A')}\n")
            else:
                print(f"❌ Cannot access channel: {result.get('description', 'Unknown error')}\n")
                return
    except Exception as e:
        print(f"❌ Error checking channel: {str(e)}\n")
        return
    
    # Test 3: Check bot permissions in channel
    print("📋 Test 3: Check Bot Permissions")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            bot_info_response = await client.get(f"{api_base}/getMe")
            bot_id = bot_info_response.json()["result"]["id"]
            
            response = await client.get(
                f"{api_base}/getChatMember?chat_id={TELEGRAM_CHANNEL_ID}&user_id={bot_id}"
            )
            result = response.json()
            
            if result.get("ok"):
                member_info = result["result"]
                print(f"✅ Bot status in channel: {member_info.get('status')}")
                
                if member_info.get('status') == 'administrator':
                    print("   ✅ Bot is an administrator")
                    perms = member_info.get('can_post_messages', False)
                    print(f"   Can post messages: {'✅ Yes' if perms else '❌ No'}")
                    
                    if not perms:
                        print("\n⚠️  WARNING: Bot needs 'Post Messages' permission!")
                        print("   Please make bot admin with posting rights in the channel.\n")
                        return
                else:
                    print(f"   ⚠️  Bot is not an administrator!")
                    print("   Please make bot admin with posting rights in the channel.\n")
                    return
                print()
            else:
                print(f"❌ Cannot get bot permissions: {result.get('description')}\n")
                return
    except Exception as e:
        print(f"❌ Error checking permissions: {str(e)}\n")
        return
    
    # Test 4: Send a simple text message
    print("📋 Test 4: Send Test Message")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{api_base}/sendMessage",
                json={
                    "chat_id": TELEGRAM_CHANNEL_ID,
                    "text": "🧪 Test message from WedLive music upload troubleshooting"
                }
            )
            result = response.json()
            
            if result.get("ok"):
                print("✅ Successfully sent test message to channel\n")
            else:
                print(f"❌ Failed to send message: {result.get('description')}\n")
                return
    except Exception as e:
        print(f"❌ Error sending message: {str(e)}\n")
        return
    
    # Test 5: Download and upload a small audio file
    print("📋 Test 5: Upload Test Audio File")
    try:
        # Download a small sample audio file
        print("   📥 Downloading sample audio file...")
        async with httpx.AsyncClient(timeout=60.0) as client:
            audio_url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            audio_response = await client.get(audio_url)
            
            if audio_response.status_code != 200:
                print(f"   ❌ Failed to download sample audio: {audio_response.status_code}\n")
                return
            
            audio_data = audio_response.content
            file_size_mb = len(audio_data) / (1024 * 1024)
            print(f"   ✅ Downloaded {file_size_mb:.2f} MB audio file")
            
            # Check file size
            if file_size_mb > 50:
                print(f"   ❌ File too large for Telegram (>50 MB limit)\n")
                return
            
            # Upload to Telegram
            print("   📤 Uploading to Telegram channel...")
            files = {'audio': ('test_music.mp3', audio_data, 'audio/mpeg')}
            data = {
                'chat_id': TELEGRAM_CHANNEL_ID,
                'caption': '🧪 Test audio upload from WedLive',
                'title': 'Test Music',
                'performer': 'Test Artist'
            }
            
            response = await client.post(
                f"{api_base}/sendAudio",
                files=files,
                data=data,
                timeout=120.0
            )
            
            result = response.json()
            
            if result.get("ok"):
                message = result["result"]
                audio = message.get("audio", {})
                file_id = audio.get("file_id")
                duration = audio.get("duration", 0)
                file_size = audio.get("file_size", 0)
                
                print(f"   ✅ Audio uploaded successfully!")
                print(f"   File ID: {file_id}")
                print(f"   Duration: {duration}s")
                print(f"   Size: {file_size / 1024:.2f} KB\n")
                
                print("🎉 ALL TESTS PASSED! Telegram integration is working correctly.\n")
            else:
                error_desc = result.get("description", "Unknown error")
                print(f"   ❌ Audio upload failed: {error_desc}")
                print(f"   Full response: {result}\n")
                
                # Provide specific troubleshooting based on error
                if "not enough rights" in error_desc.lower():
                    print("💡 SOLUTION: Bot needs admin permissions with 'Post Messages' enabled")
                elif "file too large" in error_desc.lower():
                    print("💡 SOLUTION: Audio file must be under 50 MB")
                elif "wrong file" in error_desc.lower():
                    print("💡 SOLUTION: File format issue - ensure it's a valid audio file")
                print()
                return
                
    except Exception as e:
        print(f"   ❌ Error during audio upload test: {str(e)}\n")
        import traceback
        traceback.print_exc()
        return

if __name__ == "__main__":
    asyncio.run(test_telegram_connection())
