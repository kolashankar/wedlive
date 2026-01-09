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
    "Access-Control-Expose-Headers": "*",
    "X-Content-Type-Options": "nosniff"
}

@router.options("/proxy")
@router.options("/telegram-proxy/{file_path:path}")
async def media_proxy_options(file_path: str = None):
    """Handle CORS preflight for all media proxy endpoints"""
    return Response(
        content=None,
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Expose-Headers": "*",
            "Access-Control-Max-Age": "86400"
        }
    )

@router.head("/proxy")
@router.get("/proxy")
async def media_proxy(url: str = None, request: Request = None):
    """
    Generic media proxy endpoint to handle external URLs (images and videos)
    Supports Range requests for video streaming
    Used to proxy media from Telegram and other external sources
    """
    try:
        if not url:
            raise HTTPException(
                status_code=400,
                detail="URL parameter is required"
            )
        
        logger.info(f"Proxy request for URL: {url[:100]}...")
        
        # Validate URL format
        if not (url.startswith("http://") or url.startswith("https://")):
            raise HTTPException(
                status_code=400,
                detail="Invalid URL format"
            )
        
        # Check for Range header for video streaming
        range_header = request.headers.get("Range") if request else None
        
        # Build request headers
        request_headers = {
            'User-Agent': 'WedLive-Media-Proxy/1.0',
        }
        if range_header:
            request_headers['Range'] = range_header
            logger.info(f"Range request: {range_header}")
        
        # Handle HEAD request
        if request and request.method == "HEAD":
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.head(url, headers=request_headers)
                
                if response.status_code == 200:
                    return Response(
                        content=None,
                        media_type=response.headers.get("content-type", "application/octet-stream"),
                        headers={
                            "Content-Length": response.headers.get("content-length", "0"),
                            "Accept-Ranges": "bytes",
                            **MEDIA_RESPONSE_HEADERS
                        }
                    )
                else:
                    raise HTTPException(status_code=response.status_code, detail="Failed to fetch media")
        
        # Stream the file from the external URL
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            response = await client.get(url, headers=request_headers)
            
            if response.status_code in [200, 206]:  # OK or Partial Content
                # Get content type from response headers
                content_type = response.headers.get("content-type", "application/octet-stream")
                content_length = response.headers.get("content-length")
                
                # Prepare response headers with CORS
                response_headers = {
                    **MEDIA_RESPONSE_HEADERS,
                    "Accept-Ranges": "bytes",
                }
                
                # For videos, add streaming-friendly headers
                if content_type.startswith("video/"):
                    response_headers["Cache-Control"] = "public, max-age=31536000"  # 1 year for videos
                else:
                    response_headers["Cache-Control"] = "public, max-age=3600"  # 1 hour for images
                
                # Add content-length if available
                if content_length:
                    response_headers["Content-Length"] = content_length
                
                # Handle range responses
                if response.status_code == 206:
                    content_range = response.headers.get("content-range")
                    if content_range:
                        response_headers["Content-Range"] = content_range
                    logger.info(f"Returning partial content: {content_range}")
                else:
                    logger.info(f"Successfully proxied media, size: {len(response.content)} bytes, type: {content_type}")
                
                return Response(
                    content=response.content,
                    status_code=response.status_code,
                    media_type=content_type,
                    headers=response_headers
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
    - With videos/ prefix: videos/BAACAgUAAyEGAATO7nwaAAPHaVoRGteCoQdEz...
    """
    try:
        method = request.method
        logger.info(f"{method} proxy request for file_path: {file_path}")
        
        # Extract the actual file_id from the path
        # Handle "photos/file_id", "videos/file_id", "documents/file_id" formats by removing prefix
        if file_path.startswith('photos/'):
            file_id = file_path.replace('photos/', '', 1)
        elif file_path.startswith('videos/'):
            file_id = file_path.replace('videos/', '', 1)
        elif file_path.startswith('documents/'):
            file_id = file_path.replace('documents/', '', 1)
        else:
            file_id = file_path
        
        # Remove file extension if present (e.g., .jpg, .png, .mp4)
        if '.' in file_id and not file_id.count('.') > 2:  # Telegram file_ids may contain dots
            # Only remove extension if it's at the end
            possible_ext = file_id.split('.')[-1].lower()
            if possible_ext in ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'webm']:
                file_id = file_id.rsplit('.', 1)[0]
        
        logger.info(f"Extracted file_id: {file_id}")
        
        # Validate basic file_id format
        if not file_id or len(file_id) < 10:
            logger.error(f"Invalid file_id format (too short): {file_id}")
            raise HTTPException(status_code=400, detail="Invalid file ID format - ID too short")
        
        # Check if this is a temporary/invalid file reference (file_XX format)
        # These are NOT valid Telegram file_ids and indicate placeholder/template images
        if file_id.startswith("file_") and file_id.replace("file_", "").replace(".jpg", "").replace(".png", "").replace(".mp4", "").isdigit():
            logger.error(f"Invalid temporary file reference: {file_id}. This is a placeholder, not a valid Telegram file_id.")
            
            # Return a proper 404 with clear error message
            raise HTTPException(
                status_code=404, 
                detail={
                    "error": "placeholder_file",
                    "message": f"The file reference '{file_id}' is a placeholder. Please upload actual media.",
                    "file_id": file_id,
                    "action": "re_upload_required"
                }
            )
        
        # Validate Telegram file_id format (should start with alphanumeric and contain certain patterns)
        # Telegram file_ids are typically base64-like strings with specific prefixes
        # AgAC = photos, BQAC/BAAC = documents/videos, CgAC = animations/GIFs
        if not any(file_id.startswith(prefix) for prefix in ['AgAC', 'BQAC', 'BAAC', 'CgAC', 'AwAC']):
            logger.warning(f"Unusual file_id format (doesn't match Telegram patterns): {file_id}. Attempting anyway...")
        
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
                    # Determine content type
                    content_type = response.headers.get("content-type", "application/octet-stream")
                    if 'videos' in file_path or '.mp4' in file_url.lower():
                        content_type = 'video/mp4'
                    elif '.png' in file_url.lower():
                        content_type = 'image/png'
                    
                    return Response(
                        content=None,
                        media_type=content_type,
                        headers={
                            "Content-Length": response.headers.get("content-length", "0"),
                            "Accept-Ranges": "bytes",
                            **MEDIA_RESPONSE_HEADERS
                        }
                    )
                else:
                    raise HTTPException(status_code=response.status_code, detail="File not found")
        
        # Handle GET request - stream the file
        max_retries = 2
        last_exception = None
        
        # Check for Range header for video streaming
        range_header = request.headers.get("Range") if request else None
        
        for attempt in range(max_retries):
            try:
                # Build request headers for Telegram
                request_headers = {
                    'User-Agent': 'WedLive-Media-Proxy/1.0',
                }
                
                # If client requested a Range, pass it to Telegram
                if range_header:
                    request_headers['Range'] = range_header
                    logger.info(f"Range request for {file_id}: {range_header}")
                
                async with httpx.AsyncClient(
                    timeout=60.0,  # Increased timeout for videos
                    follow_redirects=True,
                    headers=request_headers
                ) as client:
                    logger.info(f"Proxy attempt {attempt + 1}/{max_retries} for file_id: {file_id}")
                    
                    # Fetch the file content
                    response = await client.get(file_url)
                    
                    if response.status_code not in [200, 206]:  # OK or Partial Content
                        raise httpx.HTTPStatusError(f"HTTP {response.status_code}: {response.reason_phrase}", request=None, response=response)
                    
                    # Get content type and length
                    content_type = response.headers.get('content-type', 'application/octet-stream')
                    content_length = len(response.content)
                    
                    # Validate and fix content type
                    if content_type == 'application/octet-stream':
                        # Try to guess from file URL or default based on media type
                        if 'videos' in file_path or '.mp4' in file_url.lower():
                            content_type = 'video/mp4'
                        elif '.mov' in file_url.lower():
                            content_type = 'video/quicktime'
                        elif '.webm' in file_url.lower():
                            content_type = 'video/webm'
                        elif '.png' in file_url.lower():
                            content_type = 'image/png'
                        elif '.webp' in file_url.lower():
                            content_type = 'image/webp'
                        elif '.gif' in file_url.lower():
                            content_type = 'image/gif'
                        else:
                            content_type = 'image/jpeg'  # Default for photos
                        logger.info(f"Overriding content-type from octet-stream to {content_type}")
                    
                    # Build response headers with CORS
                    response_headers = {
                        "Content-Length": str(content_length),
                        **MEDIA_RESPONSE_HEADERS
                    }
                    
                    # Add Accept-Ranges for video streaming
                    if content_type.startswith('video/'):
                        response_headers["Accept-Ranges"] = "bytes"
                        # Add Content-Range if this was a range request
                        if response.status_code == 206:
                            content_range = response.headers.get("content-range")
                            if content_range:
                                response_headers["Content-Range"] = content_range
                                logger.info(f"Returning partial content for video: {content_range}")
                    
                    logger.info(f"Streaming file: {file_id}, size: {content_length}, type: {content_type}, status: {response.status_code}")
                    
                    # Return buffered response with CORS headers
                    return Response(
                        content=response.content,
                        status_code=response.status_code,
                        media_type=content_type,
                        headers=response_headers
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
