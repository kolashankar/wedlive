# WedLive - Complete Feature Documentation & Subscription Architecture

## 📋 Table of Contents
1. [Complete Feature List](#complete-feature-list)
2. [Current Issues & Fixes](#current-issues-and-fixes)
3. [Subscription Plans Architecture](#subscription-plans-architecture)
4. [Implementation Plan](#implementation-plan)

---

## 🎯 Complete Feature List

### **1. Core Wedding Management**
- ✅ Create, edit, and delete weddings
- ✅ Wedding dashboard with status overview
- ✅ Wedding details (bride/groom names, date, venue)
- ✅ Custom wedding URLs (public view links)
- ✅ Wedding locking (premium feature - multiple weddings)
- ✅ Viewer access control (public/private)

### **2. Live Streaming Features**

#### **2.1 Standard Live Streaming**
- ✅ RTMP-based live streaming via NGINX-RTMP
- ✅ OBS integration with unique stream keys
- ✅ HLS playback for viewers
- ✅ Live status management (idle → waiting → live → paused → ended)
- ✅ RTMP webhooks (on-publish, on-publish-done, on-update)
- ✅ Stream quality control (240p to 4K based on plan)
- ✅ Auto-record streaming
- ✅ Manual stream control (pause, resume, end)

#### **2.2 Multi-Camera Live Streaming** 🆕
- ✅ Up to 5 simultaneous camera feeds
- ✅ Live camera preview grid (2×2 + 1 layout)
- ✅ Real-time camera switching
- ✅ FFmpeg-based composition service
- ✅ Automatic camera fallback on disconnection
- ✅ WebSocket-based real-time updates
- ✅ Camera health monitoring
- ✅ Composition recovery system
- ✅ Multi-camera badge for viewers
- ✅ Composed stream recording

#### **2.3 LiveKit Integration (Pulse)**
- ✅ LiveKit room creation and management
- ✅ Participant tracking (host, camera, viewer)
- ✅ Egress (recording) webhooks
- ✅ Room lifecycle webhooks

### **3. Recording Features**
- ✅ Automatic stream recording
- ✅ Manual recording start/stop
- ✅ FFmpeg-based encoding service
- ✅ MP4 output format
- ✅ Recording status tracking (processing → ready → failed)
- ✅ Multi-camera composed stream recording
- ✅ Recording download
- ✅ Telegram CDN upload integration
- ✅ Recording playback

### **4. Media Management**

#### **4.1 Photo Management**
- ✅ Photo upload (single/bulk)
- ✅ Photo gallery display
- ✅ Photo categorization (groom, bride, couple, moment, general)
- ✅ Photo folders organization
- ✅ Photo download
- ✅ Photo delete
- ✅ Drag & drop upload
- ✅ Telegram CDN storage

#### **4.2 Video Management**
- ✅ Video upload (single/bulk)
- ✅ Video gallery display
- ✅ Video categorization
- ✅ Video playback
- ✅ Video thumbnails
- ✅ Video download
- ✅ Video delete

#### **4.3 Storage Management**
- ✅ Storage quota tracking
- ✅ Storage usage calculation
- ✅ Storage limit enforcement
- ✅ Plan-based storage limits:
  - Free: 10 GB
  - Monthly/Yearly: Variable (currently 10 GB, needs update)

### **5. Slideshow & Album Features** 🆕

#### **5.1 Album Management**
- ✅ Create custom photo albums
- ✅ Add/remove photos from albums
- ✅ Reorder photos in albums
- ✅ Album naming and description

#### **5.2 Slideshow Player**
- ✅ 71 Imagination animations/transitions
- ✅ Framer Motion transitions (Fade, Wipe, Zoom)
- ✅ Ken Burns effect animations
- ✅ Per-slide transition customization
- ✅ Global transition settings
- ✅ Slideshow duration control
- ✅ Music integration with slideshows
- ✅ Live preview in editor
- ✅ Random animation assignment
- ✅ Slideshow preview for creators
- ✅ Public slideshow view

### **6. Music Management** 🆕

#### **6.1 Admin Music Library**
- ✅ Upload music files (MP3, WAV, AAC, OGG, M4A)
- ✅ Music metadata extraction (duration, format)
- ✅ Music categorization
- ✅ Music folder organization
- ✅ Public music library for all users
- ✅ Telegram CDN storage with audio proxy

#### **6.2 Creator Music Library**
- ✅ Personal music uploads
- ✅ Private music flag
- ✅ Music folder management (CRUD operations)
- ✅ Storage quota tracking for music
- ✅ Music deletion

#### **6.3 Wedding Music Playlist**
- ✅ Add music to wedding playlist
- ✅ Remove music from playlist
- ✅ Reorder playlist
- ✅ Playlist preview

#### **6.4 Audio Session Management**
- ✅ Start/stop audio sessions
- ✅ Session state persistence
- ✅ Audio session tracking
- ✅ Auto-next music handling
- ✅ Stream interruption handling
- ✅ Playlist settings (shuffle, repeat modes)
- ✅ Volume normalization
- ✅ Audio mixer service
- ✅ Real-time audio state broadcasting (WebSocket)

### **7. Template & Layout Customization**

#### **7.1 Layout Templates**
- ✅ Multiple layout templates (Layout 1, 2, 3, etc.)
- ✅ Template preview
- ✅ Template selection
- ✅ Transparent layouts (background shows through)

#### **7.2 Video Templates** 🆕
- ✅ Custom video template creation
- ✅ Template editor with live preview
- ✅ Text overlay customization:
  - Position (percentage-based)
  - Size (responsive)
  - Font family
  - Font color
  - Font weight
  - Text alignment
  - Background overlay
- ✅ Video background selection
- ✅ Template thumbnails
- ✅ Template preview
- ✅ Template drag & resize controls
- ✅ Auto-scaling text to fit container
- ✅ Responsive text rendering

#### **7.3 Custom Sections**
- ✅ Add custom sections to layout
- ✅ Section types (hero, gallery, timeline, story, contact, etc.)
- ✅ Section reordering
- ✅ Section content customization
- ✅ Section visibility toggle

### **8. Theme Customization**

#### **8.1 Border & Background Management**
- ✅ Upload custom borders
- ✅ Upload custom backgrounds
- ✅ Border preview
- ✅ Background preview
- ✅ Apply borders to layout photos
- ✅ Apply backgrounds to layouts
- ✅ Transparent border support
- ✅ Border overlay positioning
- ✅ Telegram proxy URLs (CORS fix)

#### **8.2 Layout Photos**
- ✅ Upload layout-specific photos
- ✅ Bride photo
- ✅ Groom photo
- ✅ Couple photo
- ✅ Family photos
- ✅ Auto-cropping service
- ✅ Photo positioning and sizing
- ✅ Border application to layout photos

#### **8.3 Theme Assets**
- ✅ Custom color schemes
- ✅ Font customization
- ✅ Logo upload
- ✅ Cover photo management
- ✅ Welcome message customization
- ✅ Description text

### **9. Studio Partner Integration**
- ✅ Studio profiles (name, logo, contact, website)
- ✅ Multiple studio support
- ✅ Studio image upload (replaces logo)
- ✅ Studio details display in layouts
- ✅ Studio details toggle (show/hide)
- ✅ Default studio image for layouts

### **10. Comments & Live Chat**
- ✅ Live comments during streaming
- ✅ Comment display on viewer page
- ✅ Comment moderation
- ✅ Comment count
- ✅ Real-time comment updates

### **11. Analytics & Insights**
- ✅ Viewer count tracking
- ✅ Peak viewer statistics
- ✅ Average watch time
- ✅ Stream uptime tracking
- ✅ Analytics dashboard

### **12. YouTube Integration** 🆕
- ✅ YouTube OAuth integration
- ✅ Create YouTube live broadcasts
- ✅ Stream to YouTube and WedLive simultaneously
- ✅ YouTube chat integration
- ✅ YouTube analytics sync

### **13. Authentication & User Management**

#### **13.1 Authentication**
- ✅ Email/password registration
- ✅ Email/password login
- ✅ Google OAuth 2.0 integration
- ✅ JWT-based authentication
- ✅ Password hashing (bcrypt)
- ✅ Token refresh mechanism

#### **13.2 User Profiles**
- ✅ Profile picture upload
- ✅ Full name update
- ✅ Email update
- ✅ Phone number
- ✅ Google profile sync

#### **13.3 User Roles**
- ✅ User role
- ✅ Creator role
- ✅ Admin role

### **14. Subscription & Payment**

#### **14.1 Current Subscription Plans**
- ✅ Free Plan
- ✅ Monthly Plan (₹1,799/month)
- ✅ Yearly Plan (₹17,270/year - 20% discount)

#### **14.2 Payment Integration**
- ✅ Razorpay integration
- ✅ Payment verification
- ✅ Webhook handling
- ✅ Subscription activation
- ✅ Subscription cancellation
- ✅ Payment history
- ✅ Test/Live mode support

### **15. Quality Control**
- ✅ Stream quality settings:
  - Free: 240p, 360p, 480p
  - Premium: 240p - 4K
- ✅ Recording quality settings
- ✅ Playback quality control

### **16. Precious Moments** 🆕
- ✅ Mark important moments during live stream
- ✅ Timestamp recording
- ✅ Moment categorization
- ✅ Moment playback
- ✅ Moment sharing

### **17. Admin Dashboard**
- ✅ User management (view, edit, delete)
- ✅ Wedding management
- ✅ Subscription overview
- ✅ Analytics dashboard
- ✅ System health monitoring
- ✅ Admin music library management
- ✅ Admin cleanup tools

### **18. Security Features**
- ✅ Password reset functionality
- ✅ Email verification
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Secure token handling
- ✅ API authentication
- ✅ Webhook signature verification

### **19. File Management**
- ✅ Telegram CDN integration
- ✅ Media proxy for CORS handling
- ✅ File upload validation
- ✅ File size limits
- ✅ File type restrictions
- ✅ Thumbnail generation

### **20. Viewer Experience**
- ✅ Public wedding view page
- ✅ Responsive design (mobile/desktop)
- ✅ HLS.js video player
- ✅ Full-screen mode
- ✅ Share wedding link
- ✅ Live viewer count
- ✅ Comments section
- ✅ Photo/video galleries
- ✅ Slideshow albums
- ✅ Layout templates

---

## 🔧 Current Issues & Fixes

### ✅ **FIXED: Deployment Error on Render**

**Issue:** `ModuleNotFoundError: No module named 'app.services.ffmpeg_composition'`

**Root Cause:** The `ffmpeg_composition.py` service file was missing from the repository, but was being imported by:
- `rtmp_webhooks.py` (line 6, line 207)
- `streams.py` (multiple imports)

**Fix Applied:**
1. ✅ Created `/app/backend/app/services/ffmpeg_composition.py` with complete implementation
2. ✅ Implemented `FFmpegCompositionService` class with all required methods:
   - `start_composition()` - Start FFmpeg composition for a wedding
   - `update_composition()` - Update composition on camera switch
   - `stop_composition()` - Stop composition process
   - `check_health()` - Health monitoring
   - `recover_composition()` - Recovery mechanism
   - `_monitor_process()` - Process monitoring
3. ✅ Added `psutil` dependency to `requirements.txt`
4. ✅ Implemented health tracking and automatic recovery
5. ✅ Added process management and cleanup

**Status:** ✅ **DEPLOYMENT ISSUE RESOLVED** - The missing module has been created and deployment should now succeed.

---

## 💎 Subscription Plans Architecture

### **Overview**
Implement a comprehensive subscription system with three tiers: **Free**, **Pro**, and **Enterprise**, each with specific features, storage, and quality limits.

---

### **Plan Comparison Table**

| Feature | Free Plan | Pro Plan | Enterprise Plan |
|---------|-----------|----------|-----------------|
| **Price** | ₹0 | ₹1,800/month | ₹2,500/month |
| **Multi-Month Discounts** | N/A | 3m: 5%, 6m: 10%, 1y: 20% | 3m: 5%, 6m: 10%, 1y: 20% |
| **Storage** | 10 GB (one-time) | 300 GB/month (resets) | 500 GB/month (resets) |
| **Storage Rollover** | N/A | ❌ No rollover | ❌ No rollover |
| **Max Weddings** | 1 active | Unlimited | Unlimited |
| **Max Quality** | 480p | 1080p | 4K |
| **Multi-Camera** | ❌ | ✅ Up to 5 cameras | ✅ Up to 5 cameras |
| **Custom Video Templates** | ❌ | ✅ Unlimited | ✅ Unlimited |
| **Slideshow Animations** | 10 animations | 71 animations | 71 animations |
| **Personal Music Library** | ❌ | ✅ 5 GB | ✅ 10 GB |
| **YouTube Streaming** | ❌ | ✅ | ✅ |
| **Recording Storage** | 7 days | 90 days | 180 days |
| **Priority Support** | ❌ | ✅ | ✅ (24/7) |
| **Custom Branding** | ❌ | ❌ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |

---

### **Detailed Plan Specifications**

#### **1. Free Plan (₹0)**

**Target Users:** Individual users trying out the platform

**Features:**
- ✅ 1 active wedding (others read-only)
- ✅ 10 GB total storage (lifetime, does not reset)
- ✅ Up to 480p quality (live + recording)
- ✅ Single camera streaming only
- ✅ Basic slideshow (10 animations)
- ✅ Admin music library access (public music)
- ✅ 7-day recording retention
- ✅ Standard layouts and templates
- ✅ Community support

**Limitations:**
- ❌ No multi-camera support
- ❌ No personal music uploads
- ❌ No custom video templates
- ❌ No YouTube streaming
- ❌ Only 1 active wedding (older weddings become read-only)
- ❌ Limited animation selection
- ❌ Watermark on recordings

**Storage Behavior:**
- Total storage: 10 GB (one-time allocation)
- Does not reset monthly
- Once filled, must upgrade or delete old content
- Read-only access to locked weddings does not consume additional storage

---

#### **2. Pro Plan (₹1,800/month)**

**Target Users:** Professional wedding videographers and studios

**Pricing:**
- **Monthly:** ₹1,800/month
- **3 Months:** ₹5,130 (₹1,710/month - 5% discount)
- **6 Months:** ₹9,720 (₹1,620/month - 10% discount)
- **1 Year:** ₹17,280 (₹1,440/month - 20% discount)

**Features:**
- ✅ Unlimited active weddings
- ✅ 300 GB storage/month (resets every billing cycle)
- ✅ Up to 1080p quality (live + recording)
- ✅ Multi-camera support (up to 5 cameras)
- ✅ Custom video templates (unlimited)
- ✅ All 71 slideshow animations
- ✅ Personal music library (5 GB quota)
- ✅ YouTube simultaneous streaming
- ✅ 90-day recording retention
- ✅ Advanced analytics
- ✅ Priority support (email, 24-hour response)
- ✅ No watermarks

**Storage Behavior:**
- **Monthly Reset:** 300 GB resets at the start of each billing cycle
- **No Rollover:** Unused storage does NOT carry over to next month
- **Subscription Lapse:** If subscription is not renewed:
  - All wedding data becomes **read-only**
  - User cannot upload new content
  - User can still view/download existing content
  - Data remains accessible but locked
- **Reactivation:** When subscription is renewed:
  - Full 300 GB storage is restored
  - All weddings become editable again
  - Upload functionality resumes

**Example Scenario:**
```
Month 1: Use 200 GB → 100 GB unused (lost)
Month 2: Start fresh with 300 GB
Month 3: Subscription expires → Data goes read-only
Month 4: User renews → Gets 300 GB, data unlocked
```

---

#### **3. Enterprise Plan (₹2,500/month)**

**Target Users:** Large studios, wedding planning companies

**Pricing:**
- **Monthly:** ₹2,500/month
- **3 Months:** ₹7,125 (₹2,375/month - 5% discount)
- **6 Months:** ₹13,500 (₹2,250/month - 10% discount)
- **1 Year:** ₹24,000 (₹2,000/month - 20% discount)

**Features:**
- ✅ Unlimited active weddings
- ✅ 500 GB storage/month (resets every billing cycle)
- ✅ Up to 4K quality (live + recording)
- ✅ Multi-camera support (up to 5 cameras)
- ✅ Custom video templates (unlimited)
- ✅ All 71 slideshow animations
- ✅ Personal music library (10 GB quota)
- ✅ YouTube simultaneous streaming
- ✅ 180-day recording retention
- ✅ Advanced analytics + custom reports
- ✅ Priority support (24/7 phone + email)
- ✅ Custom branding (remove WedLive branding)
- ✅ API access for integrations
- ✅ Dedicated account manager
- ✅ No watermarks

**Storage Behavior:**
- **Monthly Reset:** 500 GB resets at the start of each billing cycle
- **No Rollover:** Unused storage does NOT carry over
- **Subscription Lapse:** Same as Pro Plan (read-only mode)
- **Reactivation:** Same as Pro Plan (full restore)

---

### **Storage Management Architecture**

#### **A. Storage Calculation**

**What Counts Toward Storage:**
1. **Photos:** Original file size
2. **Videos:** Original file size
3. **Recordings:** MP4 file size
4. **Personal Music:** Audio file size
5. **Custom Borders/Backgrounds:** Image file size
6. **Video Templates:** Video background file size

**What Does NOT Count:**
- Telegram CDN thumbnails
- Database metadata
- Preview images
- System-generated files

#### **B. Storage Tracking Schema**

**User Storage Model:**
```python
{
    "user_id": "user_123",
    "subscription_plan": "pro",  # free, pro, enterprise
    "storage": {
        "limit": 322122547200,  # 300 GB in bytes for pro
        "used": 107374182400,   # 100 GB used
        "breakdown": {
            "photos": 32212254720,      # 30 GB
            "videos": 53687091200,      # 50 GB
            "recordings": 21474836480,  # 20 GB
            "music": 0,
            "other": 0
        },
        "last_updated": "2025-02-09T10:00:00Z"
    },
    "subscription": {
        "status": "active",  # active, expired, cancelled
        "current_period_start": "2025-02-01T00:00:00Z",
        "current_period_end": "2025-03-01T00:00:00Z",
        "billing_cycle": "monthly",  # monthly, 3_months, 6_months, 1_year
        "auto_renew": true
    }
}
```

#### **C. Storage Reset Mechanism**

**For Pro/Enterprise Plans:**

**On Billing Cycle Start:**
```python
async def reset_monthly_storage(user_id: str):
    """
    Reset storage at the start of each billing cycle
    """
    db = get_db()
    user = await db.users.find_one({"user_id": user_id})
    
    if user["subscription_plan"] in ["pro", "enterprise"]:
        # Get storage limit based on plan
        if user["subscription_plan"] == "pro":
            new_limit = 322122547200  # 300 GB
        else:  # enterprise
            new_limit = 536870912000  # 500 GB
        
        # Reset storage usage to 0
        await db.users.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "storage.used": 0,
                    "storage.limit": new_limit,
                    "storage.breakdown": {
                        "photos": 0,
                        "videos": 0,
                        "recordings": 0,
                        "music": 0,
                        "other": 0
                    },
                    "storage.last_reset": datetime.utcnow()
                }
            }
        )
```

**Subscription Expiry Handler:**
```python
async def handle_subscription_expiry(user_id: str):
    """
    Handle subscription expiry - make all data read-only
    """
    db = get_db()
    
    # Update user subscription status
    await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "subscription.status": "expired",
                "is_read_only": True
            }
        }
    )
    
    # Lock all weddings for this user
    await db.weddings.update_many(
        {"creator_id": user_id},
        {
            "$set": {
                "is_locked": True,
                "locked_reason": "subscription_expired",
                "locked_at": datetime.utcnow()
            }
        }
    )
```

**Subscription Renewal Handler:**
```python
async def handle_subscription_renewal(user_id: str):
    """
    Handle subscription renewal - restore full access
    """
    db = get_db()
    user = await db.users.find_one({"user_id": user_id})
    
    # Calculate new storage limit
    if user["subscription_plan"] == "pro":
        storage_limit = 322122547200  # 300 GB
    elif user["subscription_plan"] == "enterprise":
        storage_limit = 536870912000  # 500 GB
    else:
        storage_limit = 10737418240   # 10 GB for free
    
    # Update user
    await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "subscription.status": "active",
                "is_read_only": False,
                "storage.limit": storage_limit,
                "storage.used": 0,  # Reset on renewal
                "storage.breakdown": {
                    "photos": 0,
                    "videos": 0,
                    "recordings": 0,
                    "music": 0,
                    "other": 0
                }
            }
        }
    )
    
    # Unlock all weddings
    await db.weddings.update_many(
        {"creator_id": user_id},
        {
            "$set": {
                "is_locked": False
            },
            "$unset": {
                "locked_reason": "",
                "locked_at": ""
            }
        }
    )
```

#### **D. Storage Enforcement**

**Upload Validation:**
```python
async def validate_storage_before_upload(user_id: str, file_size: int) -> dict:
    """
    Check if user has enough storage before upload
    """
    db = get_db()
    user = await db.users.find_one({"user_id": user_id})
    
    storage_used = user.get("storage", {}).get("used", 0)
    storage_limit = user.get("storage", {}).get("limit", 10737418240)  # 10GB default
    
    if storage_used + file_size > storage_limit:
        return {
            "allowed": False,
            "reason": "storage_limit_exceeded",
            "used": storage_used,
            "limit": storage_limit,
            "available": storage_limit - storage_used,
            "required": file_size
        }
    
    return {
        "allowed": True,
        "used": storage_used,
        "limit": storage_limit,
        "available": storage_limit - storage_used
    }
```

---

### **Discount Calculation**

**Discount Formula:**
```python
def calculate_subscription_price(plan: str, duration: str) -> dict:
    """
    Calculate subscription price with discounts
    
    Args:
        plan: "pro" or "enterprise"
        duration: "1_month", "3_months", "6_months", "1_year"
    """
    base_prices = {
        "pro": 1800,       # ₹1,800/month
        "enterprise": 2500  # ₹2,500/month
    }
    
    discounts = {
        "1_month": 0,      # 0% discount
        "3_months": 0.05,  # 5% discount
        "6_months": 0.10,  # 10% discount
        "1_year": 0.20     # 20% discount
    }
    
    months = {
        "1_month": 1,
        "3_months": 3,
        "6_months": 6,
        "1_year": 12
    }
    
    base_price = base_prices[plan]
    discount = discounts[duration]
    num_months = months[duration]
    
    discounted_monthly = base_price * (1 - discount)
    total_price = discounted_monthly * num_months
    savings = (base_price * num_months) - total_price
    
    return {
        "plan": plan,
        "duration": duration,
        "base_monthly_price": base_price,
        "discounted_monthly_price": discounted_monthly,
        "total_price": total_price,
        "discount_percentage": discount * 100,
        "total_savings": savings,
        "billing_months": num_months
    }
```

**Examples:**
```python
# Pro - 3 Months
calculate_subscription_price("pro", "3_months")
# Returns:
# {
#     "plan": "pro",
#     "duration": "3_months",
#     "base_monthly_price": 1800,
#     "discounted_monthly_price": 1710,
#     "total_price": 5130,
#     "discount_percentage": 5.0,
#     "total_savings": 270,
#     "billing_months": 3
# }

# Enterprise - 1 Year
calculate_subscription_price("enterprise", "1_year")
# Returns:
# {
#     "plan": "enterprise",
#     "duration": "1_year",
#     "base_monthly_price": 2500,
#     "discounted_monthly_price": 2000,
#     "total_price": 24000,
#     "discount_percentage": 20.0,
#     "total_savings": 6000,
#     "billing_months": 12
# }
```

---

## 📋 Implementation Plan

### **Phase 1: Database Schema Updates** (Day 1)

**1.1 Update User Model**
```python
# /app/backend/app/models.py

class SubscriptionPlan(str, Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class SubscriptionDuration(str, Enum):
    MONTHLY = "1_month"
    THREE_MONTHS = "3_months"
    SIX_MONTHS = "6_months"
    ONE_YEAR = "1_year"

class UserSubscription(BaseModel):
    plan: SubscriptionPlan
    duration: SubscriptionDuration
    status: str  # active, expired, cancelled
    current_period_start: datetime
    current_period_end: datetime
    auto_renew: bool
    razorpay_subscription_id: Optional[str] = None
```

**1.2 Create Storage Model**
```python
# /app/backend/app/models.py

class StorageBreakdown(BaseModel):
    photos: int = 0
    videos: int = 0
    recordings: int = 0
    music: int = 0
    other: int = 0

class UserStorage(BaseModel):
    limit: int  # in bytes
    used: int  # in bytes
    breakdown: StorageBreakdown
    last_reset: Optional[datetime] = None
    last_updated: datetime
```

---

### **Phase 2: Storage Service Implementation** (Day 2)

**2.1 Create Storage Service**
```python
# /app/backend/app/services/storage_service.py

class StorageService:
    async def calculate_user_storage(user_id: str) -> dict
    async def validate_storage_quota(user_id: str, file_size: int) -> dict
    async def update_storage_usage(user_id: str, file_size: int, category: str)
    async def reset_monthly_storage(user_id: str)
    async def get_storage_limit(plan: str) -> int
```

**2.2 Add Storage Validation Middleware**
- Check storage before all uploads
- Return 413 Payload Too Large if quota exceeded
- Show remaining storage in response headers

---

### **Phase 3: Subscription Management** (Day 3)

**3.1 Update Subscription Routes**
```python
# /app/backend/app/routes/subscriptions.py

@router.post("/create-pro-subscription")
async def create_pro_subscription(
    duration: SubscriptionDuration,
    current_user: dict = Depends(get_current_user)
)

@router.post("/create-enterprise-subscription")
async def create_enterprise_subscription(
    duration: SubscriptionDuration,
    current_user: dict = Depends(get_current_user)
)

@router.get("/pricing")
async def get_pricing_plans()

@router.post("/cancel-subscription")
async def cancel_subscription(current_user: dict = Depends(get_current_user))
```

**3.2 Implement Razorpay Plan Creation**
- Create Razorpay plans for each tier and duration
- Handle webhooks for subscription events
- Implement payment verification

---

### **Phase 4: Read-Only Mode Implementation** (Day 4)

**4.1 Add Read-Only Checks**
```python
# Add middleware to check read-only status

async def check_read_only_mode(
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("is_read_only"):
        raise HTTPException(
            status_code=403,
            detail="Subscription expired. Renew to continue uploading."
        )
```

**4.2 Update Frontend**
- Show "Read-Only Mode" banner when subscription expires
- Disable upload buttons
- Show "Renew Subscription" CTA
- Allow viewing and downloading existing content

---

### **Phase 5: Scheduled Jobs** (Day 5)

**5.1 Create Background Tasks**
```python
# /app/backend/app/services/scheduler.py

async def check_expired_subscriptions():
    """Run daily to check for expired subscriptions"""
    pass

async def reset_monthly_storage():
    """Run daily to reset storage for users with new billing cycle"""
    pass

async def send_expiry_reminders():
    """Send email reminders 7, 3, 1 days before expiry"""
    pass
```

**5.2 Setup APScheduler**
- Daily job for subscription expiry checks
- Daily job for storage resets
- Weekly job for reminder emails

---

### **Phase 6: Plan Restrictions Enforcement** (Day 6)

**6.1 Update Plan Restrictions**
```python
# /app/backend/app/plan_restrictions.py

PLAN_LIMITS = {
    "free": {
        "storage": 10 * 1024 * 1024 * 1024,  # 10 GB
        "max_quality": "480p",
        "max_weddings": 1,
        "multi_camera": False,
        "custom_video_templates": False,
        "slideshow_animations": 10,
        "personal_music_storage": 0,
        "youtube_streaming": False,
        "recording_retention_days": 7,
        "watermark": True
    },
    "pro": {
        "storage": 300 * 1024 * 1024 * 1024,  # 300 GB/month
        "max_quality": "1080p",
        "max_weddings": -1,  # unlimited
        "multi_camera": True,
        "custom_video_templates": True,
        "slideshow_animations": 71,
        "personal_music_storage": 5 * 1024 * 1024 * 1024,  # 5 GB
        "youtube_streaming": True,
        "recording_retention_days": 90,
        "watermark": False
    },
    "enterprise": {
        "storage": 500 * 1024 * 1024 * 1024,  # 500 GB/month
        "max_quality": "4K",
        "max_weddings": -1,  # unlimited
        "multi_camera": True,
        "custom_video_templates": True,
        "slideshow_animations": 71,
        "personal_music_storage": 10 * 1024 * 1024 * 1024,  # 10 GB
        "youtube_streaming": True,
        "recording_retention_days": 180,
        "watermark": False,
        "custom_branding": True,
        "api_access": True
    }
}
```

**6.2 Add Enforcement in APIs**
- Check wedding limit in create wedding endpoint
- Check quality limit in quality settings endpoint
- Check multi-camera access in camera add endpoint
- Check animation limit in slideshow endpoint

---

### **Phase 7: Frontend Updates** (Day 7-8)

**7.1 Pricing Page**
- Create comprehensive pricing comparison table
- Show all features per plan
- Highlight discounts for longer durations
- Add "Most Popular" badge for Pro plan

**7.2 Subscription Management Page**
- Show current plan and usage
- Display storage usage breakdown
- Show billing cycle and next billing date
- Add upgrade/downgrade options
- Add cancel subscription option

**7.3 Storage Usage Widget**
- Show real-time storage usage
- Display breakdown by category
- Show storage reset date for Pro/Enterprise
- Add "Manage Storage" button

**7.4 Read-Only Mode UI**
- Banner notification for expired subscriptions
- Disable all upload functionality
- Show "Renew Now" CTA
- Display grace period information

---

### **Phase 8: Testing & Deployment** (Day 9-10)

**8.1 Testing Checklist**
- [ ] Free plan restrictions working
- [ ] Pro plan features accessible
- [ ] Enterprise plan features accessible
- [ ] Storage quota validation
- [ ] Storage reset on billing cycle
- [ ] Read-only mode on expiry
- [ ] Subscription renewal restores access
- [ ] Multi-month discount calculation
- [ ] Razorpay payment integration
- [ ] Webhook handling
- [ ] Email notifications

**8.2 Migration Script**
- Migrate existing "monthly" and "yearly" subscriptions to new "pro" plan
- Set appropriate durations
- Recalculate storage limits
- Update plan restrictions

---

## 📊 Database Collections Schema

### **Users Collection**
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "email": "string",
  "full_name": "string",
  "role": "user|creator|admin",
  "subscription": {
    "plan": "free|pro|enterprise",
    "duration": "1_month|3_months|6_months|1_year",
    "status": "active|expired|cancelled",
    "current_period_start": "ISODate",
    "current_period_end": "ISODate",
    "auto_renew": "boolean",
    "razorpay_subscription_id": "string|null"
  },
  "storage": {
    "limit": "number (bytes)",
    "used": "number (bytes)",
    "breakdown": {
      "photos": "number",
      "videos": "number",
      "recordings": "number",
      "music": "number",
      "other": "number"
    },
    "last_reset": "ISODate|null",
    "last_updated": "ISODate"
  },
  "is_read_only": "boolean",
  "created_at": "ISODate"
}
```

### **Payments Collection**
```json
{
  "_id": "ObjectId",
  "payment_id": "string",
  "user_id": "string",
  "subscription_id": "string",
  "razorpay_payment_id": "string",
  "plan": "pro|enterprise",
  "duration": "1_month|3_months|6_months|1_year",
  "amount": "number",
  "currency": "INR",
  "status": "pending|completed|failed",
  "created_at": "ISODate",
  "completed_at": "ISODate|null"
}
```

---

## 🎯 Summary

### **Deployment Issue: RESOLVED ✅**
- Created missing `ffmpeg_composition.py` service
- Added `psutil` to requirements.txt
- Implemented complete multi-camera composition functionality
- Deployment should now succeed on Render

### **Features Documented: 20+ Major Categories**
- Comprehensive feature list covering all WedLive capabilities
- Organized by category for easy reference
- Includes new features like slideshows, music management, video templates

### **Subscription Architecture: Designed ✅**
- Three-tier system: Free, Pro (₹1,800/month), Enterprise (₹2,500/month)
- Monthly storage reset for Pro/Enterprise (no rollover)
- Multi-month discounts: 5% (3m), 10% (6m), 20% (1y)
- Read-only mode on subscription expiry
- Complete storage management system
- Detailed implementation plan with 8 phases

### **Next Steps**
1. ✅ Deploy to Render (deployment issue fixed)
2. Implement Phase 1-8 of subscription system
3. Test all subscription flows
4. Update frontend with new pricing and storage UI
5. Launch new subscription plans

---

**Document Version:** 1.0  
**Created:** February 9, 2025  
**Last Updated:** February 9, 2025
