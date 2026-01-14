from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict
from datetime import datetime

# Phase 10: Custom Branding Models
class BrandingSettings(BaseModel):
    user_id: str
    logo_url: Optional[str] = None
    primary_color: Optional[str] = "#4F46E5"  # Default indigo
    secondary_color: Optional[str] = "#9333EA"  # Default purple
    accent_color: Optional[str] = "#EC4899"  # Default pink
    font_family: Optional[str] = "Inter"
    hide_wedlive_branding: bool = False

class BrandingSettingsCreate(BaseModel):
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = None

class BrandingSettingsResponse(BaseModel):
    id: str
    user_id: str
    logo_url: Optional[str] = None
    primary_color: str
    secondary_color: str
    accent_color: str
    font_family: str
    hide_wedlive_branding: bool
    created_at: datetime
    updated_at: datetime

# Phase 10: API Key Models
class APIKeyCreate(BaseModel):
    name: str
    description: Optional[str] = None

class APIKeyResponse(BaseModel):
    id: str
    user_id: str
    name: str
    key: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_used: Optional[datetime] = None

# Phase 10: Webhook Models
class WebhookCreate(BaseModel):
    url: HttpUrl
    events: List[str]  # ["wedding.started", "wedding.ended", "viewer.joined"]
    description: Optional[str] = None

class WebhookResponse(BaseModel):
    id: str
    user_id: str
    url: str
    events: List[str]
    description: Optional[str] = None
    is_active: bool
    secret: str
    created_at: datetime
    last_triggered: Optional[datetime] = None

class WebhookLog(BaseModel):
    id: str
    webhook_id: str
    event_type: str
    payload: Dict
    response_status: Optional[int] = None
    response_body: Optional[str] = None
    created_at: datetime

# Phase 10: Recording Quality Models
class RecordingQualitySettings(BaseModel):
    wedding_id: str
    quality: str  # "720p", "1080p", "4K"
    format: str = "mp4"  # "mp4", "webm"
    bitrate: Optional[int] = None  # kbps

class RecordingDownload(BaseModel):
    wedding_id: str
    quality: str
    format: str = "mp4"

class RecordingDownloadResponse(BaseModel):
    download_url: str
    expires_at: datetime
    file_size: Optional[int] = None
    quality: str
    format: str

# Phase 10: Wedding Join by Short Code
class WeddingJoinRequest(BaseModel):
    short_code: str

class WeddingJoinResponse(BaseModel):
    wedding_id: str
    redirect_url: str
