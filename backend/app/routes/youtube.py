from fastapi import APIRouter, HTTPException, status, Depends, Request
from app.models import UserResponse
from app.auth import get_current_user
from app.database import get_db
from app.services.youtube_service import YouTubeService
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import logging
import secrets
import uuid

logger = logging.getLogger(__name__)

router = APIRouter()
youtube_service = YouTubeService()

# Store state tokens temporarily (in production, use Redis)
state_storage = {}

# Database-backed state storage for persistence
async def store_state_in_db(db, state: str, user_id: str, wedding_id: str):
    """Store OAuth state in database for persistence"""
    await db.oauth_states.insert_one({
        "state": state,
        "user_id": user_id,
        "wedding_id": wedding_id,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
    })

async def get_state_from_db(db, state: str):
    """Get OAuth state from database"""
    state_doc = await db.oauth_states.find_one({
        "state": state,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    return state_doc

async def cleanup_expired_states(db):
    """Clean up expired OAuth states"""
    await db.oauth_states.delete_many({
        "expires_at": {"$lte": datetime.utcnow()}
    })

class YouTubeConnectRequest(BaseModel):
    wedding_id: str

class YouTubeCallbackRequest(BaseModel):
    code: str
    state: str

class YouTubeTransitionRequest(BaseModel):
    broadcast_id: str
    status: str  # 'testing', 'live', 'complete'

@router.post("/clear-cache/{wedding_id}")
async def clear_youtube_cache(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Clear YouTube OAuth cache and state for a wedding
    
    This helps resolve OAuth scope mismatch issues
    """
    try:
        db = get_db()
        
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Clear YouTube settings
        await db.weddings.update_one(
            {"id": wedding_id},
            {
                "$set": {
                    "youtube_settings": {
                        "auth_connected": False
                    },
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Clear any related state tokens
        states_to_remove = []
        for state, state_data in state_storage.items():
            if state_data.get("wedding_id") == wedding_id:
                states_to_remove.append(state)
        
        for state in states_to_remove:
            del state_storage[state]
        
        logger.info(f"Cleared YouTube OAuth cache for wedding {wedding_id}")
        
        return {"success": True, "message": "YouTube cache cleared. Please try connecting again."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing YouTube cache: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear YouTube cache: {str(e)}"
        )

@router.post("/connect")
async def initiate_youtube_connection(
    request: YouTubeConnectRequest,
    current_user: dict = Depends(get_current_user)
):
    """Initiate YouTube OAuth flow
    
    Returns OAuth URL for user to visit
    """
    try:
        db = get_db()
        
        # Verify wedding ownership
        wedding = await db.weddings.find_one({"id": request.wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Generate state token
        state = secrets.token_urlsafe(32)
        
        # Store in both memory and database for reliability
        state_storage[state] = {
            "user_id": current_user["user_id"],
            "wedding_id": request.wedding_id,
            "created_at": datetime.utcnow()
        }
        
        # Also store in database for persistence
        await store_state_in_db(db, state, current_user["user_id"], request.wedding_id)
        
        # Clean up expired states
        await cleanup_expired_states(db)
        
        # Get OAuth URL
        oauth_url = youtube_service.get_oauth_url(state)
        
        logger.info(f"YouTube OAuth initiated for user {current_user['user_id']}, wedding {request.wedding_id}")
        
        return {
            "oauth_url": oauth_url,
            "state": state
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initiating YouTube connection: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate YouTube connection: {str(e)}"
        )

@router.post("/callback")
async def youtube_oauth_callback(
    request: YouTubeCallbackRequest,
    current_user: dict = Depends(get_current_user)
):
    """Handle YouTube OAuth callback
    
    Exchange authorization code for tokens and store them
    """
    try:
        # Debug logging
        logger.info(f"YouTube OAuth callback received - State: {request.state}, Code present: {bool(request.code)}")
        logger.info(f"Current state storage keys: {list(state_storage.keys())}")
        
        # Graceful state token validation
        if not request.state:
            logger.error("No state token provided in YouTube callback")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="State token is required"
            )
        
        if not request.code:
            logger.error("No authorization code provided in YouTube callback")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization code is required"
            )
        
        # Try to get wedding_id from state storage, with fallback mechanism
        wedding_id = None
        db = get_db()
        
        # First try memory storage
        if request.state in state_storage:
            wedding_id = state_storage[request.state]["wedding_id"]
            logger.info(f"Found state in memory storage: {wedding_id}")
        else:
            # Try database storage
            state_doc = await get_state_from_db(db, request.state)
            if state_doc:
                wedding_id = state_doc["wedding_id"]
                logger.info(f"Found state in database storage: {wedding_id}")
                # Restore to memory for future use
                state_storage[request.state] = {
                    "user_id": state_doc["user_id"],
                    "wedding_id": state_doc["wedding_id"],
                    "created_at": state_doc["created_at"]
                }
            else:
                logger.warning(f"State token {request.state} not found in memory or database")
                logger.info(f"Available memory states: {list(state_storage.keys())}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired state token. Please restart the YouTube authentication process."
                )
        
        # Exchange code for tokens
        tokens = await youtube_service.exchange_code_for_tokens(request.code)
        
        db = get_db()
        
        # Store tokens in wedding's youtube_settings
        await db.weddings.update_one(
            {"id": wedding_id},
            {
                "$set": {
                    "youtube_settings.auth_connected": True,
                    "youtube_settings.auth_tokens": {
                        "access_token": tokens["access_token"],
                        "refresh_token": tokens["refresh_token"],
                        "expires_at": tokens["expires_at"],
                        "token_type": tokens["token_type"]
                    },
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Clean up state token from both memory and database
        if request.state in state_storage:
            del state_storage[request.state]
        await db.oauth_states.delete_one({"state": request.state})
        
        logger.info(f"✅ YouTube OAuth completed for wedding {wedding_id}")
        
        return {
            "success": True,
            "message": "YouTube account connected successfully",
            "wedding_id": wedding_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error in YouTube OAuth callback: {error_msg}")
        
        # Check for YouTube service specific errors first
        if "live streaming not enabled" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        
        # Provide specific error messages for common OAuth issues
        if "OAuth scope mismatch detected" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OAuth scope mismatch. Please clear the YouTube cache and try connecting again."
            )
        elif "Authorization code is invalid or expired" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization expired. Please restart the YouTube authentication process."
            )
        elif "live streaming" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg  # This will contain the detailed live streaming instructions
            )
        elif "insufficient permissions" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient permissions. Please make sure you granted all required permissions during authentication."
            )
        elif "quota" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="YouTube API quota exceeded. Please try again later."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to complete YouTube authentication: {error_msg}"
            )

@router.post("/create-broadcast/{wedding_id}")
async def create_youtube_broadcast(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Create YouTube broadcast for wedding
    
    Creates broadcast and stream, binds them together
    """
    try:
        db = get_db()
        
        # Get wedding
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Check if YouTube is connected
        youtube_settings = wedding.get("youtube_settings", {})
        if not youtube_settings.get("auth_connected"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="YouTube account not connected. Please connect your YouTube account first."
            )
        
        # Check if broadcast already exists (reuse it)
        if youtube_settings.get("broadcast_id"):
            logger.info(f"Reusing existing broadcast {youtube_settings['broadcast_id']} for wedding {wedding_id}")
            return {
                "success": True,
                "reused": True,
                "broadcast_id": youtube_settings["broadcast_id"],
                "stream_id": youtube_settings.get("stream_id"),
                "rtmp_url": wedding.get("rtmp_url"),
                "stream_key": wedding.get("stream_key"),
                "youtube_video_url": youtube_settings.get("youtube_video_url"),
                "youtube_embed_url": youtube_settings.get("youtube_embed_url")
            }
        
        # Get credentials and validate them
        credentials_dict = youtube_settings["auth_tokens"]
        
        # Validate required credential fields
        if not credentials_dict.get("access_token"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid YouTube credentials. Please reconnect your YouTube account."
            )
        
        # Create broadcast
        title = f"{wedding['bride_name']} ❤️ {wedding['groom_name']} - Wedding Live"
        description = wedding.get('description', f"Watch the beautiful wedding of {wedding['bride_name']} and {wedding['groom_name']} live!")
        scheduled_time = wedding.get('scheduled_date', datetime.utcnow())
        
        broadcast_data = await youtube_service.create_broadcast(
            credentials_dict=credentials_dict,
            title=title,
            scheduled_time=scheduled_time,
            description=description,
            user_id=current_user["user_id"]
        )
        
        # Update wedding with broadcast info
        await db.weddings.update_one(
            {"id": wedding_id},
            {
                "$set": {
                    "youtube_settings.broadcast_id": broadcast_data["broadcast_id"],
                    "youtube_settings.stream_id": broadcast_data["stream_id"],
                    "youtube_settings.youtube_video_url": broadcast_data["youtube_video_url"],
                    "youtube_settings.youtube_embed_url": broadcast_data["youtube_embed_url"],
                    "rtmp_url": broadcast_data["rtmp_url"],
                    "stream_key": broadcast_data["stream_key"],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"✅ Created YouTube broadcast for wedding {wedding_id}")
        
        return {
            "success": True,
            "reused": False,
            "broadcast_id": broadcast_data["broadcast_id"],
            "stream_id": broadcast_data["stream_id"],
            "rtmp_url": broadcast_data["rtmp_url"],
            "stream_key": broadcast_data["stream_key"],
            "youtube_video_url": broadcast_data["youtube_video_url"],
            "youtube_embed_url": broadcast_data["youtube_embed_url"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error creating YouTube broadcast: {error_msg}")
        logger.error(f"Error message lower case: {error_msg.lower()}")
        logger.error(f"Contains 'live streaming not enabled': {'live streaming not enabled' in error_msg.lower()}")
        logger.error(f"Contains 'liveStreamingNotEnabled': {'liveStreamingNotEnabled' in error_msg}")
        
        # Check for YouTube service specific errors first
        if "live streaming not enabled" in error_msg.lower() or "liveStreamingNotEnabled" in error_msg or "The user is not enabled for live streaming" in error_msg:
            logger.error("MATCH: Found live streaming error - returning 400")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        elif "insufficient permissions" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient permissions for YouTube. Please make sure you granted all required permissions during authentication."
            )
        elif "quota" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="YouTube API quota exceeded. Please try again later."
            )
        else:
            logger.error("NO MATCH: Returning 500 error")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create YouTube broadcast: {error_msg}"
            )

@router.post("/transition")
async def transition_youtube_broadcast(
    request: YouTubeTransitionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Transition YouTube broadcast status
    
    Valid statuses: 'testing', 'live', 'complete'
    """
    try:
        db = get_db()
        
        # Find wedding with this broadcast
        wedding = await db.weddings.find_one({
            "youtube_settings.broadcast_id": request.broadcast_id
        })
        
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Broadcast not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get credentials
        credentials_dict = wedding["youtube_settings"]["auth_tokens"]
        
        # Transition broadcast
        result = await youtube_service.transition_broadcast(
            credentials_dict=credentials_dict,
            broadcast_id=request.broadcast_id,
            status=request.status
        )
        
        logger.info(f"✅ Transitioned broadcast {request.broadcast_id} to {request.status}")
        
        return {
            "success": True,
            "broadcast_id": request.broadcast_id,
            "status": request.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transitioning broadcast: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transition broadcast: {str(e)}"
        )

@router.get("/status/{wedding_id}")
async def get_youtube_broadcast_status(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get current YouTube broadcast status"""
    try:
        db = get_db()
        
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        youtube_settings = wedding.get("youtube_settings", {})
        if not youtube_settings.get("broadcast_id"):
            return {
                "connected": youtube_settings.get("auth_connected", False),
                "broadcast_exists": False
            }
        
        # Get credentials
        credentials_dict = youtube_settings["auth_tokens"]
        
        # Get status
        status_info = await youtube_service.get_broadcast_status(
            credentials_dict=credentials_dict,
            broadcast_id=youtube_settings["broadcast_id"],
            user_id=current_user["user_id"]
        )
        
        return {
            "connected": True,
            "broadcast_exists": True,
            **status_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting broadcast status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get broadcast status: {str(e)}"
        )

@router.get("/broadcasts")
async def list_youtube_broadcasts(
    current_user: dict = Depends(get_current_user)
):
    """List all YouTube broadcasts for current user"""
    try:
        db = get_db()
        
        # Find any wedding with YouTube connected
        wedding = await db.weddings.find_one({
            "creator_id": current_user["user_id"],
            "youtube_settings.auth_connected": True
        })
        
        if not wedding:
            return {"broadcasts": []}
        
        credentials_dict = wedding["youtube_settings"]["auth_tokens"]
        
        broadcasts = await youtube_service.list_broadcasts(
            credentials_dict=credentials_dict,
            max_results=50
        )
        
        return {"broadcasts": broadcasts}
        
    except Exception as e:
        logger.error(f"Error listing broadcasts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list broadcasts: {str(e)}"
        )

@router.get("/disconnect/{wedding_id}")
async def disconnect_youtube(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Disconnect YouTube account from wedding"""
    try:
        db = get_db()
        
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Clear YouTube settings
        await db.weddings.update_one(
            {"id": wedding_id},
            {
                "$set": {
                    "youtube_settings": {
                        "auth_connected": False
                    },
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Disconnected YouTube from wedding {wedding_id}")
        
        return {"success": True, "message": "YouTube account disconnected"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disconnecting YouTube: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disconnect YouTube: {str(e)}"
        )

@router.post("/save-video-to-media/{wedding_id}")
async def save_youtube_video_to_media(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Save YouTube video to media gallery after broadcast ends
    
    This endpoint is called automatically when a broadcast ends
    """
    try:
        db = get_db()
        
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wedding not found"
            )
        
        if wedding["creator_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        youtube_settings = wedding.get("youtube_settings", {})
        broadcast_id = youtube_settings.get("broadcast_id")
        
        if not broadcast_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No YouTube broadcast found for this wedding"
            )
        
        # Get video details from YouTube
        video_details = await youtube_service.get_video_details(broadcast_id)
        
        if "error" in video_details:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to get video details: {video_details['error']}"
            )
        
        # Check if video already exists in media
        existing_media = await db.media.find_one({
            "wedding_id": wedding_id,
            "youtube_video_id": broadcast_id
        })
        
        if existing_media:
            logger.info(f"YouTube video {broadcast_id} already exists in media gallery")
            return {
                "success": True,
                "message": "Video already in media gallery",
                "media_id": existing_media["id"]
            }
        
        # Create media entry for YouTube video
        media_id = str(uuid.uuid4())
        media_doc = {
            "id": media_id,
            "wedding_id": wedding_id,
            "media_type": "youtube_video",
            "youtube_video_id": broadcast_id,
            "youtube_url": youtube_settings.get("youtube_video_url"),
            "youtube_embed_url": youtube_settings.get("youtube_embed_url"),
            "thumbnail_url": video_details.get("thumbnail_url"),
            "title": video_details.get("title"),
            "description": video_details.get("description"),
            "duration": video_details.get("duration"),
            "view_count": video_details.get("view_count", 0),
            "like_count": video_details.get("like_count", 0),
            "caption": f"YouTube Live Stream: {wedding['bride_name']} ❤️ {wedding['groom_name']}",
            "uploaded_by": current_user["user_id"],
            "uploaded_at": datetime.utcnow(),
            "category": "livestream"
        }
        
        await db.media.insert_one(media_doc)
        
        logger.info(f"✅ Saved YouTube video {broadcast_id} to media gallery for wedding {wedding_id}")
        
        return {
            "success": True,
            "message": "YouTube video saved to media gallery",
            "media_id": media_id,
            "video_details": video_details
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving YouTube video to media: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save YouTube video to media: {str(e)}"
        )

@router.get("/video-details/{video_id}")
async def get_youtube_video_details(
    video_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get YouTube video details (thumbnail, views, etc.)"""
    try:
        video_details = await youtube_service.get_video_details(video_id)
        
        if "error" in video_details:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=video_details["error"]
            )
        
        return video_details
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting video details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get video details: {str(e)}"
        )
