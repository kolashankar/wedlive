import os
import logging
from datetime import datetime
from typing import Dict, Optional, List
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.discovery import Resource
from googleapiclient.errors import HttpError
import httpx

logger = logging.getLogger(__name__)

class GoogleAuthService:
    """Service for Google OAuth 2.0 Authentication"""
    
    def __init__(self):
        self.client_id = os.getenv('GOOGLE_CLIENT_ID', '')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET', '')
        # For Google Sign-In (website authentication)
        self.redirect_uri = os.getenv('GOOGLE_AUTH_REDIRECT_URI', 'http://localhost:3000/auth/google/callback')
        self.scopes = [
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ]
        
        logger.info(f"✅ Google Auth Service initialized")
        logger.info(f"   Client ID: {self.client_id[:30]}...")
        logger.info(f"   Redirect URI: {self.redirect_uri}")
        print(f"DEBUG: Google Auth Service Redirect URI: {self.redirect_uri}")
    
    def get_oauth_url(self, state: str, additional_scopes: List[str] = None) -> str:
        """Generate Google OAuth 2.0 authorization URL
        
        Args:
            state: State parameter for CSRF protection
            additional_scopes: Optional additional scopes to include (WARNING: YouTube scopes not allowed)
            
        Returns:
            Authorization URL for user to visit
        """
        try:
            use_scopes = self.scopes.copy()
            
            # Check if YouTube scopes are being requested (this should NOT happen)
            if additional_scopes:
                youtube_scopes = ['https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/youtube.force-ssl']
                forbidden_scopes = [scope for scope in additional_scopes if scope in youtube_scopes]
                
                if forbidden_scopes:
                    logger.error("CRITICAL: YouTube scopes requested in Google auth service")
                    logger.error(f"Forbidden scopes: {forbidden_scopes}")
                    logger.error("This indicates a serious routing issue - YouTube requests should use YouTube service")
                    raise Exception(
                        "CRITICAL: YouTube authentication cannot be performed through Google login. "
                        "Please use the YouTube integration page in your wedding management to connect YouTube."
                    )
                
                use_scopes.extend(additional_scopes)
            
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
                scopes=use_scopes,
                redirect_uri=self.redirect_uri
            )
            
            authorization_url, _ = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='false',  # Prevent scope expansion
                state=state,
                prompt='consent'
            )
            
            logger.info(f"Generated Google OAuth URL for state: {state}")
            logger.info(f"Scopes used: {use_scopes}")
            return authorization_url
            
        except Exception as e:
            logger.error(f"Error generating Google OAuth URL: {str(e)}")
            raise
    
    async def exchange_code_for_tokens(self, code: str, scopes: List[str] = None) -> Dict:
        """Exchange authorization code for access token
        
        Args:
            code: Authorization code from OAuth callback
            scopes: Optional list of scopes to use (defaults to self.scopes)
            
        Returns:
            Dictionary with access_token and user info
        """
        try:
            # Use provided scopes or default to self.scopes
            use_scopes = scopes or self.scopes
            
            # CRITICAL: Check if this is a YouTube OAuth request (has YouTube scopes)
            youtube_scopes = ['https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/youtube.force-ssl']
            is_youtube_request = any(scope in use_scopes for scope in youtube_scopes)
            
            if is_youtube_request:
                logger.error("CRITICAL: YouTube OAuth request detected in Google auth service")
                logger.error(f"Requested scopes: {use_scopes}")
                logger.error("This indicates a routing issue - YouTube requests should go to /api/youtube/callback")
                raise Exception(
                    "CRITICAL: YouTube authentication request was routed to the wrong endpoint. "
                    "Please ensure YouTube authentication is initiated from the wedding management page. "
                    "If you were trying to connect YouTube, please go back and try again from the YouTube integration section."
                )
            
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
                scopes=use_scopes,
                redirect_uri=self.redirect_uri
            )
            
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            # Get user info from Google
            user_info = await self.get_user_info(credentials.token)
            
            return {
                "access_token": credentials.token,
                "user_info": user_info
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error exchanging code for tokens: {error_msg}")
            
            # CRITICAL: Check if the error message indicates YouTube scopes were involved
            if "youtube" in error_msg.lower() or "youtube" in str(use_scopes).lower():
                logger.error("CRITICAL: YouTube scopes detected in error - routing issue confirmed")
                raise Exception(
                    "CRITICAL: YouTube authentication was incorrectly routed to Google login. "
                    "Please use the YouTube integration page in your wedding management to connect YouTube."
                )
            
            # Handle specific OAuth errors
            elif "Scope has changed" in error_msg:
                logger.error("SCOPE MISMATCH: The authorization code was generated with different scopes.")
                # Check if the original scopes include YouTube scopes
                if "youtube" in error_msg.lower():
                    logger.error("YouTube scopes detected in scope mismatch - routing issue confirmed")
                    raise Exception(
                        "CRITICAL: YouTube authentication was incorrectly routed to Google login. "
                        "Please use the YouTube integration page in your wedding management to connect YouTube."
                    )
                
                # Try to extract the original scopes from the error message and retry
                if "from" in error_msg and "to" in error_msg:
                    logger.info("Attempting to retry with original scopes...")
                    # Extract scopes between quotes
                    import re
                    original_scopes_match = re.search(r'from "(.*?)" to', error_msg)
                    if original_scopes_match:
                        original_scopes = original_scopes_match.group(1).split()
                        logger.info(f"Retrying with scopes: {original_scopes}")
                        
                        # Check if the original scopes include YouTube scopes
                        is_youtube_request = any(scope in original_scopes for scope in youtube_scopes)
                        
                        if is_youtube_request:
                            logger.error("This is a YouTube OAuth request - redirecting to proper error message")
                            raise Exception(
                                "CRITICAL: YouTube authentication was incorrectly routed to Google login. "
                                "Please use the YouTube integration page in your wedding management to connect YouTube."
                            )
                        
                        return await self.exchange_code_for_tokens(code, original_scopes)
                
                raise Exception(
                    "OAuth scope mismatch detected. Please restart the Google authentication process."
                )
            elif "invalid_grant" in error_msg:
                logger.error("INVALID GRANT: The authorization code is invalid or expired.")
                raise Exception(
                    "Authorization code is invalid or expired. Please restart the Google authentication process."
                )
            elif "redirect_uri_mismatch" in error_msg:
                logger.error("REDIRECT URI MISMATCH: The redirect URI doesn't match the configuration.")
                raise Exception(
                    "Redirect URI mismatch. Please check your Google OAuth configuration."
                )
            else:
                raise
    
    async def get_user_info(self, access_token: str) -> Dict:
        """Get user information from Google
        
        Args:
            access_token: Google access token
            
        Returns:
            Dictionary with user info (email, name, picture, google_id)
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers={'Authorization': f'Bearer {access_token}'}
                )
                
                if response.status_code != 200:
                    raise Exception(f"Failed to get user info: {response.text}")
                
                user_data = response.json()
                
                return {
                    "google_id": user_data.get("id"),
                    "email": user_data.get("email"),
                    "full_name": user_data.get("name"),
                    "profile_picture": user_data.get("picture"),
                    "verified_email": user_data.get("verified_email", False)
                }
                
        except Exception as e:
            logger.error(f"Error getting user info: {str(e)}")
            raise
    
    async def verify_token(self, token: str) -> bool:
        """Verify Google access token
        
        Args:
            token: Google access token
            
        Returns:
            True if valid, False otherwise
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f'https://oauth2.googleapis.com/tokeninfo?access_token={token}'
                )
                
                return response.status_code == 200
                
        except Exception as e:
            logger.error(f"Error verifying token: {str(e)}")
            return False
