from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import List, Optional, Union, Dict, Any
from enum import Enum
from datetime import datetime

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

class StreamingType(str, Enum):
    WEBLIVE = "weblive"
    YOUTUBE = "youtube"

class LiveStatus(str, Enum):
    IDLE = "idle"                    # Not started yet
    WAITING = "waiting"              # Go Live clicked, waiting for OBS
    LIVE = "live"                    # Currently streaming
    PAUSED = "paused"                # OBS stopped, but not ended
    ENDED = "ended"                  # Manually ended by host (final state)

class CameraStatus(str, Enum):
    WAITING = "waiting"
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"

class RecordingStatus(str, Enum):
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"

# Auth Provider Enum
class AuthProvider(str, Enum):
    EMAIL = "email"
    GOOGLE = "google"

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    code: str
    state: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    profile_picture: Optional[str] = None  # NEW: Google profile picture
    google_id: Optional[str] = None  # NEW: Google user ID
    auth_provider: str = "email"  # NEW: email or google
    role: UserRole
    subscription_plan: SubscriptionPlan
    storage_used: int = 0  # in bytes
    storage_limit: int = 10737418240  # 10GB in bytes for free plan
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Admin Models
class AdminStats(BaseModel):
    total_users: int
    total_weddings: int
    active_streams: int
    total_subscriptions: int
    monthly_revenue: float

# Multi-Camera Models
class MultiCamera(BaseModel):
    camera_id: str
    name: str
    
    # DEPRECATED: Legacy RTMP fields (kept for backward compatibility)
    stream_key: str = ""  # DEPRECATED: Use LiveKit tokens instead
    hls_url: Optional[str] = None  # DEPRECATED: Use LiveKit URLs
    
    # NEW: LiveKit participant tracking
    participant_id: Optional[str] = None  # LiveKit participant ID
    track_sid: Optional[str] = None       # LiveKit track SID
    
    status: CameraStatus = CameraStatus.WAITING
    created_at: datetime

class CameraSwitchEvent(BaseModel):
    from_camera_id: Optional[str] = None
    to_camera_id: str
    switched_at: datetime

class CompositionConfig(BaseModel):
    active: bool = False
    ffmpeg_pid: Optional[int] = None
    output_hls_url: Optional[str] = None

class AddCameraRequest(BaseModel):
    wedding_id: str
    camera_name: str

class AddCameraResponse(BaseModel):
    camera_id: str
    camera_name: str
    stream_key: str
    rtmp_url: str
    status: str
    message: str

# Stream Quality Models
class StreamQualityOption(BaseModel):
    value: str
    label: str
    width: int
    height: int
    bitrate: int

class UpdateStreamQuality(BaseModel):
    wedding_id: str
    live_quality: Optional[str] = None
    recording_quality: Optional[str] = None

class StreamQualityResponse(BaseModel):
    wedding_id: str
    live_quality: str
    recording_quality: str
    allowed_live_qualities: List[str]
    allowed_recording_qualities: List[str]
    is_premium: bool
    message: Optional[str] = None

# Wedding Settings Models
class WeddingSettings(BaseModel):
    auto_delete_media: bool = False
    auto_delete_days: int = 30
    enable_download: bool = True
    enable_sharing: bool = True
    enable_dvr: bool = False  # NEW: Enable DVR recording
    auto_record: bool = True  # NEW: Auto-record stream
    allow_comments: bool = True  # NEW: Allow viewer comments
    allow_public_sharing: bool = True  # NEW: Allow public sharing
    viewer_limit: Optional[int] = None
    playback_quality: str = "auto"  # auto, 720p, 1080p, 4k
    live_quality: str = "480p"  # Current live streaming quality
    recording_quality: str = "480p"  # Current recording quality

class UpdateWeddingSettings(BaseModel):
    auto_delete_media: Optional[bool] = None
    auto_delete_days: Optional[int] = None
    enable_download: Optional[bool] = None
    enable_sharing: Optional[bool] = None
    enable_dvr: Optional[bool] = None  # NEW: Enable DVR recording
    auto_record: Optional[bool] = None  # NEW: Auto-record stream
    allow_comments: Optional[bool] = None  # NEW: Allow viewer comments
    allow_public_sharing: Optional[bool] = None  # NEW: Allow public sharing
    viewer_limit: Optional[int] = None
    playback_quality: Optional[str] = None
    live_quality: Optional[str] = None
    recording_quality: Optional[str] = None

