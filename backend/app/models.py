from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    CREATOR = "creator"
    ADMIN = "admin"

class SubscriptionPlan(str, Enum):
    FREE = "free"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class StreamStatus(str, Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    ENDED = "ended"
    RECORDED = "recorded"

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: UserRole
    subscription_plan: SubscriptionPlan
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Wedding Models
class WeddingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    bride_name: str
    groom_name: str
    scheduled_date: datetime
    location: Optional[str] = None
    cover_image: Optional[str] = None

class WeddingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    bride_name: Optional[str] = None
    groom_name: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    location: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[StreamStatus] = None

class StreamCredentials(BaseModel):
    rtmp_url: str
    stream_key: str
    playback_url: str

class WeddingResponse(BaseModel):
    id: str
    short_code: Optional[str] = None
    title: str
    description: Optional[str] = None
    bride_name: str
    groom_name: str
    creator_id: str
    creator_name: Optional[str] = None
    scheduled_date: datetime
    location: Optional[str] = None
    cover_image: Optional[str] = None
    status: StreamStatus
    stream_credentials: Optional[StreamCredentials] = None
    playback_url: Optional[str] = None
    recording_url: Optional[str] = None
    viewers_count: int = 0
    created_at: datetime
    updated_at: datetime

# Subscription Models
class SubscriptionCreate(BaseModel):
    plan: SubscriptionPlan

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    plan: SubscriptionPlan
    stripe_subscription_id: Optional[str] = None
    status: str
    current_period_end: Optional[datetime] = None
    created_at: datetime

# Stream Models
class StreamCreate(BaseModel):
    wedding_id: str
    title: str

class StreamResponse(BaseModel):
    id: str
    wedding_id: str
    stream_call_id: Optional[str] = None
    status: StreamStatus
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    recording_url: Optional[str] = None
    viewers_count: int = 0

# Admin Models
class AdminStats(BaseModel):
    total_users: int
    total_weddings: int
    active_streams: int
    total_subscriptions: int
    monthly_revenue: float

# Phase 8: Chat Models
class ChatMessageCreate(BaseModel):
    wedding_id: str
    message: str
    guest_name: Optional[str] = "Anonymous"

class ChatMessageResponse(BaseModel):
    id: str
    wedding_id: str
    user_id: Optional[str] = None
    guest_name: str
    message: str
    created_at: datetime

# Phase 8: Reaction Models
class ReactionCreate(BaseModel):
    wedding_id: str
    emoji: str
    guest_name: Optional[str] = "Anonymous"

class ReactionResponse(BaseModel):
    id: str
    wedding_id: str
    user_id: Optional[str] = None
    guest_name: str
    emoji: str
    created_at: datetime

# Phase 8: Guest Book Models
class GuestBookCreate(BaseModel):
    wedding_id: str
    guest_name: str
    email: Optional[EmailStr] = None
    message: str

class GuestBookResponse(BaseModel):
    id: str
    wedding_id: str
    guest_name: str
    email: Optional[str] = None
    message: str
    created_at: datetime

# Phase 8: Email Invitation Models
class EmailInvitationCreate(BaseModel):
    wedding_id: str
    recipient_emails: List[EmailStr]
    custom_message: Optional[str] = None

class EmailInvitationResponse(BaseModel):
    id: str
    wedding_id: str
    recipient_email: str
    sent_at: datetime
    status: str  # "sent", "failed", "opened"

# Phase 8: Multi-Camera Models
class CameraStreamCreate(BaseModel):
    wedding_id: str
    camera_name: str
    camera_angle: Optional[str] = None  # "front", "side", "aerial", "close-up"

class CameraStreamResponse(BaseModel):
    id: str
    wedding_id: str
    camera_name: str
    camera_angle: Optional[str] = None
    rtmp_url: str
    stream_key: str
    playback_url: str
    is_active: bool
    created_at: datetime

# Phase 8: Photo Booth Models
class PhotoBoothCreate(BaseModel):
    wedding_id: str
    guest_name: Optional[str] = "Anonymous"
    photo_data: str  # Base64 encoded image
    filter_used: Optional[str] = None

class PhotoBoothResponse(BaseModel):
    id: str
    wedding_id: str
    guest_name: str
    photo_url: str
    filter_used: Optional[str] = None
    created_at: datetime

# Phase 9: Viewer Analytics Models
class ViewerSessionCreate(BaseModel):
    wedding_id: str
    session_id: str
    timezone: Optional[str] = None
    user_agent: Optional[str] = None

class ViewerSessionResponse(BaseModel):
    id: str
    wedding_id: str
    session_id: str
    timezone: Optional[str] = None
    user_agent: Optional[str] = None
    join_time: datetime
    leave_time: Optional[datetime] = None
    duration_seconds: int = 0
    chat_messages_count: int = 0
    reactions_count: int = 0

# Phase 9: Stream Quality Models
class StreamQualityMetric(BaseModel):
    wedding_id: str
    session_id: str
    bitrate: Optional[float] = None  # kbps
    resolution: Optional[str] = None  # "1080p", "720p", etc.
    buffering_events: int = 0
    buffering_duration_ms: int = 0
    fps: Optional[float] = None

class StreamQualityResponse(BaseModel):
    id: str
    wedding_id: str
    session_id: str
    bitrate: Optional[float] = None
    resolution: Optional[str] = None
    buffering_events: int = 0
    buffering_duration_ms: int = 0
    fps: Optional[float] = None
    timestamp: datetime

# Phase 9: Engagement Metrics Models
class EngagementMetrics(BaseModel):
    wedding_id: str
    total_viewers: int
    peak_viewers: int
    peak_time: Optional[datetime] = None
    average_watch_duration: float  # seconds
    total_chat_messages: int
    total_reactions: int
    total_guest_book_entries: int
    total_photo_booth_photos: int
    viewer_timezones: dict  # {"timezone": count}

# Phase 9: Analytics Dashboard Response
class AnalyticsDashboard(BaseModel):
    wedding_id: str
    stream_quality: dict
    viewer_stats: dict
    engagement_metrics: EngagementMetrics
    peak_viewership_timeline: List[dict]  # [{"time": datetime, "viewers": int}]
    timezone_distribution: dict  # {"timezone": count}
