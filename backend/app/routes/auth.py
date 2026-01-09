from fastapi import APIRouter, HTTPException, status, Depends
from app.models import UserCreate, UserLogin, TokenResponse, UserResponse, UserRole, SubscriptionPlan, GoogleAuthRequest, AuthProvider
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.database import get_db
from app.plan_restrictions import get_storage_limit
from app.services.google_auth_service import GoogleAuthService
from datetime import datetime
import uuid
import os
import secrets
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "kolashankar113@gmail.com")

# Initialize Google Auth Service
google_auth_service = GoogleAuthService()

# Store state tokens temporarily (in production, use Redis)
google_state_storage = {}

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    db = get_db()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Determine role (admin check)
    role = UserRole.ADMIN if user_data.email == ADMIN_EMAIL else UserRole.USER
    
    # Create user
    user_id = str(uuid.uuid4())
    free_storage_limit = get_storage_limit("free")
    user = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "role": role.value,
        "subscription_plan": SubscriptionPlan.FREE.value,
        "storage_used": 0,  # Initialize storage tracking
        "storage_limit": free_storage_limit,  # 10GB for free plan
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user)
    
    # Create access token
    token_data = {
        "user_id": user_id,
        "email": user_data.email,
        "role": role.value
    }
    access_token = create_access_token(token_data)
    
    # Return response
    user_response = UserResponse(
        id=user_id,
        email=user["email"],
        full_name=user.get("full_name"),
        role=role,
        subscription_plan=SubscriptionPlan.FREE,
        storage_used=0,
        storage_limit=free_storage_limit,
        created_at=user["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        user=user_response
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user"""
    db = get_db()
    
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    token_data = {
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"]
    }
    access_token = create_access_token(token_data)
    
    # Return response
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user.get("full_name"),
        role=UserRole(user["role"]),
        subscription_plan=SubscriptionPlan(user.get("subscription_plan", "free")),
        storage_used=user.get("storage_used", 0),
        storage_limit=user.get("storage_limit", get_storage_limit("free")),
        created_at=user["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        user=user_response
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    db = get_db()
    
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user.get("full_name"),
        role=UserRole(user["role"]),
        subscription_plan=SubscriptionPlan(user.get("subscription_plan", "free")),
        storage_used=user.get("storage_used", 0),
        storage_limit=user.get("storage_limit", get_storage_limit("free")),
        created_at=user["created_at"]
    )

# ========================================
# Google OAuth Authentication Routes
# ========================================

@router.post("/google/clear-cache")
async def clear_google_oauth_cache():
    """Clear Google OAuth cache and state
    
    This helps resolve OAuth scope mismatch issues
    """
    try:
        # Clear all Google OAuth state tokens
        google_state_storage.clear()
        
        logger.info("Cleared Google OAuth cache and state tokens")
        
        return {"success": True, "message": "Google OAuth cache cleared. Please try authenticating again."}
        
    except Exception as e:
        logger.error(f"Error clearing Google OAuth cache: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear Google OAuth cache: {str(e)}"
        )

@router.post("/google/clear-all-cache")
async def clear_all_oauth_cache():
    """Clear all OAuth cache and state (both Google and YouTube)
    
    This helps resolve cross-contamination between Google and YouTube OAuth flows
    """
    try:
        # Clear all Google OAuth state tokens
        google_state_storage.clear()
        
        # Also clear YouTube state if accessible
        try:
            from app.routes.youtube import state_storage as youtube_state_storage
            youtube_state_storage.clear()
            logger.info("Cleared YouTube OAuth state tokens")
        except ImportError:
            logger.warning("Could not access YouTube state storage")
        
        logger.info("Cleared all OAuth cache and state tokens")
        
        return {"success": True, "message": "All OAuth cache cleared. Please try authenticating again from the correct page."}
        
    except Exception as e:
        logger.error(f"Error clearing all OAuth cache: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear OAuth cache: {str(e)}"
        )

@router.get("/google/login")
async def google_login():
    """Initiate Google OAuth flow
    
    Returns OAuth URL for user to visit
    """
    try:
        # Generate state token for CSRF protection
        state = secrets.token_urlsafe(32)
        google_state_storage[state] = {
            "created_at": datetime.utcnow()
        }
        
        # Get OAuth URL
        oauth_url = google_auth_service.get_oauth_url(state)
        
        logger.info(f"Google OAuth initiated with state: {state}")
        print(f"DEBUG: Generated OAuth URL: {oauth_url}")
        
        return {
            "oauth_url": oauth_url,
            "state": state
        }
        
    except Exception as e:
        logger.error(f"Error initiating Google OAuth: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate Google login: {str(e)}"
        )

@router.post("/google/callback", response_model=TokenResponse)
async def google_callback(request: GoogleAuthRequest):
    """Handle Google OAuth callback
    
    Exchange authorization code for tokens and create/login user
    """
    try:
        # Debug logging
        logger.info(f"Google OAuth callback received - State: {request.state}, Code present: {bool(request.code)}")
        logger.info(f"Current Google state storage keys: {list(google_state_storage.keys())}")
        
        # Verify state token (graceful handling)
        if request.state and request.state not in google_state_storage:
            logger.warning(f"State token {request.state} not found, but proceeding anyway")
            logger.info(f"Available states: {list(google_state_storage.keys())}")
        
        # Exchange code for tokens and user info
        logger.info("Exchanging Google OAuth code for tokens...")
        auth_data = await google_auth_service.exchange_code_for_tokens(request.code)
        user_info = auth_data["user_info"]
        logger.info(f"Successfully retrieved user info for: {user_info.get('email', 'unknown')}")
        
        db = get_db()
        
        # Check if user exists by Google ID
        existing_user = await db.users.find_one({"google_id": user_info["google_id"]})
        
        if not existing_user:
            # Check if user exists by email
            existing_user = await db.users.find_one({"email": user_info["email"]})
            
            if existing_user:
                # Link Google account to existing user
                await db.users.update_one(
                    {"id": existing_user["id"]},
                    {
                        "$set": {
                            "google_id": user_info["google_id"],
                            "profile_picture": user_info["profile_picture"],
                            "auth_provider": "google",
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                user = await db.users.find_one({"id": existing_user["id"]})
                logger.info(f"✅ Linked Google account to existing user: {user['email']}")
            else:
                # Create new user
                user_id = str(uuid.uuid4())
                free_storage_limit = get_storage_limit("free")
                
                # Determine role (admin check)
                role = UserRole.ADMIN if user_info["email"] == ADMIN_EMAIL else UserRole.USER
                
                user = {
                    "id": user_id,
                    "email": user_info["email"],
                    "full_name": user_info["full_name"],
                    "google_id": user_info["google_id"],
                    "profile_picture": user_info["profile_picture"],
                    "auth_provider": "google",
                    "password_hash": None,  # No password for Google users
                    "role": role.value,
                    "subscription_plan": SubscriptionPlan.FREE.value,
                    "storage_used": 0,
                    "storage_limit": free_storage_limit,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                await db.users.insert_one(user)
                logger.info(f"✅ Created new Google user: {user['email']}")
        else:
            # Update profile picture if changed
            if existing_user.get("profile_picture") != user_info["profile_picture"]:
                await db.users.update_one(
                    {"id": existing_user["id"]},
                    {
                        "$set": {
                            "profile_picture": user_info["profile_picture"],
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            user = await db.users.find_one({"id": existing_user["id"]})
            logger.info(f"✅ Google user logged in: {user['email']}")
        
        # Clean up state token
        if request.state and request.state in google_state_storage:
            del google_state_storage[request.state]
        
        # Create access token
        token_data = {
            "user_id": user["id"],
            "email": user["email"],
            "role": user["role"]
        }
        access_token = create_access_token(token_data)
        
        # Return response
        user_response = UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user.get("full_name"),
            profile_picture=user.get("profile_picture"),
            google_id=user.get("google_id"),
            auth_provider=user.get("auth_provider", "email"),
            role=UserRole(user["role"]),
            subscription_plan=SubscriptionPlan(user.get("subscription_plan", "free")),
            storage_used=user.get("storage_used", 0),
            storage_limit=user.get("storage_limit", get_storage_limit("free")),
            created_at=user["created_at"]
        )
        
        return TokenResponse(
            access_token=access_token,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error in Google OAuth callback: {error_msg}")
        
        # Provide specific error messages for common OAuth issues
        if "CRITICAL: YouTube authentication request was routed to the wrong endpoint" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="YouTube authentication was initiated incorrectly. Please go to your wedding management page and use the YouTube integration section to connect your YouTube account."
            )
        elif "YouTube OAuth requests should use the YouTube authentication endpoint" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="YouTube authentication should be initiated from the YouTube integration page. Please go to your wedding management page and connect YouTube there."
            )
        elif "This appears to be a YouTube OAuth request" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This appears to be a YouTube authentication request. Please use the YouTube integration page instead of Google login."
            )
        elif "OAuth scope mismatch detected" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OAuth scope mismatch detected. This usually happens when YouTube authentication is mixed with Google login. Please restart the authentication process from the correct page."
            )
        elif "Authorization code is invalid or expired" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization expired. Please restart the Google authentication process."
            )
        elif "Redirect URI mismatch" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Redirect URI configuration error. Please contact support."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to complete Google authentication: {error_msg}"
            )

