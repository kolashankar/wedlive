import time
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    Rate limiter for API calls to prevent quota exhaustion
    
    YouTube API Quota Costs:
    - Broadcast creation: ~1,600 units
    - Status check: ~1 unit
    - Video details: ~1 unit
    - List broadcasts: ~1 unit
    
    Default quota: 10,000 units/day
    """
    
    def __init__(self):
        # Store rate limit data per user_id and API type
        self.user_limits: Dict[str, Dict[str, list]] = defaultdict(lambda: defaultdict(list))
        
        # Rate limit configurations
        self.limits = {
            "youtube_broadcast_create": {
                "max_calls": 5,  # Max 5 broadcast creations per day
                "window_seconds": 86400,  # 24 hours
                "cost": 1600  # Quota units
            },
            "youtube_status_check": {
                "max_calls": 100,  # Max 100 status checks per hour
                "window_seconds": 3600,  # 1 hour
                "cost": 1  # Quota units
            },
            "youtube_list_broadcasts": {
                "max_calls": 50,  # Max 50 list calls per hour
                "window_seconds": 3600,  # 1 hour
                "cost": 1  # Quota units
            },
            "youtube_transition": {
                "max_calls": 20,  # Max 20 transitions per day
                "window_seconds": 86400,  # 24 hours
                "cost": 50  # Quota units
            },
            "youtube_video_details": {
                "max_calls": 100,  # Max 100 video detail calls per hour
                "window_seconds": 3600,  # 1 hour
                "cost": 1  # Quota units
            }
        }
        
        logger.info("✅ Rate Limiter initialized for YouTube API")
    
    def check_limit(self, user_id: str, api_type: str) -> tuple[bool, Optional[str]]:
        """
        Check if user has exceeded rate limit for specific API type
        
        Args:
            user_id: User identifier
            api_type: Type of API call (e.g., 'youtube_broadcast_create')
            
        Returns:
            (allowed: bool, error_message: Optional[str])
        """
        if api_type not in self.limits:
            logger.warning(f"Unknown API type: {api_type}")
            return True, None
        
        config = self.limits[api_type]
        now = time.time()
        window_start = now - config["window_seconds"]
        
        # Get call history for this user and API type
        call_history = self.user_limits[user_id][api_type]
        
        # Remove old calls outside the time window
        call_history[:] = [timestamp for timestamp in call_history if timestamp > window_start]
        
        # Check if limit exceeded
        if len(call_history) >= config["max_calls"]:
            window_hours = config["window_seconds"] / 3600
            error_msg = (
                f"Rate limit exceeded for {api_type}. "
                f"Maximum {config['max_calls']} calls per {window_hours:.0f} hour(s). "
                f"Please try again later."
            )
            logger.warning(f"⚠️ Rate limit exceeded: user={user_id}, api={api_type}")
            return False, error_msg
        
        return True, None
    
    def record_call(self, user_id: str, api_type: str):
        """
        Record an API call for rate limiting
        
        Args:
            user_id: User identifier
            api_type: Type of API call
        """
        if api_type not in self.limits:
            logger.warning(f"Unknown API type for recording: {api_type}")
            return
        
        now = time.time()
        self.user_limits[user_id][api_type].append(now)
        
        logger.debug(f"📊 Recorded API call: user={user_id}, api={api_type}, "
                    f"count={len(self.user_limits[user_id][api_type])}")
    
    def get_remaining_calls(self, user_id: str, api_type: str) -> int:
        """
        Get remaining API calls for user
        
        Args:
            user_id: User identifier
            api_type: Type of API call
            
        Returns:
            Number of remaining calls
        """
        if api_type not in self.limits:
            return 0
        
        config = self.limits[api_type]
        now = time.time()
        window_start = now - config["window_seconds"]
        
        # Get call history
        call_history = self.user_limits[user_id][api_type]
        
        # Count recent calls
        recent_calls = sum(1 for timestamp in call_history if timestamp > window_start)
        
        return max(0, config["max_calls"] - recent_calls)
    
    def reset_user_limits(self, user_id: str):
        """
        Reset all rate limits for a specific user (admin function)
        
        Args:
            user_id: User identifier
        """
        if user_id in self.user_limits:
            del self.user_limits[user_id]
            logger.info(f"🔄 Reset rate limits for user: {user_id}")
    
    def get_user_stats(self, user_id: str) -> Dict:
        """
        Get rate limit statistics for a user
        
        Args:
            user_id: User identifier
            
        Returns:
            Dictionary with rate limit stats
        """
        stats = {}
        
        for api_type, config in self.limits.items():
            now = time.time()
            window_start = now - config["window_seconds"]
            
            call_history = self.user_limits[user_id][api_type]
            recent_calls = sum(1 for timestamp in call_history if timestamp > window_start)
            
            stats[api_type] = {
                "calls_used": recent_calls,
                "calls_remaining": config["max_calls"] - recent_calls,
                "max_calls": config["max_calls"],
                "window_hours": config["window_seconds"] / 3600,
                "quota_cost": config["cost"]
            }
        
        return stats

# Global rate limiter instance
rate_limiter = RateLimiter()
