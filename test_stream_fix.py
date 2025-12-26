#!/usr/bin/env python3
"""
Test script to verify the Stream.io SDK protobuf fix
"""
import sys
import os
import asyncio

sys.path.insert(0, '/app/backend')
os.environ['STREAM_API_KEY'] = 'hhdxgg9s2qq2'
os.environ['STREAM_API_SECRET'] = '5yp6t23dw6szzqj9tmeaddp5jqxra4ut2fmkm4f4huf7quc56uqjyb74jyngxjnk'

async def test_stream_creation():
    """Test that stream creation works without TypeError"""
    try:
        from app.services.stream_service import StreamService
        
        print("=" * 70)
        print("TESTING STREAM.IO SDK PROTOBUF FIX")
        print("=" * 70)
        
        # Initialize service
        print("\n1. Initializing StreamService...")
        service = StreamService()
        print("   ✅ StreamService initialized")
        
        # Test stream creation
        print("\n2. Creating test stream...")
        test_wedding_id = "test-wedding-12345"
        
        try:
            result = await service.create_stream(test_wedding_id)
            
            print("   ✅ Stream created successfully!")
            print("\n3. Verifying response structure...")
            
            # Verify all required fields
            required_fields = ['call_id', 'rtmp_url', 'stream_key', 'playback_url', 'stream_user_id']
            for field in required_fields:
                if field in result:
                    print(f"   ✅ {field}: Present")
                else:
                    print(f"   ❌ {field}: Missing")
            
            print("\n4. Checking credential format...")
            print(f"   RTMP URL: {result['rtmp_url']}")
            print(f"   Stream Key (first 50 chars): {result['stream_key'][:50]}...")
            print(f"   Playback URL: {result['playback_url']}")
            
            # Verify RTMP URL format
            if result['rtmp_url'].startswith('rtmp://'):
                print("   ✅ RTMP URL format correct")
            else:
                print("   ⚠️  RTMP URL format unexpected")
            
            # Verify stream key is JWT-like (long string)
            if len(result['stream_key']) > 100:
                print("   ✅ Stream key appears to be JWT token")
            else:
                print("   ⚠️  Stream key seems too short for JWT")
            
            print("\n" + "=" * 70)
            print("TEST RESULT: ✅ SUCCESS - No TypeError!")
            print("The protobuf fix is working correctly.")
            print("=" * 70)
            
            return True
            
        except TypeError as e:
            if "MergeFrom" in str(e) or "CreateCallInput" in str(e):
                print(f"   ❌ ORIGINAL BUG STILL EXISTS: {e}")
                print("\n" + "=" * 70)
                print("TEST RESULT: ❌ FAILED - TypeError still occurring")
                print("=" * 70)
                return False
            else:
                raise
                
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_stream_creation())
    sys.exit(0 if result else 1)
