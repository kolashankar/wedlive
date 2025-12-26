"""
Test Photo Upload Script
Tests the complete photo upload flow with the bride photo
"""
import asyncio
import aiohttp
import sys
import os
from pathlib import Path

# Test configuration
API_BASE_URL = "http://localhost:8001"
TEST_PHOTO_PATH = "/tmp/bride_test.jpg"

# Test wedding ID - we'll get this from the API
TEST_WEDDING_ID = None

# Admin credentials from .env
ADMIN_EMAIL = "kolashankar113@gmail.com"
ADMIN_PASSWORD = "Shankar@113"

async def test_photo_upload():
    """Complete test of photo upload functionality"""
    
    print("=" * 70)
    print("PHOTO UPLOAD TEST - Bride Photo")
    print("=" * 70)
    
    # Verify test photo exists
    if not os.path.exists(TEST_PHOTO_PATH):
        print(f"❌ Test photo not found: {TEST_PHOTO_PATH}")
        return False
    
    file_size = os.path.getsize(TEST_PHOTO_PATH)
    print(f"\n✓ Test photo found: {TEST_PHOTO_PATH} ({file_size:,} bytes)")
    
    async with aiohttp.ClientSession() as session:
        try:
            # Step 1: Login as admin
            print("\n[STEP 1] Logging in as admin...")
            login_url = f"{API_BASE_URL}/api/auth/login"
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            async with session.post(login_url, json=login_data) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    print(f"❌ Login failed: {resp.status}")
                    print(f"   Response: {text}")
                    return False
                
                result = await resp.json()
                token = result.get("access_token")
                user_id = result.get("user", {}).get("id")
                
                if not token:
                    print("❌ No access token in response")
                    return False
                
                print(f"✓ Login successful")
                print(f"  User ID: {user_id}")
                print(f"  Token: {token[:20]}...")
            
            # Step 2: Get or create a test wedding
            print("\n[STEP 2] Getting test wedding...")
            headers = {"Authorization": f"Bearer {token}"}
            
            # Get user's weddings
            weddings_url = f"{API_BASE_URL}/api/weddings"
            async with session.get(weddings_url, headers=headers) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    print(f"❌ Failed to get weddings: {resp.status}")
                    print(f"   Response: {text}")
                    return False
                
                weddings_data = await resp.json()
                # API returns either a list or dict with "weddings" key
                if isinstance(weddings_data, list):
                    weddings = weddings_data
                else:
                    weddings = weddings_data.get("weddings", [])
                
                # Use existing wedding (now owned by admin)
                if not weddings:
                    print("❌ No weddings found")
                    return False
                
                TEST_WEDDING_ID = weddings[0].get("id")
                print(f"✓ Using existing wedding: {TEST_WEDDING_ID}")
                print(f"  Bride: {weddings[0].get('bride_name')}")
                print(f"  Groom: {weddings[0].get('groom_name')}")
            
            # Step 3: Upload photo to bridePhoto placeholder
            print("\n[STEP 3] Uploading bride photo...")
            upload_url = f"{API_BASE_URL}/api/weddings/{TEST_WEDDING_ID}/layout-photos/upload"
            
            # Create multipart form data
            with open(TEST_PHOTO_PATH, 'rb') as f:
                photo_data = f.read()
            
            form_data = aiohttp.FormData()
            form_data.add_field('placeholder', 'bridePhoto')
            form_data.add_field('file', photo_data, 
                              filename='bride.jpg', 
                              content_type='image/jpeg')
            
            async with session.post(upload_url, data=form_data, headers=headers, timeout=aiohttp.ClientTimeout(total=60)) as resp:
                response_text = await resp.text()
                
                if resp.status not in [200, 201]:
                    print(f"❌ Upload failed: {resp.status}")
                    print(f"   Response: {response_text}")
                    return False
                
                try:
                    upload_result = await resp.json()
                except:
                    upload_result = {"raw": response_text}
                
                print(f"✓ Upload successful!")
                print(f"  Photo ID: {upload_result.get('photo_id')}")
                print(f"  File ID: {upload_result.get('file_id')}")
                print(f"  URL: {upload_result.get('url', 'N/A')[:80]}...")
                
                # Store for validation
                uploaded_file_id = upload_result.get('file_id')
                uploaded_url = upload_result.get('url')
            
            # Step 4: Verify photo was saved correctly
            print("\n[STEP 4] Verifying photo was saved...")
            layout_photos_url = f"{API_BASE_URL}/api/weddings/{TEST_WEDDING_ID}/layout-photos"
            
            async with session.get(layout_photos_url) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    print(f"❌ Failed to get layout photos: {resp.status}")
                    print(f"   Response: {text}")
                    return False
                
                layout_data = await resp.json()
                photos = layout_data.get('photos', {})
                bride_photo = photos.get('bridePhoto')
                
                if not bride_photo:
                    print("❌ Bride photo not found in layout photos")
                    return False
                
                saved_file_id = bride_photo.get('file_id')
                saved_url = bride_photo.get('url')
                
                print(f"✓ Photo verified in database")
                print(f"  File ID: {saved_file_id}")
                print(f"  URL: {saved_url[:80] if saved_url else 'N/A'}...")
                
                # Validate file_id format
                if not saved_file_id or len(saved_file_id) < 20:
                    print(f"❌ Invalid file_id format: too short ({len(saved_file_id) if saved_file_id else 0} chars)")
                    return False
                
                if saved_file_id.startswith("file_") and saved_file_id.replace("file_", "").replace(".jpg", "").isdigit():
                    print(f"❌ Invalid file_id format: placeholder format detected")
                    return False
                
                print(f"✓ File ID format is valid (length: {len(saved_file_id)})")
            
            # Step 5: Test proxy endpoint
            print("\n[STEP 5] Testing photo proxy endpoint...")
            proxy_url = f"{API_BASE_URL}/api/media/telegram-proxy/photos/{saved_file_id}"
            
            async with session.get(proxy_url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    print(f"❌ Proxy request failed: {resp.status}")
                    print(f"   URL: {proxy_url}")
                    print(f"   Response: {text[:200]}...")
                    return False
                
                content = await resp.read()
                content_type = resp.headers.get('Content-Type', 'unknown')
                
                print(f"✓ Proxy endpoint working")
                print(f"  Content-Type: {content_type}")
                print(f"  Size: {len(content):,} bytes")
                
                # Verify it's an image
                if not content_type.startswith('image/'):
                    print(f"❌ Invalid content type: {content_type}")
                    return False
                
                print(f"✓ Image loaded successfully via proxy")
            
            # Step 6: Test direct Telegram URL
            print("\n[STEP 6] Testing direct Telegram URL...")
            if uploaded_url and 'api.telegram.org' in uploaded_url:
                async with session.get(uploaded_url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    if resp.status != 200:
                        print(f"⚠️  Direct Telegram URL failed: {resp.status}")
                    else:
                        content = await resp.read()
                        print(f"✓ Direct Telegram URL working")
                        print(f"  Size: {len(content):,} bytes")
            
            # Final Summary
            print("\n" + "=" * 70)
            print("TEST RESULTS: ALL PASSED ✓")
            print("=" * 70)
            print(f"\nSummary:")
            print(f"  Wedding ID: {TEST_WEDDING_ID}")
            print(f"  Photo uploaded to: bridePhoto placeholder")
            print(f"  File ID: {saved_file_id}")
            print(f"  File ID length: {len(saved_file_id)} chars")
            print(f"  Proxy URL: {proxy_url}")
            print(f"\n✓ Photo upload system is working correctly!")
            print(f"✓ No invalid file_id errors detected")
            print("=" * 70)
            
            return True
            
        except Exception as e:
            print(f"\n❌ Test failed with exception:")
            print(f"   {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    result = asyncio.run(test_photo_upload())
    sys.exit(0 if result else 1)
