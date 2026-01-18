"""Audio Mixer Service for FFmpeg Integration"""
import asyncio
import subprocess
import os
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class AudioMixerService:
    """Service to mix audio with FFmpeg for live streaming"""
    
    def __init__(self):
        self.active_mixes: Dict[str, subprocess.Popen] = {}
    
    def generate_audio_mix_command(
        self,
        video_input: str,
        background_music_url: Optional[str] = None,
        sound_effects: List[Dict] = None,
        output_path: str = None,
        master_volume: float = 0.85,
        music_volume: float = 0.70,
        effects_volume: float = 0.80
    ) -> List[str]:
        """Generate FFmpeg command for audio mixing"""
        
        command = ["ffmpeg"]
        
        # Input video stream
        command.extend(["-i", video_input])
        
        # Input audio sources
        input_count = 1
        has_background_music = False
        
        if background_music_url:
            command.extend(["-i", background_music_url])
            has_background_music = True
            input_count += 1
        
        # Add sound effects
        effect_count = 0
        if sound_effects:
            for effect in sound_effects:
                command.extend(["-i", effect.get("url")])
                effect_count += 1
                input_count += 1
        
        # Build filter complex
        filter_parts = []
        
        if has_background_music:
            # Loop background music and apply volume
            filter_parts.append(
                f"[1:a]aloop=loop=-1:size=2e+09,volume={music_volume}[music]"
            )
        
        # Mix sound effects if any
        if effect_count > 0:
            effect_inputs = []
            for i in range(effect_count):
                effect_idx = 2 + i if has_background_music else 1 + i
                filter_parts.append(
                    f"[{effect_idx}:a]volume={effects_volume}[effect{i}]"
                )
                effect_inputs.append(f"[effect{i}]")
            
            # Mix all effects together
            if len(effect_inputs) > 1:
                effect_mix = "".join(effect_inputs)
                filter_parts.append(
                    f"{effect_mix}amix=inputs={len(effect_inputs)}:duration=first[effects_mixed]"
                )
            else:
                filter_parts.append(
                    f"[effect0]anull[effects_mixed]"
                )
        
        # Mix video audio, background music, and effects
        final_inputs = ["[0:a]"]
        if has_background_music:
            final_inputs.append("[music]")
        if effect_count > 0:
            final_inputs.append("[effects_mixed]")
        
        if len(final_inputs) > 1:
            final_mix = "".join(final_inputs)
            filter_parts.append(
                f"{final_mix}amix=inputs={len(final_inputs)}:duration=first,volume={master_volume}[final]"
            )
        else:
            filter_parts.append(
                f"[0:a]volume={master_volume}[final]"
            )
        
        # Join all filter parts
        filter_complex = ";".join(filter_parts)
        
        command.extend([
            "-filter_complex", filter_complex,
            "-map", "0:v",  # Map video from first input
            "-map", "[final]",  # Map mixed audio
            "-c:v", "copy",  # Copy video codec
            "-c:a", "aac",  # Encode audio as AAC
            "-b:a", "128k",  # Audio bitrate
            "-shortest",  # Stop when shortest input ends
        ])
        
        # HLS output settings
        if output_path:
            command.extend([
                "-f", "hls",
                "-hls_time", "1",
                "-hls_list_size", "3",
                "-hls_flags", "delete_segments+append_list",
                output_path
            ])
        else:
            command.append("-f null -")
        
        return command
    
    async def start_audio_mix(
        self,
        wedding_id: str,
        video_input: str,
        background_music_url: Optional[str] = None,
        sound_effects: List[Dict] = None,
        output_path: str = None,
        master_volume: float = 0.85,
        music_volume: float = 0.70,
        effects_volume: float = 0.80
    ) -> bool:
        """Start audio mixing process"""
        
        try:
            # Stop existing mix if any
            await self.stop_audio_mix(wedding_id)
            
            # Generate command
            command = self.generate_audio_mix_command(
                video_input=video_input,
                background_music_url=background_music_url,
                sound_effects=sound_effects,
                output_path=output_path,
                master_volume=master_volume,
                music_volume=music_volume,
                effects_volume=effects_volume
            )
            
            logger.info(f"Starting audio mix for wedding {wedding_id}")
            logger.info(f"Command: {' '.join(command)}")
            
            # Start FFmpeg process
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.PIPE
            )
            
            self.active_mixes[wedding_id] = process
            
            logger.info(f"Audio mix started for wedding {wedding_id}, PID: {process.pid}")
            return True
            
        except Exception as e:
            logger.error(f"Error starting audio mix for wedding {wedding_id}: {e}")
            return False
    
    async def stop_audio_mix(self, wedding_id: str) -> bool:
        """Stop audio mixing process"""
        
        if wedding_id not in self.active_mixes:
            return True
        
        try:
            process = self.active_mixes[wedding_id]
            
            if process.poll() is None:  # Process is still running
                logger.info(f"Stopping audio mix for wedding {wedding_id}")
                process.terminate()
                
                # Wait for graceful shutdown
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    logger.warning(f"Force killing audio mix for wedding {wedding_id}")
                    process.kill()
                    process.wait()
            
            del self.active_mixes[wedding_id]
            logger.info(f"Audio mix stopped for wedding {wedding_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error stopping audio mix for wedding {wedding_id}: {e}")
            return False
    
    async def update_volume(
        self,
        wedding_id: str,
        master_volume: Optional[float] = None,
        music_volume: Optional[float] = None,
        effects_volume: Optional[float] = None
    ) -> bool:
        """Update volume in real-time (requires restarting mix)"""
        
        # Note: FFmpeg doesn't support real-time volume adjustment
        # This would require restarting the mix with new volume settings
        # In a production environment, you might use a different approach
        # like using FFmpeg's zmq filter or a separate audio processing daemon
        
        logger.warning("Volume update requires restarting audio mix")
        return False
    
    def is_mixing_active(self, wedding_id: str) -> bool:
        """Check if audio mixing is active for wedding"""
        
        if wedding_id not in self.active_mixes:
            return False
        
        process = self.active_mixes[wedding_id]
        return process.poll() is None
    
    def get_active_mixes(self) -> List[str]:
        """Get list of active wedding IDs with audio mixing"""
        
        return [
            wedding_id
            for wedding_id, process in self.active_mixes.items()
            if process.poll() is None
        ]
    
    async def cleanup_finished_mixes(self) -> int:
        """Remove finished mixes from tracking"""
        
        finished = [
            wedding_id
            for wedding_id, process in self.active_mixes.items()
            if process.poll() is not None
        ]
        
        for wedding_id in finished:
            del self.active_mixes[wedding_id]
            logger.info(f"Cleaned up finished mix for wedding {wedding_id}")
        
        return len(finished)


# Global instance
audio_mixer_service = AudioMixerService()