# Theme Settings Models
class StudioDetails(BaseModel):
    studio_id: str = ""  # Reference to studio from profile
    name: str = ""
    logo_url: str = ""  # Deprecated - kept for backward compatibility
    default_image_url: str = ""  # Studio image (replaces logo_url)
    website: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    contact: str = ""  # Keep for backward compatibility
    show_details: bool = False  # Toggle to show/hide studio details (name, contact, etc.)

class CoverPhoto(BaseModel):
    url: str
    category: Optional[str] = "general"  # groom, bride, couple, moment, general
    type: Optional[str] = "photo"  # photo, video

class CustomMessages(BaseModel):
    welcome_text: str = "Welcome to our big day"
    description: str = ""

class ThemeSettings(BaseModel):
    theme_id: str = "layout_1"  # e.g., 'layout_1', 'layout_2', etc. (legacy: floral_garden, royal_palace)
    layout_id: Optional[str] = "layout_1"  # New layout system
    custom_font: str = "Playfair Display"  # Font for couple names
    primary_color: str = "#f43f5e"  # Primary theme color
    secondary_color: str = "#a855f7"  # Secondary theme color
    pre_wedding_video: str = ""  # URL (Youtube or Uploaded)
    cover_photos: List[Union[str, CoverPhoto]] = []  # Array of photo URLs or objects
    studio_details: StudioDetails = StudioDetails()
    custom_messages: CustomMessages = CustomMessages()
    theme_assets: Optional['WeddingThemeAssets'] = None  # Dynamic borders, styles, backgrounds
    
    # Resolved asset URLs (added by theme asset resolver)
    bride_border_url: Optional[str] = None
    groom_border_url: Optional[str] = None
    couple_border_url: Optional[str] = None
    precious_moments_border_url: Optional[str] = None
    studio_border_url: Optional[str] = None
    background_url: Optional[str] = None
    hero_background: Optional[str] = None
    layout_page_background_url: Optional[str] = None
    stream_page_background_url: Optional[str] = None
    couple_style_url: Optional[str] = None
    background_template_url: Optional[str] = None
    
    class Config:
        extra = "allow"  # Allow additional fields for future extensibility

class UpdateThemeSettings(BaseModel):
    theme_id: Optional[str] = None
    layout_id: Optional[str] = None
    custom_font: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    pre_wedding_video: Optional[str] = None
    cover_photos: Optional[List[Union[str, CoverPhoto]]] = None
    studio_details: Optional[StudioDetails] = None
    custom_messages: Optional[CustomMessages] = None
    theme_assets: Optional['UpdateWeddingThemeAssets'] = None

# Theme Assets Models (Dynamic Borders, Styles, Backgrounds)

# Mask Data for Photo Borders
class MaskData(BaseModel):
    svg_path: str = ""  # SVG path for masking
    polygon_points: List[List[float]] = []  # Alternative: array of [x, y] points
    feather_radius: int = 0  # Blur/feather effect in pixels
    inner_x: float = 0  # Inner usable area coordinates
    inner_y: float = 0
    inner_width: float = 0
    inner_height: float = 0
    slots_count: int = 1  # Number of photo slots in this border

class PhotoBorder(BaseModel):
    id: str
    name: str
    cdn_url: str
    telegram_file_id: str
    orientation: str = "square"  # portrait, landscape, square
    width: int = 0
    height: int = 0
    file_size: int = 0
    tags: List[str] = []
    mask_data: Optional[MaskData] = None  # NEW: Mask information for photo fitting
    has_transparency: bool = False  # NEW: Indicates if border has transparent background
    remove_background: bool = False  # NEW: Indicates if background removal was applied
    created_at: datetime
    uploaded_by: str  # admin user_id

