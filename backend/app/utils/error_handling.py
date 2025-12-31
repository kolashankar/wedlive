"""
Phase 5 & 6: Error Handling Utilities and UX Improvements
Centralized error handling, validation, and user feedback
"""

from functools import wraps
from fastapi import HTTPException, status
from typing import Any, Dict, Optional, Callable
import logging
import traceback
from datetime import datetime

logger = logging.getLogger(__name__)

# ==================== ERROR CODES ====================
class ErrorCodes:
    # General errors
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    
    # Photo upload errors
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    UPLOAD_FAILED = "UPLOAD_FAILED"
    MAX_PHOTOS_REACHED = "MAX_PHOTOS_REACHED"
    
    # Layout errors
    INVALID_LAYOUT = "INVALID_LAYOUT"
    INVALID_PLACEHOLDER = "INVALID_PLACEHOLDER"
    LAYOUT_NOT_SUPPORTED = "LAYOUT_NOT_SUPPORTED"
    
    # Wedding errors
    WEDDING_NOT_FOUND = "WEDDING_NOT_FOUND"
    WEDDING_ACCESS_DENIED = "WEDDING_ACCESS_DENIED"
    
    # Media errors
    MEDIA_NOT_FOUND = "MEDIA_NOT_FOUND"
    MEDIA_DELETE_FAILED = "MEDIA_DELETE_FAILED"
    TELEGRAM_CDN_ERROR = "TELEGRAM_CDN_ERROR"

# ==================== ERROR RESPONSE BUILDER ====================
class ErrorResponse:
    @staticmethod
    def build(
        error_code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        suggestions: Optional[list] = None
    ) -> Dict[str, Any]:
        """Build standardized error response"""
        return {
            "error": True,
            "error_code": error_code,
            "message": message,
            "details": details or {},
            "suggestions": suggestions or [],
            "timestamp": datetime.utcnow().isoformat()
        }

# ==================== ERROR HANDLER DECORATOR ====================
def handle_errors(func: Callable):
    """Decorator for comprehensive error handling"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
        except Exception as e:
            # Log unexpected errors
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
            logger.error(traceback.format_exc())
            
            # Return user-friendly error
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=ErrorResponse.build(
                    error_code=ErrorCodes.INTERNAL_SERVER_ERROR,
                    message="An unexpected error occurred",
                    details={"function": func.__name__},
                    suggestions=["Please try again", "Contact support if the issue persists"]
                )
            )
    return wrapper

# ==================== VALIDATION HELPERS ====================
class Validators:
    @staticmethod
    def validate_wedding_ownership(wedding: Dict, user_id: str) -> None:
        """Validate user owns the wedding"""
        if wedding["creator_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=ErrorResponse.build(
                    error_code=ErrorCodes.WEDDING_ACCESS_DENIED,
                    message="You don't have permission to modify this wedding",
                    suggestions=["Verify you're logged in with the correct account"]
                )
            )
    
    @staticmethod
    def validate_wedding_exists(wedding: Optional[Dict], wedding_id: str) -> None:
        """Validate wedding exists"""
        if not wedding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorResponse.build(
                    error_code=ErrorCodes.WEDDING_NOT_FOUND,
                    message=f"Wedding not found: {wedding_id}",
                    suggestions=["Check the wedding ID", "Verify the wedding hasn't been deleted"]
                )
            )
    
    @staticmethod
    def validate_file_upload(
        content_type: str,
        file_size: int,
        max_size: int = 10 * 1024 * 1024
    ) -> None:
        """Validate file upload"""
        # Check content type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorResponse.build(
                    error_code=ErrorCodes.INVALID_FILE_TYPE,
                    message=f"Invalid file type: {content_type}",
                    details={"allowed_types": allowed_types},
                    suggestions=[
                        "Use JPEG, PNG, or WebP format",
                        "Convert your image to a supported format"
                    ]
                )
            )
        
        # Check file size
        if file_size > max_size:
            max_mb = max_size / (1024 * 1024)
            actual_mb = file_size / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorResponse.build(
                    error_code=ErrorCodes.FILE_TOO_LARGE,
                    message=f"File size ({actual_mb:.2f}MB) exceeds maximum ({max_mb}MB)",
                    details={"max_size_mb": max_mb, "file_size_mb": actual_mb},
                    suggestions=[
                        "Compress your image before uploading",
                        "Use an online image compressor",
                        "Reduce image dimensions"
                    ]
                )
            )
    
    @staticmethod
    def validate_placeholder_max_count(
        current_count: int,
        max_count: int,
        placeholder: str
    ) -> None:
        """Validate photo count doesn't exceed maximum"""
        if current_count >= max_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorResponse.build(
                    error_code=ErrorCodes.MAX_PHOTOS_REACHED,
                    message=f"Maximum {max_count} photos allowed for {placeholder}",
                    details={
                        "current_count": current_count,
                        "max_count": max_count,
                        "placeholder": placeholder
                    },
                    suggestions=[
                        f"Remove existing photos to add new ones",
                        f"Maximum limit is {max_count} photos for this section"
                    ]
                )
            )

