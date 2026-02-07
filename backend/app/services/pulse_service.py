"""
Pulse Platform Service - Unified API Client for WedLive

This service provides a single interface to all Pulse platform APIs,
replacing custom NGINX-RTMP, FFmpeg, and recording infrastructure.

Pulse provides:
- Live streaming via LiveKit (WebRTC)
- Recording via LiveKit Egress
- RTMP ingress for OBS/encoders
- RTMP egress for YouTube/Facebook
- Storage (Cloudflare R2 + Telegram CDN)
- Token generation and access control

Phase 1 Implementation: Mock credentials for development/testing
"""

import os
import logging
import requests
from typing import Dict, Optional, List, Any
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)


class PulseServiceException(Exception):
    """Custom exception for Pulse service errors"""
    pass


class PulseService:
    """
    Unified service for Pulse Platform API integration
    
    Replaces:
    - NGINX-RTMP streaming
    - FFmpeg composition
    - Custom recording service
    - Custom token generation
    """
    
    def __init__(self):
        """Initialize Pulse service with configuration"""
        self.pulse_api_url = os.getenv("PULSE_API_URL", "https://api.pulse.example.com")
        self.pulse_api_key = os.getenv("PULSE_API_KEY", "pulse_mock_key_wedlive_xxx")
        self.pulse_api_secret = os.getenv("PULSE_API_SECRET", "pulse_mock_secret_wedlive_xxx")
        self.livekit_url = os.getenv("PULSE_LIVEKIT_URL", "wss://livekit.pulse.example.com")
        
        # Mock mode flag
        self.mock_mode = os.getenv("PULSE_MOCK_MODE", "true").lower() == "true"
        
        if self.mock_mode:
            logger.warning("⚠️ Pulse Service running in MOCK MODE - API calls will be simulated")
        else:
            logger.info("✅ Pulse Service initialized with live API")
        
        logger.info(f"   API URL: {self.pulse_api_url}")
        logger.info(f"   LiveKit URL: {self.livekit_url}")
        logger.info(f"   Mock Mode: {self.mock_mode}")
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        payload: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict:
        """
        Make HTTP request to Pulse API with error handling
        
        Args:
            method: HTTP method (GET, POST, DELETE, etc.)
            endpoint: API endpoint path
            payload: Request body (for POST/PUT)
            params: Query parameters
            
        Returns:
            Response JSON
            
        Raises:
            PulseServiceException: If request fails
        """
        if self.mock_mode:
            return self._mock_response(method, endpoint, payload)
        
        url = f"{self.pulse_api_url}{endpoint}"
        
        headers = {
            "X-Pulse-Key": self.pulse_api_key,
            "X-Pulse-Secret": self.pulse_api_secret,
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.request(
                method=method,
                url=url,
                json=payload,
                params=params,
                headers=headers,
                timeout=30
            )
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Pulse API request failed: {str(e)}")
            raise PulseServiceException(f"Pulse API error: {str(e)}")
    
    def _mock_response(self, method: str, endpoint: str, payload: Optional[Dict]) -> Dict:
        """Generate mock responses for testing without real Pulse API"""
        logger.info(f"🎭 MOCK: {method} {endpoint}")
        
        # Mock token generation
        if "/tokens/create" in endpoint:
            return {
                "token": f"mock_token_{datetime.utcnow().timestamp()}",
                "server_url": self.livekit_url,
                "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
                "room_name": payload.get("room_name"),
                "participant_name": payload.get("participant_name")
            }
        
        # Mock room creation
        elif "/rooms/create" in endpoint:
            return {
                "room_id": f"RM_{datetime.utcnow().timestamp()}",
                "room_name": payload.get("room_name"),
                "status": "active",
                "created_at": datetime.utcnow().isoformat(),
                "server_url": self.livekit_url
            }
        
        # Mock egress start (recording)
        elif "/egress/room" in endpoint:
            return {
                "egress_id": f"EG_{datetime.utcnow().timestamp()}",
                "status": "starting",
                "room_name": payload.get("room_name"),
                "started_at": datetime.utcnow().isoformat()
            }
        
        # Mock egress stop
        elif "/egress/" in endpoint and "stop" in endpoint:
            egress_id = endpoint.split("/")[-2]
            return {
                "egress_id": egress_id,
                "status": "ended",
                "ended_at": datetime.utcnow().isoformat()
            }
        
        # Mock recording details
        elif "/recordings/" in endpoint:
            recording_id = endpoint.split("/")[-1]
            return {
                "recording_id": recording_id,
                "status": "completed",
                "duration": 3600,
                "file_size": 524288000,  # 500MB
                "urls": {
                    "r2": f"https://pub-mock.r2.dev/{recording_id}.mp4",
                    "telegram_cdn": f"https://t.me/file/{recording_id}.mp4",
                    "streaming": f"https://stream.pulse.example.com/{recording_id}/playlist.m3u8"
                },
                "metadata": {
                    "resolution": "1920x1080",
                    "codec": "H264",
                    "fps": 30
                }
            }
        
        # Mock RTMP ingress
        elif "/ingress/rtmp" in endpoint:
            return {
                "ingress_id": f"IN_{datetime.utcnow().timestamp()}",
                "rtmp_url": "rtmp://ingress.pulse.example.com/live",
                "stream_key": f"sk_mock_{datetime.utcnow().timestamp()}",
                "room_name": payload.get("room_name"),
                "status": "ready"
            }
        
        # Mock RTMP egress (YouTube streaming)
        elif "/egress/stream" in endpoint:
            return {
                "stream_id": f"ST_{datetime.utcnow().timestamp()}",
                "status": "active",
                "room_name": payload.get("room_name"),
                "started_at": datetime.utcnow().isoformat(),
                "urls": payload.get("stream", {}).get("urls", [])
            }
        
        # Mock room info
        elif "/rooms/" in endpoint and method == "GET":
            room_name = endpoint.split("/")[-1]
            return {
                "room_name": room_name,
                "status": "active",
                "num_participants": 5,
                "created_at": datetime.utcnow().isoformat()
            }
        
        # Default mock response
        return {
            "success": True,
            "message": "Mock response",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # ==================== TOKEN GENERATION ====================
    
    async def generate_stream_token(
        self,
        room_name: str,
        participant_name: str,
        participant_id: str,
        can_publish: bool = False,
        can_subscribe: bool = True,
        can_publish_data: bool = True,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Generate LiveKit access token for a wedding stream
        
        This replaces custom stream key generation.
        
        Args:
            room_name: Unique room identifier (e.g., wedding_123)
            participant_name: Display name for the participant
            participant_id: Internal user ID
            can_publish: Allow publishing video/audio (host only)
            can_subscribe: Allow subscribing to streams (guests)
            can_publish_data: Allow sending chat/data messages
            metadata: Additional participant metadata
            
        Returns:
            {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "server_url": "wss://livekit.pulse.example.com",
                "expires_at": "2025-02-08T10:00:00Z",
                "room_name": "wedding_123",
                "participant_name": "John Doe"
            }
        """
        logger.info(f"🎫 Generating token for {participant_name} in room {room_name}")
        
        payload = {
            "room_name": room_name,
            "participant_name": participant_name,
            "participant_identity": participant_id,
            "can_publish": can_publish,
            "can_subscribe": can_subscribe,
            "can_publish_data": can_publish_data,
            "metadata": metadata or {}
        }
        
        response = self._make_request("POST", "/v1/tokens/create", payload)
        
        logger.info(f"✅ Token generated for {participant_name}")
        return response
    
    # ==================== ROOM MANAGEMENT ====================
    
    async def create_room(self, room_name: str, metadata: Optional[Dict] = None) -> Dict:
        """
        Create a LiveKit room for a wedding
        
        Args:
            room_name: Unique room identifier
            metadata: Room metadata (wedding_id, etc.)
            
        Returns:
            {
                "room_id": "RM_123456789",
                "room_name": "wedding_123",
                "status": "active",
                "created_at": "2025-02-07T10:00:00Z"
            }
        """
        logger.info(f"🏠 Creating room: {room_name}")
        
        payload = {
            "room_name": room_name,
            "metadata": metadata or {}
        }
        
        response = self._make_request("POST", "/v1/rooms/create", payload)
        
        logger.info(f"✅ Room created: {room_name}")
        return response
    
    async def end_room(self, room_name: str) -> Dict:
        """
        End a LiveKit room
        
        Args:
            room_name: Room to end
            
        Returns:
            {
                "room_name": "wedding_123",
                "status": "ended",
                "ended_at": "2025-02-07T12:00:00Z"
            }
        """
        logger.info(f"🛑 Ending room: {room_name}")
        
        response = self._make_request("DELETE", f"/v1/rooms/{room_name}")
        
        logger.info(f"✅ Room ended: {room_name}")
        return response
    
    async def get_room_info(self, room_name: str) -> Dict:
        """
        Get information about a room
        
        Args:
            room_name: Room to query
            
        Returns:
            {
                "room_name": "wedding_123",
                "status": "active",
                "num_participants": 25,
                "created_at": "2025-02-07T10:00:00Z"
            }
        """
        logger.info(f"ℹ️ Getting room info: {room_name}")
        
        response = self._make_request("GET", f"/v1/rooms/{room_name}")
        
        return response
    
    async def list_participants(self, room_name: str) -> List[Dict]:
        """
        List participants in a room
        
        Args:
            room_name: Room to query
            
        Returns:
            [
                {
                    "participant_id": "user_123",
                    "name": "John Doe",
                    "joined_at": "2025-02-07T10:05:00Z",
                    "is_publishing": true
                }
            ]
        """
        logger.info(f"👥 Listing participants in room: {room_name}")
        
        response = self._make_request("GET", f"/v1/rooms/{room_name}/participants")
        
        return response.get("participants", [])
    
    # ==================== RECORDING (EGRESS) ====================
    
    async def start_recording(
        self,
        room_name: str,
        wedding_id: str,
        quality: str = "1080p",
        upload_to_telegram: bool = True,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Start recording a wedding stream via Pulse Egress
        
        This replaces the custom recording service.
        
        Args:
            room_name: LiveKit room to record
            wedding_id: WedLive wedding identifier
            quality: Video quality preset (1080p, 720p, 480p)
            upload_to_telegram: Mirror to Telegram CDN (free bandwidth)
            metadata: Additional recording metadata
            
        Returns:
            {
                "egress_id": "EG_abc123",
                "status": "starting",
                "room_name": "wedding_123",
                "started_at": "2025-02-07T10:00:00Z"
            }
        """
        logger.info(f"📹 Starting recording for room {room_name} at {quality}")
        
        filename = f"wedding_{wedding_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.mp4"
        
        payload = {
            "room_name": room_name,
            "file": {
                "filename": filename
            },
            "options": {
                "preset": f"H264_{quality.upper()}_30",
                "upload_to_telegram": upload_to_telegram
            },
            "metadata": {
                "wedding_id": wedding_id,
                "platform": "wedlive",
                **(metadata or {})
            }
        }
        
        response = self._make_request("POST", "/v1/egress/room", payload)
        
        logger.info(f"✅ Recording started: {response.get('egress_id')}")
        return response
    
    async def stop_recording(self, egress_id: str) -> Dict:
        """
        Stop an active recording
        
        Args:
            egress_id: Egress ID from start_recording
            
        Returns:
            {
                "egress_id": "EG_abc123",
                "status": "ended",
                "ended_at": "2025-02-07T12:00:00Z"
            }
        """
        logger.info(f"⏹️ Stopping recording: {egress_id}")
        
        response = self._make_request("POST", f"/v1/egress/{egress_id}/stop")
        
        logger.info(f"✅ Recording stopped: {egress_id}")
        return response
    
    async def get_recording(self, recording_id: str) -> Dict:
        """
        Get recording details and playback URLs
        
        Args:
            recording_id: Recording/Egress ID
            
        Returns:
            {
                "recording_id": "EG_abc123",
                "status": "completed",
                "duration": 3600,
                "file_size": 524288000,
                "urls": {
                    "r2": "https://pub-xyz.r2.dev/wedding_123.mp4",
                    "telegram_cdn": "https://t.me/file/wedding_123.mp4",
                    "streaming": "https://cdn.pulse.com/wedding_123/playlist.m3u8"
                },
                "metadata": {
                    "resolution": "1920x1080",
                    "codec": "H264",
                    "fps": 30
                }
            }
        """
        logger.info(f"📼 Getting recording details: {recording_id}")
        
        response = self._make_request("GET", f"/v1/recordings/{recording_id}")
        
        return response
    
    # ==================== RTMP INGRESS (OBS Support) ====================
    
    async def create_rtmp_ingress(
        self,
        room_name: str,
        wedding_id: str,
        participant_name: str = "RTMP Stream",
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Create RTMP ingress for professional videographers using OBS/encoders
        
        This replaces NGINX-RTMP server functionality.
        
        Args:
            room_name: LiveKit room to stream into
            wedding_id: WedLive wedding identifier
            participant_name: Display name for the RTMP stream
            metadata: Additional metadata
            
        Returns:
            {
                "ingress_id": "IN_xyz789",
                "rtmp_url": "rtmp://ingress.pulse.example.com/live",
                "stream_key": "sk_abc123def456",
                "room_name": "wedding_123",
                "status": "ready"
            }
        """
        logger.info(f"📡 Creating RTMP ingress for room {room_name}")
        
        payload = {
            "room_name": room_name,
            "participant_name": participant_name,
            "video": {
                "preset": "H264_1080P_30_BASELINE"
            },
            "audio": {
                "preset": "AAC_128_STEREO"
            },
            "metadata": {
                "wedding_id": wedding_id,
                "source": "rtmp",
                **(metadata or {})
            }
        }
        
        response = self._make_request("POST", "/v1/ingress/rtmp", payload)
        
        logger.info(f"✅ RTMP ingress created: {response.get('ingress_id')}")
        return response
    
    async def delete_rtmp_ingress(self, ingress_id: str) -> Dict:
        """
        Delete an RTMP ingress
        
        Args:
            ingress_id: Ingress ID from create_rtmp_ingress
            
        Returns:
            {
                "ingress_id": "IN_xyz789",
                "status": "deleted"
            }
        """
        logger.info(f"🗑️ Deleting RTMP ingress: {ingress_id}")
        
        response = self._make_request("DELETE", f"/v1/ingress/{ingress_id}")
        
        logger.info(f"✅ RTMP ingress deleted: {ingress_id}")
        return response
    
    # ==================== YOUTUBE LIVE STREAMING ====================
    
    async def create_youtube_stream(
        self,
        room_name: str,
        youtube_rtmp_url: str,
        youtube_stream_key: str,
        quality: str = "1080p",
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Stream wedding to YouTube Live using Pulse Egress
        
        This replaces custom YouTube integration with RTMP output.
        
        Args:
            room_name: LiveKit room to stream
            youtube_rtmp_url: YouTube RTMP server (e.g., rtmp://a.rtmp.youtube.com/live2)
            youtube_stream_key: YouTube stream key from YouTube Studio
            quality: Stream quality (1080p, 720p, 480p)
            metadata: Additional metadata
            
        Returns:
            {
                "stream_id": "ST_abc123",
                "status": "active",
                "room_name": "wedding_123",
                "started_at": "2025-02-07T10:00:00Z",
                "urls": ["rtmp://a.rtmp.youtube.com/live2/xxxx"]
            }
        """
        logger.info(f"📺 Starting YouTube stream for room {room_name}")
        
        # Parse quality
        quality_map = {
            "1080p": {"width": 1920, "height": 1080, "bitrate": 5000},
            "720p": {"width": 1280, "height": 720, "bitrate": 3000},
            "480p": {"width": 854, "height": 480, "bitrate": 1500}
        }
        
        video_config = quality_map.get(quality, quality_map["1080p"])
        
        payload = {
            "room_name": room_name,
            "stream": {
                "protocol": "rtmp",
                "urls": [f"{youtube_rtmp_url}/{youtube_stream_key}"]
            },
            "video": {
                "codec": "H264_MAIN",
                "width": video_config["width"],
                "height": video_config["height"],
                "framerate": 30,
                "bitrate": video_config["bitrate"]
            },
            "audio": {
                "codec": "AAC",
                "bitrate": 128,
                "channels": 2
            },
            "metadata": metadata or {}
        }
        
        response = self._make_request("POST", "/v1/egress/stream", payload)
        
        logger.info(f"✅ YouTube stream started: {response.get('stream_id')}")
        return response
    
    async def stop_youtube_stream(self, stream_id: str) -> Dict:
        """
        Stop YouTube Live stream
        
        Args:
            stream_id: Stream ID from create_youtube_stream
            
        Returns:
            {
                "stream_id": "ST_abc123",
                "status": "ended",
                "ended_at": "2025-02-07T12:00:00Z"
            }
        """
        logger.info(f"⏹️ Stopping YouTube stream: {stream_id}")
        
        response = self._make_request("POST", f"/v1/egress/stream/{stream_id}/stop")
        
        logger.info(f"✅ YouTube stream stopped: {stream_id}")
        return response
    
    # ==================== MULTI-PLATFORM STREAMING ====================
    
    async def create_multi_platform_stream(
        self,
        room_name: str,
        platforms: List[Dict[str, str]],
        quality: str = "1080p",
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Stream to multiple platforms simultaneously (YouTube + Facebook + Twitch)
        
        Args:
            room_name: LiveKit room to stream
            platforms: List of platform configs
                [
                    {"name": "youtube", "rtmp_url": "rtmp://...", "stream_key": "xxx"},
                    {"name": "facebook", "rtmp_url": "rtmp://...", "stream_key": "yyy"}
                ]
            quality: Stream quality
            metadata: Additional metadata
            
        Returns:
            {
                "stream_id": "ST_abc123",
                "status": "active",
                "platforms": ["youtube", "facebook"],
                "started_at": "2025-02-07T10:00:00Z"
            }
        """
        logger.info(f"🌐 Starting multi-platform stream for room {room_name}")
        
        # Build RTMP URLs
        rtmp_urls = []
        for platform in platforms:
            url = f"{platform['rtmp_url']}/{platform['stream_key']}"
            rtmp_urls.append(url)
        
        quality_map = {
            "1080p": {"width": 1920, "height": 1080, "bitrate": 5000},
            "720p": {"width": 1280, "height": 720, "bitrate": 3000},
            "480p": {"width": 854, "height": 480, "bitrate": 1500}
        }
        
        video_config = quality_map.get(quality, quality_map["1080p"])
        
        payload = {
            "room_name": room_name,
            "stream": {
                "protocol": "rtmp",
                "urls": rtmp_urls
            },
            "video": {
                "codec": "H264_MAIN",
                "width": video_config["width"],
                "height": video_config["height"],
                "framerate": 30,
                "bitrate": video_config["bitrate"]
            },
            "audio": {
                "codec": "AAC",
                "bitrate": 128,
                "channels": 2
            },
            "metadata": {
                "platforms": [p["name"] for p in platforms],
                **(metadata or {})
            }
        }
        
        response = self._make_request("POST", "/v1/egress/stream", payload)
        
        logger.info(f"✅ Multi-platform stream started: {response.get('stream_id')}")
        return response
    
    # ==================== HEALTH & MONITORING ====================
    
    async def health_check(self) -> Dict:
        """
        Check Pulse API health
        
        Returns:
            {
                "status": "healthy",
                "timestamp": "2025-02-07T10:00:00Z",
                "services": {
                    "livekit": "operational",
                    "egress": "operational",
                    "ingress": "operational"
                }
            }
        """
        logger.info("🏥 Checking Pulse API health")
        
        try:
            response = self._make_request("GET", "/v1/health")
            return response
        except Exception as e:
            logger.error(f"❌ Health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }


# Singleton instance
_pulse_service_instance = None

def get_pulse_service() -> PulseService:
    """Get singleton instance of PulseService"""
    global _pulse_service_instance
    if _pulse_service_instance is None:
        _pulse_service_instance = PulseService()
    return _pulse_service_instance
