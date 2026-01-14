from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from app.models import *
from app.auth import get_current_user, require_premium
from app.database import get_db
from datetime import datetime
import uuid
import secrets
import hashlib
import os
import json

router = APIRouter()

# =====================
# CUSTOM BRANDING
# =====================

@router.get("/branding")
async def get_branding(current_user: dict = Depends(get_current_user)):
    """Get user's custom branding settings"""
    db = get_db()
    
    branding = await db.branding.find_one({"user_id": current_user["user_id"]})
    
    if not branding:
        return {
            "user_id": current_user["user_id"],
            "brand_name": None,
            "logo_url": None,
            "primary_color": "#6366f1",
            "secondary_color": "#8b5cf6",
            "hide_wedlive_branding": False
        }
    
    return branding

@router.put("/branding")
async def update_branding(
    brand_name: str = None,
    logo_url: str = None,
    primary_color: str = None,
    secondary_color: str = None,
    hide_wedlive_branding: bool = False,
    current_user: dict = Depends(require_premium)
):
    """Update custom branding (Premium only)"""
    db = get_db()
    
    branding_data = {
        "user_id": current_user["user_id"],
        "brand_name": brand_name,
        "logo_url": logo_url,
        "primary_color": primary_color or "#6366f1",
        "secondary_color": secondary_color or "#8b5cf6",
        "hide_wedlive_branding": hide_wedlive_branding,
        "updated_at": datetime.utcnow()
    }
    
    await db.branding.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": branding_data},
        upsert=True
    )
    
    return {"message": "Branding updated successfully", "branding": branding_data}

# =====================
# API KEY MANAGEMENT
# =====================

def generate_api_key():
    """Generate a secure API key"""
    return f"wedlive_{secrets.token_urlsafe(32)}"

def hash_api_key(api_key: str):
    """Hash API key for storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()

@router.get("/api-keys")
async def list_api_keys(current_user: dict = Depends(require_premium)):
    """List user's API keys (Premium only)"""
    db = get_db()
    
    keys = await db.api_keys.find(
        {"user_id": current_user["user_id"]}
    ).to_list(length=100)
    
    # Don't return the actual key, just metadata
    for key in keys:
        key.pop("key_hash", None)
    
    return {"api_keys": keys}

@router.post("/api-keys")
async def create_api_key(
    name: str,
    current_user: dict = Depends(require_premium)
):
    """Create new API key (Premium only)"""
    db = get_db()
    
    # Check if user already has 5 keys (limit)
    existing_keys = await db.api_keys.count_documents(
        {"user_id": current_user["user_id"], "status": "active"}
    )
    
    if existing_keys >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 active API keys allowed"
        )
    
    # Generate new key
    api_key = generate_api_key()
    key_hash = hash_api_key(api_key)
    
    key_data = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "name": name,
        "key_hash": key_hash,
        "key_prefix": api_key[:20] + "...",
        "status": "active",
        "created_at": datetime.utcnow(),
        "last_used": None,
        "request_count": 0
    }
    
    await db.api_keys.insert_one(key_data)
    
    # Return the full key ONLY on creation (can't retrieve later)
    return {
        "message": "API key created successfully",
        "api_key": api_key,
        "id": key_data["id"],
        "warning": "Save this key securely. You won't be able to see it again."
    }

