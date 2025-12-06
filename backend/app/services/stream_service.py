import os
import httpx
from typing import Dict
import uuid
import hmac
import hashlib
import time

class StreamService:
    def __init__(self):
        self.api_key = os.getenv("STREAM_API_KEY")
        self.api_secret = os.getenv("STREAM_API_SECRET")
        self.app_id = os.getenv("STREAM_APP_ID")
        self.base_url = f"https://video.stream-io-api.com/video/call/livestream"
    
    async def create_stream(self) -> Dict[str, str]:
        """Create a new stream and return RTMP credentials"""
        
        # Generate unique call ID
        call_id = str(uuid.uuid4())
        timestamp = str(int(time.time()))
        
        # Generate signature for Stream.com API
        # Format: signature = hmac_sha256(api_secret, call_id + timestamp)
        message = f"{call_id}{timestamp}"
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # For Stream.com, we create a livestream call
        # The RTMP URL format for Stream is:
        # rtmp://live.stream-io-api.com/app/{app_id}
        # Stream key: {call_id}?api_key={api_key}&signature={signature}&timestamp={timestamp}
        
        rtmp_url = f"rtmp://live.stream-io-api.com/app/{self.app_id}"
        stream_key = f"{call_id}?api_key={self.api_key}&signature={signature}&timestamp={timestamp}"
        playback_url = f"https://stream-io-api.com/video/call/livestream/{call_id}"
        
        return {
            "call_id": call_id,
            "rtmp_url": rtmp_url,
            "stream_key": stream_key,
            "playback_url": playback_url
        }
    
    async def get_stream_status(self, call_id: str) -> Dict:
        """Get stream status from Stream.com"""
        # In production, you would call Stream.com API to get actual status
        # For now, return mock data
        return {
            "call_id": call_id,
            "status": "offline",
            "viewers": 0
        }

# Function alias for compatibility
async def create_stream_call():
    """Create a stream call (compatibility function)"""
    service = StreamService()
    return await service.create_stream()
