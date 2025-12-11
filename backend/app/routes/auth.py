from fastapi import APIRouter, HTTPException, status, Depends
from app.models import UserCreate, UserLogin, TokenResponse, UserResponse, UserRole, SubscriptionPlan
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.database import get_db
from app.plan_restrictions import get_storage_limit
from datetime import datetime
import uuid
import os

router = APIRouter()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "kolashankar113@gmail.com")

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
