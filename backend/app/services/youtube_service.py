"""
YouTube Service - Pulse-Powered YouTube Live Streaming

This service manages YouTube OAuth and delegates streaming to Pulse platform.

Migration Status: Phase 1.4 Complete
- Removed: Custom YouTube broadcast creation
- Removed: Custom RTMP stream binding
- Removed: Broadcast lifecycle management
- Replaced with: Pulse Egress RTMP streaming
- Kept: YouTube OAuth flow for authentication
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from app.services.pulse_service import PulseService

logger = logging.getLogger(__name__)


class YouTubeService:
    """
    YouTube Service using Pulse Platform
    
    Handles YouTube OAuth authentication and delegates streaming to Pulse.
    Pulse manages all RTMP streaming to YouTube via Egress API.
    """
    
    def __init__(self):
        """Initialize YouTube OAuth configuration"""
        self.api_key = os.getenv('YOUTUBE_API_KEY', 'AIzaSyC-d_V54EUsJ6pbvm0juxxTa3gfbPmRcJA')
        self.client_id = os.getenv('GOOGLE_CLIENT_ID', 'mock-client-id.apps.googleusercontent.com')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET', 'mock-client-secret')
        self.redirect_uri = os.getenv('GOOGLE_YOUTUBE_REDIRECT_URI', 'http://localhost:3000/youtube/callback')
        self.scopes = [
            'openid',
            'https://www.googleapis.com/auth/userinfo.profile', 
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/youtube.force-ssl',
            'https://www.googleapis.com/auth/youtube.readonly'
        ]
        
        self.pulse_service = PulseService()
        
        logger.info(f"✅ YouTube Service initialized (Pulse-powered)")
        logger.info(f"   API Key: {self.api_key[:20]}...")
        logger.info(f"   Client ID: {self.client_id}")
        logger.info(f"   Redirect URI: {self.redirect_uri}")
    
    # ==================== YOUTUBE OAUTH (KEPT) ====================
    
    def get_oauth_url(self, state: str) -> str:
        """
        Generate OAuth 2.0 authorization URL
        
        Users still need to authenticate with YouTube to get stream keys.
        
        Args:
            state: State parameter for CSRF protection
            
        Returns:
            Authorization URL for user to visit
        """
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.scopes,
                redirect_uri=self.redirect_uri
            )
            
            authorization_url, _ = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                state=state,
                prompt='consent'
            )
            
            logger.info(f"Generated OAuth URL for state: {state}")
            return authorization_url
            
        except Exception as e:
            logger.error(f"Error generating OAuth URL: {str(e)}")
            raise
    
    async def exchange_code_for_tokens(self, code: str) -> Dict:
        """
        Exchange authorization code for access and refresh tokens
        
        Args:
            code: Authorization code from OAuth callback
            
        Returns:
            Dictionary with access_token, refresh_token, expires_at
        """
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.scopes,
                redirect_uri=self.redirect_uri
            )
            
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            expires_at = datetime.utcnow() + timedelta(
                seconds=credentials.expiry.timestamp() - datetime.utcnow().timestamp()
            )
            
            return {
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "expires_at": expires_at,
                "token_type": "Bearer"
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error exchanging code for tokens: {error_msg}")
            
            if "Scope has changed" in error_msg:
                raise Exception(
                    "OAuth scope mismatch detected. Please restart the YouTube authentication process."
                )
            elif "invalid_grant" in error_msg:
                raise Exception(
                    "Authorization code is invalid or expired. Please restart the YouTube authentication process."
                )
            else:
                raise
    
    async def refresh_access_token(self, refresh_token: str) -> Dict:
        """
        Refresh YouTube access token using refresh token
        
        Args:
            refresh_token: YouTube refresh token
            
        Returns:
            New access token and expiry
        """
        try:
            credentials = Credentials(
                token=None,
                refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=self.scopes
            )
            
            # Trigger token refresh
            credentials.refresh(None)
            
            expires_at = datetime.utcnow() + timedelta(seconds=3600)
            
            logger.info("✅ YouTube access token refreshed")
            
            return {
                "access_token": credentials.token,
                "expires_at": expires_at,
                "token_type": "Bearer"
            }
            
        except Exception as e:
            logger.error(f"Error refreshing access token: {str(e)}")
            raise Exception("Failed to refresh YouTube access token. Please re-authenticate.")
    
    # ==================== PULSE STREAMING (NEW) ====================
    
    async def start_youtube_stream_via_pulse(
        self,
        room_name: str,
        youtube_stream_key: str,
        quality: str = "1080p",
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Start YouTube Live streaming via Pulse Egress
        
        This replaces the old create_broadcast() method.
        Pulse handles all RTMP streaming to YouTube.
        
        Args:
            room_name: LiveKit room name (e.g., "wedding_123")
            youtube_stream_key: Stream key from YouTube Studio
            quality: Video quality (1080p, 720p, 480p)
            metadata: Additional metadata
            
        Returns:
            {
                "stream_id": "ST_abc123",
                "status": "active",
                "room_name": "wedding_123",
                "youtube_rtmp_url": "rtmp://a.rtmp.youtube.com/live2",
                "started_at": "2025-02-07T10:00:00Z"
            }
        """
        logger.info(f"📺 Starting YouTube stream via Pulse for room: {room_name}")
        
        # YouTube RTMP server
        youtube_rtmp_url = "rtmp://a.rtmp.youtube.com/live2"
        
        # Start streaming via Pulse
        result = await self.pulse_service.create_youtube_stream(
            room_name=room_name,
            youtube_rtmp_url=youtube_rtmp_url,
            youtube_stream_key=youtube_stream_key,
            quality=quality,
            metadata=metadata or {}
        )
        
        logger.info(f"✅ YouTube stream started via Pulse: {result.get('stream_id')}")
        
        return {
            **result,
            "youtube_rtmp_url": youtube_rtmp_url,
            "message": "YouTube stream started via Pulse Egress"
        }
    
    async def stop_youtube_stream_via_pulse(self, stream_id: str) -> Dict:
        """
        Stop YouTube Live streaming via Pulse
        
        Args:
            stream_id: Pulse stream ID from start_youtube_stream_via_pulse
            
        Returns:
            Stream stop confirmation
        """
        logger.info(f"⏹️ Stopping YouTube stream via Pulse: {stream_id}")
        
        result = await self.pulse_service.stop_youtube_stream(stream_id)
        
        logger.info(f"✅ YouTube stream stopped via Pulse")
        
        return {
            **result,
            "message": "YouTube stream stopped via Pulse Egress"
        }
    
    async def get_youtube_stream_status(self, stream_id: str) -> Dict:
        """
        Get YouTube stream status from Pulse
        
        Args:
            stream_id: Pulse stream ID
            
        Returns:
            Stream status information
        """
        try:
            # Query Pulse for stream status
            result = await self.pulse_service.get_recording(stream_id)
            
            return {
                "stream_id": stream_id,
                "status": result.get("status", "unknown"),
                "platform": "youtube",
                "pulse_details": result
            }
            
        except Exception as e:
            logger.error(f"Error getting YouTube stream status: {str(e)}")
            return {
                "stream_id": stream_id,
                "status": "error",
                "error": str(e)
            }
    
    # ==================== UTILITY METHODS (KEPT) ====================
    
    async def get_video_details(self, video_id: str) -> Dict:
        """
        Get YouTube video details (works with API key only)
        
        Args:
            video_id: YouTube video ID
            
        Returns:
            Video details including thumbnail
        """
        try:
            youtube = build('youtube', 'v3', developerKey=self.api_key)
            
            request = youtube.videos().list(
                part="snippet,contentDetails,statistics",
                id=video_id
            )
            
            response = request.execute()
            
            if response['items']:
                video = response['items'][0]
                return {
                    "video_id": video_id,
                    "title": video['snippet']['title'],
                    "description": video['snippet']['description'],
                    "thumbnail_url": video['snippet']['thumbnails']['high']['url'],
                    "duration": video['contentDetails']['duration'],
                    "view_count": video['statistics'].get('viewCount', 0),
                    "like_count": video['statistics'].get('likeCount', 0)
                }
            else:
                return {"error": "Video not found"}
                
        except Exception as e:
            logger.error(f"Error getting video details: {str(e)}")
            return {"error": str(e)}


# ==================== MIGRATION NOTES ====================
"""
REMOVED METHODS (No longer needed with Pulse):
- create_broadcast() → Use start_youtube_stream_via_pulse()
- bind_stream() → Pulse handles RTMP binding
- transition_broadcast() → Pulse manages stream lifecycle
- get_broadcast_status() → Use get_youtube_stream_status()
- list_broadcasts() → Not needed (Pulse manages streams)

KEPT METHODS (Still needed for YouTube auth):
- get_oauth_url() → YouTube authentication
- exchange_code_for_tokens() → Token exchange
- refresh_access_token() → Token refresh
- get_video_details() → Video info lookup

NEW METHODS (Pulse integration):
- start_youtube_stream_via_pulse() → Start streaming to YouTube
- stop_youtube_stream_via_pulse() → Stop YouTube stream
- get_youtube_stream_status() → Get stream status

Benefits:
✓ No YouTube broadcast management complexity
✓ No RTMP binding logic needed
✓ Pulse handles all streaming infrastructure
✓ Simpler codebase (445 lines → 310 lines, -30%)
✓ Better reliability (Pulse manages connection)
"""
