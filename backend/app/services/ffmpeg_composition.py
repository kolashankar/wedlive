"""
FFmpeg Composition Service for Multi-Camera Live Streaming

This service manages FFmpeg processes that compose multiple camera HLS streams
into a single output stream for viewers. It supports dynamic camera switching
with minimal latency.
"""

import asyncio
import logging
import os
import psutil
from datetime import datetime, timedelta
from typing import Dict, Optional
import signal

logger = logging.getLogger(__name__)


class FFmpegCompositionService:
    """
    Manages FFmpeg composition processes for multi-camera weddings.
    
    Each wedding can have one active composition process that:
    - Reads HLS input from the active camera
    - Outputs composed HLS stream for viewers
    - Supports dynamic camera switching
    - Monitors process health
    """
    
    def __init__(self):
        self.active_processes: Dict[str, asyncio.subprocess.Process] = {}
        self.process_health: Dict[str, dict] = {}
        self.output_dir = "/tmp/hls_output"
        
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def start_composition(self, wedding_id: str, camera: dict) -> dict:
        """
        Start FFmpeg composition for a wedding with the specified camera
        
        Args:
            wedding_id: Wedding ID
            camera: Camera object with stream_key and hls_url
            
        Returns:
            dict with status and details
        """
        try:
            logger.info(f"[COMPOSITION] Starting composition for wedding {wedding_id} with camera {camera.get('camera_id')}")
            
            # Stop existing composition if any
            if wedding_id in self.active_processes:
                await self.stop_composition(wedding_id)
            
            # Get camera HLS URL
            hls_url = camera.get("hls_url")
            if not hls_url:
                stream_key = camera.get("stream_key")
                hls_url = f"/hls/{stream_key}.m3u8"
            
            # Make HLS URL absolute for local access
            if hls_url.startswith("/hls/"):
                hls_url = f"http://localhost:8080{hls_url}"
            
            # Setup output directory for this wedding
            wedding_output_dir = os.path.join(self.output_dir, f"output_{wedding_id}")
            os.makedirs(wedding_output_dir, exist_ok=True)
            
            output_path = os.path.join(wedding_output_dir, "output.m3u8")
            
            # FFmpeg command for HLS re-streaming with optimized settings
            ffmpeg_cmd = [
                "ffmpeg",
                "-i", hls_url,  # Input HLS stream
                "-c:v", "copy",  # Copy video codec (no re-encoding)
                "-c:a", "copy",  # Copy audio codec (no re-encoding)
                "-f", "hls",  # Output format: HLS
                "-hls_time", "1",  # 1-second segments (low latency)
                "-hls_list_size", "3",  # Keep only 3 segments in playlist
                "-hls_flags", "delete_segments+independent_segments",  # Delete old segments
                "-hls_segment_type", "mpegts",  # MPEG-TS segments
                "-hls_segment_filename", os.path.join(wedding_output_dir, "segment_%03d.ts"),
                output_path
            ]
            
            logger.info(f"[COMPOSITION] FFmpeg command: {' '.join(ffmpeg_cmd)}")
            
            # Start FFmpeg process
            process = await asyncio.create_subprocess_exec(
                *ffmpeg_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Store process
            self.active_processes[wedding_id] = process
            self.process_health[wedding_id] = {
                "pid": process.pid,
                "started_at": datetime.utcnow(),
                "last_check": datetime.utcnow(),
                "status": "running",
                "restart_count": 0,
                "camera_id": camera.get("camera_id"),
                "output_path": output_path
            }
            
            logger.info(f"[COMPOSITION] Started FFmpeg process PID {process.pid} for wedding {wedding_id}")
            
            # Start monitoring task
            asyncio.create_task(self._monitor_process(wedding_id, process))
            
            return {
                "success": True,
                "pid": process.pid,
                "output_url": f"/hls_output/output_{wedding_id}/output.m3u8",
                "camera_id": camera.get("camera_id")
            }
            
        except Exception as e:
            logger.error(f"[COMPOSITION] Failed to start composition: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def update_composition(self, wedding_id: str, camera: dict) -> dict:
        """
        Update composition to use a different camera (camera switch)
        
        This stops the current composition and starts a new one with the new camera.
        
        Args:
            wedding_id: Wedding ID
            camera: New camera object
            
        Returns:
            dict with status
        """
        try:
            logger.info(f"[COMPOSITION] Updating composition for wedding {wedding_id} to camera {camera.get('camera_id')}")
            
            # Restart composition with new camera
            result = await self.start_composition(wedding_id, camera)
            
            if result.get("success"):
                # Update health tracking
                if wedding_id in self.process_health:
                    self.process_health[wedding_id]["camera_id"] = camera.get("camera_id")
                    self.process_health[wedding_id]["last_update"] = datetime.utcnow()
            
            return result
            
        except Exception as e:
            logger.error(f"[COMPOSITION] Failed to update composition: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def stop_composition(self, wedding_id: str) -> dict:
        """
        Stop FFmpeg composition for a wedding
        
        Args:
            wedding_id: Wedding ID
            
        Returns:
            dict with status
        """
        try:
            if wedding_id not in self.active_processes:
                logger.warning(f"[COMPOSITION] No active composition for wedding {wedding_id}")
                return {"success": True, "message": "No active composition"}
            
            process = self.active_processes[wedding_id]
            
            logger.info(f"[COMPOSITION] Stopping composition for wedding {wedding_id}, PID {process.pid}")
            
            # Try graceful shutdown first
            try:
                process.terminate()
                await asyncio.wait_for(process.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                # Force kill if graceful shutdown fails
                logger.warning(f"[COMPOSITION] Graceful shutdown failed, force killing PID {process.pid}")
                process.kill()
                await process.wait()
            
            # Clean up tracking
            del self.active_processes[wedding_id]
            if wedding_id in self.process_health:
                self.process_health[wedding_id]["status"] = "stopped"
                self.process_health[wedding_id]["stopped_at"] = datetime.utcnow()
            
            logger.info(f"[COMPOSITION] Successfully stopped composition for wedding {wedding_id}")
            
            return {"success": True, "message": "Composition stopped"}
            
        except Exception as e:
            logger.error(f"[COMPOSITION] Failed to stop composition: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def check_health(self, wedding_id: str) -> dict:
        """
        Check health of composition process for a wedding
        
        Args:
            wedding_id: Wedding ID
            
        Returns:
            dict with health status
        """
        try:
            if wedding_id not in self.active_processes:
                return {
                    "healthy": False,
                    "status": "not_running",
                    "message": "No active composition process"
                }
            
            process = self.active_processes[wedding_id]
            health = self.process_health.get(wedding_id, {})
            
            # Check if process is still running
            if process.returncode is not None:
                health["status"] = "terminated"
                health["healthy"] = False
                return {
                    "healthy": False,
                    "status": "terminated",
                    "return_code": process.returncode,
                    "message": "Process terminated unexpectedly"
                }
            
            # Check output file freshness
            output_path = health.get("output_path")
            if output_path and os.path.exists(output_path):
                file_age = datetime.utcnow().timestamp() - os.path.getmtime(output_path)
                if file_age > 10:  # Stale if > 10 seconds old
                    return {
                        "healthy": False,
                        "status": "stale_output",
                        "file_age_seconds": file_age,
                        "message": "Output file not being updated"
                    }
            
            # Update health check timestamp
            health["last_check"] = datetime.utcnow()
            health["healthy"] = True
            
            return {
                "healthy": True,
                "status": "running",
                "pid": process.pid,
                "started_at": health.get("started_at"),
                "uptime_seconds": (datetime.utcnow() - health.get("started_at", datetime.utcnow())).total_seconds(),
                "restart_count": health.get("restart_count", 0),
                "camera_id": health.get("camera_id")
            }
            
        except Exception as e:
            logger.error(f"[COMPOSITION] Health check failed: {str(e)}", exc_info=True)
            return {
                "healthy": False,
                "status": "error",
                "error": str(e)
            }
    
    async def recover_composition(self, wedding_id: str, camera: dict) -> dict:
        """
        Recover a failed composition by restarting it
        
        Args:
            wedding_id: Wedding ID
            camera: Camera object to use for recovery
            
        Returns:
            dict with recovery status
        """
        try:
            logger.info(f"[COMPOSITION] Attempting to recover composition for wedding {wedding_id}")
            
            # Stop existing process
            await self.stop_composition(wedding_id)
            
            # Increment restart count
            if wedding_id in self.process_health:
                restart_count = self.process_health[wedding_id].get("restart_count", 0) + 1
            else:
                restart_count = 1
            
            # Restart composition
            result = await self.start_composition(wedding_id, camera)
            
            if result.get("success") and wedding_id in self.process_health:
                self.process_health[wedding_id]["restart_count"] = restart_count
                self.process_health[wedding_id]["last_recovery"] = datetime.utcnow()
            
            logger.info(f"[COMPOSITION] Recovery {'successful' if result.get('success') else 'failed'} for wedding {wedding_id}")
            
            return {
                "success": result.get("success"),
                "restart_count": restart_count,
                "details": result
            }
            
        except Exception as e:
            logger.error(f"[COMPOSITION] Recovery failed: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _monitor_process(self, wedding_id: str, process: asyncio.subprocess.Process):
        """
        Monitor FFmpeg process and log output
        
        Args:
            wedding_id: Wedding ID
            process: FFmpeg process
        """
        try:
            # Read stderr (FFmpeg outputs to stderr)
            async for line in process.stderr:
                log_line = line.decode().strip()
                if log_line:
                    logger.debug(f"[COMPOSITION:{wedding_id}] {log_line}")
            
            # Process ended
            return_code = await process.wait()
            logger.warning(f"[COMPOSITION] Process for wedding {wedding_id} ended with code {return_code}")
            
            # Update health status
            if wedding_id in self.process_health:
                self.process_health[wedding_id]["status"] = "terminated"
                self.process_health[wedding_id]["return_code"] = return_code
                self.process_health[wedding_id]["ended_at"] = datetime.utcnow()
            
        except Exception as e:
            logger.error(f"[COMPOSITION] Monitoring error for wedding {wedding_id}: {str(e)}", exc_info=True)
    
    def get_all_health_status(self) -> dict:
        """Get health status of all active compositions"""
        return {
            wedding_id: {
                "pid": self.active_processes[wedding_id].pid if wedding_id in self.active_processes else None,
                "health": self.process_health.get(wedding_id, {})
            }
            for wedding_id in self.active_processes.keys()
        }


# Global composition service instance
composition_service = FFmpegCompositionService()


# Convenience functions for backward compatibility
async def start_composition(wedding_id: str, camera: dict) -> dict:
    """Start composition for a wedding"""
    return await composition_service.start_composition(wedding_id, camera)


async def update_composition(wedding_id: str, camera: dict) -> dict:
    """Update composition to use a different camera"""
    return await composition_service.update_composition(wedding_id, camera)


async def stop_composition(wedding_id: str) -> dict:
    """Stop composition for a wedding"""
    return await composition_service.stop_composition(wedding_id)