class PhotoBorderResponse(BaseModel):
    id: str
    name: str
    cdn_url: str
    orientation: str
    width: int = 0  # Default value for backward compatibility
    height: int = 0  # Default value for backward compatibility
    file_size: int = 0  # Default value for backward compatibility
    tags: List[str] = []  # Default empty list
    mask_data: Optional[MaskData] = None
    category: Optional[str] = "border"  # NEW: Category field (border or background)
    has_transparency: bool = False  # NEW: Transparency flag
    remove_background: bool = False  # NEW: Background removal flag
    created_at: datetime

class MaskSlot(BaseModel):
    slot_id: str
    svg_path: str = ""
    polygon_points: List[List[float]] = []
    feather_radius: int = 0
    x: float = 0  # Position in layout
    y: float = 0
    width: float = 0
    height: float = 0

class PreciousMomentStyle(BaseModel):
    id: str
    name: str
    description: str = ""
    cdn_url: Optional[str] = ""  # Optional preview image
    telegram_file_id: Optional[str] = ""
    layout_type: str = "grid"  # grid, collage, carousel, animated-frames
    photo_count: int = 6  # Number of photos required (slots)
    slots: List[MaskSlot] = []  # NEW: Mask data for each photo slot
    frame_shapes: List[str] = []  # rectangle, circle, heart, custom
    tags: List[str] = []
    created_at: datetime
    uploaded_by: str

class PreciousMomentStyleResponse(BaseModel):
    id: str
    name: str
    description: str
    cdn_url: Optional[str]
    layout_type: str
    photo_count: int
    slots: List[MaskSlot]
    frame_shapes: List[str]
    tags: List[str]
    created_at: datetime

class AnimationType(str, Enum):
    NONE = "none"
    FADE = "fade"
    ZOOM = "zoom"
    PARALLAX = "parallax"
    SLOW_PAN = "slow_pan"
    FLORAL_FLOAT = "floral_float"
    LIGHT_SHIMMER = "light_shimmer"

class BackgroundTemplate(BaseModel):
    id: str
    name: str
    cdn_url: str
    telegram_file_id: str
    thumbnail_url: Optional[str] = ""
    category: str = "general"  # hero, full-page, pattern, gradient
    width: int = 0
    height: int = 0
    file_size: int = 0
    tags: List[str] = []
    supported_animations: List[AnimationType] = [AnimationType.NONE]  # NEW
    default_animation: AnimationType = AnimationType.NONE  # NEW
    created_at: datetime
    uploaded_by: str

class BackgroundImage(BaseModel):
    id: str
    name: str
    cdn_url: str
    telegram_file_id: str
    category: str = "general"  # hero, full-page, pattern, gradient
    width: int = 0
    height: int = 0
    file_size: int = 0
    tags: List[str] = []
    created_at: datetime
    uploaded_by: str

class BackgroundImageResponse(BaseModel):
    id: str
    name: str
    cdn_url: str
    category: str
    width: int
    height: int
    file_size: int
    tags: List[str]
    created_at: datetime

class BackgroundTemplateResponse(BaseModel):
    id: str
    name: str
    cdn_url: str
    thumbnail_url: Optional[str]
    category: str
    width: int
    height: int
    file_size: int
    tags: List[str]
    supported_animations: List[AnimationType]
    default_animation: AnimationType
    created_at: datetime

# Theme Definition Models
class PreciousMomentsConfig(BaseModel):
    enabled: bool = False
    min_photos: int = 2
    max_photos: int = 6

class ThemeRequiredSections(BaseModel):
    bride_photo: bool = False
    groom_photo: bool = False
    couple_photo: bool = False
    precious_moments: PreciousMomentsConfig = PreciousMomentsConfig()

class ThemeDefaultBorders(BaseModel):
    cover: Optional[str] = None  # border_id
    precious_moments: Optional[str] = None  # precious_moment_style_id

class Theme(BaseModel):
    id: str
    name: str
    description: str = ""
    preview_image: Optional[str] = ""
    required_sections: ThemeRequiredSections = ThemeRequiredSections()
    default_borders: ThemeDefaultBorders = ThemeDefaultBorders()
    supported_layouts: List[str] = ["default"]  # default, split, overlay, etc.
    supported_animations: List[AnimationType] = [AnimationType.NONE]
    is_premium: bool = False
    created_at: datetime
    updated_at: datetime

