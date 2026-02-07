"""
Stream Service - Pulse-Powered Token Generation

This service manages stream creation using Pulse platform APIs.

Migration Status: Phase 1.5 Complete
- Removed: Custom stream key generation
- Removed: NGINX-RTMP URL construction
- Removed: Custom HLS playback URLs
- Replaced with: Pulse LiveKit token generation
- Replaced with: Pulse room management
"""

import os
import logging
from typing import Dict, Optional
from app.services.pulse_service import PulseService

logger = logging.getLogger(__name__)


class StreamService:
    """
    Stream Service using Pulse Platform
    
    Delegates all streaming operations to Pulse LiveKit APIs.
    Generates access tokens instead of stream keys.
    """
    
    def __init__(self):
        """Initialize Pulse-powered Stream Service"""
        self.pulse_service = PulseService()
        
        logger.info(f"✅ Pulse Stream Service initialized")
        logger.info(f"   Using LiveKit for streaming")
        logger.info(f"   Token-based access control")
    
    async def create_stream(self, wedding_id: str, host_name: str = "Host") -> Dict[str, str]:
        """
        Create a new stream using Pulse LiveKit
        
        This replaces the old NGINX-RTMP stream creation.
        Returns LiveKit access tokens instead of stream keys.
        
        Args:
            wedding_id: Unique identifier for the wedding
            host_name: Display name for the host/broadcaster
            
        Returns:
            Dictionary containing:
            - room_name: LiveKit room identifier
            - host_token: Token for host (can publish)
            - viewer_token: Token for viewers (can subscribe)
            - livekit_url: WebRTC connection URL
            - rtmp_ingress: Optional RTMP ingress for OBS
        """
        logger.info(f"🎥 Creating Pulse stream for wedding: {wedding_id}")
        
        room_name = f"wedding_{wedding_id}"
        
        # Create LiveKit room
        room_result = await self.pulse_service.create_room(
            room_name=room_name,
            metadata={
                "wedding_id": wedding_id,
                "type": "wedding_stream"
            }
        )
        
        # Generate host token (can publish video/audio)
        host_token_result = await self.pulse_service.generate_stream_token(
            room_name=room_name,
            participant_name=host_name,
            participant_id=f"host_{wedding_id}",
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
            metadata={
                "role": "host",
                "wedding_id": wedding_id
            }
        )
        
        # Generate viewer token (can only subscribe)
        viewer_token_result = await self.pulse_service.generate_stream_token(
            room_name=room_name,
            participant_name="Viewer",
            participant_id=f"viewer_{wedding_id}",
            can_publish=False,
            can_subscribe=True,
            can_publish_data=True,
            metadata={
                "role": "viewer",
                "wedding_id": wedding_id
            }
        )
        
        # Create RTMP ingress for OBS/professional cameras
        rtmp_result = await self.pulse_service.create_rtmp_ingress(
            room_name=room_name,
            wedding_id=wedding_id,
            participant_name=f"{host_name} (RTMP)",
            metadata={
                "wedding_id": wedding_id,
                "ingress_type": "obs"
            }
        )
        
        logger.info("=" * 70)
        logger.info("✅ PULSE STREAM CREATED SUCCESSFULLY")
        logger.info(f"   Room Name: {room_name}")
        logger.info(f"   LiveKit URL: {host_token_result.get('server_url')}")
        logger.info(f"   RTMP URL: {rtmp_result.get('rtmp_url')}")
        logger.info(f"   Stream Key: {rtmp_result.get('stream_key')}")
        logger.info("=" * 70)
        
        return {
            "room_name": room_name,
            "room_id": room_result.get("room_id"),
            
            # LiveKit WebRTC tokens
            "host_token": host_token_result.get("token"),
            "viewer_token": viewer_token_result.get("token"),
            "livekit_url": host_token_result.get("server_url"),
            
            # RTMP ingress for OBS
            "rtmp_url": rtmp_result.get("rtmp_url"),
            "stream_key": rtmp_result.get("stream_key"),
            "ingress_id": rtmp_result.get("ingress_id"),
            
            # Metadata
            "wedding_id": wedding_id,
            "created_at": room_result.get("created_at"),
            
            # Legacy compatibility (for backward compatibility)
            "call_id": room_name,  # Map room_name to call_id
            "playback_url": host_token_result.get("server_url")  # WebRTC URL
        }
    
    async def generate_viewer_token(
        self,
        room_name: str,
        participant_name: str = "Guest",
        participant_id: Optional[str] = None
    ) -> Dict:
        """
        Generate a viewer token for an existing stream
        
        Args:
            room_name: LiveKit room name
            participant_name: Display name for the viewer
            participant_id: Optional unique identifier
            
        Returns:
            Viewer token and connection details
        """
        import uuid
        
        if not participant_id:
            participant_id = f"guest_{uuid.uuid4().hex[:8]}"
        
        logger.info(f"🎫 Generating viewer token for room: {room_name}")
        
        result = await self.pulse_service.generate_stream_token(
            room_name=room_name,
            participant_name=participant_name,
            participant_id=participant_id,
            can_publish=False,
            can_subscribe=True,
            can_publish_data=True,
            metadata={
                "role": "viewer"
            }
        )
        
        return {
            "token": result.get("token"),
            "livekit_url": result.get("server_url"),
            "room_name": room_name,
            "participant_name": participant_name,
            "expires_at": result.get("expires_at")
        }
    
    async def get_stream_status(self, room_name: str) -> Dict:
        """
        Get stream status from Pulse
        
        Args:
            room_name: LiveKit room identifier
            
        Returns:
            Dictionary with status information
        """
        logger.info(f"📊 Getting status for room: {room_name}")
        
        try:
            room_info = await self.pulse_service.get_room_info(room_name)
            participants = await self.pulse_service.list_participants(room_name)
            
            return {
                "room_name": room_name,
                "status": room_info.get("status", "offline"),
                "num_participants": room_info.get("num_participants", 0),
                "participants": participants,
                "created_at": room_info.get("created_at"),
                
                # Legacy compatibility
                "call_id": room_name,
                "viewers": len(participants)
            }
            
        except Exception as e:
            logger.error(f"Error getting stream status: {str(e)}")
            return {
                "room_name": room_name,
                "status": "error",
                "error": str(e)
            }
    
    async def end_stream(self, room_name: str) -> Dict:
        """
        End a stream by closing the LiveKit room
        
        Args:
            room_name: LiveKit room to close
            
        Returns:
            Confirmation of stream end
        """
        logger.info(f"🛑 Ending stream for room: {room_name}")
        
        result = await self.pulse_service.end_room(room_name)
        
        logger.info(f"✅ Stream ended: {room_name}")
        
        return {
            "room_name": room_name,
            "status": "ended",
            "ended_at": result.get("ended_at"),
            "message": "Stream ended successfully"
        }


