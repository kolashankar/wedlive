import random
import string
from datetime import datetime
from typing import Dict, Any

def generate_short_code(prefix: str = "", length: int = 6) -> str:
    """Generate a simple 6-digit numeric wedding code like 123456"""
    # Generate a random 6-digit number
    code = ''.join([str(random.randint(0, 9)) for _ in range(length)])
    return code

def check_premium_plan(subscription_plan: str) -> bool:
    """Check if user has premium plan (monthly or yearly)"""
    return subscription_plan in ["monthly", "yearly"]

def get_recording_quality_options(subscription_plan: str) -> list:
    """Get available recording quality options based on plan"""
    if check_premium_plan(subscription_plan):
        return ["720p", "1080p", "4K"]
    return ["720p"]  # Free plan only gets 720p

def format_webhook_event(event_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Format webhook event payload"""
    return {
        "event": event_type,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data
    }