class ThemeResponse(BaseModel):
    id: str
    name: str
    description: str
    preview_image: Optional[str] = None
    preview_image_url: Optional[str] = None  # Alias for frontend compatibility
    required_sections: ThemeRequiredSections
    default_borders: ThemeDefaultBorders
    supported_layouts: List[str]
    supported_animations: List[AnimationType]
    is_premium: bool
    subscription_required: Optional[bool] = None  # Alias for is_premium
    precious_moments_config: Optional[Dict] = None  # For frontend compatibility
    created_at: datetime
    updated_at: datetime
    
    def __init__(self, **data):
        # Ensure subscription_required matches is_premium
        if 'subscription_required' not in data and 'is_premium' in data:
            data['subscription_required'] = data['is_premium']
        if 'preview_image_url' not in data and 'preview_image' in data:
            data['preview_image_url'] = data['preview_image']
        # Extract precious_moments config from required_sections
        if 'precious_moments_config' not in data and 'required_sections' in data:
            if isinstance(data['required_sections'], dict):
                precious = data['required_sections'].get('precious_moments', {})
                if precious:
                    data['precious_moments_config'] = {
                        'min_photos': precious.get('min_photos', 2),
                        'max_photos': precious.get('max_photos', 5)
                    }
        super().__init__(**data)

class CreateThemeRequest(BaseModel):
    name: str
    description: str = ""
    preview_image: Optional[str] = ""
    required_sections: ThemeRequiredSections
    default_borders: ThemeDefaultBorders
    supported_layouts: List[str] = ["default"]
    supported_animations: List[AnimationType] = [AnimationType.NONE]
    is_premium: bool = False

class UpdateThemeRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    preview_image: Optional[str] = None
    required_sections: Optional[ThemeRequiredSections] = None
    default_borders: Optional[ThemeDefaultBorders] = None
    supported_layouts: Optional[List[str]] = None
    supported_animations: Optional[List[AnimationType]] = None
    is_premium: Optional[bool] = None

# Wedding Theme Asset Selection
class SelectedBorders(BaseModel):
    # CRITICAL FIX: Allow dynamic border keys to match frontend structure
    # Frontend sends: brideGroomBorder, coupleBorder, preciousMomentsBorder, studioBorder
    groom_border_id: Optional[str] = None
    bride_border_id: Optional[str] = None
    couple_border_id: Optional[str] = None
    cover_border_id: Optional[str] = None
    bride_groom_border: Optional[str] = None  # NEW: Match frontend key
    couple_border: Optional[str] = None  # NEW: Match frontend key
    precious_moments_border: Optional[str] = None  # NEW: Match frontend key
    studio_border: Optional[str] = None  # NEW: Match frontend key
    
    class Config:
        extra = "allow"  # Allow additional fields dynamically

class SelectedAnimation(BaseModel):
    template_id: Optional[str] = None
    animation_type: AnimationType = AnimationType.NONE
    animation_speed: str = "normal"  # slow, normal, fast

class WeddingThemeAssets(BaseModel):
    borders: SelectedBorders = SelectedBorders()
    precious_moment_style_id: Optional[str] = None
    background_image_id: Optional[str] = None
    background_template_id: Optional[str] = None  # NEW: for animated backgrounds
    animation: SelectedAnimation = SelectedAnimation()  # NEW
    precious_moment_photos: List[str] = []  # Array of photo URLs

    # Background selection (new system used by ThemeManager)
    backgrounds: Optional[dict] = None

    # Resolved URLs (populated by backend resolver)
    bride_border_url: Optional[str] = None
    groom_border_url: Optional[str] = None
    couple_border_url: Optional[str] = None
    precious_moments_border_url: Optional[str] = None
    studio_border_url: Optional[str] = None
    background_url: Optional[str] = None
    hero_background: Optional[str] = None
    layout_page_background_url: Optional[str] = None
    stream_page_background_url: Optional[str] = None
    couple_style_url: Optional[str] = None
    background_template_url: Optional[str] = None

    class Config:
        extra = "allow"

class UpdateWeddingThemeAssets(BaseModel):
    borders: Optional[SelectedBorders] = None
    precious_moment_style_id: Optional[str] = None
    background_image_id: Optional[str] = None
    background_template_id: Optional[str] = None  # NEW
    animation: Optional[SelectedAnimation] = None  # NEW
    precious_moment_photos: Optional[List[str]] = None

    # Background selection (new system used by ThemeManager)
    backgrounds: Optional[dict] = None

    class Config:
        extra = "allow"

