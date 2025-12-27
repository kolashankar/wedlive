"""
File ID Validation Utilities
Validates Telegram file_ids to prevent placeholder/invalid IDs from being stored
"""
import logging
import re

logger = logging.getLogger(__name__)

# Minimum length for valid Telegram file_ids (typically 50+ characters)
MIN_TELEGRAM_FILE_ID_LENGTH = 20

# Known valid Telegram file_id prefixes
VALID_TELEGRAM_PREFIXES = [
    'AgAC',  # Photo files
    'BQAc',  # Document files
    'BAAC',  # Audio files
    'CgAC',  # Video files
    'AwAC',  # Sticker files
]

def is_placeholder_file_id(file_id: str) -> bool:
    """
    Check if a file_id is a placeholder (invalid temporary reference)
    
    Placeholders typically look like: file_84, file_87, file_123.jpg
    These are NOT valid Telegram file_ids and should never be stored.
    
    Args:
        file_id: The file_id to check
        
    Returns:
        True if it's a placeholder, False otherwise
    """
    if not file_id:
        return True
    
    # Remove common image extensions for checking
    clean_id = file_id.replace('.jpg', '').replace('.jpeg', '').replace('.png', '').replace('.webp', '')
    
    # Check for "file_XXX" pattern where XXX is a number
    if clean_id.startswith("file_") and clean_id.replace("file_", "").isdigit():
        logger.warning(f"[FILE_ID_VALIDATOR] Detected placeholder file_id: {file_id}")
        return True
    
    return False

def is_valid_telegram_file_id(file_id: str, strict: bool = False) -> bool:
    """
    Validate if a file_id is a legitimate Telegram file_id
    
    Args:
        file_id: The file_id to validate
        strict: If True, enforce prefix matching
        
    Returns:
        True if valid, False otherwise
    """
    if not file_id:
        logger.warning("[FILE_ID_VALIDATOR] Empty file_id provided")
        return False
    
    # Check for placeholder pattern first
    if is_placeholder_file_id(file_id):
        return False
    
    # Check minimum length
    if len(file_id) < MIN_TELEGRAM_FILE_ID_LENGTH:
        logger.warning(f"[FILE_ID_VALIDATOR] file_id too short: {file_id} (length: {len(file_id)})")
        return False
    
    # In strict mode, check for known Telegram prefixes
    if strict:
        has_valid_prefix = any(file_id.startswith(prefix) for prefix in VALID_TELEGRAM_PREFIXES)
        if not has_valid_prefix:
            logger.warning(f"[FILE_ID_VALIDATOR] file_id doesn't match known Telegram patterns: {file_id[:20]}...")
            return False
    
    # Telegram file_ids are base64-like strings (alphanumeric + _-)
    if not re.match(r'^[A-Za-z0-9_-]+$', file_id):
        logger.warning(f"[FILE_ID_VALIDATOR] file_id contains invalid characters: {file_id[:20]}...")
        return False
    
    return True

def validate_and_log_file_id(file_id: str, context: str = "") -> tuple[bool, str]:
    """
    Validate file_id and return detailed error message if invalid
    
    Args:
        file_id: The file_id to validate
        context: Context info for logging (e.g., "media upload", "layout photo")
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    context_prefix = f"[{context}] " if context else ""
    
    if not file_id:
        error = f"{context_prefix}Empty or null file_id provided"
        logger.error(f"[FILE_ID_VALIDATOR] {error}")
        return False, error
    
    if is_placeholder_file_id(file_id):
        error = f"{context_prefix}Placeholder file_id detected: {file_id}. This is not a valid Telegram file_id."
        logger.error(f"[FILE_ID_VALIDATOR] {error}")
        return False, error
    
    if len(file_id) < MIN_TELEGRAM_FILE_ID_LENGTH:
        error = f"{context_prefix}file_id too short ({len(file_id)} chars): {file_id}. Valid Telegram file_ids are typically 50+ characters."
        logger.error(f"[FILE_ID_VALIDATOR] {error}")
        return False, error
    
    if not re.match(r'^[A-Za-z0-9_-]+$', file_id):
        error = f"{context_prefix}file_id contains invalid characters: {file_id[:30]}..."
        logger.error(f"[FILE_ID_VALIDATOR] {error}")
        return False, error
    
    logger.info(f"[FILE_ID_VALIDATOR] {context_prefix}Valid file_id: {file_id[:30]}... (length: {len(file_id)})")
    return True, ""

def clean_file_id_from_response(data: dict) -> dict:
    """
    Remove invalid file_ids from response data
    Used to clean up API responses before sending to frontend
    
    Args:
        data: Dictionary that may contain file_id fields
        
    Returns:
        Cleaned dictionary with invalid file_ids removed/marked
    """
    if not isinstance(data, dict):
        return data
    
    cleaned_data = data.copy()
    
    # Check top-level file_id
    if 'file_id' in cleaned_data:
        file_id = cleaned_data['file_id']
        if not is_valid_telegram_file_id(file_id):
            logger.warning(f"[FILE_ID_VALIDATOR] Removing invalid file_id from response: {file_id}")
            cleaned_data['file_id'] = None
            cleaned_data['_invalid_file_id'] = file_id
            cleaned_data['_error'] = "Invalid or placeholder file_id"
    
    # Check nested photo objects
    for key in ['bridePhoto', 'groomPhoto', 'couplePhoto', 'studioImage']:
        if key in cleaned_data and isinstance(cleaned_data[key], dict):
            photo = cleaned_data[key]
            if 'file_id' in photo and not is_valid_telegram_file_id(photo['file_id']):
                logger.warning(f"[FILE_ID_VALIDATOR] Removing invalid file_id from {key}: {photo['file_id']}")
                photo['file_id'] = None
                photo['_invalid_file_id'] = photo.get('file_id')
                photo['_error'] = "Invalid or placeholder file_id"
    
    # Check photo arrays
    for key in ['preciousMoments', 'coverPhotos']:
        if key in cleaned_data and isinstance(cleaned_data[key], list):
            for photo in cleaned_data[key]:
                if isinstance(photo, dict) and 'file_id' in photo:
                    if not is_valid_telegram_file_id(photo['file_id']):
                        logger.warning(f"[FILE_ID_VALIDATOR] Removing invalid file_id from {key} array: {photo['file_id']}")
                        photo['file_id'] = None
                        photo['_invalid_file_id'] = photo.get('file_id')
                        photo['_error'] = "Invalid or placeholder file_id"
    
    return cleaned_data