# ==================== LEGACY COMPATIBILITY ====================

async def create_stream_call(wedding_id: str = None):
    """
    Create a stream call (legacy compatibility function)
    
    Maps old NGINX-RTMP API to new Pulse API
    """
    service = StreamService()
    
    if not wedding_id:
        import uuid
        wedding_id = uuid.uuid4().hex[:8]
    
    return await service.create_stream(wedding_id)


# ==================== MIGRATION NOTES ====================
"""
REMOVED METHODS (No longer needed with Pulse):
- generate_stream_key() → Pulse generates tokens
- validate_stream_key() → Pulse validates tokens
- get_rtmp_url() → Pulse provides via create_rtmp_ingress()
- get_playback_url() → Use LiveKit WebRTC URL

REPLACED METHODS (New Pulse implementation):
- create_stream() → Now uses Pulse token generation
- get_stream_status() → Query Pulse room status
- end_stream() → Close Pulse room

NEW METHODS:
- generate_viewer_token() → Generate tokens for viewers
- All methods now async and use Pulse APIs

Stream Flow Changes:

OLD (NGINX-RTMP):
1. Generate stream key
2. Construct RTMP URL: rtmp://server/live
3. Construct HLS URL: http://server/hls/{key}.m3u8
4. Broadcaster uses OBS with stream key
5. Viewers watch HLS stream

NEW (Pulse LiveKit):
1. Create LiveKit room
2. Generate host token (can publish)
3. Generate viewer tokens (can subscribe)
4. Create RTMP ingress for OBS
5. Broadcaster can use:
   - WebRTC (token-based, <500ms latency)
   - RTMP (OBS, traditional workflow)
6. Viewers watch via WebRTC (low latency)

Benefits:
✓ Lower latency (<500ms vs 3-5s with HLS)
✓ Better quality (adaptive bitrate)
✓ More secure (token-based auth)
✓ No server maintenance (Pulse handles infrastructure)
✓ WebRTC native support
✓ Backward compatible with RTMP (OBS)
✓ Simpler codebase (122 lines → 240 lines, but more features)
"""
