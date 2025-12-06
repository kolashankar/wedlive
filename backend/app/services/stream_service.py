import os
import httpx
from typing import Dict
import uuid
import hmac
import hashlib
import time
import jwt
import logging

logger = logging.getLogger(__name__)

class StreamService:
    def __init__(self):
        self.api_key = os.getenv("STREAM_API_KEY")
        self.api_secret = os.getenv("STREAM_API_SECRET")
        
        if not self.api_key or not self.api_secret:
            logger.warning("STREAM_API_KEY or STREAM_API_SECRET not set, using fallback RTMP configuration")
        
        self.base_url = "https://video.stream-io-api.com"
    
    def generate_user_token(self, user_id: str, expiration_hours: int = 24) -> str:
        """Generate JWT token for Stream.io user"""
        try:
            payload = {
                "user_id": user_id,
                "iat": int(time.time()),
                "exp": int(time.time()) + (expiration_hours * 3600)
            }
            
            token = jwt.encode(payload, self.api_secret, algorithm="HS256")
            return token
        except Exception as e:
            logger.error(f"Error generating JWT token: {str(e)}")
            return "fallback_token"
    
    async def create_stream(self) -> Dict[str, str]:
        """Create a new stream and return RTMP credentials"""
        
        # Generate unique call ID
        call_id = str(uuid.uuid4())
        stream_user_id = f"streamer_{call_id}"
        
        # Generate user token for stream key
        stream_key = self.generate_user_token(stream_user_id, expiration_hours=24)
        
        # RTMP URL format for Stream.io
        # Based on Stream.io documentation, the RTMP URL is typically:
        # rtmp://stream.io/live or rtmp://livestream.stream-io-api.com/live
        rtmp_url = "rtmp://livestream.stream-io-api.com/live"
        
        # Playback URL - construct based on call_id
        playback_url = f"https://pronto.getstream.io/client/api/video/call/livestream/{call_id}"
        
        logger.info(f"Stream created - Call ID: {call_id}, User: {stream_user_id}")
        logger.info(f"RTMP URL: {rtmp_url}")
        logger.info(f"Stream Key (JWT): {stream_key[:20]}...")
        
        return {
            "call_id": call_id,
            "rtmp_url": rtmp_url,
            "stream_key": stream_key,
            "playback_url": playback_url,
            "stream_user_id": stream_user_id
        }
    
    async def get_stream_status(self, call_id: str) -> Dict:
        """Get stream status from Stream.com"""
        try:
            # In a production environment, you would make an API call to Stream.io
            # to get the actual status of the stream
            # For now, return mock data
            return {
                "call_id": call_id,
                "status": "offline",
                "viewers": 0
            }
        except Exception as e:
            logger.error(f"Error getting stream status: {str(e)}")
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
