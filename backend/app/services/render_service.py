"""
Video Rendering Service
Handles server-side video rendering with FFmpeg to burn-in text overlays
"""
import os
import subprocess
import tempfile
import logging
import asyncio
import uuid
from typing import Dict, List, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class RenderJob:
    """Represents a video render job"""
    def __init__(self, job_id: str, wedding_id: str, template_id: str, quality: str = 'hd'):
        self.job_id = job_id
        self.wedding_id = wedding_id
        self.template_id = template_id
        self.quality = quality
        self.status = 'queued'  # queued, processing, completed, failed
        self.progress = 0
        self.error_message = None
        self.rendered_video_url = None
        self.rendered_file_id = None
        self.created_at = datetime.utcnow()
        self.completed_at = None


class VideoRenderService:
    """Service for rendering videos with text overlays burned in"""
    
    def __init__(self):
        self.render_jobs: Dict[str, RenderJob] = {}
        self.font_path_map = {
            'Playfair Display': '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
            'Montserrat': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            'Roboto': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            'Open Sans': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            'Lato': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            'Poppins': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            'Raleway': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            'Ubuntu': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            'default': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
        }
    
    def create_render_job(
        self, 
        wedding_id: str, 
        template_id: str, 
        quality: str = 'hd'
    ) -> RenderJob:
        """Create a new render job"""
        job_id = str(uuid.uuid4())
        job = RenderJob(job_id, wedding_id, template_id, quality)
        self.render_jobs[job_id] = job
        logger.info(f"[RENDER_JOB] Created job {job_id} for wedding {wedding_id}")
        return job
    
    def get_render_job(self, job_id: str) -> Optional[RenderJob]:
        """Get render job by ID"""
        return self.render_jobs.get(job_id)
    
    async def render_video_async(
        self,
        job_id: str,
        video_url: str,
        overlays: List[Dict],
        output_path: str,
        quality: str = 'hd'
    ) -> Dict:
        """
        Render video with overlays burned in (async wrapper)
        This will run in the background
        """
        job = self.get_render_job(job_id)
        if not job:
            return {"success": False, "error": "Job not found"}
        
        try:
            job.status = 'processing'
            job.progress = 10
            
            # Download video to temp file
            temp_video_path = await self._download_video(video_url)
            job.progress = 30
            
            # Build FFmpeg filter complex for overlays
            filter_complex = self._build_filter_complex(overlays)
            job.progress = 40
            
            # Run FFmpeg rendering
            result = await self._render_with_ffmpeg(
                temp_video_path,
                output_path,
                filter_complex,
                quality
            )
            
            if result['success']:
                job.status = 'completed'
                job.progress = 100
                job.completed_at = datetime.utcnow()
                logger.info(f"[RENDER_JOB] Job {job_id} completed successfully")
            else:
                job.status = 'failed'
                job.error_message = result.get('error', 'Unknown error')
                logger.error(f"[RENDER_JOB] Job {job_id} failed: {job.error_message}")
            
            # Cleanup temp file
            if os.path.exists(temp_video_path):
                os.unlink(temp_video_path)
            
            return result
            
        except Exception as e:
            job.status = 'failed'
            job.error_message = str(e)
            logger.error(f"[RENDER_JOB] Job {job_id} exception: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _download_video(self, video_url: str) -> str:
        """Download video from URL to temp file"""
        import aiohttp
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        temp_path = temp_file.name
        temp_file.close()
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(video_url) as response:
                    if response.status != 200:
                        raise Exception(f"Failed to download video: HTTP {response.status}")
                    
                    with open(temp_path, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            f.write(chunk)
            
            logger.info(f"[RENDER] Video downloaded to {temp_path}")
            return temp_path
            
        except Exception as e:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise e
    
    def _build_filter_complex(self, overlays: List[Dict]) -> str:
        """
        Build FFmpeg filter_complex string for text overlays
        """
        if not overlays:
            return None
        
        filter_parts = []
        
        for idx, overlay in enumerate(overlays):
            # Extract overlay properties
            text = overlay.get('text', '').replace("'", "\\'").replace(":", "\\:")
            position = overlay.get('position', {})
            timing = overlay.get('timing', {})
            styling = overlay.get('styling', {})
            
            x = position.get('x', 960)
            y = position.get('y', 540)
            start_time = timing.get('start_time', 0)
            end_time = timing.get('end_time', 999)
            
            font_family = styling.get('font_family', 'Arial')
            font_size = styling.get('font_size', 48)
            color = styling.get('color', '#ffffff').replace('#', '0x')
            font_weight = styling.get('font_weight', 'normal')
            
            # Get font path
            font_path = self.font_path_map.get(font_family, self.font_path_map['default'])
            
            # Build drawtext filter
            drawtext = (
                f"drawtext="
                f"text='{text}':"
                f"x={x}:"
                f"y={y}:"
                f"fontfile={font_path}:"
                f"fontsize={font_size}:"
                f"fontcolor={color}:"
                f"enable='between(t,{start_time},{end_time})'"
            )
            
            filter_parts.append(drawtext)
        
        # Join all filters with comma
        return ','.join(filter_parts)
    
    async def _render_with_ffmpeg(
        self,
        input_path: str,
        output_path: str,
        filter_complex: Optional[str],
        quality: str = 'hd'
    ) -> Dict:
        """
        Render video using FFmpeg with text overlays
        """
        try:
            # Build FFmpeg command
            cmd = ['ffmpeg', '-i', input_path]
            
            # Add filter complex if overlays exist
            if filter_complex:
                cmd.extend(['-vf', filter_complex])
            
            # Quality settings
            if quality == 'hd':
                cmd.extend([
                    '-c:v', 'libx264',
                    '-preset', 'medium',
                    '-crf', '23',
                    '-c:a', 'aac',
                    '-b:a', '192k'
                ])
            else:  # sd
                cmd.extend([
                    '-c:v', 'libx264',
                    '-preset', 'fast',
                    '-crf', '28',
                    '-s', '1280x720',
                    '-c:a', 'aac',
                    '-b:a', '128k'
                ])
            
            cmd.extend(['-movflags', '+faststart', '-y', output_path])
            
            logger.info(f"[FFMPEG] Running command: {' '.join(cmd)}")
            
            # Run FFmpeg
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode('utf-8')
                logger.error(f"[FFMPEG] Error: {error_msg}")
                return {
                    "success": False,
                    "error": f"FFmpeg rendering failed: {error_msg[:200]}"
                }
            
            if not os.path.exists(output_path):
                return {
                    "success": False,
                    "error": "Output file not created"
                }
            
            logger.info(f"[FFMPEG] Video rendered successfully: {output_path}")
            return {
                "success": True,
                "output_path": output_path
            }
            
        except Exception as e:
            logger.error(f"[FFMPEG] Exception: {str(e)}")
            return {
                "success": False,
                "error": f"Rendering exception: {str(e)}"
            }
    
    def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Get render job status"""
        job = self.get_render_job(job_id)
        if not job:
            return None
        
        return {
            "job_id": job.job_id,
            "wedding_id": job.wedding_id,
            "template_id": job.template_id,
            "status": job.status,
            "progress": job.progress,
            "error_message": job.error_message,
            "rendered_video_url": job.rendered_video_url,
            "created_at": job.created_at.isoformat(),
            "completed_at": job.completed_at.isoformat() if job.completed_at else None
        }
    
    def cleanup_old_jobs(self, max_age_hours: int = 24):
        """Clean up old completed/failed jobs"""
        now = datetime.utcnow()
        to_delete = []
        
        for job_id, job in self.render_jobs.items():
            age_hours = (now - job.created_at).total_seconds() / 3600
            if age_hours > max_age_hours and job.status in ['completed', 'failed']:
                to_delete.append(job_id)
        
        for job_id in to_delete:
            del self.render_jobs[job_id]
        
        if to_delete:
            logger.info(f"[RENDER_CLEANUP] Cleaned up {len(to_delete)} old jobs")
