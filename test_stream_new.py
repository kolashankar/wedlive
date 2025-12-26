#!/usr/bin/env python3
"""
Test script for the new GetStream SDK integration
"""
import sys
import os
import asyncio

sys.path.insert(0, '/app/backend')
os.environ['STREAM_API_KEY'] = 'hhdxgg9s2qq2'
os.environ['STREAM_API_SECRET'] = '5yp6t23dw6szzqj9tmeaddp5jqxra4ut2fmkm4f4huf7quc56uqjyb74jyngxjnk'

async def test_new_sdk():
    """Test the new GetStream SDK implementation"""
    try:
        from app.services.stream_service import StreamService
        
        print("=" * 70)
        print("TESTING NEW GETSTREAM SDK (2.2.1)")
        print("=" * 70)
        
        # Initialize service
        print("\n1. Initializing StreamService with GetStream SDK...")
        service = StreamService()
        print("   ✅ Service initialized")
        
        # Create stream
        print("\n2. Creating livestream...")
        wedding_id = "test-wedding-new-sdk"
        
        result = await service.create_stream(wedding_id)
        
        print("\n3. ✅ SUCCESS! Stream created")
        print(f"   Call ID: {result['call_id']}")
        print(f"   RTMP URL: {result['rtmp_url']}")
        print(f"   Stream Key: {result['stream_key'][:50]}...")
        print(f"   Playback URL: {result['playback_url']}")
        print(f"   User ID: {result['stream_user_id']}")
        
        # Validate response structure
        print("\n4. Validating response...")
        required_fields = ['call_id', 'rtmp_url', 'stream_key', 'playback_url', 'stream_user_id']
        all_present = all(field in result for field in required_fields)
        
        if all_present:
            print("   ✅ All required fields present")
        else:
            print("   ❌ Missing fields")
            
        # Check RTMP URL format
        if result['rtmp_url'].startswith('rtmp'):
            print("   ✅ RTMP URL format valid")
        else:
            print(f"   ❌ RTMP URL format invalid: {result['rtmp_url']}")
            
        print("\n" + "=" * 70)
        print("✅ NEW SDK INTEGRATION WORKING!")
        print("=" * 70)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_new_sdk())
    sys.exit(0 if result else 1)
