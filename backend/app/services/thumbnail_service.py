
import logging
import asyncio
import os
from typing import Dict, Optional
from datetime import datetime
from app.services.recording_service import RecordingService

logger = logging.getLogger(__name__)

class ThumbnailService:
    """Service for generating thumbnails from RTMP/HLS streams"""
    
    def __init__(self):
        self.thumbnail_dir = "/tmp/thumbnails"
        os.makedirs(self.thumbnail_dir, exist_ok=True)
        
    async def generate_thumbnail(self, stream_key: str, wedding_id: str, is_camera: bool = False) -> Optional[str]:
        """
        Generate a thumbnail from the local HLS stream
        Returns the public URL path to the thumbnail
        """
        try:
            # Input path - NGINX-RTMP HLS location
            # Usually /tmp/hls/{stream_key}.m3u8 or similar depending on nginx.conf
            # Assuming standard location based on typical nginx-rtmp setup
            hls_path = f"/tmp/hls/{stream_key}/index.m3u8"
            
            # If HLS not yet ready, we might fail, so checking existence is good
            if not os.path.exists(hls_path):
                # Try RTMP directly if HLS not ready (slower but works instantly)
                # input_source = f"rtmp://localhost/live/{stream_key}"
                # For now, let's stick to HLS as it's less resource intensive if file exists
                return None
                
            output_filename = f"{stream_key}.jpg"
            output_path = os.path.join(self.thumbnail_dir, output_filename)
            
            # FFmpeg command to extract one frame
            # -ss 00:00:01 : Seek 1 second in (avoid black start frame)
            # -vframes 1 : Output 1 frame
            # -q:v 2 : High quality jpeg
            cmd = [
                "ffmpeg",
                "-y", # Overwrite
                "-i", hls_path,
                "-ss", "00:00:01",
                "-vframes", "1",
                "-q:v", "5",
                "-vf", "scale=320:-1", # Resize to 320px width, keep aspect ratio
                output_path
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL
            )
            
            await process.wait()
            
            if process.returncode == 0 and os.path.exists(output_path):
                # In a real production env, we'd upload this to S3/CDN
                # For this setup, we assume NGINX serves /thumbnails alias or we serve via API
                return f"/api/media/thumbnails/{output_filename}"
                
            return None
            
        except Exception as e:
            logger.error(f"Error generating thumbnail for {stream_key}: {e}")
            return None
