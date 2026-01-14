"""
Plan-based restrictions and storage management for WedLive
Implements Free vs Premium plan features and limitations
"""

from typing import Dict, Optional, Tuple
from datetime import datetime
from app.models import SubscriptionPlan

# Storage limits in bytes
STORAGE_LIMITS = {
    "free": 10 * 1024 * 1024 * 1024,      # 10GB
    "monthly": 200 * 1024 * 1024 * 1024,  # 200GB
    "yearly": 200 * 1024 * 1024 * 1024,   # 200GB
}

# Resolution limits
RESOLUTION_LIMITS = {
    "free": ["240p", "360p", "480p"],
    "monthly": ["240p", "360p", "480p", "720p", "1080p", "4K"],
    "yearly": ["240p", "360p", "480p", "720p", "1080p", "4K"],
}

# Wedding creation limits
WEDDING_LIMITS = {
    "free": 1,
    "monthly": -1,  # Unlimited (-1)
    "yearly": -1,   # Unlimited (-1)
}

# Feature flags
PLAN_FEATURES = {
    "free": {
        "media_upload": False,  # Free plan: NO uploads
        "custom_branding": False,
        "white_label": False,
        "custom_domain": False,
        "dvr_recording": False,
        "analytics_dashboard": False,
        "multi_camera": False,
        "api_access": False,
        "webhooks": False,
        "live_streaming": True,  # Can stream but limited quality
    },
    "monthly": {
        "media_upload": True,
        "custom_branding": True,
        "white_label": True,
        "custom_domain": True,
        "dvr_recording": True,
        "analytics_dashboard": True,
        "multi_camera": True,
        "api_access": True,
        "webhooks": True,
        "live_streaming": True,
    },
    "yearly": {
        "media_upload": True,
        "custom_branding": True,
        "white_label": True,
        "custom_domain": True,
        "dvr_recording": True,
        "analytics_dashboard": True,
        "multi_camera": True,
        "api_access": True,
        "webhooks": True,
        "live_streaming": True,
    }
}


def get_storage_limit(plan: str) -> int:
    """Get storage limit in bytes for a plan"""
    return STORAGE_LIMITS.get(plan, STORAGE_LIMITS["free"])


def get_allowed_resolutions(plan: str) -> list:
    """Get allowed resolutions for a plan"""
    return RESOLUTION_LIMITS.get(plan, RESOLUTION_LIMITS["free"])


def get_wedding_limit(plan: str) -> int:
    """Get wedding creation limit for a plan (-1 = unlimited)"""
    return WEDDING_LIMITS.get(plan, WEDDING_LIMITS["free"])


def has_feature(plan: str, feature: str) -> bool:
    """Check if a plan has access to a specific feature"""
    plan_features = PLAN_FEATURES.get(plan, PLAN_FEATURES["free"])
    return plan_features.get(feature, False)


def can_upload_media(plan: str) -> bool:
    """Check if plan allows media uploads"""
    return has_feature(plan, "media_upload")


def can_stream_resolution(plan: str, resolution: str) -> bool:
    """Check if plan allows streaming at given resolution"""
    allowed = get_allowed_resolutions(plan)
    return resolution in allowed


