"""
Video Template Models
Data models for dynamic video template system with text overlays
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class AnimationType(str, Enum):
    """Available animation types for text overlays"""
    FADE_IN = "fade-in"
    FADE_OUT = "fade-out"
    SLIDE_UP = "slide-up"
    SLIDE_DOWN = "slide-down"
    SLIDE_LEFT = "slide-left"
    SLIDE_RIGHT = "slide-right"
    SCALE_UP = "scale-up"
    SCALE_DOWN = "scale-down"
    ZOOM_IN = "zoom-in"
    BOUNCE_IN = "bounce-in"
    BOUNCE_OUT = "bounce-out"
    ROTATE_IN = "rotate-in"
    SPIN = "spin"
    TYPEWRITER = "typewriter"
    BLUR_IN = "blur-in"
    BLUR_OUT = "blur-out"
    FADE_SLIDE_UP = "fade-slide-up"
    SCALE_FADE = "scale-fade"


class TextAlignment(str, Enum):
    """Text alignment options"""
    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"


class AnchorPoint(str, Enum):
    """Anchor point for positioning"""
    TOP_LEFT = "top-left"
    TOP_CENTER = "top-center"
    TOP_RIGHT = "top-right"
    CENTER_LEFT = "center-left"
    CENTER = "center"
    CENTER_RIGHT = "center-right"
    BOTTOM_LEFT = "bottom-left"
    BOTTOM_CENTER = "bottom-center"
    BOTTOM_RIGHT = "bottom-right"


class TemplateCategory(str, Enum):
    """Template categories"""
    INVITATION = "invitation"
    ANNOUNCEMENT = "announcement"
    SAVE_THE_DATE = "save-the-date"
    THANK_YOU = "thank-you"
    COUNTDOWN = "countdown"
    STORY = "story"
    GENERAL = "general"


class OverlayPosition(BaseModel):
    """Position configuration for text overlay - stores coordinates as percentages (0-100)"""
    x: float = Field(..., description="X coordinate as percentage (0-100)")
    y: float = Field(..., description="Y coordinate as percentage (0-100)")
    alignment: TextAlignment = Field(default=TextAlignment.CENTER)
    anchor_point: AnchorPoint = Field(default=AnchorPoint.CENTER)
    unit: str = Field(default="percent", description="Coordinate unit system (percent or pixel)")
    
    @validator('x', 'y', allow_reuse=True)
    def validate_percentage(cls, v):
        # Allow any positive value - validation will depend on unit
        if v < 0:
            raise ValueError('Coordinate values must be positive')
        return v


class OverlayDimensions(BaseModel):
    """Dimensions configuration for text overlay box"""
    width: Optional[float] = Field(None, description="Text box width as percentage (0-100)")
    height: Optional[float] = Field(None, description="Text box height as percentage (0-100)")
    unit: str = Field(default="percent", description="Dimension unit system (percent or pixel)")


class OverlayTiming(BaseModel):
    """Timing configuration for text overlay"""
    start_time: float = Field(..., ge=0, description="Start time in seconds")
    end_time: float = Field(..., gt=0, description="End time in seconds")
    duration: Optional[float] = Field(None, description="Auto-calculated duration")
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be greater than start_time')
        return v
    
    @validator('duration', always=True)
    def calculate_duration(cls, v, values):
        if 'start_time' in values and 'end_time' in values:
            return values['end_time'] - values['start_time']
        return v


class TextStroke(BaseModel):
    """Text stroke/outline configuration"""
    enabled: bool = Field(default=False)
    color: str = Field(default="#000000")
    width: int = Field(default=2, ge=0, le=10)


class OverlayStyling(BaseModel):
    """Styling configuration for text overlay"""
    font_family: str = Field(default="Playfair Display")
    font_size: int = Field(default=72, ge=12, le=200)
    font_weight: str = Field(default="bold")
    color: str = Field(default="#ffffff")
    text_align: TextAlignment = Field(default=TextAlignment.CENTER)
    letter_spacing: int = Field(default=2, ge=0, le=20)
    line_height: float = Field(default=1.2, ge=0.8, le=3.0)
    text_shadow: str = Field(default="0 2px 4px rgba(0,0,0,0.3)")
    stroke: TextStroke = Field(default_factory=TextStroke)


class AnimationConfig(BaseModel):
    """Animation configuration"""
    type: AnimationType = Field(default=AnimationType.FADE_IN)
    duration: float = Field(default=1.0, ge=0.1, le=5.0)
    easing: str = Field(default="ease-in-out")


class OverlayAnimation(BaseModel):
    """Full animation configuration with entrance and exit"""
    type: AnimationType = Field(default=AnimationType.FADE_IN)
    duration: float = Field(default=1.0, ge=0.1, le=5.0)
    easing: str = Field(default="ease-in-out")
    entrance: AnimationConfig = Field(default_factory=lambda: AnimationConfig())
    exit: AnimationConfig = Field(default_factory=lambda: AnimationConfig(type=AnimationType.FADE_OUT))


class ResponsiveSettings(BaseModel):
    """Responsive settings for mobile devices"""
    mobile_font_size: int = Field(default=48, ge=12, le=150)
    mobile_position: Dict[str, Any] = Field(
        default_factory=lambda: {"x": 50, "y": 30, "unit": "percent"}
    )


class TextOverlay(BaseModel):
    """Complete text overlay configuration"""
    id: str = Field(..., description="Unique overlay ID")
    endpoint_key: str = Field(..., description="Wedding data endpoint key")
    label: str = Field(..., description="Human-readable label")
    placeholder_text: str = Field(default="Sample Text")
    
    position: OverlayPosition
    dimensions: Optional[OverlayDimensions] = Field(None, description="Text box dimensions")
    timing: OverlayTiming
    styling: OverlayStyling = Field(default_factory=OverlayStyling)
    animation: OverlayAnimation = Field(default_factory=OverlayAnimation)
    responsive: ResponsiveSettings = Field(default_factory=ResponsiveSettings)
    
    layer_index: int = Field(default=1, ge=0, le=100)
    is_active: bool = Field(default=True)


class AspectRatio(str, Enum):
    """Video aspect ratios"""
    LANDSCAPE = "16:9"
    PORTRAIT = "9:16"


class OverlayDimensions(BaseModel):
    """Dimensions configuration for text overlay box"""
    width: Optional[float] = Field(None, description="Text box width as percentage (0-100)")
    height: Optional[float] = Field(None, description="Text box height as percentage (0-100)")
    unit: str = Field(default="percent", description="Dimension unit system (percent or pixel)")


class VideoData(BaseModel):
    """Video file data with reference resolution for overlay positioning"""
    original_url: str = Field(..., description="CDN URL")
    telegram_file_id: str = Field(..., description="Telegram file ID")
    duration_seconds: float = Field(..., ge=0)
    width: int = Field(..., ge=1)
    height: int = Field(..., ge=1)
    format: str = Field(default="mp4")
    file_size_mb: float = Field(..., ge=0)
    aspect_ratio: Optional[AspectRatio] = Field(None, description="Video aspect ratio")
    reference_resolution: Dict[str, int] = Field(
        default_factory=lambda: {"width": 1920, "height": 1080},
        description="Reference resolution for overlay positioning"
    )


class PreviewThumbnail(BaseModel):
    """Preview thumbnail data"""
    url: str = Field(..., description="CDN URL")
    telegram_file_id: str = Field(..., description="Telegram file ID")


class TemplateMetadata(BaseModel):
    """Template metadata"""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = Field(..., description="Admin user ID")
    is_featured: bool = Field(default=False)
    is_active: bool = Field(default=True)
    usage_count: int = Field(default=0, ge=0)


class VideoTemplate(BaseModel):
    """Complete video template model"""
    id: str = Field(..., description="Unique template ID")
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    category: TemplateCategory = Field(default=TemplateCategory.GENERAL)
    tags: List[str] = Field(default_factory=list)
    
    video_data: VideoData
    preview_thumbnail: Optional[PreviewThumbnail] = None
    text_overlays: List[TextOverlay] = Field(default_factory=list)
    
    metadata: TemplateMetadata


class VideoTemplateCreate(BaseModel):
    """Request model for creating video template"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    category: TemplateCategory = Field(default=TemplateCategory.GENERAL)
    tags: List[str] = Field(default_factory=list)


