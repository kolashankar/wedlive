import os
import asyncio
import aiofiles
import logging
from datetime import datetime
from typing import Optional, Dict
from bson import ObjectId
from app.models import RecordingStatus
from app.services.encoding_service import EncodingService

logger = logging.getLogger(__name__)


class RecordingService:
    """
    DVR Recording Service for NGINX-RTMP streams
    
    NGINX-RTMP automatically records streams to disk when configured.
    This service manages recording metadata and provides control endpoints.
    """
    
    def __init__(self, db):
        self.db = db
        self.recordings_collection = db.recordings
        self.encoding_service = EncodingService()
        self.weddings_collection = db.weddings
        
        # NGINX-RTMP recording paths (from nginx.conf)
        self.recording_base_path = os.getenv("RECORDING_PATH", "/tmp/recordings")
        self.hls_server_url = os.getenv("HLS_SERVER_URL", "http://localhost:8080")
    
    async def start_recording(
        self,
        wedding_id: str,
        quality: str = "720p",
        user_id: str = None,
        record_composed: bool = True
    ) -> Dict:
        """
        Start DVR recording for a wedding stream
        
        For Multi-Camera Weddings:
        - If record_composed=True (default): Records the composed output stream (what viewers see)
        - If record_composed=False: Records individual camera streams (future enhancement)
        
        Note: NGINX-RTMP handles actual recording via config for single streams.
        For composed streams, we use FFmpeg to record the HLS output.
        
        This method creates metadata tracking.
        """
        try:
            # Check if wedding exists and is live
            wedding = await self.weddings_collection.find_one({
                "_id": ObjectId(wedding_id)
            })
            
            if not wedding:
                raise Exception(f"Wedding {wedding_id} not found")
            
            if wedding.get("status") != "live":
                raise Exception("Cannot start recording - stream is not live")
            
            # Check if already recording
            existing_recording = await self.recordings_collection.find_one({
                "wedding_id": wedding_id,
                "status": {"$in": ["starting", "recording"]}
            })
            
            if existing_recording:
                return {
                    "recording_id": str(existing_recording["_id"]),
                    "status": "already_recording",
                    "message": "Recording already in progress"
                }
            
            # Create recording record
            recording_doc = {
                "wedding_id": wedding_id,
                "status": RecordingStatus.STARTING.value,
                "quality": quality,
                "started_at": datetime.utcnow(),
                "started_by": user_id,
                "recording_url": None,
                "file_size": None,
                "duration_seconds": None,
                "completed_at": None,
                "error_message": None
            }
            
            result = await self.recordings_collection.insert_one(recording_doc)
            recording_id = str(result.inserted_id)
            
            # Update recording status to RECORDING
            await self.recordings_collection.update_one(
                {"_id": result.inserted_id},
                {"$set": {"status": RecordingStatus.RECORDING.value}}
            )
            
            logger.info(f"📹 Recording started for wedding {wedding_id} - Recording ID: {recording_id}")
            
            return {
                "recording_id": recording_id,
                "status": "recording",
                "quality": quality,
                "started_at": recording_doc["started_at"].isoformat(),
                "message": "Recording started successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to start recording for wedding {wedding_id}: {str(e)}")
            raise
    
    async def stop_recording(
        self,
        wedding_id: str,
        user_id: str = None
    ) -> Dict:
        """
        Stop DVR recording for a wedding stream
        
        NGINX-RTMP automatically stops recording when stream ends.
        This method updates metadata and generates playback URL.
        """
        recording = None
        try:
            # Find active recording
            recording = await self.recordings_collection.find_one({
                "wedding_id": wedding_id,
                "status": {"$in": ["starting", "recording"]}
            })
            
            if not recording:
                raise Exception("No active recording found for this wedding")
            
            recording_id = str(recording["_id"])
            
            # Update status to STOPPING
            await self.recordings_collection.update_one(
                {"_id": recording["_id"]},
                {"$set": {
                    "status": RecordingStatus.STOPPING.value,
                    "stopped_by": user_id
                }}
            )
            
            # Simulate processing delay (NGINX-RTMP finalizes file)
            await asyncio.sleep(2)
            
            # Calculate duration
            started_at = recording["started_at"]
            completed_at = datetime.utcnow()
            duration_seconds = int((completed_at - started_at).total_seconds())
            
            # Generate recording file path
            # NGINX-RTMP saves as: {stream_key}-{timestamp}.flv
            stream_key = f"live_{wedding_id}"
            recording_filename = f"{stream_key}.flv"
            recording_url = f"{self.hls_server_url}/recordings/{recording_filename}"
            
            # Encode to MP4 format
            try:
                encoded_result = await self.encoding_service.encode_to_mp4(recording_filename, wedding_id)
                
                if encoded_result.get("success"):
                    recording_url = encoded_result.get("output_file")
                    logger.info(f"🎬 Recording encoded to MP4: {recording_url}")
                else:
                    recording_url = encoded_result.get("output_file", recording_url)
                    logger.error(f"❌ MP4 encoding failed: {encoded_result.get('error')}")
            except Exception as encoding_error:
                logger.error(f"⚠️ MP4 encoding error: {str(encoding_error)}")
                # Continue with original recording_url if encoding fails
            
            # Update recording record
            await self.recordings_collection.update_one(
                {"_id": recording["_id"]},
                {"$set": {
                    "status": RecordingStatus.COMPLETED.value,
                    "completed_at": completed_at,
                    "duration_seconds": duration_seconds,
                    "recording_url": recording_url,
                    "file_size": 0  # TODO: Get actual file size
                }}
            )
            
            # Update wedding with recording URL
            await self.weddings_collection.update_one(
                {"_id": ObjectId(wedding_id)},
                {"$set": {
                    "recording_url": recording_url,
                    "status": "recorded"
                }}
            )
            
            logger.info(f"✅ Recording completed for wedding {wedding_id} - Duration: {duration_seconds}s")
            
            return {
                "recording_id": recording_id,
                "status": "completed",
                "duration_seconds": duration_seconds,
                "recording_url": recording_url,
                "completed_at": completed_at.isoformat(),
                "message": "Recording completed successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to stop recording for wedding {wedding_id}: {str(e)}")
            
            # Mark recording as failed
            if recording:
                await self.recordings_collection.update_one(
                    {"_id": recording["_id"]},
                    {"$set": {
                        "status": RecordingStatus.FAILED.value,
                        "error_message": str(e),
                        "completed_at": datetime.utcnow()
                    }}
                )
            
            raise
    
    async def get_recording_status(self, recording_id: str) -> Dict:
        """Get status of a specific recording"""
        try:
            recording = await self.recordings_collection.find_one({
                "_id": ObjectId(recording_id)
            })
            
            if not recording:
                raise Exception(f"Recording {recording_id} not found")
            
            return {
                "recording_id": recording_id,
                "wedding_id": recording["wedding_id"],
                "status": recording["status"],
                "quality": recording.get("quality", "720p"),
                "duration_seconds": recording.get("duration_seconds"),
                "recording_url": recording.get("recording_url"),
                "started_at": recording["started_at"].isoformat(),
                "completed_at": recording.get("completed_at").isoformat() if recording.get("completed_at") else None,
                "error_message": recording.get("error_message")
            }
            
        except Exception as e:
            logger.error(f"Failed to get recording status {recording_id}: {str(e)}")
            raise
    
    async def get_wedding_recordings(self, wedding_id: str) -> list:
        """Get all recordings for a wedding"""
        try:
            cursor = self.recordings_collection.find({
                "wedding_id": wedding_id
            }).sort("started_at", -1)
            
            recordings = []
            async for recording in cursor:
                recordings.append({
                    "id": str(recording["_id"]),
                    "wedding_id": recording["wedding_id"],
                    "status": recording["status"],
                    "quality": recording.get("quality", "720p"),
                    "duration_seconds": recording.get("duration_seconds"),
                    "recording_url": recording.get("recording_url"),
                    "started_at": recording["started_at"].isoformat(),
                    "completed_at": recording.get("completed_at").isoformat() if recording.get("completed_at") else None
                })
            
            return recordings
            
        except Exception as e:
            logger.error(f"Failed to get recordings for wedding {wedding_id}: {str(e)}")
            raise
    
    async def auto_start_recording(self, wedding_id: str) -> Optional[Dict]:
        """
        Auto-start recording when stream goes live
        Called by stream service when auto_record is enabled
        """
        try:
            # Check wedding settings
            wedding = await self.weddings_collection.find_one({
                "_id": ObjectId(wedding_id)
            })
            
            if not wedding:
                return None
            
            settings = wedding.get("settings", {})
            
            # Check if auto-record is enabled
            if not settings.get("auto_record", False):
                logger.info(f"Auto-record disabled for wedding {wedding_id}")
                return None
            
            # Check if DVR is enabled
            if not settings.get("enable_dvr", False):
                logger.info(f"DVR disabled for wedding {wedding_id}")
                return None
            
            # Start recording
            recording_quality = settings.get("recording_quality", "720p")
            result = await self.start_recording(
                wedding_id=wedding_id,
                quality=recording_quality,
                user_id="system"
            )
            
            logger.info(f"🎬 Auto-recording started for wedding {wedding_id}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to auto-start recording for wedding {wedding_id}: {str(e)}")
            return None