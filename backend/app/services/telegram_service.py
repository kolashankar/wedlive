"""
Telegram CDN Service for media storage
Handles photo/video uploads to Telegram channels
"""
import os
import httpx
import aiofiles
from typing import Optional, Dict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class TelegramCDNService:
    def __init__(self):
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.channel_id = os.getenv("TELEGRAM_CHANNEL_ID")
        self.log_channel = os.getenv("TELEGRAM_LOG_CHANNEL")
        self.api_base = f"https://api.telegram.org/bot{self.bot_token}"
        
    async def upload_photo(self, file_path: str, caption: str = "", wedding_id: str = "") -> Dict:
        """
        Upload photo to Telegram channel
        Returns: dict with file_id, file_url, and telegram_message_id
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Read file
                async with aiofiles.open(file_path, 'rb') as f:
                    file_data = await f.read()
                
                # Determine file extension and MIME type to preserve transparency
                file_ext = os.path.splitext(file_path)[1].lower()
                mime_type = 'image/jpeg'  # default
                if file_ext in ['.png']:
                    mime_type = 'image/png'
                elif file_ext in ['.webp']:
                    mime_type = 'image/webp'
                
                # Upload to channel with correct MIME type
                files = {'photo': (f'photo{file_ext}', file_data, mime_type)}
                data = {
                    'chat_id': self.channel_id,
                    'caption': f"{caption}\n\nWedding ID: {wedding_id}\nUploaded: {datetime.utcnow().isoformat()}"
                }
                
                response = await client.post(
                    f"{self.api_base}/sendPhoto",
                    files=files,
                    data=data
                )
                
                result = response.json()
                
                if result.get("ok"):
                    message = result["result"]
                    
                    # Check if photo exists and has expected structure
                    if "photo" not in message or not message["photo"]:
                        logger.error(f"No photo in Telegram response: {message}")
                        return {"success": False, "error": "No photo in response"}
                    
                    photo = message["photo"][-1]  # Get largest photo
                    
                    # Check if file_id exists
                    if "file_id" not in photo:
                        logger.error(f"No file_id in photo response: {photo}")
                        return {"success": False, "error": "No file_id in photo response"}
                    
                    file_id = photo["file_id"]
                    
                    # Get CDN URL for the uploaded file
                    cdn_url = await self.get_file_url(file_id)
                    
                    return {
                        "success": True,
                        "file_id": file_id,
                        "cdn_url": cdn_url,
                        "file_unique_id": photo.get("file_unique_id", ""),
                        "message_id": message.get("message_id", 0),
                        "file_size": photo.get("file_size", 0),
                        "width": photo.get("width", 0),
                        "height": photo.get("height", 0),
                        "uploaded_at": datetime.utcnow().isoformat()
                    }
                else:
                    logger.error(f"Telegram upload failed: {result}")
                    return {"success": False, "error": result.get("description", "Unknown error")}
                    
        except Exception as e:
            logger.error(f"Error uploading to Telegram: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def upload_document(self, file_path: str, caption: str = "", wedding_id: str = "") -> Dict:
        """
        Upload file as document to Telegram channel (preserves PNG transparency)
        This method MUST be used for transparent PNG images as sendPhoto compresses and strips alpha channel
        Returns: dict with file_id, file_url, and telegram_message_id
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Read file
                async with aiofiles.open(file_path, 'rb') as f:
                    file_data = await f.read()
                
                # Determine file extension and MIME type
                file_ext = os.path.splitext(file_path)[1].lower()
                filename = os.path.basename(file_path)
                
                mime_type = 'image/png'  # default for transparency
                if file_ext in ['.png']:
                    mime_type = 'image/png'
                elif file_ext in ['.jpg', '.jpeg']:
                    mime_type = 'image/jpeg'
                elif file_ext in ['.webp']:
                    mime_type = 'image/webp'
                
                # Upload as DOCUMENT to preserve transparency and original quality
                files = {'document': (filename, file_data, mime_type)}
                data = {
                    'chat_id': self.channel_id,
                    'caption': f"{caption}\n\nWedding ID: {wedding_id}\nUploaded: {datetime.utcnow().isoformat()}"
                }
                
                logger.info(f"[TELEGRAM] Uploading as DOCUMENT (preserves transparency): {filename}")
                
                response = await client.post(
                    f"{self.api_base}/sendDocument",
                    files=files,
                    data=data
                )
                
                result = response.json()
                
                if result.get("ok"):
                    message = result["result"]
                    
                    # Check if document exists
                    if "document" not in message:
                        logger.error(f"No document in Telegram response: {message}")
                        return {"success": False, "error": "No document in response"}
                    
                    document = message["document"]
                    
                    # Check if file_id exists
                    if "file_id" not in document:
                        logger.error(f"No file_id in document response: {document}")
                        return {"success": False, "error": "No file_id in document response"}
                    
                    file_id = document["file_id"]
                    
                    # Get CDN URL for the uploaded file
                    cdn_url = await self.get_file_url(file_id)
                    
                    logger.info(f"[TELEGRAM] Document uploaded successfully with transparency preserved")
                    
                    return {
                        "success": True,
                        "file_id": file_id,
                        "cdn_url": cdn_url,
                        "file_unique_id": document.get("file_unique_id", ""),
                        "message_id": message.get("message_id", 0),
                        "file_size": document.get("file_size", 0),
                        "uploaded_at": datetime.utcnow().isoformat()
                    }
                else:
                    logger.error(f"Telegram document upload failed: {result}")
                    return {"success": False, "error": result.get("description", "Unknown error")}
                    
        except Exception as e:
            logger.error(f"Error uploading document to Telegram: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def upload_video(self, file_path: str, caption: str = "", wedding_id: str = "", thumb_path: Optional[str] = None) -> Dict:
        """
        Upload video to Telegram channel
        Returns: dict with file_id, file_url, and telegram_message_id
        """
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                # Read file
                async with aiofiles.open(file_path, 'rb') as f:
                    file_data = await f.read()
                
                files = {'video': ('video.mp4', file_data, 'video/mp4')}
                data = {
                    'chat_id': self.channel_id,
                    'caption': f"{caption}\n\nWedding ID: {wedding_id}\nUploaded: {datetime.utcnow().isoformat()}",
                    'supports_streaming': True
                }
                
                # Add thumbnail if provided
                if thumb_path:
                    async with aiofiles.open(thumb_path, 'rb') as tf:
                        thumb_data = await tf.read()
                        files['thumb'] = ('thumb.jpg', thumb_data, 'image/jpeg')
                
                response = await client.post(
                    f"{self.api_base}/sendVideo",
                    files=files,
                    data=data
                )
                
                result = response.json()
                
                if result.get("ok"):
                    message = result["result"]
                    video = message["video"]
                    file_id = video["file_id"]
                    
                    # Get CDN URL for the uploaded file
                    cdn_url = await self.get_file_url(file_id)
                    
                    return {
                        "success": True,
                        "file_id": file_id,
                        "cdn_url": cdn_url,
                        "file_unique_id": video["file_unique_id"],
                        "message_id": message["message_id"],
                        "file_size": video.get("file_size", 0),
                        "duration": video.get("duration", 0),
                        "width": video.get("width", 0),
                        "height": video.get("height", 0),
                        "uploaded_at": datetime.utcnow().isoformat()
                    }
                else:
                    logger.error(f"Telegram video upload failed: {result}")
                    return {"success": False, "error": result.get("description", "Unknown error")}
                    
        except Exception as e:
            logger.error(f"Error uploading video to Telegram: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_file_url(self, file_id: str) -> Optional[str]:
        """
        Get direct download URL for a file
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.api_base}/getFile?file_id={file_id}")
                result = response.json()
                
                if result.get("ok"):
                    file_path = result["result"]["file_path"]
                    return f"https://api.telegram.org/file/bot{self.bot_token}/{file_path}"
                else:
                    logger.error(f"Failed to get file URL: {result}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting file URL: {str(e)}")
            return None
    
    async def delete_message(self, message_id: int) -> bool:
        """
        Delete a message from Telegram channel
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/deleteMessage",
                    json={
                        "chat_id": self.channel_id,
                        "message_id": message_id
                    }
                )
                result = response.json()
                return result.get("ok", False)
                
        except Exception as e:
            logger.error(f"Error deleting message: {str(e)}")
            return False
    
    async def upload_audio(self, file_path: str, filename: str = None, caption: str = "") -> Dict:
        """
        Upload audio file to Telegram channel
        Returns: dict with file_id, file_url, and telegram_message_id
        """
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                # Read file
                async with aiofiles.open(file_path, 'rb') as f:
                    file_data = await f.read()
                
                # Determine file extension and MIME type
                file_ext = os.path.splitext(file_path)[1].lower()
                if not filename:
                    filename = os.path.basename(file_path)
                
                # Map MIME types
                mime_type_map = {
                    '.mp3': 'audio/mpeg',
                    '.wav': 'audio/wav',
                    '.aac': 'audio/aac',
                    '.ogg': 'audio/ogg',
                    '.m4a': 'audio/mp4'
                }
                mime_type = mime_type_map.get(file_ext, 'audio/mpeg')
                
                # Upload as AUDIO
                files = {'audio': (filename, file_data, mime_type)}
                data = {
                    'chat_id': self.channel_id,
                    'caption': f"{caption}\nUploaded: {datetime.utcnow().isoformat()}"
                }
                
                logger.info(f"[TELEGRAM] Uploading audio: {filename}")
                
                response = await client.post(
                    f"{self.api_base}/sendAudio",
                    files=files,
                    data=data
                )
                
                result = response.json()
                
                if result.get("ok"):
                    message = result["result"]
                    
                    # Check if audio exists
                    if "audio" not in message:
                        logger.error(f"No audio in Telegram response: {message}")
                        return {"success": False, "error": "No audio in response"}
                    
                    audio = message["audio"]
                    
                    # Check if file_id exists
                    if "file_id" not in audio:
                        logger.error(f"No file_id in audio response: {audio}")
                        return {"success": False, "error": "No file_id in audio response"}
                    
                    file_id = audio["file_id"]
                    
                    # Construct proxy URL
                    backend_url = os.getenv("BACKEND_URL", "http://localhost:8001")
                    file_url = f"{backend_url}/api/media/telegram-proxy/audio/{file_id}"
                    
                    logger.info(f"[TELEGRAM] Audio uploaded successfully: {file_id}")
                    
                    return {
                        "success": True,
                        "file_id": file_id,
                        "file_url": file_url,
                        "file_unique_id": audio.get("file_unique_id", ""),
                        "message_id": message.get("message_id", 0),
                        "file_size": audio.get("file_size", 0),
                        "duration": audio.get("duration", 0),
                        "uploaded_at": datetime.utcnow().isoformat()
                    }
                else:
                    logger.error(f"Telegram audio upload failed: {result}")
                    return {"success": False, "error": result.get("description", "Unknown error")}
                    
        except Exception as e:
            logger.error(f"Error uploading audio to Telegram: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def log_activity(self, message: str):
        """
        Log activity to log channel
        """
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{self.api_base}/sendMessage",
                    json={
                        "chat_id": self.log_channel,
                        "text": f"📝 {datetime.utcnow().isoformat()}\n\n{message}"
                    }
                )
        except Exception as e:
            logger.error(f"Error logging to Telegram: {str(e)}")
