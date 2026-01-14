from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from app.models_phase10 import (
    BrandingSettingsCreate, BrandingSettingsResponse,
    APIKeyCreate, APIKeyResponse,
    WebhookCreate, WebhookResponse, WebhookLog,
    RecordingQualitySettings, RecordingDownload, RecordingDownloadResponse
)
from app.auth import get_current_user
from app.database import get_db
from app.utils import check_premium_plan, get_recording_quality_options, format_webhook_event
from datetime import datetime, timedelta
from typing import List
import uuid
import secrets
import httpx

router = APIRouter()

# ============= BRANDING ENDPOINTS =============

@router.post("/branding", response_model=BrandingSettingsResponse)
async def create_or_update_branding(
    branding_data: BrandingSettingsCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create or update custom branding settings (Premium only)"""
    db = get_db()
    
    # Check if user has premium plan
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not check_premium_plan(user.get("subscription_plan", "free")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Custom branding is only available for premium users"
        )
    
    # Check if branding settings exist
    existing = await db.branding_settings.find_one({"user_id": current_user["user_id"]})
    
    branding_dict = branding_data.model_dump(exclude_unset=True)
    
    if existing:
        # Update existing settings
        branding_dict["updated_at"] = datetime.utcnow()
        await db.branding_settings.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": branding_dict}
        )
        branding = await db.branding_settings.find_one({"user_id": current_user["user_id"]})
    else:
        # Create new settings
        branding = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            **branding_dict,
            "primary_color": branding_dict.get("primary_color", "#4F46E5"),
            "secondary_color": branding_dict.get("secondary_color", "#9333EA"),
            "accent_color": branding_dict.get("accent_color", "#EC4899"),
            "font_family": branding_dict.get("font_family", "Inter"),
            "hide_wedlive_branding": check_premium_plan(user.get("subscription_plan", "free")),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.branding_settings.insert_one(branding)
    
    return BrandingSettingsResponse(**branding)

@router.get("/branding", response_model=BrandingSettingsResponse)
async def get_branding(current_user: dict = Depends(get_current_user)):
    """Get user's branding settings"""
    db = get_db()
    
    branding = await db.branding_settings.find_one({"user_id": current_user["user_id"]})
    if not branding:
        # Return default branding
        user = await db.users.find_one({"id": current_user["user_id"]})
        return BrandingSettingsResponse(
            id="default",
            user_id=current_user["user_id"],
            primary_color="#4F46E5",
            secondary_color="#9333EA",
            accent_color="#EC4899",
            font_family="Inter",
            hide_wedlive_branding=check_premium_plan(user.get("subscription_plan", "free")),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    return BrandingSettingsResponse(**branding)

@router.get("/branding/user/{user_id}", response_model=BrandingSettingsResponse)
async def get_user_branding(user_id: str):
    """Get public branding settings for a user (for viewing their weddings)"""
    db = get_db()
    
    branding = await db.branding_settings.find_one({"user_id": user_id})
    if not branding:
        user = await db.users.find_one({"id": user_id})
        return BrandingSettingsResponse(
            id="default",
            user_id=user_id,
            primary_color="#4F46E5",
            secondary_color="#9333EA",
            accent_color="#EC4899",
            font_family="Inter",
            hide_wedlive_branding=check_premium_plan(user.get("subscription_plan", "free")) if user else False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    return BrandingSettingsResponse(**branding)

# ============= API KEY ENDPOINTS =============

@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    key_data: APIKeyCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create API key for programmatic access (Premium only)"""
    db = get_db()
    
    # Check if user has premium plan
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not check_premium_plan(user.get("subscription_plan", "free")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API access is only available for premium users"
        )
    
    # Generate secure API key
    api_key = f"wedlive_{secrets.token_urlsafe(32)}"
    
    key_record = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "name": key_data.name,
        "key": api_key,
        "description": key_data.description,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "last_used": None
    }
    
    await db.api_keys.insert_one(key_record)
    
    return APIKeyResponse(**key_record)

@router.get("/api-keys", response_model=List[APIKeyResponse])
async def list_api_keys(current_user: dict = Depends(get_current_user)):
    """List all API keys"""
    db = get_db()
    
    cursor = db.api_keys.find({"user_id": current_user["user_id"]}).sort("created_at", -1)
    keys = await cursor.to_list(length=100)
    
    return [APIKeyResponse(**key) for key in keys]

@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(key_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an API key"""
    db = get_db()
    
    key = await db.api_keys.find_one({"id": key_id, "user_id": current_user["user_id"]})
    if not key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    await db.api_keys.delete_one({"id": key_id})
    return None

# ============= WEBHOOK ENDPOINTS =============

@router.post("/webhooks", response_model=WebhookResponse)
async def create_webhook(
    webhook_data: WebhookCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create webhook for real-time notifications (Premium only)"""
    db = get_db()
    
    # Check if user has premium plan
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not check_premium_plan(user.get("subscription_plan", "free")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Webhooks are only available for premium users"
        )
    
    # Validate events
    valid_events = [
        "wedding.created", "wedding.started", "wedding.ended",
        "viewer.joined", "viewer.left", "chat.message",
        "recording.ready"
    ]
    
    for event in webhook_data.events:
        if event not in valid_events:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid event type: {event}"
            )
    
    # Generate webhook secret
    webhook_secret = secrets.token_urlsafe(32)
    
    webhook = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "url": str(webhook_data.url),
        "events": webhook_data.events,
        "description": webhook_data.description,
        "is_active": True,
        "secret": webhook_secret,
        "created_at": datetime.utcnow(),
        "last_triggered": None
    }
    
    await db.webhooks.insert_one(webhook)
    
    return WebhookResponse(**webhook)

@router.get("/webhooks", response_model=List[WebhookResponse])
async def list_webhooks(current_user: dict = Depends(get_current_user)):
    """List all webhooks"""
    db = get_db()
    
    cursor = db.webhooks.find({"user_id": current_user["user_id"]}).sort("created_at", -1)
    webhooks = await cursor.to_list(length=100)
    
    return [WebhookResponse(**webhook) for webhook in webhooks]

@router.delete("/webhooks/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(webhook_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a webhook"""
    db = get_db()
    
    webhook = await db.webhooks.find_one({"id": webhook_id, "user_id": current_user["user_id"]})
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found"
        )
    
    await db.webhooks.delete_one({"id": webhook_id})
    return None

@router.get("/webhooks/{webhook_id}/logs")
async def get_webhook_logs(webhook_id: str, current_user: dict = Depends(get_current_user), limit: int = 50):
    """Get webhook delivery logs"""
    db = get_db()
    
    # Verify ownership
    webhook = await db.webhooks.find_one({"id": webhook_id, "user_id": current_user["user_id"]})
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found"
        )
    
    cursor = db.webhook_logs.find({"webhook_id": webhook_id}).sort("created_at", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    return logs

# ============= RECORDING QUALITY ENDPOINTS =============

@router.get("/recording-quality/options")
async def get_recording_options(current_user: dict = Depends(get_current_user)):
    """Get available recording quality options based on subscription"""
    db = get_db()
    
    user = await db.users.find_one({"id": current_user["user_id"]})
    plan = user.get("subscription_plan", "free")
    
    options = get_recording_quality_options(plan)
    
    return {
        "available_qualities": options,
        "formats": ["mp4", "webm"],
        "plan": plan,
        "is_premium": check_premium_plan(plan)
    }

@router.post("/recording-quality/settings")
async def set_recording_quality(
    settings: RecordingQualitySettings,
    current_user: dict = Depends(get_current_user)
):
    """Set recording quality for a wedding"""
    db = get_db()
    
    # Verify wedding ownership
    wedding = await db.weddings.find_one({"id": settings.wedding_id})
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
    
    # Check if quality is available for user's plan
    user = await db.users.find_one({"id": current_user["user_id"]})
    available_qualities = get_recording_quality_options(user.get("subscription_plan", "free"))
    
    if settings.quality not in available_qualities:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Quality {settings.quality} not available for your plan"
        )
    
    # Update wedding recording settings
    await db.weddings.update_one(
        {"id": settings.wedding_id},
        {"$set": {
            "recording_quality": settings.quality,
            "recording_format": settings.format,
            "recording_bitrate": settings.bitrate,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"success": True, "message": "Recording quality updated"}

@router.post("/recording-quality/download", response_model=RecordingDownloadResponse)
async def generate_download_link(
    download_req: RecordingDownload,
    current_user: dict = Depends(get_current_user)
):
    """Generate download link for wedding recording (Premium only)"""
    db = get_db()
    
    # Check premium access
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not check_premium_plan(user.get("subscription_plan", "free")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recording downloads are only available for premium users"
        )
    
    # Verify wedding and recording
    wedding = await db.weddings.find_one({"id": download_req.wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if not wedding.get("recording_url"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No recording available for this wedding"
        )
    
    # Generate temporary download link (expires in 24 hours)
    download_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    download_record = {
        "id": str(uuid.uuid4()),
        "wedding_id": download_req.wedding_id,
        "user_id": current_user["user_id"],
        "token": download_token,
        "quality": download_req.quality,
        "format": download_req.format,
        "expires_at": expires_at,
        "created_at": datetime.utcnow()
    }
    
    await db.download_tokens.insert_one(download_record)
    
    # In production, this would be a signed URL to the actual recording file
    download_url = f"/api/phase10/recording-quality/download/{download_token}"
    
    return RecordingDownloadResponse(
        download_url=download_url,
        expires_at=expires_at,
        quality=download_req.quality,
        format=download_req.format,
        file_size=None  # Would be calculated from actual file
    )

# ============= HELPER FUNCTION FOR WEBHOOK DELIVERY =============

async def trigger_webhook(webhook_id: str, event_type: str, data: dict):
    """Trigger a webhook (called by other parts of the application)"""
    db = get_db()
    
    webhook = await db.webhooks.find_one({"id": webhook_id, "is_active": True})
    if not webhook or event_type not in webhook["events"]:
        return
    
    # Format payload
    payload = format_webhook_event(event_type, data)
    
    # Send webhook
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                webhook["url"],
                json=payload,
                headers={
                    "X-Webhook-Signature": webhook["secret"],
                    "Content-Type": "application/json"
                }
            )
            
            # Log webhook delivery
            log = {
                "id": str(uuid.uuid4()),
                "webhook_id": webhook_id,
                "event_type": event_type,
                "payload": payload,
                "response_status": response.status_code,
                "response_body": response.text[:1000],  # First 1000 chars
                "created_at": datetime.utcnow()
            }
            await db.webhook_logs.insert_one(log)
            
            # Update last triggered time
            await db.webhooks.update_one(
                {"id": webhook_id},
                {"$set": {"last_triggered": datetime.utcnow()}}
            )
    except Exception as e:
        # Log failed webhook
        log = {
            "id": str(uuid.uuid4()),
            "webhook_id": webhook_id,
            "event_type": event_type,
            "payload": payload,
            "response_status": None,
            "response_body": str(e),
            "created_at": datetime.utcnow()
        }
        await db.webhook_logs.insert_one(log)
