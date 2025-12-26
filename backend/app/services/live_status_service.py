from app.models import LiveStatus, WeddingLiveSession
from datetime import datetime, timezone
from typing import Dict, Optional
import logging
import uuid

logger = logging.getLogger(__name__)

class LiveStatusService:
    """Service for managing live stream status transitions with state machine logic"""
    
    def __init__(self, db):
        self.db = db
    
    async def transition_status(
        self, 
        wedding_id: str, 
        new_status: LiveStatus, 
        reason: str = "",
        triggered_by: str = "system"  # system, host, rtmp
    ) -> bool:
        """
        Safely transition live status with validation
        
        Valid transitions:
        - IDLE → WAITING (host clicks Go Live)
        - WAITING → LIVE (OBS stream detected)
        - LIVE → PAUSED (OBS stops)
        - PAUSED → LIVE (OBS resumes)
        - LIVE/PAUSED → ENDED (host clicks End Live)
        
        Invalid transitions return False
        """
        try:
            wedding = await self.db.weddings.find_one({"id": wedding_id})
            if not wedding:
                logger.error(f"Wedding not found: {wedding_id}")
                return False
            
            current_session = wedding.get("live_session")
            current_status = LiveStatus.IDLE
            
            if current_session:
                current_status = LiveStatus(current_session.get("status", "idle"))
            
            # Define valid transitions
            valid_transitions = {
                LiveStatus.IDLE: [LiveStatus.WAITING],
                LiveStatus.WAITING: [LiveStatus.LIVE],
                LiveStatus.LIVE: [LiveStatus.PAUSED, LiveStatus.ENDED],
                LiveStatus.PAUSED: [LiveStatus.LIVE, LiveStatus.ENDED],
                LiveStatus.ENDED: []  # Final state, no transitions allowed
            }
            
            # Check if transition is valid
            if new_status not in valid_transitions.get(current_status, []):
                logger.warning(
                    f"Invalid transition attempted: {current_status} → {new_status} "
                    f"for wedding {wedding_id}"
                )
                return False
            
            # Log the status change
            await self.add_status_history(
                wedding_id=wedding_id,
                status=new_status,
                reason=reason,
                triggered_by=triggered_by
            )
            
            logger.info(
                f"Status transition: {current_status} → {new_status} "
                f"for wedding {wedding_id} (triggered by {triggered_by})"
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error in transition_status: {str(e)}")
            return False
    
    async def handle_go_live(self, wedding_id: str, user_id: str) -> Dict:
        """Host clicks Go Live - set WAITING status"""
        try:
            # Check authorization
            if not await self.is_host_authorized(wedding_id, user_id):
                return {
                    "success": False,
                    "error": "Unauthorized"
                }
            
            wedding = await self.db.weddings.find_one({"id": wedding_id})
            if not wedding:
                return {
                    "success": False,
                    "error": "Wedding not found"
                }
            
            # Check if can go live
            if not wedding.get("can_go_live", True):
                return {
                    "success": False,
                    "error": "This wedding has already ended. Cannot go live again."
                }
            
            # Check current status
            current_session = wedding.get("live_session")
            if current_session and current_session.get("status") != "idle":
                return {
                    "success": False,
                    "error": f"Wedding is already in {current_session.get('status')} state"
                }
            
            # Generate stream credentials
            stream_key = f"live_{wedding_id}_{uuid.uuid4().hex[:8]}"
            rtmp_url = f"rtmp://localhost:1935/live"
            hls_playback_url = f"/hls/{stream_key}/index.m3u8"
            
            # Create live session with WAITING status
            live_session = {
                "wedding_id": wedding_id,
                "status": LiveStatus.WAITING.value,
                "stream_started_at": None,
                "stream_paused_at": None,
                "stream_resumed_at": None,
                "stream_ended_at": None,
                "pause_count": 0,
                "total_pause_duration": 0,
                "recording_session_id": str(uuid.uuid4()),
                "rtmp_url": rtmp_url,
                "stream_key": stream_key,
                "hls_playback_url": hls_playback_url,
                "status_history": [],
                "recording_started": False,
                "recording_path": None,
                "recording_segments": []
            }
            
            # Update wedding
            await self.db.weddings.update_one(
                {"id": wedding_id},
                {"$set": {
                    "live_session": live_session,
                    "status": "scheduled"  # Keep as scheduled until actually live
                }}
            )
            
            # Add status history
            await self.add_status_history(
                wedding_id=wedding_id,
                status=LiveStatus.WAITING,
                reason="Host clicked Go Live",
                triggered_by="host"
            )
            
            return {
                "success": True,
                "status": "waiting",
                "message": "Waiting for OBS stream to start",
                "rtmp_url": rtmp_url,
                "stream_key": stream_key,
                "hls_playback_url": hls_playback_url,
                "recording_session_id": live_session["recording_session_id"]
            }
            
        except Exception as e:
            logger.error(f"Error in handle_go_live: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_stream_start(self, wedding_id: str, stream_key: str) -> Dict:
        """OBS starts streaming - WAITING → LIVE or PAUSED → LIVE"""
        try:
            wedding = await self.db.weddings.find_one({"id": wedding_id})
            if not wedding:
                return {
                    "success": False,
                    "error": "Wedding not found"
                }
            
            live_session = wedding.get("live_session")
            if not live_session:
                return {
                    "success": False,
                    "error": "No live session found"
                }
            
            current_status = LiveStatus(live_session.get("status", "idle"))
            
            # Can transition from WAITING or PAUSED to LIVE
            if current_status not in [LiveStatus.WAITING, LiveStatus.PAUSED]:
                logger.warning(f"Invalid stream start from {current_status} state")
                return {
                    "success": False,
                    "error": f"Cannot start stream from {current_status} state"
                }
            
            # Validate transition
            if not await self.transition_status(
                wedding_id=wedding_id,
                new_status=LiveStatus.LIVE,
                reason="OBS stream detected",
                triggered_by="rtmp"
            ):
                return {
                    "success": False,
                    "error": "Failed to transition to LIVE"
                }
            
            # Update session timestamps
            update_fields = {
                "live_session.status": LiveStatus.LIVE.value,
                "status": "live"  # Update main wedding status
            }
            
            if current_status == LiveStatus.WAITING:
                # First time going live
                update_fields["live_session.stream_started_at"] = datetime.now(timezone.utc)
                update_fields["live_session.recording_started"] = False  # Will be set by recording service
            elif current_status == LiveStatus.PAUSED:
                # Resuming from pause
                update_fields["live_session.stream_resumed_at"] = datetime.now(timezone.utc)
                
                # Calculate pause duration
                pause_start = live_session.get("stream_paused_at")
                if pause_start:
                    pause_duration = int((datetime.now(timezone.utc) - pause_start).total_seconds())
                    update_fields["live_session.total_pause_duration"] = (
                        live_session.get("total_pause_duration", 0) + pause_duration
                    )
            
            await self.db.weddings.update_one(
                {"id": wedding_id},
                {"$set": update_fields}
            )
            
            should_start_recording = (
                current_status == LiveStatus.WAITING and 
                not live_session.get("recording_started", False)
            )
            
            return {
                "success": True,
                "status": "live",
                "previous_status": current_status.value,
                "should_start_recording": should_start_recording,
                "recording_session_id": live_session.get("recording_session_id")
            }
            
        except Exception as e:
            logger.error(f"Error in handle_stream_start: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_stream_stop(self, wedding_id: str, stream_key: str) -> Dict:
        """OBS stops streaming - LIVE → PAUSED (NEVER auto-end)"""
        try:
            wedding = await self.db.weddings.find_one({"id": wedding_id})
            if not wedding:
                return {
                    "success": False,
                    "error": "Wedding not found"
                }
            
            live_session = wedding.get("live_session")
            if not live_session:
                return {
                    "success": False,
                    "error": "No live session found"
                }
            
            current_status = LiveStatus(live_session.get("status", "idle"))
            
            # Check if already ended by host
            if current_status == LiveStatus.ENDED:
                logger.info(f"Wedding {wedding_id} already ended by host, ignoring stream stop")
                return {
                    "success": True,
                    "status": "ended",
                    "message": "Already ended by host"
                }
            
            # Only pause if currently live
            if current_status != LiveStatus.LIVE:
                logger.warning(f"Stream stop received but status is {current_status}")
                return {
                    "success": False,
                    "error": f"Cannot pause from {current_status} state"
                }
            
            # Validate transition
            if not await self.transition_status(
                wedding_id=wedding_id,
                new_status=LiveStatus.PAUSED,
                reason="OBS stream stopped",
                triggered_by="rtmp"
            ):
                return {
                    "success": False,
                    "error": "Failed to transition to PAUSED"
                }
            
            # Update session
            await self.db.weddings.update_one(
                {"id": wedding_id},
                {"$set": {
                    "live_session.status": LiveStatus.PAUSED.value,
                    "live_session.stream_paused_at": datetime.now(timezone.utc),
                    "live_session.pause_count": live_session.get("pause_count", 0) + 1,
                    "status": "live"  # Keep main status as live (just paused)
                }}
            )
            
            return {
                "success": True,
                "status": "paused",
                "pause_count": live_session.get("pause_count", 0) + 1,
                "message": "Stream paused, recording continues"
            }
            
        except Exception as e:
            logger.error(f"Error in handle_stream_stop: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_pause_live(self, wedding_id: str, user_id: str) -> Dict:
        """Host manually pauses - LIVE → PAUSED"""
        try:
            # Check authorization
            if not await self.is_host_authorized(wedding_id, user_id):
                return {
                    "success": False,
                    "error": "Unauthorized"
                }
            
            wedding = await self.db.weddings.find_one({"id": wedding_id})
            if not wedding:
                return {
                    "success": False,
                    "error": "Wedding not found"
                }
            
            live_session = wedding.get("live_session")
            if not live_session:
                return {
                    "success": False,
                    "error": "No live session found"
                }
            
            current_status = LiveStatus(live_session.get("status", "idle"))
            
            if current_status != LiveStatus.LIVE:
                return {
                    "success": False,
                    "error": f"Cannot pause from {current_status} state"
                }
            
            # Validate transition
            if not await self.transition_status(
                wedding_id=wedding_id,
                new_status=LiveStatus.PAUSED,
                reason="Host manually paused",
                triggered_by="host"
            ):
                return {
                    "success": False,
                    "error": "Failed to transition to PAUSED"
                }
            
            # Update session
            await self.db.weddings.update_one(
                {"id": wedding_id},
                {"$set": {
                    "live_session.status": LiveStatus.PAUSED.value,
                    "live_session.stream_paused_at": datetime.now(timezone.utc),
                    "live_session.pause_count": live_session.get("pause_count", 0) + 1
                }}
            )
            
            return {
                "success": True,
                "status": "paused",
                "pause_count": live_session.get("pause_count", 0) + 1,
                "message": "Live stream paused. Recording continues."
            }
            
        except Exception as e:
            logger.error(f"Error in handle_pause_live: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_resume_live(self, wedding_id: str, user_id: str) -> Dict:
        """Host manually resumes - PAUSED → LIVE (if OBS streaming)"""
        try:
            # Check authorization
            if not await self.is_host_authorized(wedding_id, user_id):
                return {
                    "success": False,
                    "error": "Unauthorized"
                }
            
            wedding = await self.db.weddings.find_one({"id": wedding_id})
            if not wedding:
                return {
                    "success": False,
                    "error": "Wedding not found"
                }
            
            live_session = wedding.get("live_session")
            if not live_session:
                return {
                    "success": False,
                    "error": "No live session found"
                }
            
            current_status = LiveStatus(live_session.get("status", "idle"))
            
            if current_status != LiveStatus.PAUSED:
                return {
                    "success": False,
                    "error": f"Cannot resume from {current_status} state"
                }
            
            # Note: In a real implementation, you might want to check if OBS is actually streaming
            # For now, we'll allow the resume and let OBS connection trigger the actual LIVE state
            
            # Validate transition
            if not await self.transition_status(
                wedding_id=wedding_id,
                new_status=LiveStatus.LIVE,
                reason="Host manually resumed",
                triggered_by="host"
            ):
                return {
                    "success": False,
                    "error": "Failed to transition to LIVE"
                }
            
            # Calculate pause duration
            pause_start = live_session.get("stream_paused_at")
            pause_duration = 0
            if pause_start:
                pause_duration = int((datetime.now(timezone.utc) - pause_start).total_seconds())
            
            # Update session
            await self.db.weddings.update_one(
                {"id": wedding_id},
                {"$set": {
                    "live_session.status": LiveStatus.LIVE.value,
                    "live_session.stream_resumed_at": datetime.now(timezone.utc),
                    "live_session.total_pause_duration": (
                        live_session.get("total_pause_duration", 0) + pause_duration
                    ),
                    "status": "live"
                }}
            )
            
            return {
                "success": True,
                "status": "live",
                "message": "Live stream resumed"
            }
            
        except Exception as e:
            logger.error(f"Error in handle_resume_live: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_end_live(self, wedding_id: str, user_id: str) -> Dict:
        """
        Host clicks End Live - FINAL action
        - Stop recording
        - Finalize video
        - Set status → ENDED
        - Mark can_go_live = False
        """
        try:
            # Check authorization
            if not await self.is_host_authorized(wedding_id, user_id):
                return {
                    "success": False,
                    "error": "Unauthorized"
                }
            
            wedding = await self.db.weddings.find_one({"id": wedding_id})
            if not wedding:
                return {
                    "success": False,
                    "error": "Wedding not found"
                }
            
            live_session = wedding.get("live_session")
            if not live_session:
                # If wedding status is live but no session exists, create one
                if wedding.get("status") == "live":
                    live_session = {
                        "status": "live",
                        "started_at": datetime.now(timezone.utc),
                        "stream_started_at": datetime.now(timezone.utc)
                    }
                    # Update wedding with live session
                    await self.db.weddings.update_one(
                        {"id": wedding_id},
                        {"$set": {"live_session": live_session}}
                    )
                else:
                    return {
                        "success": False,
                        "error": "No live session found"
                    }
            
            current_status = LiveStatus(live_session.get("status", "idle"))
            
            # Can only end from LIVE or PAUSED states
            if current_status not in [LiveStatus.LIVE, LiveStatus.PAUSED]:
                return {
                    "success": False,
                    "error": f"Cannot end from {current_status} state"
                }
            
            # Validate transition
            if not await self.transition_status(
                wedding_id=wedding_id,
                new_status=LiveStatus.ENDED,
                reason="Host manually ended live stream",
                triggered_by="host"
            ):
                return {
                    "success": False,
                    "error": "Failed to transition to ENDED"
                }
            
            # Update session and mark wedding as ended
            await self.db.weddings.update_one(
                {"id": wedding_id},
                {"$set": {
                    "live_session.status": LiveStatus.ENDED.value,
                    "live_session.stream_ended_at": datetime.now(timezone.utc),
                    "status": "ended",
                    "can_go_live": False,  # Prevent going live again
                    "playback_url": None  # Clear playback URL
                }}
            )
            
            return {
                "success": True,
                "status": "ended",
                "message": "Live stream ended. Processing recording...",
                "recording_session_id": live_session.get("recording_session_id")
            }
            
        except Exception as e:
            logger.error(f"Error in handle_end_live: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_live_status(self, wedding_id: str) -> Dict:
        """Get current live status for wedding"""
        try:
            wedding = await self.db.weddings.find_one({"id": wedding_id})
            if not wedding:
                return {
                    "success": False,
                    "error": "Wedding not found"
                }
            
            live_session = wedding.get("live_session")
            
            if not live_session:
                return {
                    "success": True,
                    "status": "idle",
                    "can_go_live": wedding.get("can_go_live", True)
                }
            
            status = live_session.get("status", "idle")
            
            # Calculate total duration if live
            total_duration = 0
            if live_session.get("stream_started_at"):
                if status == "live":
                    # Currently live
                    total_duration = int(
                        (datetime.now(timezone.utc) - live_session["stream_started_at"]).total_seconds()
                    ) - live_session.get("total_pause_duration", 0)
                elif status == "ended":
                    # Ended
                    if live_session.get("stream_ended_at"):
                        total_duration = int(
                            (live_session["stream_ended_at"] - live_session["stream_started_at"]).total_seconds()
                        ) - live_session.get("total_pause_duration", 0)
            
            return {
                "success": True,
                "status": status,
                "stream_started_at": live_session.get("stream_started_at"),
                "stream_ended_at": live_session.get("stream_ended_at"),
                "pause_count": live_session.get("pause_count", 0),
                "total_duration": total_duration,
                "total_pause_duration": live_session.get("total_pause_duration", 0),
                "recording_available": status == "ended" and live_session.get("recording_started", False),
                "can_go_live": wedding.get("can_go_live", True),
                "hls_playback_url": live_session.get("hls_playback_url") if status in ["live", "paused"] else None
            }
            
        except Exception as e:
            logger.error(f"Error in get_live_status: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def is_host_authorized(self, wedding_id: str, user_id: str) -> bool:
        """Check if user is creator/admin of the wedding"""
        try:
            wedding = await self.db.weddings.find_one({"id": wedding_id})
            if not wedding:
                return False
            
            # Check if user is the creator
            if wedding.get("creator_id") == user_id:
                return True
            
            # Check if user is admin
            user = await self.db.users.find_one({"id": user_id})
            if user and user.get("role") == "admin":
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error in is_host_authorized: {str(e)}")
            return False
    
    async def add_status_history(
        self, 
        wedding_id: str, 
        status: LiveStatus, 
        reason: str,
        triggered_by: str
    ):
        """Log status change to history"""
        try:
            history_entry = {
                "status": status.value,
                "timestamp": datetime.now(timezone.utc),
                "reason": reason,
                "triggered_by": triggered_by
            }
            
            await self.db.weddings.update_one(
                {"id": wedding_id},
                {"$push": {"live_session.status_history": history_entry}}
            )
            
        except Exception as e:
            logger.error(f"Error in add_status_history: {str(e)}")
