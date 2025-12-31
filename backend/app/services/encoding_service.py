import os
import asyncio
import subprocess
from typing import Optional, Dict
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class EncodingService:
    """
    MP4 Encoding Service for RTMP recordings
    Converts FLV recordings to MP4 format using FFmpeg
    """
    
    def __init__(self):
        self.encoding_path = os.getenv("ENCODING_PATH", "/tmp/encoding")
        self.output_path = os.getenv("RECORDING_PATH", "/tmp/recordings")
        
        # Ensure directories exist
        os.makedirs(self.encoding_path, exist_ok=True)
        os.makedirs(self.output_path, exist_ok=True)
    
    async def encode_to_mp4(self, input_file: str, wedding_id: str) -> Dict:
        """
        Convert FLV recording to MP4 format
        
        Args:
            input_file: Path to FLV file from NGINX-RTMP
            wedding_id: Wedding identifier for tracking
            
        Returns:
            Dict with encoding status and output file path
        """
        try:
            # Generate output filename
            base_name = os.path.basename(input_file).replace('.flv', '')
            output_file = f"{self.output_path}/{base_name}_encoded.mp4"
            
            # FFmpeg command for FLV to MP4 conversion
            cmd = [
                'ffmpeg',
                '-i', input_file,
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-preset', 'medium',
                '-crf', '23',
                '-output_format', 'mp4',
                '-movflags', '+faststart',
                '-y',
                output_file
            ]
            
            logger.info(f"Starting MP4 encoding for {input_file}")
            
            # Run encoding process
            process = await asyncio.create_subprocess_exec(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                logger.info(f"✅ MP4 encoding completed: {output_file}")
                return {
                    "success": True,
                    "output_file": output_file,
                    "message": "Encoding completed successfully"
                }
            else:
                logger.error(f"❌ MP4 encoding failed: {stderr}")
                return {
                    "success": False,
                    "error": stderr,
                    "message": "Encoding failed"
                }
                
        except Exception as e:
            logger.error(f"Error during encoding: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Encoding process failed"
            }
    
    async def batch_encode(self, files: list, wedding_id: str) -> list:
        """
        Encode multiple files in parallel
        """
        tasks = []
        for file_path in files:
            task = self.encode_to_mp4(file_path, wedding_id)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return results
