"""
Utils Package - Common utility functions
"""
import random
import string
from datetime import datetime
from typing import Dict, Any

# Import all utility modules for easy access
from .file_id_validator import (
    validate_and_log_file_id, 
    is_valid_telegram_file_id,
    is_placeholder_file_id,
    clean_file_id_from_response
)
from .error_handling import (
    ErrorCodes,
    ErrorResponse,
    SuccessResponse,
    handle_errors,
    Validators,
    LogHelpers,
    RetryHelper,
    RateLimiter,
    PerformanceMonitor
)

# Helper functions previously in utils.py
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

__all__ = [
    # File ID validation
    'validate_and_log_file_id',
    'is_valid_telegram_file_id',
    'is_placeholder_file_id',
    'clean_file_id_from_response',
    # Error handling
    'ErrorCodes',
    'ErrorResponse',
    'SuccessResponse',
    'handle_errors',
    'Validators',
    'LogHelpers',
    'RetryHelper',
    'RateLimiter',
    'PerformanceMonitor',
    # Helper functions
    'generate_short_code',
    'check_premium_plan',
    'get_recording_quality_options',
    'format_webhook_event',
]