@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: dict = Depends(require_premium)
):
    """Revoke an API key (Premium only)"""
    db = get_db()
    
    result = await db.api_keys.update_one(
        {"id": key_id, "user_id": current_user["user_id"]},
        {"$set": {"status": "revoked", "revoked_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    return {"message": "API key revoked successfully"}

# =====================
# WEBHOOK MANAGEMENT
# =====================

@router.get("/webhooks")
async def list_webhooks(current_user: dict = Depends(require_premium)):
    """List user's webhooks (Premium only)"""
    db = get_db()
    
    webhooks = await db.webhooks.find(
        {"user_id": current_user["user_id"]}
    ).to_list(length=100)
    
    return {"webhooks": webhooks}

@router.post("/webhooks")
async def create_webhook(
    url: str,
    events: List[str],
    description: str = None,
    current_user: dict = Depends(require_premium)
):
    """Create webhook (Premium only)"""
    db = get_db()
    
    valid_events = [
        "stream.started",
        "stream.ended",
        "recording.ready",
        "viewer.joined",
        "wedding.created",
        "wedding.updated"
    ]
    
    # Validate events
    for event in events:
        if event not in valid_events:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid event: {event}. Valid events: {', '.join(valid_events)}"
            )
    
    webhook_data = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "url": url,
        "events": events,
        "description": description,
        "status": "active",
        "secret": secrets.token_urlsafe(32),
        "created_at": datetime.utcnow(),
        "last_triggered": None,
        "success_count": 0,
        "failure_count": 0
    }
    
    await db.webhooks.insert_one(webhook_data)
    
    return {
        "message": "Webhook created successfully",
        "webhook": webhook_data
    }

@router.put("/webhooks/{webhook_id}")
async def update_webhook(
    webhook_id: str,
    url: str = None,
    events: List[str] = None,
    status: str = None,
    current_user: dict = Depends(require_premium)
):
    """Update webhook (Premium only)"""
    db = get_db()
    
    update_data = {}
    if url:
        update_data["url"] = url
    if events:
        update_data["events"] = events
    if status in ["active", "paused"]:
        update_data["status"] = status
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.webhooks.update_one(
            {"id": webhook_id, "user_id": current_user["user_id"]},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Webhook not found"
            )
    
    return {"message": "Webhook updated successfully"}

@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    current_user: dict = Depends(require_premium)
):
    """Delete webhook (Premium only)"""
    db = get_db()
    
    result = await db.webhooks.delete_one(
        {"id": webhook_id, "user_id": current_user["user_id"]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found"
        )
    
    return {"message": "Webhook deleted successfully"}

@router.get("/webhooks/{webhook_id}/logs")
async def get_webhook_logs(
    webhook_id: str,
    limit: int = 50,
    current_user: dict = Depends(require_premium)
):
    """Get webhook delivery logs (Premium only)"""
    db = get_db()
    
    # Verify webhook ownership
    webhook = await db.webhooks.find_one(
        {"id": webhook_id, "user_id": current_user["user_id"]}
    )
    
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found"
        )
    
    logs = await db.webhook_logs.find(
        {"webhook_id": webhook_id}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    return {"logs": logs}

# =====================
# ADVANCED RECORDING OPTIONS
# =====================

@router.get("/recording-settings")
async def get_recording_settings(current_user: dict = Depends(require_premium)):
    """Get recording settings (Premium only)"""
    db = get_db()
    
    settings = await db.recording_settings.find_one(
        {"user_id": current_user["user_id"]}
    )
    
    if not settings:
        return {
            "user_id": current_user["user_id"],
            "quality": "1080p",
            "auto_upload": False,
            "storage_provider": None,
            "enable_4k": False,
            "bitrate": "6000"
        }
    
    return settings

@router.put("/recording-settings")
async def update_recording_settings(
    quality: str = "1080p",
    auto_upload: bool = False,
    storage_provider: str = None,
    enable_4k: bool = False,
    bitrate: str = "6000",
    current_user: dict = Depends(require_premium)
):
    """Update recording settings (Premium only)"""
    db = get_db()
    
    valid_qualities = ["720p", "1080p", "4K"]
    if quality not in valid_qualities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid quality. Choose from: {', '.join(valid_qualities)}"
        )
    
    settings_data = {
        "user_id": current_user["user_id"],
        "quality": quality,
        "auto_upload": auto_upload,
        "storage_provider": storage_provider,
        "enable_4k": enable_4k,
        "bitrate": bitrate,
        "updated_at": datetime.utcnow()
    }
    
    await db.recording_settings.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": settings_data},
        upsert=True
    )
    
    return {"message": "Recording settings updated", "settings": settings_data}

# =====================
# API DOCUMENTATION
# =====================

@router.get("/api-docs")
async def get_api_documentation(current_user: dict = Depends(require_premium)):
    """Get API documentation for developers (Premium only)"""
    
    docs = {
        "version": "1.0.0",
        "base_url": os.getenv("NEXT_PUBLIC_API_URL", "https://api.wedlive.com"),
        "authentication": {
            "type": "API Key",
            "header": "X-API-Key",
            "description": "Include your API key in the X-API-Key header"
        },
        "endpoints": [
            {
                "method": "GET",
                "path": "/api/v1/weddings",
                "description": "List all your weddings",
                "authentication": True
            },
            {
                "method": "POST",
                "path": "/api/v1/weddings",
                "description": "Create a new wedding",
                "authentication": True,
                "body": {
                    "title": "string",
                    "bride_name": "string",
                    "groom_name": "string",
                    "scheduled_date": "ISO 8601 datetime"
                }
            },
            {
                "method": "GET",
                "path": "/api/v1/weddings/{id}",
                "description": "Get wedding details",
                "authentication": True
            },
            {
                "method": "GET",
                "path": "/api/v1/analytics/{wedding_id}",
                "description": "Get wedding analytics",
                "authentication": True
            }
        ],
        "webhooks": {
            "description": "Configure webhooks to receive real-time notifications",
            "events": [
                "stream.started",
                "stream.ended",
                "recording.ready",
                "viewer.joined",
                "wedding.created",
                "wedding.updated"
            ]
        },
        "rate_limits": {
            "requests_per_minute": 60,
            "requests_per_day": 10000
        }
    }
    
    return docs
