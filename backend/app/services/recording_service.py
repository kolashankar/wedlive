"""
Recording Service - Pulse-Powered Recording Management

This service manages recording operations using Pulse platform APIs.
All actual recording is handled by Pulse LiveKit Egress.

Migration Status: Phase 1.3 Complete
- Removed: Custom FFmpeg recording
- Removed: NGINX-RTMP DVR
- Replaced with: Pulse Egress API calls
"""

import logging
from datetime import datetime
from typing import Optional, Dict
from bson import ObjectId
from app.models import RecordingStatus
from app.services.pulse_service import PulseService

logger = logging.getLogger(__name__)


class RecordingService:
    """
    Recording Service using Pulse Platform
    
    Delegates all recording operations to Pulse Egress API.
    Maintains local metadata for wedding recordings.
    """
    
    def __init__(self, db):
        self.db = db
        self.recordings_collection = db.recordings
        self.weddings_collection = db.weddings
        self.pulse_service = PulseService()
    
    async def start_recording(
        self,
        wedding_id: str,
        quality: str = "1080p",
        user_id: str = None,
        upload_to_telegram: bool = True
    ) -> Dict:
        """
        Start recording for a wedding stream using Pulse Egress
        
        Args:
            wedding_id: Wedding identifier
            quality: Video quality (1080p, 720p, 480p)
            user_id: User who initiated recording
            upload_to_telegram: Mirror to Telegram CDN for free bandwidth
            
        Returns:
            Recording metadata with Pulse egress_id
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
                    "message": "Recording already in progress",
                    "egress_id": existing_recording.get("egress_id")
                }
            
            # Get room name from wedding (Pulse uses room-based recording)
            room_name = wedding.get("pulse_room_name", f"wedding_{wedding_id}")
            
            # Start recording via Pulse Egress
            logger.info(f"📹 Starting Pulse recording for wedding {wedding_id}")
            pulse_response = await self.pulse_service.start_recording(
                room_name=room_name,
                wedding_id=wedding_id,
                quality=quality,
                upload_to_telegram=upload_to_telegram,
                metadata={
                    "wedding_id": wedding_id,
                    "started_by": user_id
                }
            )
            
            # Create local recording record
            recording_doc = {
                "wedding_id": wedding_id,
                "status": RecordingStatus.STARTING.value,
                "quality": quality,
                "started_at": datetime.utcnow(),
                "started_by": user_id,
                "egress_id": pulse_response.get("egress_id"),
                "room_name": room_name,
                "recording_url": None,
                "file_size": None,
                "duration_seconds": None,
                "completed_at": None,
                "error_message": None,
                "upload_to_telegram": upload_to_telegram,
                "pulse_metadata": pulse_response
            }
            
            result = await self.recordings_collection.insert_one(recording_doc)
            recording_id = str(result.inserted_id)
            
            # Update status to RECORDING
            await self.recordings_collection.update_one(
                {"_id": result.inserted_id},
                {"$set": {"status": RecordingStatus.RECORDING.value}}
            )
            
            logger.info(f"✅ Recording started via Pulse - Recording ID: {recording_id}, Egress ID: {pulse_response.get('egress_id')}")
            
            return {
                "recording_id": recording_id,
                "status": "recording",
                "quality": quality,
                "started_at": recording_doc["started_at"].isoformat(),
                "egress_id": pulse_response.get("egress_id"),
                "message": "Recording started successfully via Pulse"
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
        Stop recording for a wedding stream using Pulse Egress
        
        Args:
            wedding_id: Wedding identifier
            user_id: User who stopped recording
            
        Returns:
            Recording completion status
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
            egress_id = recording.get("egress_id")
            
            if not egress_id:
                raise Exception("No Pulse egress_id found for this recording")
            
            # Update status to STOPPING
            await self.recordings_collection.update_one(
                {"_id": recording["_id"]},
                {"$set": {
                    "status": RecordingStatus.STOPPING.value,
                    "stopped_by": user_id
                }}
            )
            
            # Stop recording via Pulse
            logger.info(f"⏹️ Stopping Pulse recording: {egress_id}")
            pulse_response = await self.pulse_service.stop_recording(egress_id)
            
            # Calculate duration
            started_at = recording["started_at"]
            completed_at = datetime.utcnow()
            duration_seconds = int((completed_at - started_at).total_seconds())
            
            # Get recording details from Pulse
            recording_details = await self.pulse_service.get_recording(egress_id)
            
            recording_url = None
            file_size = 0
            
            # Extract URLs from Pulse response
            if recording_details.get("urls"):
                urls = recording_details["urls"]
                # Prefer Telegram CDN (free), fallback to R2
                recording_url = urls.get("telegram_cdn") or urls.get("r2") or urls.get("streaming")
                
            if recording_details.get("file_size"):
                file_size = recording_details["file_size"]
            
            # Update recording record
            await self.recordings_collection.update_one(
                {"_id": recording["_id"]},
                {"$set": {
                    "status": RecordingStatus.COMPLETED.value,
                    "completed_at": completed_at,
                    "duration_seconds": duration_seconds,
                    "recording_url": recording_url,
                    "file_size": file_size,
                    "pulse_stop_response": pulse_response,
                    "pulse_recording_details": recording_details
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
            
            logger.info(f"✅ Recording completed via Pulse - Duration: {duration_seconds}s")
            
            return {
                "recording_id": recording_id,
                "status": "completed",
                "duration_seconds": duration_seconds,
                "recording_url": recording_url,
                "file_size": file_size,
                "completed_at": completed_at.isoformat(),
                "message": "Recording completed successfully via Pulse"
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
        """
        Get status of a specific recording
        
        Args:
            recording_id: Local recording identifier
            
        Returns:
            Recording status and metadata
        """
        try:
            recording = await self.recordings_collection.find_one({
                "_id": ObjectId(recording_id)
            })
            
            if not recording:
                raise Exception(f"Recording {recording_id} not found")
            
            # If recording is in progress, fetch live status from Pulse
            if recording.get("status") in ["starting", "recording"] and recording.get("egress_id"):
                try:
                    pulse_details = await self.pulse_service.get_recording(recording["egress_id"])
                    # Update local record with latest info
                    if pulse_details:
                        await self.recordings_collection.update_one(
                            {"_id": recording["_id"]},
                            {"$set": {"pulse_recording_details": pulse_details}}
                        )
                except Exception as e:
                    logger.warning(f"Could not fetch live recording status from Pulse: {e}")
            
            return {
                "recording_id": recording_id,
                "wedding_id": recording["wedding_id"],
                "status": recording["status"],
                "quality": recording.get("quality", "1080p"),
                "duration_seconds": recording.get("duration_seconds"),
                "recording_url": recording.get("recording_url"),
                "file_size": recording.get("file_size"),
                "started_at": recording["started_at"].isoformat(),
                "completed_at": recording.get("completed_at").isoformat() if recording.get("completed_at") else None,
                "error_message": recording.get("error_message"),
                "egress_id": recording.get("egress_id")
            }
            
        except Exception as e:
            logger.error(f"Failed to get recording status {recording_id}: {str(e)}")
            raise
    
    async def get_recording_url(self, recording_id: str) -> Optional[str]:
        """
        Get playback URL for a completed recording
        
        Args:
            recording_id: Local recording identifier
            
        Returns:
            Recording URL or None
        """
        try:
            recording = await self.recordings_collection.find_one({
                "_id": ObjectId(recording_id)
            })
            
            if not recording:
                return None
            
            return recording.get("recording_url")
            
        except Exception as e:
            logger.error(f"Failed to get recording URL {recording_id}: {str(e)}")
            return None
    
    async def list_recordings(self, wedding_id: str) -> list:
        """
        Get all recordings for a wedding
        
        Args:
            wedding_id: Wedding identifier
            
        Returns:
            List of recordings with metadata
        """
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
                    "quality": recording.get("quality", "1080p"),
                    "duration_seconds": recording.get("duration_seconds"),
                    "recording_url": recording.get("recording_url"),
                    "file_size": recording.get("file_size"),
                    "started_at": recording["started_at"].isoformat(),
                    "completed_at": recording.get("completed_at").isoformat() if recording.get("completed_at") else None,
                    "egress_id": recording.get("egress_id")
                })
            
            return recordings
            
        except Exception as e:
            logger.error(f"Failed to get recordings for wedding {wedding_id}: {str(e)}")
            raise
    
    async def auto_start_recording(self, wedding_id: str) -> Optional[Dict]:
        """
        Auto-start recording when stream goes live
        Called by stream service when auto_record is enabled
        
        Args:
            wedding_id: Wedding identifier
            
        Returns:
            Recording metadata or None
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
            
            # Check if DVR is enabled (legacy setting, kept for compatibility)
            if not settings.get("enable_dvr", True):
                logger.info(f"DVR disabled for wedding {wedding_id}")
                return None
            
            # Start recording via Pulse
            recording_quality = settings.get("recording_quality", "1080p")
            result = await self.start_recording(
                wedding_id=wedding_id,
                quality=recording_quality,
                user_id="system"
            )
            
            logger.info(f"🎬 Auto-recording started via Pulse for wedding {wedding_id}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to auto-start recording for wedding {wedding_id}: {str(e)}")
            return None
