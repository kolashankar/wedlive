import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
from app.services.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

class YouTubeService:
    """Service for managing YouTube Live Streaming"""
    
    def __init__(self):
        self.api_key = os.getenv('YOUTUBE_API_KEY', 'AIzaSyC-d_V54EUsJ6pbvm0juxxTa3gfbPmRcJA')
        # Using unified Google OAuth credentials
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
        
        logger.info(f"✅ YouTube Service initialized with unified Google OAuth")
        logger.info(f"   API Key: {self.api_key[:20]}...")
        logger.info(f"   Client ID: {self.client_id}")
        logger.info(f"   Redirect URI: {self.redirect_uri}")
    
    def get_oauth_url(self, state: str) -> str:
        """Generate OAuth 2.0 authorization URL
        
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
                prompt='consent'  # Force consent to get refresh token
            )
            
            logger.info(f"Generated OAuth URL for state: {state}")
            return authorization_url
            
        except Exception as e:
            logger.error(f"Error generating OAuth URL: {str(e)}")
            raise
    
    async def exchange_code_for_tokens(self, code: str) -> Dict:
        """Exchange authorization code for access and refresh tokens
        
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
            
            expires_at = datetime.utcnow() + timedelta(seconds=credentials.expiry.timestamp() - datetime.utcnow().timestamp())
            
            return {
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "expires_at": expires_at,
                "token_type": "Bearer"
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error exchanging code for tokens: {error_msg}")
            
            # Handle specific scope mismatch error
            if "Scope has changed" in error_msg:
                logger.error("SCOPE MISMATCH: The authorization code was generated with different scopes.")
                logger.error("Solution: Clear any existing OAuth state and restart the authentication flow.")
                raise Exception(
                    "OAuth scope mismatch detected. Please restart the YouTube authentication process. "
                    "This can happen if OAuth settings were recently updated. Try connecting YouTube again."
                )
            elif "invalid_grant" in error_msg:
                logger.error("INVALID GRANT: The authorization code is invalid or expired.")
                logger.error("Solution: Generate a new authorization code by restarting the OAuth flow.")
                raise Exception(
                    "Authorization code is invalid or expired. Please restart the YouTube authentication process."
                )
            else:
                raise
    
    def _get_youtube_client(self, credentials_dict: Dict):
        """Create YouTube API client from credentials
        
        Args:
            credentials_dict: Dictionary with access_token, refresh_token, etc.
            
        Returns:
            YouTube API client
        """
        credentials = Credentials(
            token=credentials_dict['access_token'],
            refresh_token=credentials_dict.get('refresh_token'),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=self.scopes
        )
        
        return build('youtube', 'v3', credentials=credentials)
    
    async def create_broadcast(self, credentials_dict: Dict, title: str, scheduled_time: datetime, description: str = "", user_id: str = None) -> Dict:
        """Create a YouTube Live Broadcast
        
        Args:
            credentials_dict: User's YouTube OAuth credentials
            title: Broadcast title
            scheduled_time: Scheduled start time
            description: Broadcast description
            user_id: User ID for rate limiting (optional)
            
        Returns:
            Dictionary with broadcast_id, stream_id, rtmp_url, stream_key
        """
        try:
            # Check rate limit if user_id provided
            if user_id:
                allowed, error_msg = rate_limiter.check_limit(user_id, "youtube_broadcast_create")
                if not allowed:
                    raise Exception(error_msg)
            
            youtube = self._get_youtube_client(credentials_dict)
            
            # Create the broadcast
            broadcast_request = youtube.liveBroadcasts().insert(
                part="snippet,status,contentDetails",
                body={
                    "snippet": {
                        "title": title,
                        "description": description,
                        "scheduledStartTime": scheduled_time.isoformat() + "Z"
                    },
                    "status": {
                        "privacyStatus": "public",
                        "selfDeclaredMadeForKids": False
                    },
                    "contentDetails": {
                        "enableAutoStart": False,
                        "enableAutoStop": False,
                        "enableDvr": True,
                        "recordFromStart": True,
                        "enableContentEncryption": False,
                        "enableEmbed": True
                    }
                }
            )
            
            broadcast_response = broadcast_request.execute()
            broadcast_id = broadcast_response['id']
            
            logger.info(f"✅ Created YouTube broadcast: {broadcast_id}")
            
            # Create the live stream
            stream_request = youtube.liveStreams().insert(
                part="snippet,cdn,contentDetails",
                body={
                    "snippet": {
                        "title": f"Stream for {title}"
                    },
                    "cdn": {
                        "frameRate": "variable",
                        "ingestionType": "rtmp",
                        "resolution": "variable"
                    },
                    "contentDetails": {
                        "isReusable": True
                    }
                }
            )
            
            stream_response = stream_request.execute()
            stream_id = stream_response['id']
            
            # Get RTMP credentials
            ingestion_info = stream_response['cdn']['ingestionInfo']
            rtmp_url = ingestion_info['ingestionAddress']
            stream_key = ingestion_info['streamName']
            
            logger.info(f"✅ Created YouTube stream: {stream_id}")
            logger.info(f"   RTMP URL: {rtmp_url}")
            
            # Bind stream to broadcast
            bind_request = youtube.liveBroadcasts().bind(
                part="id,contentDetails",
                id=broadcast_id,
                streamId=stream_id
            )
            bind_request.execute()
            
            logger.info(f"✅ Bound stream {stream_id} to broadcast {broadcast_id}")
            
            # Record API call for rate limiting
            if user_id:
                rate_limiter.record_call(user_id, "youtube_broadcast_create")
            
            return {
                "broadcast_id": broadcast_id,
                "stream_id": stream_id,
                "rtmp_url": rtmp_url,
                "stream_key": stream_key,
                "youtube_video_url": f"https://www.youtube.com/watch?v={broadcast_id}",
                "youtube_embed_url": f"https://www.youtube.com/embed/{broadcast_id}"
            }
            
        except HttpError as e:
            error_msg = str(e)
            logger.error(f"YouTube API error creating broadcast: {error_msg}")
            logger.error(f"Error details: {e.content}")
            
            # Handle specific YouTube errors
            if "liveStreamingNotEnabled" in error_msg:
                raise Exception(
                    "Your YouTube account is not enabled for live streaming. "
                    "To enable live streaming, you need to:\n"
                    "1. Verify your YouTube account (no strikes)\n"
                    "2. Wait 24 hours after verification\n"
                    "3. Enable live streaming in YouTube Studio\n"
                    "4. Try connecting again"
                )
            elif "forbidden" in error_msg.lower() or "insufficientPermissions" in error_msg:
                raise Exception(
                    "Insufficient permissions for YouTube. Please make sure you granted all required permissions "
                    "during authentication and try connecting again."
                )
            elif "quotaExceeded" in error_msg or "quota" in error_msg.lower():
                raise Exception(
                    "YouTube API quota exceeded. Please try again later."
                )
            elif "invalid_grant" in error_msg.lower():
                raise Exception(
                    "Your YouTube authorization has expired. Please reconnect your YouTube account."
                )
            else:
                raise Exception(f"YouTube API error: {error_msg}")
        except Exception as e:
            logger.error(f"Unexpected error creating broadcast: {str(e)}")
            raise Exception(f"Failed to create YouTube broadcast: {str(e)}")
    
    async def transition_broadcast(self, credentials_dict: Dict, broadcast_id: str, status: str) -> Dict:
        """Transition broadcast status (testing, live, complete)
        
        Args:
            credentials_dict: User's YouTube OAuth credentials
            broadcast_id: YouTube broadcast ID
            status: Target status ('testing', 'live', 'complete')
            
        Returns:
            Updated broadcast info
        """
        try:
            youtube = self._get_youtube_client(credentials_dict)
            
            request = youtube.liveBroadcasts().transition(
                part="status",
                id=broadcast_id,
                broadcastStatus=status
            )
            
            response = request.execute()
            logger.info(f"✅ Transitioned broadcast {broadcast_id} to {status}")
            
            return response
            
        except HttpError as e:
            logger.error(f"YouTube API error transitioning broadcast: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error transitioning broadcast: {str(e)}")
            raise
    
    async def get_broadcast_status(self, credentials_dict: Dict, broadcast_id: str, user_id: str = None) -> Dict:
        """Get current broadcast status
        
        Args:
            credentials_dict: User's YouTube OAuth credentials
            broadcast_id: YouTube broadcast ID
            user_id: User ID for rate limiting (optional)
            
        Returns:
            Broadcast status information
        """
        try:
            # Check rate limit
            if user_id:
                allowed, error_msg = rate_limiter.check_limit(user_id, "youtube_status_check")
                if not allowed:
                    raise Exception(error_msg)
            
            youtube = self._get_youtube_client(credentials_dict)
            
            request = youtube.liveBroadcasts().list(
                part="status,snippet",
                id=broadcast_id
            )
            
            response = request.execute()
            
            if response['items']:
                broadcast = response['items'][0]
                
                # Record API call
                if user_id:
                    rate_limiter.record_call(user_id, "youtube_status_check")
                
                return {
                    "broadcast_id": broadcast_id,
                    "life_cycle_status": broadcast['status']['lifeCycleStatus'],
                    "recording_status": broadcast['status'].get('recordingStatus', 'unknown'),
                    "privacy_status": broadcast['status']['privacyStatus']
                }
            else:
                return {"error": "Broadcast not found"}
                
        except Exception as e:
            logger.error(f"Error getting broadcast status: {str(e)}")
            raise
    
    async def list_broadcasts(self, credentials_dict: Dict, max_results: int = 25) -> List[Dict]:
        """List user's YouTube broadcasts
        
        Args:
            credentials_dict: User's YouTube OAuth credentials
            max_results: Maximum number of results to return
            
        Returns:
            List of broadcast information
        """
        try:
            youtube = self._get_youtube_client(credentials_dict)
            
            request = youtube.liveBroadcasts().list(
                part="snippet,status,contentDetails",
                mine=True,
                maxResults=max_results
            )
            
            response = request.execute()
            
            broadcasts = []
            for item in response.get('items', []):
                broadcasts.append({
                    "broadcast_id": item['id'],
                    "title": item['snippet']['title'],
                    "description": item['snippet'].get('description', ''),
                    "scheduled_start_time": item['snippet'].get('scheduledStartTime'),
                    "actual_start_time": item['snippet'].get('actualStartTime'),
                    "actual_end_time": item['snippet'].get('actualEndTime'),
                    "life_cycle_status": item['status']['lifeCycleStatus'],
                    "privacy_status": item['status']['privacyStatus'],
                    "thumbnail_url": item['snippet']['thumbnails'].get('high', {}).get('url', ''),
                    "youtube_video_url": f"https://www.youtube.com/watch?v={item['id']}"
                })
            
            return broadcasts
            
        except Exception as e:
            logger.error(f"Error listing broadcasts: {str(e)}")
            raise
    
    async def get_video_details(self, video_id: str) -> Dict:
        """Get YouTube video details (works with API key only)
        
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
