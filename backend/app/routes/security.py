from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from app.auth import get_current_user, verify_password, hash_password
from app.database import get_db
from datetime import datetime
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/security", tags=["Security"])


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class SessionResponse(BaseModel):
    session_id: str
    device_info: str
    ip_address: str
    last_active: str
    is_current: bool


@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
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
        new_hashed_password = hash_password(password_data.new_password)
        
        # Update password
        await db.users.update_one(
            {"id": current_user["user_id"]},
            {"$set": {
                "password": new_hashed_password,
                "password_changed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        logger.info(f"Password changed for user {current_user['user_id']}")
        
        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def get_active_sessions(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get all active sessions for user"""
    try:
        db = get_db()
        
        # Get all sessions for user
        sessions_cursor = db.sessions.find(
            {"user_id": current_user["user_id"]}
        ).sort("last_active", -1)
        
        current_session_id = request.state.session_id if hasattr(request.state, 'session_id') else None
        
        sessions = []
        async for session in sessions_cursor:
            sessions.append({
                "session_id": str(session["_id"]),
                "device_info": session.get("device_info", "Unknown Device"),
                "ip_address": session.get("ip_address", "Unknown"),
                "last_active": session.get("last_active", session["created_at"]).isoformat(),
                "is_current": str(session["_id"]) == current_session_id
            })
        
        return {"sessions": sessions}
    except Exception as e:
        logger.error(f"Error getting sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Revoke a specific session"""
    try:
        db = get_db()
        
        # Verify session belongs to user
        session = await db.sessions.find_one({
            "_id": session_id,
            "user_id": current_user["user_id"]
        })
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Delete session
        await db.sessions.delete_one({"_id": session_id})
        
        logger.info(f"Session {session_id} revoked for user {current_user['user_id']}")
        
        return {"message": "Session revoked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error revoking session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/2fa/enable")
async def enable_2fa(current_user: dict = Depends(get_current_user)):
    """Enable 2FA for user (Placeholder - returns setup instructions)"""
    try:
        db = get_db()
        
        # Generate 2FA secret (placeholder)
        import secrets
        secret = secrets.token_urlsafe(32)
        
        # Update user
        await db.users.update_one(
            {"id": current_user["user_id"]},
            {"$set": {
                "two_factor_enabled": True,
                "two_factor_secret": secret,
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {
            "message": "2FA enabled successfully",
            "secret": secret,
            "note": "2FA is enabled. Full implementation with authenticator app coming soon."
        }
    except Exception as e:
        logger.error(f"Error enabling 2FA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/2fa/disable")
async def disable_2fa(current_user: dict = Depends(get_current_user)):
    """Disable 2FA for user"""
    try:
        db = get_db()
        
        # Update user
        await db.users.update_one(
            {"id": current_user["user_id"]},
            {"$set": {
                "two_factor_enabled": False,
                "two_factor_secret": None,
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {"message": "2FA disabled successfully"}
    except Exception as e:
        logger.error(f"Error disabling 2FA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/account")
async def delete_account(
    password: str,
    current_user: dict = Depends(get_current_user)
):
    """Permanently delete user account and all associated data"""
    try:
        db = get_db()
        
        # Verify password
        user = await db.users.find_one({"id": current_user["user_id"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not verify_password(password, user["password"]):
            raise HTTPException(status_code=400, detail="Incorrect password")
        
        user_id = current_user["user_id"]
        
        # Delete all user data
        logger.info(f"Starting account deletion for user {user_id}")
        
        # 1. Delete all weddings
        weddings_result = await db.weddings.delete_many({"creator_id": user_id})
        logger.info(f"Deleted {weddings_result.deleted_count} weddings")
        
        # 2. Delete all media
        media_result = await db.media.delete_many({"uploaded_by": user_id})
        logger.info(f"Deleted {media_result.deleted_count} media files")
        
        # 3. Delete all folders
        folders_result = await db.media_folders.delete_many({"created_by": user_id})
        logger.info(f"Deleted {folders_result.deleted_count} folders")
        
        # 4. Delete all studios
        studios_result = await db.studios.delete_many({"user_id": user_id})
        logger.info(f"Deleted {studios_result.deleted_count} studios")
        
        # 5. Delete all sessions
        sessions_result = await db.sessions.delete_many({"user_id": user_id})
        logger.info(f"Deleted {sessions_result.deleted_count} sessions")
        
        # 6. Delete subscriptions
        await db.subscriptions.delete_many({"user_id": user_id})
        
        # 7. Finally, delete user
        await db.users.delete_one({"id": user_id})
        
        logger.info(f"Account deletion completed for user {user_id}")
        
        return {
            "message": "Account and all associated data deleted permanently",
            "deleted": {
                "weddings": weddings_result.deleted_count,
                "media": media_result.deleted_count,
                "folders": folders_result.deleted_count,
                "studios": studios_result.deleted_count,
                "sessions": sessions_result.deleted_count
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
