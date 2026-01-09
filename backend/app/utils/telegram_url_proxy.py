"""
Utility to convert direct Telegram Bot API URLs to proxied URLs
This prevents CORS issues and avoids exposing bot tokens in the frontend
"""
import os
import re
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def get_backend_url() -> str:
    """Get the backend URL from environment"""
    # Try to get from environment, fallback to localhost for development
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8001")
    # Remove trailing slash if present
    return backend_url.rstrip("/")

def telegram_file_id_to_proxy_url(telegram_file_id: str, media_type: str = "photos") -> Optional[str]:
    """
    Convert a Telegram file_id to a proxied URL through our backend.
    This is the PREFERRED method as it ensures files are always accessible.
    
    Args:
        telegram_file_id: The Telegram file_id (e.g., "BQACAgUAAyEGAATO...")
        media_type: Type of media - "photos", "videos", or "documents" (default: "photos")
    
    Returns:
        Proxied URL: "/api/media/telegram-proxy/{media_type}/{file_id}" (relative)
        OR "https://backend.com/api/media/telegram-proxy/{media_type}/{file_id}" (absolute if BACKEND_URL set)
    
    Example:
        Input:  "BQACAgUAAyEGAATO7nwaAAORaU_lARiYUfa4-Ql7aimRSPI5FiwAAv4cAALG7oBWmnWGZsd6drE2BA"
        Output: "/api/media/telegram-proxy/photos/BQACAgUAAyEGAATO7nwaAAORaU_lARiYUfa4-Ql7aimRSPI5FiwAAv4cAALG7oBWmnWGZsd6drE2BA"
    """
    if not telegram_file_id:
        return None
    
    # Validate that it looks like a Telegram file_id (starts with common prefixes)
    if not any(telegram_file_id.startswith(prefix) for prefix in ['AgAC', 'BQAC', 'BAAC', 'CgAC', 'AwAC']):
        logger.warning(f"Unusual file_id format: {telegram_file_id[:20]}...")
    
    # Build the proxy path
    proxy_path = f"/api/media/telegram-proxy/{media_type}/{telegram_file_id}"
    
    # Get backend URL from environment
    backend_url = get_backend_url()
    
    # If BACKEND_URL is set and not localhost, use absolute URL for cross-origin scenarios
    # This is critical for production where frontend (Vercel) and backend (Render) are on different domains
    if backend_url and "localhost" not in backend_url and "127.0.0.1" not in backend_url:
        absolute_url = f"{backend_url}{proxy_path}"
        logger.debug(f"Generated absolute proxy URL: {absolute_url[:100]}...")
        return absolute_url
    
    # For local development, use relative URL (same-origin)
    return proxy_path

def telegram_url_to_proxy(telegram_url: Optional[str]) -> Optional[str]:
    """
    Convert a direct Telegram Bot API URL to a proxied URL
    
    Args:
        telegram_url: Direct Telegram URL like 
                     https://api.telegram.org/file/bot<TOKEN>/<file_path>
    
    Returns:
        Proxied URL like /api/media/proxy?url=<encoded_url> (relative)
        OR https://backend.com/api/media/proxy?url=<encoded_url> (absolute if BACKEND_URL set)
        or None if input is None/invalid
    
    Examples:
        Input:  https://api.telegram.org/file/bot123:ABC/videos/file_162.mp4
        Output: /api/media/proxy?url=https%3A%2F%2Fapi.telegram.org%2Ffile%2Fbot123%3AABC%2Fvideos%2Ffile_162.mp4
    """
    if not telegram_url:
        return None
    
    # Check if it's a Telegram Bot API URL
    if not telegram_url.startswith("https://api.telegram.org/file/bot"):
        # Not a Telegram URL, return as is
        return telegram_url
    
    # URL encode the Telegram URL
    from urllib.parse import quote
    encoded_url = quote(telegram_url, safe='')
    
    # Build the proxy path
    proxy_path = f"/api/media/proxy?url={encoded_url}"
    
    # Get backend URL from environment
    backend_url = get_backend_url()
    
    # If BACKEND_URL is set and not localhost, use absolute URL for cross-origin scenarios
    if backend_url and "localhost" not in backend_url and "127.0.0.1" not in backend_url:
        absolute_url = f"{backend_url}{proxy_path}"
        logger.info(f"Converted Telegram URL to absolute proxy: {telegram_url[:50]}... -> {absolute_url[:80]}...")
        return absolute_url
    
    # For local development, use relative URL
    logger.info(f"Converted Telegram URL to relative proxy: {telegram_url[:50]}... -> {proxy_path[:80]}...")
    return proxy_path

def extract_file_path_from_telegram_url(telegram_url: Optional[str]) -> Optional[str]:
    """
    Extract file path from Telegram URL for direct file_id based proxy
    
    Args:
        telegram_url: https://api.telegram.org/file/bot<TOKEN>/<file_path>
    
    Returns:
        Just the file_path portion (e.g., "videos/file_162.mp4")
        or None if not a valid Telegram URL
    """
    if not telegram_url:
        return None
    
    # Pattern to match Telegram Bot API file URLs
    pattern = r'https://api\.telegram\.org/file/bot[^/]+/(.+)'
    match = re.match(pattern, telegram_url)
    
    if match:
        return match.group(1)
    
    return None

def batch_convert_telegram_urls(data: dict, keys: list[str] = None) -> dict:
    """
    Convert multiple Telegram URLs in a dictionary to proxy URLs
    
    Args:
        data: Dictionary containing URLs
        keys: List of keys to check for URLs (default: common keys like 'url', 'video_url', etc.)
    
    Returns:
        Dictionary with converted URLs
    """
    if keys is None:
        keys = ['url', 'video_url', 'cdn_url', 'original_url', 'thumbnail_url', 'preview_url']
    
    converted_data = data.copy()
    
    for key in keys:
        if key in converted_data and isinstance(converted_data[key], str):
            proxied_url = telegram_url_to_proxy(converted_data[key])
            if proxied_url != converted_data[key]:  # Only log if changed
                logger.debug(f"Converted {key}: {converted_data[key][:50]}... -> {proxied_url[:50]}...")
            converted_data[key] = proxied_url
    
    return converted_data
