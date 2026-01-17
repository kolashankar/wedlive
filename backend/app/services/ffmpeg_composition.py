import subprocess
import asyncio
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class FFmpegCompositionService:
    def __init__(self):
        self.processes: Dict[str, subprocess.Popen] = {}  # wedding_id -> Process
        self.process_health: Dict[str, Dict] = {}  # wedding_id -> {last_check, status, restarts}
        self.output_dir = Path("/tmp/hls_output")
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    async def start_composition(self, wedding_id: str, camera: Dict[str, Any]) -> Dict[str, Any]:
        """Start FFmpeg to stream active camera to output"""
        try:
            output_path = self.output_dir / f"output_{wedding_id}"
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Input: Camera HLS
            # HLS URL from camera object, or constructed if not present
            # Assuming NGINX RTMP HLS location. 
            # If camera['hls_url'] is like "/hls/key.m3u8", we prepend localhost:8080
            # If not present, we construct it from stream_key
            
            hls_url = camera.get("hls_url")
            if not hls_url and camera.get("stream_key"):
                hls_url = f"/hls/{camera['stream_key']}.m3u8"
                
            input_hls = f"http://localhost:8080{hls_url}"
            output_hls = str(output_path / "output.m3u8")
            
            logger.info(f"🎬 Starting FFmpeg composition for {wedding_id}")
            logger.info(f"   Input: {input_hls}")
            logger.info(f"   Output: {output_hls}")
            
            # Stop existing if any
            await self.stop_composition(wedding_id)
            
            cmd = [
                "ffmpeg",
                "-re", # Read input at native frame rate (important for composition if input is static/loop, but for HLS input it might be auto)
                "-i", input_hls,
                "-c", "copy",  # Copy codec (no re-encoding) - FAST switching
                "-f", "hls",
                "-hls_time", "2",
                "-hls_list_size", "5",
                "-hls_flags", "delete_segments",
                output_hls
            ]
            
            # Use asyncio subprocess for better async integration
            # But the plan used subprocess.Popen, let's stick to Popen for now 
            # or upgrade to asyncio.create_subprocess_exec if preferred. 
            # Popen is synchronous blocking call, but starting process is fast.
            
            process = subprocess.Popen(
                cmd, 
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL, 
                stderr=subprocess.DEVNULL
            )
            
            self.processes[wedding_id] = process
            
            return {
                "success": True,
                "pid": process.pid,
                "output_url": f"/hls_output/output_{wedding_id}/output.m3u8"
            }
        except Exception as e:
            logger.error(f"❌ Error starting composition: {e}")
            return {"success": False, "error": str(e)}
    
    async def switch_camera(self, wedding_id: str, new_camera: Dict[str, Any]) -> Dict[str, Any]:
        """Switch to new camera by restarting FFmpeg"""
        logger.info(f"🔄 Switching camera for {wedding_id} to {new_camera.get('name')}")
        
        # Stop current
        await self.stop_composition(wedding_id)
        
        # Wait for clean shutdown - maybe needed for file locks?
        await asyncio.sleep(0.5)
        
        # Start with new camera
        return await self.start_composition(wedding_id, new_camera)
    
    async def stop_composition(self, wedding_id: str):
        """Stop FFmpeg process"""
        if wedding_id in self.processes:
            process = self.processes[wedding_id]
            logger.info(f"🛑 Stopping FFmpeg composition for {wedding_id} (PID: {process.pid})")
            
            try:
                # Try graceful quit
                if process.stdin:
                    process.stdin.write(b'q')
                    process.stdin.flush()
                
                # Wait
                try:
                    process.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    process.terminate()
                    process.wait(timeout=1)
            except Exception as e:
                logger.warning(f"Error stopping process: {e}")
                process.kill()
                
            del self.processes[wedding_id]

# Singleton instance
composition_service = FFmpegCompositionService()

async def update_composition(wedding_id: str, camera: Dict[str, Any]):
    """Helper function for routes to trigger switch"""
    await composition_service.switch_camera(wedding_id, camera)

async def start_composition(wedding_id: str, camera: Dict[str, Any]):
    """Helper function for webhooks to start composition"""
    await composition_service.start_composition(wedding_id, camera)