class VideoTemplateUpdate(BaseModel):
    """Request model for updating video template"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[TemplateCategory] = None
    tags: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class TextOverlayCreate(BaseModel):
    """Request model for creating text overlay"""
    endpoint_key: str = Field(..., description="Wedding data endpoint")
    label: str = Field(..., description="Display label")
    placeholder_text: str = Field(default="Sample Text")
    position: OverlayPosition
    dimensions: Optional[OverlayDimensions] = None
    timing: OverlayTiming
    styling: Optional[OverlayStyling] = None
    animation: Optional[OverlayAnimation] = None
    responsive: Optional[ResponsiveSettings] = None
    layer_index: int = Field(default=1, ge=0, le=100)


class TextOverlayUpdate(BaseModel):
    """Request model for updating text overlay"""
    label: Optional[str] = None
    placeholder_text: Optional[str] = None
    position: Optional[OverlayPosition] = None
    dimensions: Optional[OverlayDimensions] = None
    timing: Optional[OverlayTiming] = None
    styling: Optional[OverlayStyling] = None
    animation: Optional[OverlayAnimation] = None
    responsive: Optional[ResponsiveSettings] = None
    layer_index: Optional[int] = None
    is_active: Optional[bool] = None


class WeddingTemplateAssignment(BaseModel):
    """Wedding to template assignment"""
    id: str = Field(..., description="Assignment ID")
    wedding_id: str = Field(..., description="Wedding ID")
    template_id: str = Field(..., description="Template ID")
    slot: int = Field(default=1, ge=1, le=10)
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    
    customizations: Dict[str, Any] = Field(
        default_factory=lambda: {"color_overrides": {}, "font_overrides": {}}
    )
    
    rendered_video: Optional[Dict[str, Any]] = None


class TemplateAssignmentCreate(BaseModel):
    """Request model for assigning template to wedding"""
    template_id: str = Field(..., description="Template ID")
    slot: int = Field(default=1, ge=1, le=10)
    customizations: Dict[str, Any] = Field(
        default_factory=lambda: {"color_overrides": {}, "font_overrides": {}}
    )


class TemplatePreviewRequest(BaseModel):
    """Request model for template preview"""
    wedding_id: str = Field(..., description="Wedding ID for data population")


class RenderVideoRequest(BaseModel):
    """Request model for rendering video"""
    template_id: str = Field(..., description="Template ID")
    quality: str = Field(default="hd", pattern="^(sd|hd)$")
