import os
import uuid
import logging
from typing import Dict

logger = logging.getLogger(__name__)

class StreamService:
    def __init__(self):
        """Initialize NGINX-RTMP Stream Service
        
        Uses environment variables for RTMP and HLS server URLs.
        No third-party dependencies required.
        """
        self.rtmp_server_url = os.getenv("RTMP_SERVER_URL", "rtmp://localhost/live")
        self.hls_server_url = os.getenv("HLS_SERVER_URL", "http://localhost:8080/hls")
        
        logger.info(f"✅ NGINX-RTMP Stream Service initialized")
        logger.info(f"   RTMP Server: {self.rtmp_server_url}")
        logger.info(f"   HLS Server: {self.hls_server_url}")
    
    def generate_stream_key(self, wedding_id: str) -> str:
        """Generate unique stream key in format: live_<wedding_id>_<random_uuid>
        
        Args:
            wedding_id: Unique identifier for the wedding
            
        Returns:
            Stream key in format: live_{wedding_id}_{uuid}
        """
        try:
            # Generate random UUID (remove hyphens for cleaner format)
            random_id = str(uuid.uuid4()).replace('-', '')[:16]
            
            # Format: live_<wedding_id>_<random_id>
            stream_key = f"live_{wedding_id}_{random_id}"
            
            logger.info(f"Generated stream key: {stream_key}")
            return stream_key
        except Exception as e:
            logger.error(f"Error generating stream key: {str(e)}")
            raise
    
    async def create_stream(self, wedding_id: str) -> Dict[str, str]:
        """Create a new stream and return RTMP/HLS credentials
        
        This method generates static RTMP and HLS URLs for self-hosted NGINX-RTMP streaming.
        No API calls are made to third-party services.
        
        Args:
            wedding_id: Unique identifier for the wedding
            
        Returns:
            Dictionary containing:
            - call_id: Unique identifier for this stream session
            - rtmp_url: Full RTMP URL for broadcaster (OBS)
            - stream_key: Unique stream key
            - playback_url: HLS URL for viewers
        """
        
        logger.info(f"🎥 Creating stream for wedding: {wedding_id}")
        
        # Generate unique call ID for the livestream
        call_id = str(uuid.uuid4())
        
        # Generate stream key
        stream_key = self.generate_stream_key(wedding_id)
        
        # Construct RTMP URL (for OBS/broadcaster)
        rtmp_url = self.rtmp_server_url
        
        # Construct HLS playback URL (for viewers)
        playback_url = f"{self.hls_server_url}/{stream_key}.m3u8"
        
        logger.info("=" * 70)
        logger.info("✅ STREAM CREATED SUCCESSFULLY")
        logger.info(f"   Call ID: {call_id}")
        logger.info(f"   RTMP Server: {rtmp_url}")
        logger.info(f"   Stream Key: {stream_key}")
        logger.info(f"   Playback URL: {playback_url}")
        logger.info("=" * 70)
        
        return {
            "call_id": call_id,
            "rtmp_url": rtmp_url,
            "stream_key": stream_key,
            "playback_url": playback_url
        }
    
    async def get_stream_status(self, call_id: str) -> Dict:
        """Get stream status
        
        Note: This is a placeholder implementation. In production, you would
        integrate with NGINX RTMP stats module or implement a custom status tracking system.
        
        Args:
            call_id: Stream session identifier
            
        Returns:
            Dictionary with status information
        """
        logger.info(f"Getting status for call: {call_id}")
        
        # Placeholder implementation
        # TODO: Integrate with NGINX RTMP stats API when available
        # Example: http://your-server/stat
        
        return {
            "call_id": call_id,
            "status": "offline",  # Default to offline
            "viewers": 0,
            "message": "Status tracking not yet implemented. Integrate with NGINX RTMP stats module."
        }

# Function alias for compatibility
async def create_stream_call(wedding_id: str = None):
    """Create a stream call (compatibility function)"""
    service = StreamService()
    # Use wedding_id if provided, otherwise generate a random one for compatibility
    if not wedding_id:
        wedding_id = str(uuid.uuid4())[:8]
    return await service.create_stream(wedding_id)