# Wedding Models

# Pulse Session Model (LiveKit-based streaming)
class PulseSession(BaseModel):
    room_name: str                      # LiveKit room name
    room_id: Optional[str] = None       # Pulse room ID
    server_url: str                      # LiveKit WebSocket URL
    created_at: datetime
    status: str = "active"               # active, ended

# Live Status Session Models (must be defined before WeddingResponse)
class WeddingLiveSession(BaseModel):
    wedding_id: str
    status: LiveStatus = LiveStatus.IDLE
    stream_started_at: Optional[datetime] = None
    stream_paused_at: Optional[datetime] = None
    stream_resumed_at: Optional[datetime] = None
    stream_ended_at: Optional[datetime] = None
    pause_count: int = 0              # Track number of pauses
    total_pause_duration: int = 0     # Total seconds paused
    recording_session_id: Optional[str] = None  # Single recording across pauses
    
    # DEPRECATED: Legacy RTMP fields (kept for backward compatibility)
    rtmp_url: str = ""
    stream_key: str = ""
    hls_playback_url: str = ""
    
    # NEW: Pulse/LiveKit session (replaces RTMP)
    pulse_session: Optional[PulseSession] = None
    
    # Transition timestamps
    status_history: List[dict] = []  # [{status, timestamp, reason}]
    
    # Recording info
    recording_started: bool = False
    recording_path: Optional[str] = None  # DEPRECATED
    recording_segments: List[str] = []  # DEPRECATED (Multiple segments if paused/resumed)

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

# YouTube OAuth Models
class YouTubeAuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: datetime
    token_type: str = "Bearer"

class YouTubeStreamSettings(BaseModel):
    broadcast_id: Optional[str] = None
    stream_id: Optional[str] = None
    youtube_video_url: Optional[str] = None
    youtube_embed_url: Optional[str] = None
    auth_connected: bool = False
    auth_tokens: Optional[YouTubeAuthTokens] = None

class WeddingBackgrounds(BaseModel):
    """Background images for layout and stream pages"""
    layout_page_background_id: Optional[str] = None
    layout_page_background_url: Optional[str] = None
    stream_page_background_id: Optional[str] = None
    stream_page_background_url: Optional[str] = None

class WeddingResponse(BaseModel):
    id: str
    short_code: Optional[str] = None
    title: str
    description: Optional[str] = None
    bride_name: str
    groom_name: str
    creator_id: str
    creator_name: Optional[str] = None
    creator_subscription_plan: Optional[str] = 'free'  # Added for theme preview logic
    scheduled_date: datetime
    location: Optional[str] = None
    cover_image: Optional[str] = None
    status: StreamStatus
    streaming_type: StreamingType = StreamingType.WEBLIVE  # NEW: WebLive or YouTube
    stream_credentials: Optional[StreamCredentials] = None
    youtube_settings: Optional[YouTubeStreamSettings] = None  # NEW: YouTube streaming settings
    playback_url: Optional[str] = None
    recording_url: Optional[str] = None
    viewers_count: int = 0
    is_locked: bool = False
    multi_cameras: Optional[List[MultiCamera]] = []
    active_camera_id: Optional[str] = None
    camera_switches: List[CameraSwitchEvent] = []
    composition_config: Optional[CompositionConfig] = None
    settings: Optional[WeddingSettings] = None
    theme_settings: Optional[ThemeSettings] = None
    backgrounds: Optional[WeddingBackgrounds] = None  # ADDED: Background images for layout and stream pages
    live_session: Optional[WeddingLiveSession] = None
    can_go_live: bool = True  # False if ended
    created_at: datetime
    updated_at: datetime

# Subscription Models
class SubscriptionCreate(BaseModel):
    plan: SubscriptionPlan

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    plan: SubscriptionPlan
    razorpay_subscription_id: Optional[str] = None
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
    title: str
    status: StreamStatus
    rtmp_url: str
    stream_key: str
    playback_url: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class StreamRequest(BaseModel):
    wedding_id: str

