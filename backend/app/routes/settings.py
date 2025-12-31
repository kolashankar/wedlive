from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator
from typing import Optional, List
from app.auth import get_current_user, hash_password, verify_password
from app.database import get_db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/settings", tags=["Settings"])


# Settings Models
class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class UserPreferences(BaseModel):
    default_stream_resolution: Optional[str] = "1080p"  # 720p, 1080p, 4k
    timezone: Optional[str] = "UTC"
    email_stream_alerts: Optional[bool] = True
    email_guestbook_alerts: Optional[bool] = True
    email_payment_receipts: Optional[bool] = True
    marketing_emails: Optional[bool] = False
    two_factor_enabled: Optional[bool] = False


class ActiveSession(BaseModel):
    id: str
    device: str
    location: str
    last_active: str
    is_current: bool


@router.put("/password")
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    try:
        db = get_db()
        
        # Get user
        user = await db.users.find_one({"id": current_user["user_id"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        if not verify_password(password_data.current_password, user["password"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Hash new password
        new_password_hash = hash_password(password_data.new_password)
        
        # Update password
        await db.users.update_one(
            {"id": current_user["user_id"]},
            {"$set": {
                "password": new_password_hash,
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preferences", response_model=UserPreferences)
async def get_preferences(current_user: dict = Depends(get_current_user)):
    """Get user preferences"""
    try:
        db = get_db()
        user = await db.users.find_one({"id": current_user["user_id"]})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        preferences = user.get("preferences", {})
        return UserPreferences(
            default_stream_resolution=preferences.get("default_stream_resolution", "1080p"),
            timezone=preferences.get("timezone", "UTC"),
            email_stream_alerts=preferences.get("email_stream_alerts", True),
            email_guestbook_alerts=preferences.get("email_guestbook_alerts", True),
            email_payment_receipts=preferences.get("email_payment_receipts", True),
            marketing_emails=preferences.get("marketing_emails", False),
            two_factor_enabled=preferences.get("two_factor_enabled", False)
        )
    except Exception as e:
        logger.error(f"Error getting preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/preferences")
async def update_preferences(
    preferences: UserPreferences,
    current_user: dict = Depends(get_current_user)
):
    """Update user preferences"""
    try:
        db = get_db()
        
        await db.users.update_one(
            {"id": current_user["user_id"]},
            {"$set": {
                "preferences": preferences.dict(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {"message": "Preferences updated successfully"}
    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions", response_model=List[ActiveSession])
async def get_active_sessions(current_user: dict = Depends(get_current_user)):
    """Get active sessions (mock data for now)"""
    # TODO: Implement real session tracking
    return [
        ActiveSession(
            id="current",
            device="Current Device",
            location="Current Location",
            last_active=datetime.utcnow().isoformat(),
            is_current=True
        )
    ]


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Revoke a session"""
    # TODO: Implement real session revocation
    if session_id == "current":
        raise HTTPException(status_code=400, detail="Cannot revoke current session")
    
    return {"message": "Session revoked successfully"}


@router.delete("/account")
async def delete_account(
    password: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete user account (requires password confirmation)"""
    try:
        db = get_db()
        
        # Get user
        user = await db.users.find_one({"id": current_user["user_id"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify password
        if not verify_password(password, user["password_hash"]):
            raise HTTPException(status_code=400, detail="Password is incorrect")
        
        # Delete user's data
        await db.weddings.delete_many({"creator_id": current_user["user_id"]})
        await db.studios.delete_many({"user_id": current_user["user_id"]})
        await db.media.delete_many({"uploaded_by": current_user["user_id"]})
        await db.users.delete_one({"id": current_user["user_id"]})
        
        return {"message": "Account deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
