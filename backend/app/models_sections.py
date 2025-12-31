"""
Section-Based Wedding System Models
Replaces static themes with dynamic section + border + mask system
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# ==================== SECTION CONFIGURATION ====================

class CoverMode(str, Enum):
    SINGLE = "single"  # Mode A: One couple photo
    SEPARATE = "separate"  # Mode B: Bride & Groom separate photos with mirror borders

class SectionType(str, Enum):
    COVER_COUPLE = "cover_couple"
    LIVE_VIDEO = "live_video"
    STUDIO = "studio"
    PRECIOUS_MOMENTS = "precious_moments"

# Border Mask Models
class MaskPoint(BaseModel):
    x: float
    y: float

class BorderMask(BaseModel):
    """Mask data for cropping photos into borders (single slot)"""
    svg_path: str = ""  # SVG path string for vector mask
    polygon_points: List[MaskPoint] = []  # Alternative: polygon points
    feather_radius: int = 8  # Blur/feather effect in pixels (default from sample)
    
    # Bounding box of usable area
    x: float = 0
    y: float = 0
    width: float = 0
    height: float = 0

class MaskSlot(BaseModel):
    """Individual mask slot for multiple photos in one border (for Precious Moments)"""
    slot_id: str  # Unique identifier for this slot
    svg_path: str = ""
    polygon_points: List[MaskPoint] = []
    feather_radius: int = 8
    x: float = 0
    y: float = 0
    width: float = 0
    height: float = 0

class PhotoBorderFull(BaseModel):
    """Complete photo border with mask data"""
    id: str
    name: str
    cdn_url: str  # Border image URL
    telegram_file_id: str
    
    # Mask data for auto-crop (single slot for most borders)
    mask: BorderMask
    
    # Multiple masks for "Our Precious Moments Border" (optional)
    mask_slots: List[MaskSlot] = []  # If empty, use single mask above
    
    # Metadata
    width: int = 0
    height: int = 0
    file_size: int = 0
    orientation: str = "square"  # portrait, landscape, square
    category: str = "general"  # general, bride_groom, couple, background, precious_moments
    tags: List[str] = []
    
    # Mirror support for bride/groom
    supports_mirror: bool = True
    
    created_at: datetime
    uploaded_by: str

# Photo with Crop Data
class PhotoWithCrop(BaseModel):
    """Stores original + cropped photo data"""
    photo_id: str
    original_url: str  # Original uploaded photo
    original_file_id: str
    
    border_id: Optional[str] = None  # Border applied
    cropped_url: Optional[str] = None  # Final cropped image with border
    cropped_file_id: Optional[str] = None
    
    is_mirrored: bool = False  # For bride/groom mirror logic
    
    uploaded_at: datetime
    last_cropped_at: Optional[datetime] = None

# Section 1: Cover/Couple Configuration
class CoverCoupleSection(BaseModel):
    mode: CoverMode = CoverMode.SINGLE
    
    # Mode A: Single couple photo
    couple_photo: Optional[PhotoWithCrop] = None
    couple_border_id: Optional[str] = None
    
    # Mode B: Separate bride & groom
    bride_photo: Optional[PhotoWithCrop] = None
    groom_photo: Optional[PhotoWithCrop] = None
    selected_border_id: Optional[str] = None  # One border, applied normally to bride, mirrored to groom

# Section 3: Studio Configuration
class StudioSection(BaseModel):
    studio_id: Optional[str] = None  # Reference to studio from profile
    studio_photo: Optional[PhotoWithCrop] = None  # Studio image with border applied
    studio_border_id: Optional[str] = None
    
    # Studio details (populated from studio database)
    studio_name: str = ""
    studio_logo_url: str = ""
    studio_contact: str = ""
    studio_website: str = ""
    studio_email: str = ""
    studio_phone: str = ""

# Section 4: Precious Moments (for later implementation)
class PreciousMomentsSection(BaseModel):
    border_id: Optional[str] = None  # Border determines slot count
    photos: List[PhotoWithCrop] = []  # Auto-limited by border slot count
    max_photos: int = 5  # Determined by border

# Complete Section Configuration
class WeddingSectionConfig(BaseModel):
    """Main section-based configuration for a wedding"""
    section_1_cover: CoverCoupleSection = CoverCoupleSection()
    section_2_live: Dict[str, Any] = {}  # Already implemented (YouTube URL, etc.)
    section_3_studio: StudioSection = StudioSection()
    section_4_precious: PreciousMomentsSection = PreciousMomentsSection()
    
    # Global background (synced across all pages)
    background_image_id: Optional[str] = None
    background_url: Optional[str] = None

# ==================== STUDIO MANAGEMENT ====================

class Studio(BaseModel):
    """Studio profile for Section 3"""
    id: str
    user_id: str  # Owner/creator of the studio
    name: str
    logo_url: Optional[str] = ""
    
    # Contact details
    email: str = ""
    phone: str = ""
    address: str = ""
    website: str = ""
    
    # Social media
    instagram: str = ""
    facebook: str = ""
    
    # Default studio image (can be overridden per wedding)
    default_image_url: Optional[str] = ""
    default_image_file_id: Optional[str] = ""
    
    created_at: datetime
    updated_at: datetime

class StudioCreate(BaseModel):
    name: str
    email: str = ""
    phone: str = ""
    address: str = ""
    website: str = ""
    instagram: str = ""
    facebook: str = ""

class StudioUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None

class StudioResponse(BaseModel):
    id: str
    name: str
    logo_url: Optional[str]
    email: str
    phone: str
    address: str
    website: str
    instagram: str
    facebook: str
    default_image_url: Optional[str]
    created_at: datetime

# ==================== API REQUEST/RESPONSE MODELS ====================

# Border Upload Request
class UploadBorderRequest(BaseModel):
    name: str
    tags: List[str] = []
    mask_svg_path: str = ""
    mask_polygon_points: List[MaskPoint] = []
    feather_radius: int = 8
    mask_x: float = 0
    mask_y: float = 0
    mask_width: float = 0
    mask_height: float = 0
    suggested_aspect_ratio: str = "1:1"
    supports_mirror: bool = True
    category: str = "general"  # bride_groom, couple, background, precious_moments, general
    # Multiple masks for precious_moments
    mask_slots_json: str = "[]"  # JSON string of mask slots

class BorderResponse(BaseModel):
    id: str
    name: str
    cdn_url: str
    mask: BorderMask
    mask_slots: List[MaskSlot] = []  # Multiple masks for precious_moments
    width: int
    height: int
    orientation: str
    tags: List[str]
    supports_mirror: bool
    category: str = "general"
    created_at: datetime

# Photo Upload with Auto-Crop Request
class UploadPhotoWithCropRequest(BaseModel):
    wedding_id: str
    section: SectionType
    border_id: Optional[str] = None
    category: str = "couple"  # couple, bride, groom, studio, moment

class PhotoCropResponse(BaseModel):
    photo_id: str
    original_url: str
    cropped_url: Optional[str]
    border_applied: Optional[str]
    message: str

# Update Section Configuration
class UpdateCoverSectionRequest(BaseModel):
    mode: Optional[CoverMode] = None
    couple_border_id: Optional[str] = None
    selected_border_id: Optional[str] = None  # For separate mode

class UpdateStudioSectionRequest(BaseModel):
    studio_id: Optional[str] = None
    studio_border_id: Optional[str] = None

# Re-crop Request (when border changes)
class RecropPhotoRequest(BaseModel):
    photo_id: str
    new_border_id: str

class RecropResponse(BaseModel):
    photo_id: str
    new_cropped_url: str
    message: str = "Photo re-cropped successfully"

# ==================== BACKGROUND TEMPLATES ====================

class BackgroundImage(BaseModel):
    """Background image for theme pages"""
    id: str
    name: str
    cdn_url: str
    telegram_file_id: str
    thumbnail_url: Optional[str] = ""
    width: int = 0
    height: int = 0
    file_size: int = 0
    tags: List[str] = []
    created_at: datetime
    uploaded_by: str

class BackgroundResponse(BaseModel):
    id: str
    name: str
    cdn_url: str
    thumbnail_url: Optional[str]
    width: int
    height: int
    tags: List[str]
    created_at: datetime
