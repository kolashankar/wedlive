#!/usr/bin/env python3
"""
Test script to debug Stream.io API connection and capture full error details
"""
import sys
import os
import asyncio
from twirp import exceptions

sys.path.insert(0, '/app/backend')
os.environ['STREAM_API_KEY'] = 'hhdxgg9s2qq2'
os.environ['STREAM_API_SECRET'] = '5yp6t23dw6szzqj9tmeaddp5jqxra4ut2fmkm4f4huf7quc56uqjyb74jyngxjnk'

async def test_stream_connection():
    """Test Stream.io connection and capture detailed error info"""
    try:
        from app.services.stream_service import StreamService
        
        print("=" * 70)
        print("STREAM.IO CONNECTION DEBUG TEST")
        print("=" * 70)
        
        # Initialize service
        print("\n1. Initializing StreamService...")
        service = StreamService()
        print(f"   ✅ API Key: {service.api_key}")
        print(f"   ✅ API Secret: {service.api_secret[:20]}...{service.api_secret[-10:]}")
        print("   ✅ StreamService initialized")
        
        # Test stream creation
        print("\n2. Attempting to create test stream...")
        test_wedding_id = "test-wedding-debug"
        
        try:
            result = await service.create_stream(test_wedding_id)
            print("   ✅ Stream created successfully!")
            print(f"   RTMP URL: {result['rtmp_url']}")
            print(f"   Call ID: {result['call_id']}")
            
        except exceptions.TwirpServerException as e:
            print("\n   ❌ TwirpServerException caught!")
            print(f"   Error Code: {e.code}")
            print(f"   Error Message: {e.message}")
            print(f"   Error Meta: {e.meta}")
            print(f"   Error Dict: {e.to_dict()}")
            
            # Additional diagnostics
            print("\n3. Diagnostics:")
            if "unauthenticated" in str(e.message).lower():
                print("   ⚠️  Authentication failed - Check API credentials")
            elif "not found" in str(e.message).lower():
                print("   ⚠️  Resource not found - Check API endpoint")
            elif "permission" in str(e.message).lower():
                print("   ⚠️  Permission denied - Check API key permissions")
            elif "quota" in str(e.message).lower() or "limit" in str(e.message).lower():
                print("   ⚠️  Quota/Rate limit exceeded")
            
            return False
            
        except Exception as e:
            print(f"\n   ❌ Unexpected error: {type(e).__name__}")
            print(f"   Message: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
                
    except Exception as e:
        print(f"\n❌ Setup error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_stream_connection())
    sys.exit(0 if result else 1)
