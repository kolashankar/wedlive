from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response, StreamingResponse
import httpx
import os
import logging
import asyncio
from typing import Optional
from app.services.telegram_service import TelegramCDNService

logger = logging.getLogger(__name__)
router = APIRouter()
telegram_service = TelegramCDNService()

# Response headers for media files
MEDIA_RESPONSE_HEADERS = {
    "Cache-Control": "public, max-age=86400",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "X-Content-Type-Options": "nosniff"
}

@router.get("/media/proxy")
async def media_proxy(url: str = None):
    """
    Generic media proxy endpoint to handle external URLs
    Used to proxy images and other media from external sources
    """
    try:
        if not url:
            raise HTTPException(
                status_code=400,
                detail="URL parameter is required"
            )
        
        logger.info(f"Proxy request for URL: {url}")
        
        # Validate URL format
        if not (url.startswith("http://") or url.startswith("https://")):
            raise HTTPException(
                status_code=400,
                detail="Invalid URL format"
            )
        
        # Stream the file from the external URL
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url)
            
            if response.status_code == 200:
                # Get content type from response headers
                content_type = response.headers.get("content-type", "application/octet-stream")
                
                logger.info(f"Successfully proxied media, size: {len(response.content)} bytes")
                
                return Response(
                    content=response.content,
                    media_type=content_type,
                    headers={
                        "Cache-Control": "public, max-age=3600",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, OPTIONS",
                        "Access-Control-Allow-Headers": "*"
                    }
                )
            else:
                logger.error(f"Failed to fetch media from URL: {response.status_code}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to fetch media from external URL"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in media proxy: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.head("/telegram-proxy/{file_path:path}")
@router.get("/telegram-proxy/{file_path:path}")
async def telegram_proxy(file_path: str, request: Request):
    """
    Proxy endpoint for Telegram files to avoid CORS issues
    Handles both direct file_ids and file paths (e.g., photos/AgACAgUAAyEGAATO7...)
    
    Expected formats:
    - Direct Telegram file_id: AgACAgUAAyEGAATO7nwaAAMhaTrImX_enn...
    - With photos/ prefix: photos/AgACAgUAAyEGAATO7nwaAAMhaTrImX_enn...
    """
    try:
        method = request.method
        logger.info(f"{method} proxy request for file_path: {file_path}")
        
        # Extract the actual file_id from the path
        # Handle "photos/file_id" format by removing prefix
        if file_path.startswith('photos/'):
            file_id = file_path.replace('photos/', '', 1)
        else:
            file_id = file_path
        
        # Remove file extension if present (e.g., .jpg, .png)
        if '.' in file_id and not file_id.count('.') > 2:  # Telegram file_ids may contain dots
            # Only remove extension if it's at the end
            possible_ext = file_id.split('.')[-1].lower()
            if possible_ext in ['jpg', 'jpeg', 'png', 'webp', 'gif']:
                file_id = file_id.rsplit('.', 1)[0]
        
        logger.info(f"Extracted file_id: {file_id}")
        
        # Validate basic file_id format
        if not file_id or len(file_id) < 10:
            logger.error(f"Invalid file_id format (too short): {file_id}")
            raise HTTPException(status_code=400, detail="Invalid file ID format - ID too short")
        
        # Check if this is a temporary/invalid file reference (file_XX format)
        # These are NOT valid Telegram file_ids and indicate placeholder/template images
        if file_id.startswith("file_") and file_id.replace("file_", "").replace(".jpg", "").replace(".png", "").isdigit():
            logger.error(f"Invalid temporary file reference: {file_id}. This is a placeholder, not a valid Telegram file_id.")
            
            # Return a proper 404 with clear error message
            # This prevents retries and shows proper error on frontend
            raise HTTPException(
                status_code=404, 
                detail={
                    "error": "placeholder_image",
                    "message": f"The image reference '{file_id}' is a placeholder. Please upload actual photos.",
                    "file_id": file_id,
                    "action": "re_upload_required"
                }
            )
        
        # Validate Telegram file_id format (should start with alphanumeric and contain certain patterns)
        # Telegram file_ids are typically base64-like strings with specific prefixes
        if not any(file_id.startswith(prefix) for prefix in ['AgAC', 'BQAc', 'BAAC', 'CgAC']):
            logger.warning(f"Unusual file_id format (doesn't match Telegram patterns): {file_id}. Attempting anyway...")
        
        # Optional: Check if file_id exists in database for better logging
        try:
            from app.database import get_db
            db = get_db()
            
            media_record = await db.media.find_one({"file_id": file_id})
            if media_record:
                logger.info(f"Verified file_id {file_id} exists in database for wedding {media_record.get('wedding_id')}")
            else:
                logger.warning(f"File_id {file_id} not found in database, but will attempt to proxy from Telegram")
        except Exception as e:
            logger.error(f"Error checking database for file_id {file_id}: {str(e)}")
            # Continue anyway - file might still be valid on Telegram
        
        # Get the actual file URL from Telegram using getFile API
        logger.info(f"Calling telegram_service.get_file_url for file_id: {file_id}")
        try:
            file_url = await telegram_service.get_file_url(file_id)
            if not file_url:
                logger.error(f"telegram_service.get_file_url returned None for file_id: {file_id}")
                raise HTTPException(
                    status_code=404, 
                    detail="File not found on Telegram. The file may have been deleted or the file_id is invalid."
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Exception in telegram_service.get_file_url: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=502, 
                detail=f"Failed to get file URL from Telegram: {str(e)}"
            )
        
        logger.info(f"Got file URL from Telegram: {file_url}")
        
        # Handle HEAD request - just get headers
        if method == "HEAD":
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.head(file_url)
                
                if response.status_code == 200:
                    return Response(
                        content=None,
                        media_type=response.headers.get("content-type", "image/jpeg"),
                        headers={
                            "Content-Length": response.headers.get("content-length", "0"),
                            **MEDIA_RESPONSE_HEADERS
                        }
                    )
                else:
                    raise HTTPException(status_code=response.status_code, detail="File not found")
        
        # Handle GET request - stream the file
        max_retries = 2
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(
                    timeout=30.0,
                    follow_redirects=True,
                    headers={
                        'User-Agent': 'WedLive-Media-Proxy/1.0',
                        'Accept': 'image/*'
                    }
                ) as client:
                    logger.info(f"Proxy attempt {attempt + 1}/{max_retries} for file_id: {file_id}")
                    
                    # Use streaming for large files
                    async with client.stream('GET', file_url) as response:
                        if response.status_code != 200:
                            raise httpx.HTTPStatusError(f"HTTP {response.status_code}: {response.reason}")
                        
                        # Get content type and length
                        content_type = response.headers.get('content-type', 'image/jpeg')
                        content_length = response.headers.get('content-length', '0')
                        
                        # Validate content type
                        # Note: Telegram sometimes returns 'application/octet-stream' for images
                        # We allow this and default to 'image/jpeg' for such cases
                        if not content_type.startswith('image/') and content_type != 'application/octet-stream':
                            raise ValueError(f"Invalid content type: {content_type}")
                        
                        # Override content-type if it's octet-stream (Telegram quirk)
                        if content_type == 'application/octet-stream':
                            # Try to guess from file path or default to jpeg
                            if '.png' in file_url.lower():
                                content_type = 'image/png'
                            elif '.webp' in file_url.lower():
                                content_type = 'image/webp'
                            elif '.gif' in file_url.lower():
                                content_type = 'image/gif'
                            else:
                                content_type = 'image/jpeg'  # Default to JPEG
                            logger.info(f"Overriding content-type from octet-stream to {content_type}")
                        
                        logger.info(f"Streaming file: {file_id}, size: {content_length}, type: {content_type}")
                        
                        # Create streaming response
                        return StreamingResponse(
                            content=response.aiter_bytes(),
                            status_code=200,
                            media_type=content_type,
                            headers={
                                "Content-Length": content_length,
                                **MEDIA_RESPONSE_HEADERS
                            }
                        )
                        
            except httpx.TimeoutException as e:
                last_exception = e
                logger.warning(f"Timeout on attempt {attempt + 1} for {file_id}: {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    continue
                
            except httpx.NetworkError as e:
                last_exception = e
                logger.warning(f"Network error on attempt {attempt + 1} for {file_id}: {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                    
            except httpx.HTTPStatusError as e:
                last_exception = e
                logger.error(f"HTTP error on attempt {attempt + 1} for {file_id}: {str(e)}")
                if e.response.status_code in [404, 410]:  # Not found or gone
                    break  # Don't retry for client errors
                elif attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                    
            except Exception as e:
                last_exception = e
                logger.error(f"Unexpected error on attempt {attempt + 1} for {file_id}: {str(e)}", exc_info=True)
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
        
        # All retries failed
        logger.error(f"All proxy attempts failed for file_id: {file_id}")
        if last_exception:
            if isinstance(last_exception, (httpx.TimeoutException, httpx.NetworkError)):
                raise HTTPException(status_code=504, detail="Gateway timeout after retries")
            elif isinstance(last_exception, httpx.HTTPStatusError):
                raise HTTPException(
                    status_code=last_exception.response.status_code,
                    detail=f"Upstream error: {last_exception.response.reason}"
                )
            else:
                raise HTTPException(status_code=502, detail="Internal proxy error")
        else:
            raise HTTPException(status_code=500, detail="Unknown proxy error")
    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except Exception as e:
        # Handle any unexpected errors at the top level
        logger.error(f"Unexpected error in telegram_proxy: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.options("/api/media/telegram-proxy/photos/{file_path:path}")
async def telegram_proxy_options(file_path: str):
    """Handle CORS preflight requests"""
    return Response(
        content=None,
        status_code=200,
        headers={**MEDIA_RESPONSE_HEADERS}
    )
