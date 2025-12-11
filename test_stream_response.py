#!/usr/bin/env python3
"""
Test script to inspect Stream.io API response structure
"""
import asyncio
import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend
backend_path = Path(__file__).parent / "backend"
env_path = backend_path / ".env"
load_dotenv(env_path)

# Add backend to path
sys.path.insert(0, str(backend_path))

from app.services.stream_service import StreamService

async def test_stream_creation():
    """Test stream creation and inspect response"""
    print("=" * 80)
    print("🧪 Testing Stream.io API Response Structure")
    print("=" * 80)
    
    try:
        service = StreamService()
        print("✅ StreamService initialized")
        
        # Create a test stream
        wedding_id = "test_wedding_123"
        print(f"\n📝 Creating stream for wedding: {wedding_id}")
        
        result = await service.create_stream(wedding_id)
        
        print("\n" + "=" * 80)
        print("📋 RETURNED CREDENTIALS:")
        print("=" * 80)
        print(f"Call ID: {result['call_id']}")
        print(f"RTMP URL: {result['rtmp_url']}")
        print(f"Stream Key: {result['stream_key'][:50]}..." if len(result['stream_key']) > 50 else f"Stream Key: {result['stream_key']}")
        print(f"Playback URL: {result['playback_url']}")
        print(f"Stream User ID: {result['stream_user_id']}")
        
        # Test if this looks like a real Stream.io URL
        print("\n" + "=" * 80)
        print("🔍 VALIDATION:")
        print("=" * 80)
        
        if "stream-io-video.com" in result['rtmp_url'] or "stream.io" in result['rtmp_url']:
            print("✅ RTMP URL looks like a real Stream.io address")
        elif "wedlive.app" in result['rtmp_url']:
            print("⚠️  WARNING: Still using hardcoded fallback URL!")
        else:
            print("❓ Unknown RTMP URL format")
        
        # Check stream key format
        if result['stream_key'].count('.') >= 2 and len(result['stream_key']) > 50:
            print("✅ Stream Key looks like a JWT token")
        else:
            print("⚠️  WARNING: Stream key doesn't look like a JWT!")
        
        print("\n" + "=" * 80)
        print("💡 OBS CONFIGURATION:")
        print("=" * 80)
        print(f"Server: {result['rtmp_url']}")
        print(f"Stream Key: {result['stream_key']}")
        
        return result
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = asyncio.run(test_stream_creation())
    
    if result:
        print("\n✅ Test completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Test failed!")
        sys.exit(1)
