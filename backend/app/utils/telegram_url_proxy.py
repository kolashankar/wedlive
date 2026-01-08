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

def telegram_url_to_proxy(telegram_url: Optional[str]) -> Optional[str]:
    """
    Convert a direct Telegram Bot API URL to a proxied URL
    
    Args:
        telegram_url: Direct Telegram URL like 
                     https://api.telegram.org/file/bot<TOKEN>/<file_path>
    
    Returns:
        Proxied URL like /api/media/proxy?url=<encoded_url>
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
    
    # Return proxy URL using the generic media proxy endpoint
    # This endpoint handles CORS and streams the file from Telegram
    proxy_url = f"/api/media/proxy?url={encoded_url}"
    
    logger.info(f"Converted Telegram URL to proxy: {telegram_url[:50]}... -> {proxy_url[:80]}...")
    
    return proxy_url

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
