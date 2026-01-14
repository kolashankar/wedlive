"""
Video Processing Service
Handles video processing, thumbnail generation, and FFmpeg operations
"""
import os
import subprocess
import tempfile
import logging
import json
from typing import Dict, Optional, Tuple
import aiofiles

logger = logging.getLogger(__name__)


class VideoProcessingService:
    """Service for video processing operations"""
    
    def __init__(self):
        self.max_video_size_mb = 50
        self.max_duration_seconds = 60
        self.supported_formats = ['mp4', 'webm', 'mov', 'avi']
    
    async def validate_video(self, file_path: str) -> Dict:
        """
        Validate video file format, size, and duration
        Returns: dict with validation results and video metadata
        """
        try:
            # Check file exists
            if not os.path.exists(file_path):
                return {
                    "valid": False,
                    "error": "File not found"
                }
            
            # Check file size
            file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
            if file_size_mb > self.max_video_size_mb:
                return {
                    "valid": False,
                    "error": f"File size ({file_size_mb:.2f}MB) exceeds maximum ({self.max_video_size_mb}MB)"
                }
            
            # Get video metadata using ffprobe
            metadata = await self.get_video_metadata(file_path)
            
            if not metadata.get("valid"):
                return metadata
            
            # Check duration
            duration = metadata.get("duration", 0)
            if duration > self.max_duration_seconds:
                return {
                    "valid": False,
                    "error": f"Video duration ({duration:.2f}s) exceeds maximum ({self.max_duration_seconds}s)"
                }
            
            # Check format
            format_name = metadata.get("format", "").lower()
            if not any(fmt in format_name for fmt in self.supported_formats):
                return {
                    "valid": False,
                    "error": f"Unsupported video format: {format_name}"
                }
            
            return {
                "valid": True,
                "metadata": metadata
            }
            
        except Exception as e:
            logger.error(f"[VIDEO_VALIDATION] Error: {str(e)}")
            return {
                "valid": False,
                "error": f"Validation error: {str(e)}"
            }
    
    async def get_video_metadata(self, file_path: str) -> Dict:
        """
        Extract video metadata using ffprobe
        Returns: dict with duration, width, height, format, etc.
        """
        try:
            # Use ffprobe to get video info
            cmd = [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                file_path
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                logger.error(f"[FFPROBE] Error: {result.stderr}")
                return {
                    "valid": False,
                    "error": "Failed to read video metadata"
                }
            
            data = json.loads(result.stdout)
            
            # Extract video stream info
            video_stream = None
            for stream in data.get('streams', []):
                if stream.get('codec_type') == 'video':
                    video_stream = stream
                    break
            
            if not video_stream:
                return {
                    "valid": False,
                    "error": "No video stream found"
                }
            
            format_info = data.get('format', {})
            
            return {
                "valid": True,
                "duration": float(format_info.get('duration', 0)),
                "width": int(video_stream.get('width', 0)),
                "height": int(video_stream.get('height', 0)),
                "format": format_info.get('format_name', ''),
                "file_size_mb": float(format_info.get('size', 0)) / (1024 * 1024),
                "codec": video_stream.get('codec_name', ''),
                "fps": self._parse_fps(video_stream.get('r_frame_rate', '0/1'))
            }
            
        except subprocess.TimeoutExpired:
            logger.error("[FFPROBE] Timeout expired")
            return {
                "valid": False,
                "error": "Timeout reading video metadata"
            }
        except Exception as e:
            logger.error(f"[FFPROBE] Error: {str(e)}")
            return {
                "valid": False,
                "error": f"Error reading metadata: {str(e)}"
            }
    
    def _parse_fps(self, fps_string: str) -> float:
        """Parse FPS from fraction string (e.g., '30/1' -> 30.0)"""
        try:
            if '/' in fps_string:
                num, den = fps_string.split('/')
                return float(num) / float(den)
            return float(fps_string)
        except:
            return 0.0
    
    async def generate_thumbnail(self, video_path: str, output_path: str, timestamp: float = 1.0) -> Dict:
        """
        Generate thumbnail from video at specific timestamp
        Returns: dict with success status and output path
        """
        try:
            # Ensure timestamp is within video duration
            metadata = await self.get_video_metadata(video_path)
            if not metadata.get("valid"):
                return {
                    "success": False,
                    "error": "Failed to read video metadata"
                }
            
            duration = metadata.get("duration", 0)
            if timestamp >= duration:
                timestamp = duration / 2  # Use middle frame if timestamp too large
            
            # Generate thumbnail using ffmpeg
            cmd = [
                'ffmpeg',
                '-i', video_path,
                '-ss', str(timestamp),
                '-vframes', '1',
                '-q:v', '2',
                '-y',
                output_path
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                logger.error(f"[FFMPEG] Thumbnail generation failed: {result.stderr}")
                return {
                    "success": False,
                    "error": "Failed to generate thumbnail"
                }
            
            if not os.path.exists(output_path):
                return {
                    "success": False,
                    "error": "Thumbnail file not created"
                }
            
            logger.info(f"[FFMPEG] Thumbnail generated: {output_path}")
            return {
                "success": True,
                "output_path": output_path
            }
            
        except subprocess.TimeoutExpired:
            logger.error("[FFMPEG] Thumbnail generation timeout")
            return {
                "success": False,
                "error": "Thumbnail generation timeout"
            }
        except Exception as e:
            logger.error(f"[FFMPEG] Error generating thumbnail: {str(e)}")
            return {
                "success": False,
                "error": f"Error: {str(e)}"
            }
    
    async def convert_video_format(self, input_path: str, output_path: str, target_format: str = 'mp4') -> Dict:
        """
        Convert video to target format
        Returns: dict with success status and output path
        """
        try:
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-c:v', 'libx264',
                '-preset', 'medium',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
                '-y',
                output_path
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode != 0:
                logger.error(f"[FFMPEG] Conversion failed: {result.stderr}")
                return {
                    "success": False,
                    "error": "Video conversion failed"
                }
            
            logger.info(f"[FFMPEG] Video converted: {output_path}")
            return {
                "success": True,
                "output_path": output_path
            }
            
        except subprocess.TimeoutExpired:
            logger.error("[FFMPEG] Conversion timeout")
            return {
                "success": False,
                "error": "Conversion timeout"
            }
        except Exception as e:
            logger.error(f"[FFMPEG] Error converting video: {str(e)}")
            return {
                "success": False,
                "error": f"Error: {str(e)}"
            }
