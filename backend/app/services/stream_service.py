import os
from typing import Dict
import uuid
import logging
from stream_video import StreamVideoClient

logger = logging.getLogger(__name__)

class StreamService:
    def __init__(self):
        self.api_key = os.getenv("STREAM_API_KEY")
        self.api_secret = os.getenv("STREAM_API_SECRET")
        
        if not self.api_key or not self.api_secret:
            raise ValueError("STREAM_API_KEY and STREAM_API_SECRET must be set in environment")
        
        # Initialize Stream Video Client
        self.client = StreamVideoClient(
            api_key=self.api_key,
            api_secret=self.api_secret
        )
    
    async def create_stream(self) -> Dict[str, str]:
        """Create a new stream and return RTMP credentials using GetStream Video API"""
        
        try:
            # Generate unique call ID
            call_id = str(uuid.uuid4())
            
            # Create a livestream call
            call_type = "livestream"
            
            # Get or create the call
            call = self.client.video.call(call_type, call_id)
            response = call.get_or_create()
            
            logger.info(f"Stream call created: {call_id}")
            
            # Extract RTMP ingress details from response
            ingress = response.data.call.ingress
            rtmp_url = ingress.rtmp.address if ingress and ingress.rtmp else None
            
            # Generate user token for stream key (valid for 24 hours)
            stream_user_id = f"streamer_{call_id}"
            stream_key = self.client.create_token(
                user_id=stream_user_id,
                exp=86400  # 24 hours in seconds
            )
            
            # Create playback URL
            playback_url = f"https://stream.io/video/demos/livestream/?call_id={call_id}"
            
            if not rtmp_url:
                logger.warning("RTMP URL not available from Stream.com, using default")
                # Fallback to constructed URL if not provided
                rtmp_url = "rtmp://stream.io/live"
            
            logger.info(f"RTMP URL: {rtmp_url}, Stream Key generated for user: {stream_user_id}")
            
            return {
                "call_id": call_id,
                "rtmp_url": rtmp_url,
                "stream_key": stream_key,
                "playback_url": playback_url,
                "stream_user_id": stream_user_id
            }
            
        except Exception as e:
            logger.error(f"Error creating stream: {str(e)}")
            # Return fallback values for development
            call_id = str(uuid.uuid4())
            stream_user_id = f"streamer_{call_id}"
            
            # Generate token even if API call fails
            try:
                stream_key = self.client.create_token(
                    user_id=stream_user_id,
                    exp=86400
                )
            except Exception as token_error:
                logger.error(f"Error generating token: {str(token_error)}")
                stream_key = "error_generating_token"
            
            return {
                "call_id": call_id,
                "rtmp_url": "rtmp://stream.io/live",
                "stream_key": stream_key,
                "playback_url": f"https://stream.io/video/demos/livestream/?call_id={call_id}",
                "stream_user_id": stream_user_id
            }
    
    async def get_stream_status(self, call_id: str) -> Dict:
        """Get stream status from Stream.com"""
        try:
            call = self.client.video.call("livestream", call_id)
            response = call.get()
            
            return {
                "call_id": call_id,
                "status": response.data.call.backstage.get("enabled", False),
                "viewers": 0  # Would need to be retrieved from analytics
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