# ==================== SUCCESS RESPONSE BUILDER ====================
class SuccessResponse:
    @staticmethod
    def build(
        message: str,
        data: Optional[Dict[str, Any]] = None,
        meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Build standardized success response"""
        return {
            "success": True,
            "message": message,
            "data": data or {},
            "meta": meta or {},
            "timestamp": datetime.utcnow().isoformat()
        }

# ==================== LOGGING HELPERS ====================
class LogHelpers:
    @staticmethod
    def log_api_call(endpoint: str, user_id: str, params: Dict[str, Any]) -> None:
        """Log API call with context"""
        logger.info(f"[API] {endpoint} | User: {user_id} | Params: {params}")
    
    @staticmethod
    def log_error(endpoint: str, error: Exception, context: Dict[str, Any]) -> None:
        """Log error with context"""
        logger.error(f"[ERROR] {endpoint} | Error: {str(error)} | Context: {context}")
        logger.error(traceback.format_exc())
    
    @staticmethod
    def log_success(endpoint: str, message: str, meta: Dict[str, Any]) -> None:
        """Log successful operation"""
        logger.info(f"[SUCCESS] {endpoint} | {message} | Meta: {meta}")

# ==================== RETRY MECHANISM ====================
class RetryHelper:
    @staticmethod
    async def retry_with_backoff(
        func: Callable,
        max_attempts: int = 3,
        backoff_seconds: float = 1.0
    ) -> Any:
        """Retry function with exponential backoff"""
        import asyncio
        
        for attempt in range(max_attempts):
            try:
                return await func()
            except Exception as e:
                if attempt == max_attempts - 1:
                    raise
                
                wait_time = backoff_seconds * (2 ** attempt)
                logger.warning(f"Attempt {attempt + 1} failed, retrying in {wait_time}s: {str(e)}")
                await asyncio.sleep(wait_time)

# ==================== RATE LIMITING ====================
class RateLimiter:
    """Simple rate limiter for API protection"""
    def __init__(self):
        self.requests = {}
    
    def check_rate_limit(
        self,
        user_id: str,
        endpoint: str,
        max_requests: int = 100,
        window_seconds: int = 60
    ) -> bool:
        """Check if user exceeded rate limit"""
        import time
        
        key = f"{user_id}:{endpoint}"
        current_time = time.time()
        
        # Clean old entries
        if key in self.requests:
            self.requests[key] = [
                ts for ts in self.requests[key]
                if current_time - ts < window_seconds
            ]
        else:
            self.requests[key] = []
        
        # Check limit
        if len(self.requests[key]) >= max_requests:
            return False
        
        # Add current request
        self.requests[key].append(current_time)
        return True

# ==================== PERFORMANCE MONITORING ====================
class PerformanceMonitor:
    @staticmethod
    def measure_time(func: Callable):
        """Decorator to measure function execution time"""
        @wraps(func)
        async def wrapper(*args, **kwargs):
            import time
            start = time.time()
            result = await func(*args, **kwargs)
            elapsed = time.time() - start
            
            if elapsed > 2.0:  # Log slow operations
                logger.warning(f"Slow operation: {func.__name__} took {elapsed:.2f}s")
            
            return result
        return wrapper

# ==================== EXPORTS ====================
__all__ = [
    'ErrorCodes',
    'ErrorResponse',
    'SuccessResponse',
    'handle_errors',
    'Validators',
    'LogHelpers',
    'RetryHelper',
    'RateLimiter',
    'PerformanceMonitor'
]