def format_bytes(bytes_value: int) -> str:
    """Format bytes to human-readable format"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.2f} PB"


def get_storage_info(storage_used: int, plan: str) -> Dict:
    """Get comprehensive storage information"""
    storage_limit = get_storage_limit(plan)
    percentage = (storage_used / storage_limit * 100) if storage_limit > 0 else 0
    remaining = max(0, storage_limit - storage_used)
    is_over_limit = storage_used > storage_limit
    
    return {
        "used": storage_used,
        "used_formatted": format_bytes(storage_used),
        "limit": storage_limit,
        "limit_formatted": format_bytes(storage_limit),
        "remaining": remaining,
        "remaining_formatted": format_bytes(remaining),
        "percentage": round(percentage, 2),
        "is_over_limit": is_over_limit,
        "can_upload": not is_over_limit and can_upload_media(plan)
    }


def check_upload_allowed(user: Dict, file_size: int) -> Tuple[bool, Optional[str]]:
    """
    Check if user can upload a file
    Returns: (allowed: bool, error_message: Optional[str])
    """
    plan = user.get("subscription_plan", "free")
    storage_used = user.get("storage_used", 0)
    storage_limit = get_storage_limit(plan)
    
    # Check if plan allows uploads
    if not can_upload_media(plan):
        return False, "Media uploads are not available on Free plan. Please upgrade to Premium to upload photos and videos."
    
    # Check storage limit
    if storage_used + file_size > storage_limit:
        return False, f"Storage limit exceeded. You are using {format_bytes(storage_used)} of {format_bytes(storage_limit)}. Please upgrade your plan or delete some files."
    
    return True, None


def get_quality_options(plan: str) -> list:
    """Get available quality options for a plan"""
    return RESOLUTION_LIMITS.get(plan, RESOLUTION_LIMITS["free"])


def get_viewer_limit(plan: str) -> Optional[int]:
    """Get viewer limit for a plan (None = unlimited)"""
    if plan == "free":
        return 100
    return None  # Unlimited for premium plans



def is_subscription_active(user: Dict) -> bool:
    """Check if user has an active subscription"""
    plan = user.get("subscription_plan", "free")
    
    # Free plan is always "active" (with limitations)
    if plan == "free":
        return True
    
    # Check if premium subscription is active
    subscription_end = user.get("subscription_end_date")
    if not subscription_end:
        return False
    
    # If subscription has expired, set to read-only mode
    if isinstance(subscription_end, datetime):
        return subscription_end > datetime.utcnow()
    
    return True


def should_show_upgrade_banner(user: Dict) -> Tuple[bool, Optional[str]]:
    """
    Check if upgrade banner should be shown
    Returns: (show: bool, message: Optional[str])
    """
    plan = user.get("subscription_plan", "free")
    storage_used = user.get("storage_used", 0)
    storage_limit = get_storage_limit(plan)
    
    # Expired premium subscription
    if plan in ["monthly", "yearly"] and not is_subscription_active(user):
        return True, f"Your plan has expired. You are using {format_bytes(storage_used)} of {format_bytes(storage_limit)} limit. Upgrade to restore upload and 4K live streaming."
    
    # Free plan with high storage usage
    if plan == "free" and storage_used > storage_limit * 0.8:
        return True, f"You are using {format_bytes(storage_used)} of {format_bytes(storage_limit)}. Upgrade to Premium for 200GB storage and unlimited features."
    
    return False, None


def get_plan_comparison() -> Dict:
    """Get detailed plan comparison for display"""
    return {
        "free": {
            "name": "Free Plan",
            "price": "₹0",
            "features": {
                "resolution": "Up to 480p",
                "weddings": "1 wedding only",
                "uploads": "No media uploads",
                "storage": "10GB (read-only)",
                "branding": "WedLive branding visible",
                "custom_domain": "Not available",
                "analytics": "Basic only",
                "support": "Community support"
            }
        },
        "monthly": {
            "name": "Premium Monthly",
            "price": "₹1,799/month",
            "features": {
                "resolution": "Up to 4K",
                "weddings": "Unlimited weddings",
                "uploads": "Full photo & video uploads",
                "storage": "200GB + add-ons",
                "branding": "Remove WedLive branding",
                "custom_domain": "Custom slug + domain",
                "analytics": "Advanced analytics dashboard",
                "support": "Priority support"
            }
        },
        "yearly": {
            "name": "Premium Yearly",
            "price": "₹17,270/year",
            "savings": "Save ₹4,318 (20% off)",
            "features": {
                "resolution": "Up to 4K",
                "weddings": "Unlimited weddings",
                "uploads": "Full photo & video uploads",
                "storage": "200GB + add-ons",
                "branding": "Remove WedLive branding",
                "custom_domain": "Custom slug + domain",
                "analytics": "Advanced analytics dashboard",
                "support": "Priority support"
            }
        }
    }