# Media Models
class MediaType(str, Enum):
    PHOTO = "photo"
    VIDEO = "video"

class MediaUploadResponse(BaseModel):
    id: str
    media_type: MediaType
    cdn_url: str
    file_id: str
    wedding_id: str
    folder_id: Optional[str] = None
    caption: Optional[str] = None
    uploaded_at: datetime

class MediaResponse(BaseModel):
    id: str
    wedding_id: str
    media_type: MediaType
    cdn_url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    folder_id: Optional[str] = None
    folder_name: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime

# Folder Models
class MediaFolderCreate(BaseModel):
    name: str
    wedding_id: str
    parent_folder_id: Optional[str] = None
    description: Optional[str] = None

class MediaFolderResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    wedding_id: str
    parent_folder_id: Optional[str] = None
    media_count: int = 0
    folder_size: int = 0
    subfolder_count: int = 0
    created_at: datetime
    updated_at: datetime

class MediaFolderMove(BaseModel):
    folder_id: str
    new_parent_id: Optional[str] = None

class MediaMoveRequest(BaseModel):
    media_id: str
    target_folder_id: Optional[str] = None


class MediaFolderUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class MediaFolderListResponse(BaseModel):
    folders: List[MediaFolderResponse]
    total_count: int

# Chat Models
class ChatMessageCreate(BaseModel):
    wedding_id: str
    message: str
    guest_name: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: str
    wedding_id: str
    user_id: Optional[str] = None
    guest_name: Optional[str] = None
    message: str
    created_at: datetime

class ReactionCreate(BaseModel):
    wedding_id: str
    reaction_type: str  # e.g., "heart", "clap", "fire"

class ReactionResponse(BaseModel):
    id: str
    wedding_id: str
    user_id: Optional[str] = None
    guest_name: Optional[str] = None
    reaction_type: str
    created_at: datetime

class GuestBookCreate(BaseModel):
    wedding_id: str
    guest_name: str
    message: str
    email: Optional[str] = None

class GuestBookResponse(BaseModel):
    id: str
    wedding_id: str
    guest_name: str
    message: str
    email: Optional[str] = None
    created_at: datetime

# Comment Models (YouTube-style with threading)
class CommentCreate(BaseModel):
    wedding_id: str
    comment: str
    parent_comment_id: Optional[str] = None  # For threaded replies

class CommentResponse(BaseModel):
    id: str
    wedding_id: str
    parent_comment_id: Optional[str] = None
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    comment: str
    likes_count: int = 0
    replies_count: int = 0
    is_liked_by_user: bool = False  # Populated based on current user
    replies: List['CommentResponse'] = []  # Nested replies
    created_at: datetime
    updated_at: Optional[datetime] = None

class CommentLikeRequest(BaseModel):
    comment_id: str

class CommentUpdateRequest(BaseModel):
    comment: str

# Enable forward references for nested model
CommentResponse.model_rebuild()

# Analytics Models
class ViewerSessionCreate(BaseModel):
    wedding_id: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None

class ViewerSessionResponse(BaseModel):
    id: str
    wedding_id: str
    user_id: Optional[str] = None
    join_time: datetime
    leave_time: Optional[datetime] = None
    duration_seconds: int = 0
    chat_messages_count: int = 0
    reactions_count: int = 0

class StreamQualityMetric(BaseModel):
    timestamp: datetime
    quality: str
    bitrate: int
    fps: int
    dropped_frames: int = 0

class EngagementMetrics(BaseModel):
    total_viewers: int
    peak_concurrent_viewers: int
    average_watch_time_seconds: float
    total_chat_messages: int
    total_reactions: int
    unique_viewers: int

class AnalyticsDashboard(BaseModel):
    wedding_id: str
    engagement: EngagementMetrics
    quality_metrics: List[StreamQualityMetric]
    viewer_sessions: List[ViewerSessionResponse]

# Features Models  
class EmailInvitationCreate(BaseModel):
    wedding_id: str
    recipient_emails: List[EmailStr]
    custom_message: Optional[str] = None

class EmailInvitationResponse(BaseModel):
    id: str
    wedding_id: str
    email: str
    guest_name: Optional[str] = None
    sent_at: datetime
    opened_at: Optional[datetime] = None

class CameraStreamCreate(BaseModel):
    wedding_id: str
    camera_name: str
    stream_key: Optional[str] = None

class CameraStreamResponse(BaseModel):
    id: str
    wedding_id: str
    camera_name: str
    stream_key: str
    rtmp_url: str
    status: str
    created_at: datetime

class PhotoBoothCreate(BaseModel):
    wedding_id: str
    photo_data: str  # Base64 encoded image
    filter_used: Optional[str] = "none"
    guest_name: Optional[str] = None

class PhotoBoothResponse(BaseModel):
    id: str
    wedding_id: str
    title: str
    description: Optional[str] = None
    photo_count: int = 0
    created_at: datetime

# Quality Models (additional to StreamQuality models)
class QualitySettings(BaseModel):
    wedding_id: str
    live_quality: str
    recording_quality: str

class QualityChangeRequest(BaseModel):
    wedding_id: str
    quality_type: str  # "live" or "recording"
    quality_value: str  # e.g., "720p", "1080p"

class QualityChangeResponse(BaseModel):
    success: bool
    message: str
    new_quality: str

class QualityOption(BaseModel):
    value: str
    label: str
    available: bool
    requires_premium: bool = False

# Recording Models
class RecordingCreate(BaseModel):
    wedding_id: str
    stream_id: str
    quality: str = "480p"

# Recording URL Schema (Pulse Egress)
class RecordingUrls(BaseModel):
    r2: Optional[str] = None                  # Cloudflare R2 URL
    telegram_cdn: Optional[str] = None        # Telegram CDN URL (free bandwidth)
    streaming: Optional[str] = None           # HLS streaming URL

# Recording Metadata
class RecordingMetadata(BaseModel):
    duration_seconds: Optional[int] = 0
    file_size_bytes: Optional[int] = 0
    resolution: Optional[str] = None          # e.g., "1920x1080"
    codec: Optional[str] = None               # e.g., "H264"
    fps: Optional[int] = None                 # e.g., 30

class RecordingResponse(BaseModel):
    id: str
    wedding_id: str
    stream_id: str
    
    # DEPRECATED: Legacy recording URL (kept for backward compatibility)
    recording_url: str = ""  # DEPRECATED: Use recording_urls instead
    
    # NEW: Pulse Egress fields
    pulse_egress_id: Optional[str] = None       # Pulse Egress ID
    pulse_recording_id: Optional[str] = None    # Pulse Recording ID
    recording_urls: Optional[RecordingUrls] = None  # Multiple CDN URLs
    metadata: Optional[RecordingMetadata] = None
    
    duration_seconds: int = 0
    file_size_bytes: int = 0
    quality: str
    status: str  # "processing", "ready", "failed"
    created_at: datetime
    completed_at: Optional[datetime] = None

class RecordingListResponse(BaseModel):
    recordings: List[RecordingResponse]
    total_count: int


# Album & Slideshow Models (Phase 1)
class SlideTransition(str, Enum):
    NONE = "none"
    FADE = "fade"
    WIPE_LEFT = "wipe_left"
    WIPE_RIGHT = "wipe_right"
    ZOOM_IN = "zoom_in"
    ZOOM_OUT = "zoom_out"
    KEN_BURNS = "ken_burns"
    RANDOM = "random"

class AlbumSlide(BaseModel):
    media_id: str
    order: int
    duration: float = 5.0
    transition: str = "fade"
    transition_duration: float = 1.0
    animation: Optional[str] = "none" # e.g., "ken_burns"
    caption: Optional[str] = None

class Album(BaseModel):
    id: str
    wedding_id: str
    title: str
    description: Optional[str] = None
    cover_photo_url: Optional[str] = None
    music_url: Optional[str] = None
    slides: List[AlbumSlide] = []
    created_at: datetime
    updated_at: datetime
    created_by: str

class AlbumCreate(BaseModel):
    wedding_id: str
    title: str
    description: Optional[str] = None
    cover_photo_url: Optional[str] = None
    music_url: Optional[str] = None

class AlbumUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_photo_url: Optional[str] = None
    music_url: Optional[str] = None
    slides: Optional[List[AlbumSlide]] = None

class AlbumResponse(Album):
    pass
