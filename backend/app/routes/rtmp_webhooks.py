from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from app.database import get_db
from app.services.recording_service import RecordingService
from app.services.telegram_service import TelegramCDNService
from app.services.live_status_service import LiveStatusService
from app.services.ffmpeg_composition import start_composition
from datetime import datetime
import re
import logging
import asyncio
import os

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/rtmp/on-publish")
async def on_publish(request: Request, background_tasks: BackgroundTasks):
    """
    Called by NGINX when OBS starts streaming
    
    NGINX sends: 
    - stream_key (as 'name')
    - client_ip
    - timestamp
    
    Action:
    1. Find wedding by stream_key (main or camera)
    2. If camera:
       - Mark as live
       - Auto-switch if active is missing
       - Start composition if needed
    3. If main stream:
       - Transition WAITING → LIVE or PAUSED → LIVE
       - Start recording if not already started
       - Notify viewers via WebSocket
    """
    try:
        # NGINX sends form data, not JSON
        data = await request.form()
        stream_key = data.get("name", "")
        
        logger.info(f"[RTMP_PUBLISH] Stream started: {stream_key}")
        
        db = get_db()
        
        # 1. Check if it's a multi-camera stream
        camera_wedding = await db.weddings.find_one({
            "multi_cameras.stream_key": stream_key
        })
        
        if camera_wedding:
            wedding_id = camera_wedding["id"]
            logger.info(f"🎥 Camera stream detected for wedding {wedding_id}")
            
            # Update camera status to live
            await db.weddings.update_one(
                {
                    "id": wedding_id, 
                    "multi_cameras.stream_key": stream_key
                },
                {"$set": {"multi_cameras.$.status": "live"}}
            )
            
            # Retrieve updated wedding to check active camera
            wedding = await db.weddings.find_one({"id": wedding_id})
            
            # Find the camera object
            cameras = wedding.get("multi_cameras", [])
            camera = next((c for c in cameras if c["stream_key"] == stream_key), None)
            
            if camera:
                # If no active camera is set, make this one active
                if not wedding.get("active_camera_id"):
                    logger.info(f"✨ Auto-activating camera {camera['camera_id']} as none was active")
                    await db.weddings.update_one(
                        {"id": wedding_id},
                        {"$set": {"active_camera_id": camera["camera_id"]}}
                    )
                    
                    # Start composition
                    # Ensure hls_url is present or constructed
                    if not camera.get("hls_url"):
                        camera["hls_url"] = f"/hls/{stream_key}.m3u8"
                        
                    background_tasks.add_task(start_composition, wedding_id, camera)
                
                # If this IS the active camera (e.g. reconnected), restart composition
                elif wedding.get("active_camera_id") == camera["camera_id"]:
                    logger.info(f"🔄 Active camera {camera['camera_id']} reconnected - restarting composition")
                    if not camera.get("hls_url"):
                         camera["hls_url"] = f"/hls/{stream_key}.m3u8"
                    background_tasks.add_task(start_composition, wedding_id, camera)
            
            return {"status": "success", "type": "camera", "wedding_id": wedding_id}

        # 2. Check if it's a main stream (legacy/single cam)
        wedding = await db.weddings.find_one({
            "live_session.stream_key": stream_key
        })
        
        if not wedding:
            logger.error(f"[RTMP_PUBLISH] Wedding not found for key: {stream_key}")
            return {"status": "error", "message": "Invalid stream key"}
        
        wedding_id = wedding["id"]
        
        # Transition status using LiveStatusService
        live_service = LiveStatusService(db)
        result = await live_service.handle_stream_start(
            wedding_id=wedding_id,
            stream_key=stream_key
        )
        
        if not result.get("success"):
            logger.error(f"[RTMP_PUBLISH] Failed to start stream: {result.get('error')}")
            return {"status": "error", "message": result.get("error")}
        
        # Start recording in background if needed
        if result.get("should_start_recording"):
            background_tasks.add_task(start_auto_recording, wedding_id, stream_key)
        
        # TODO: Notify viewers via WebSocket
        # background_tasks.add_task(notify_viewers, wedding_id, "stream_started")
        
        logger.info(f"[RTMP_PUBLISH] Stream started successfully for wedding {wedding_id}")
        return {"status": "success", "wedding_id": wedding_id}
        
    except Exception as e:
        logger.error(f"[RTMP_PUBLISH] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


@router.post("/rtmp/on-publish-done")
async def on_publish_done(request: Request, background_tasks: BackgroundTasks):
    """
    Called by NGINX when OBS stops streaming
    
    CRITICAL: This should PAUSE, not END
    
    Action:
    1. Find wedding by stream_key (main or camera)
    2. If camera:
       - Mark as offline
       - Stop composition if it was active
    3. If main stream:
       - Transition LIVE → PAUSED (NEVER end)
       - Keep recording session active
       - Notify viewers "Live will resume shortly"
    """
    try:
        data = await request.form()
        stream_key = data.get("name", "")
        
        logger.info(f"[RTMP_DONE] Stream stopped: {stream_key}")
        
        db = get_db()
        
        # 1. Check if it's a multi-camera stream
        camera_wedding = await db.weddings.find_one({
            "multi_cameras.stream_key": stream_key
        })
        
        if camera_wedding:
            wedding_id = camera_wedding["id"]
            logger.info(f"🎥 Camera stream stopped for wedding {wedding_id}")
            
            # Update camera status to offline (or disconnected)
            await db.weddings.update_one(
                {
                    "id": wedding_id, 
                    "multi_cameras.stream_key": stream_key
                },
                {"$set": {"multi_cameras.$.status": "disconnected"}}
            )
            
            # If this was the active camera, we might need to stop composition or switch
            if camera_wedding.get("active_camera_id"):
                cameras = camera_wedding.get("multi_cameras", [])
                camera = next((c for c in cameras if c["stream_key"] == stream_key), None)
                
                if camera and camera["camera_id"] == camera_wedding.get("active_camera_id"):
                    logger.warning(f"⚠️ Active camera {camera['camera_id']} went offline!")
                    
                    # Try to find another live camera to switch to
                    fallback_camera = next((
                        c for c in cameras 
                        if c["stream_key"] != stream_key 
                        and (c.get("status") == "live" or c.get("status") == "connected")
                    ), None)
                    
                    if fallback_camera:
                        logger.info(f"🔄 Auto-switching to fallback camera: {fallback_camera['name']}")
                        await db.weddings.update_one(
                             {"id": wedding_id},
                             {"$set": {"active_camera_id": fallback_camera["camera_id"]}}
                        )
                        if not fallback_camera.get("hls_url"):
                             fallback_camera["hls_url"] = f"/hls/{fallback_camera['stream_key']}.m3u8"
                        
                        background_tasks.add_task(start_composition, wedding_id, fallback_camera)
                    else:
                        # No fallback? We might just let composition die or explicitly stop it
                        # For now, let's stop it to be safe
                        from app.services.ffmpeg_composition import composition_service
                        await composition_service.stop_composition(wedding_id)
            
            return {"status": "success", "type": "camera", "wedding_id": wedding_id}

        # 2. Check main stream
        wedding = await db.weddings.find_one({
            "live_session.stream_key": stream_key
        })
        
        if not wedding:
            logger.error(f"[RTMP_DONE] Wedding not found for key: {stream_key}")
            return {"status": "error", "message": "Invalid stream key"}
        
        wedding_id = wedding["id"]
        
        # Check if already ENDED (host ended manually)
        live_session = wedding.get("live_session", {})
        if live_session.get("status") == "ended":
            logger.info(f"[RTMP_DONE] Wedding {wedding_id} already ended, ignoring")
            return {"status": "already_ended", "wedding_id": wedding_id}
        
        # Transition to PAUSED (not ended)
        live_service = LiveStatusService(db)
        result = await live_service.handle_stream_stop(
            wedding_id=wedding_id,
            stream_key=stream_key
        )
        
        if not result.get("success"):
            logger.error(f"[RTMP_DONE] Failed to pause stream: {result.get('error')}")
            return {"status": "error", "message": result.get("error")}
        
        # TODO: Notify viewers
        # background_tasks.add_task(notify_viewers, wedding_id, "stream_paused")
        
        logger.info(f"[RTMP_DONE] Stream paused for wedding {wedding_id}")
        return {"status": "success", "wedding_id": wedding_id, "new_status": "paused"}
        
    except Exception as e:
        logger.error(f"[RTMP_DONE] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


@router.post("/rtmp/on-update")
async def on_update(request: Request):
    """
    Called periodically by NGINX while streaming
    Can be used for health checks
    """
    try:
        data = await request.form()
        stream_key = data.get("name", "")
        
        # Update last_seen timestamp
        # Could be used for stale stream detection
        
        # For now, just acknowledge
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"[RTMP_UPDATE] Error: {str(e)}")
        return {"status": "error", "message": str(e)}


# Legacy endpoints for backward compatibility
@router.post("/rtmp/start")
async def rtmp_stream_start(request: Request, background_tasks: BackgroundTasks):
    """DEPRECATED: Use /rtmp/on-publish instead"""
    logger.warning("Legacy /rtmp/start endpoint called - redirecting to /rtmp/on-publish")
    return await on_publish(request, background_tasks)


@router.post("/rtmp/stop")
async def rtmp_stream_stop(request: Request, background_tasks: BackgroundTasks):
    """DEPRECATED: Use /rtmp/on-publish-done instead"""
    logger.warning("Legacy /rtmp/stop endpoint called - redirecting to /rtmp/on-publish-done")
    return await on_publish_done(request, background_tasks)

# Additional legacy endpoints for test compatibility
@router.post("/stream-started")
async def stream_started_legacy(request: Request, background_tasks: BackgroundTasks):
    """LEGACY: Alias for /rtmp/on-publish"""
    logger.warning("Legacy /stream-started endpoint called - redirecting to /rtmp/on-publish")
    return await on_publish(request, background_tasks)

@router.post("/stream-ended")
async def stream_ended_legacy(request: Request, background_tasks: BackgroundTasks):
    """LEGACY: Alias for /rtmp/on-publish-done"""
    logger.warning("Legacy /stream-ended endpoint called - redirecting to /rtmp/on-publish-done")
    return await on_publish_done(request, background_tasks)

async def start_auto_recording(wedding_id: str, stream_key: str):
    """Start recording the stream"""
    try:
        db = get_db()
        recording_service = RecordingService(db)
        
        # Check if auto-record is enabled
        wedding = await db.weddings.find_one({"id": wedding_id})
        settings = wedding.get("settings", {})
        
        if settings.get("auto_record", True):
            result = await recording_service.auto_start_recording(wedding_id)
            logger.info(f"Auto-recording started for wedding {wedding_id}")
        
    except Exception as e:
        logger.error(f"Failed to start recording: {str(e)}")

async def stop_recording_and_upload(wedding_id: str, stream_key: str):
    """Stop recording, encode to MP4, and upload to Telegram CDN"""
    try:
        db = get_db()
        recording_service = RecordingService(db)
        
        # Stop recording
        result = await recording_service.stop_recording(wedding_id, "system")
        
        # Encode to MP4 if recording stopped successfully
        if result and result.get("status") == "completed":
            recording_filename = result.get("recording_url", "").split("/")[-1]
            input_file = f"/tmp/recordings/{recording_filename}"
            
            # Encode to MP4
            encoding_result = await recording_service.encoding_service.encode_to_mp4(input_file, wedding_id)
            
            if encoding_result.get("success"):
                mp4_file = encoding_result.get("output_file")
                
                # Upload MP4 to Telegram CDN
                telegram_service = TelegramCDNService()
                upload_result = await telegram_service.upload_video(
                    file_path=mp4_file,
                    caption=f"Wedding Recording - {wedding_id}",
                    wedding_id=wedding_id
                )
                
                if upload_result.get("success"):
                    # Update database with Telegram file_id
                    await db.recordings.update_one(
                        {"wedding_id": wedding_id, "status": "completed"},
                        {"$set": {
                            "telegram_file_id": upload_result.get("file_id"),
                            "mp4_url": upload_result.get("cdn_url"),
                            "status": "uploaded"
                        }}
                    )
                    
                    logger.info(f"📤 Recording uploaded to Telegram: {upload_result.get('file_id')}")
            
    except Exception as e:
        logger.error(f"Failed to stop recording and upload: {str(e)}")


# ============================================================================
# LIVEKIT WEBHOOKS (PULSE INTEGRATION) - Phase 1.6
# ============================================================================
# These webhooks replace NGINX-RTMP webhooks in Pulse-powered mode.
# LiveKit sends webhooks for room events, participant events, and egress events.
# ============================================================================

@router.post("/webhooks/livekit/room-started")
async def livekit_room_started(request: Request):
    """
    Called by LiveKit when a room is created and becomes active
    
    Payload:
    - room_name: string
    - room_id: string  
    - created_at: timestamp
    - num_participants: int
    
    Action:
    1. Find wedding by room_name (format: wedding_{wedding_id})
    2. Update wedding status to LIVE
    3. Record room_id in pulse_session
    4. Notify viewers via WebSocket
    """
    try:
        payload = await request.json()
        room_name = payload.get("room_name", "")
        room_id = payload.get("room_id", "")
        
        logger.info(f"[LIVEKIT_ROOM_STARTED] Room: {room_name}, ID: {room_id}")
        
        # Extract wedding_id from room_name (format: wedding_{wedding_id})
        if not room_name.startswith("wedding_"):
            logger.warning(f"Invalid room name format: {room_name}")
            return {"status": "ignored", "reason": "invalid_room_name"}
        
        wedding_id = room_name.replace("wedding_", "")
        
        db = get_db()
        wedding = await db.weddings.find_one({"id": wedding_id})
        
        if not wedding:
            logger.error(f"Wedding not found: {wedding_id}")
            raise HTTPException(status_code=404, detail="Wedding not found")
        
        # Update wedding with Pulse session info
        await db.weddings.update_one(
            {"id": wedding_id},
            {
                "$set": {
                    "status": "LIVE",
                    "started_at": datetime.utcnow(),
                    "pulse_session": {
                        "room_name": room_name,
                        "room_id": room_id,
                        "created_at": datetime.utcnow(),
                        "status": "active"
                    }
                }
            }
        )
        
        logger.info(f"✅ Wedding {wedding_id} transitioned to LIVE via Pulse")
        
        # Notify viewers via WebSocket
        try:
            from app.services.camera_websocket import ws_manager
            await ws_manager.broadcast_to_wedding(wedding_id, {
                "type": "room_started",
                "wedding_id": wedding_id,
                "room_name": room_name,
                "room_id": room_id
            })
        except Exception as ws_error:
            logger.warning(f"Failed to send WebSocket notification: {ws_error}")
        
        return {
            "status": "success",
            "wedding_id": wedding_id,
            "room_id": room_id
        }
        
    except Exception as e:
        logger.error(f"Error handling room-started webhook: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhooks/livekit/room-finished")
async def livekit_room_finished(request: Request, background_tasks: BackgroundTasks):
    """
    Called by LiveKit when a room is closed
    
    Payload:
    - room_name: string
    - room_id: string
    - ended_at: timestamp
    - duration_seconds: int
    - num_participants: int
    
    Action:
    1. Find wedding by room_name
    2. Update wedding status to ENDED
    3. Update pulse_session status
    4. Stop any active recordings
    5. Notify viewers
    """
    try:
        payload = await request.json()
        room_name = payload.get("room_name", "")
        room_id = payload.get("room_id", "")
        duration = payload.get("duration_seconds", 0)
        
        logger.info(f"[LIVEKIT_ROOM_FINISHED] Room: {room_name}, Duration: {duration}s")
        
        if not room_name.startswith("wedding_"):
            return {"status": "ignored", "reason": "invalid_room_name"}
        
        wedding_id = room_name.replace("wedding_", "")
        
        db = get_db()
        wedding = await db.weddings.find_one({"id": wedding_id})
        
        if not wedding:
            logger.error(f"Wedding not found: {wedding_id}")
            raise HTTPException(status_code=404, detail="Wedding not found")
        
        # Update wedding status
        await db.weddings.update_one(
            {"id": wedding_id},
            {
                "$set": {
                    "status": "ENDED",
                    "ended_at": datetime.utcnow(),
                    "pulse_session.status": "ended",
                    "pulse_session.ended_at": datetime.utcnow(),
                    "pulse_session.duration_seconds": duration
                }
            }
        )
        
        logger.info(f"✅ Wedding {wedding_id} ended via Pulse")
        
        # Stop any active recordings in background
        try:
            recording_service = RecordingService(db)
            background_tasks.add_task(
                recording_service.stop_recording,
                wedding_id
            )
        except Exception as rec_error:
            logger.warning(f"Failed to stop recording: {rec_error}")
        
        # Notify viewers
        try:
            from app.services.camera_websocket import ws_manager
            await ws_manager.broadcast_to_wedding(wedding_id, {
                "type": "room_finished",
                "wedding_id": wedding_id,
                "duration": duration
            })
        except Exception as ws_error:
            logger.warning(f"Failed to send WebSocket notification: {ws_error}")
        
        return {
            "status": "success",
            "wedding_id": wedding_id,
            "duration": duration
        }
        
    except Exception as e:
        logger.error(f"Error handling room-finished webhook: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhooks/livekit/participant-joined")
async def livekit_participant_joined(request: Request):
    """
    Called by LiveKit when a participant joins a room
    
    Payload:
    - room_name: string
    - participant_id: string (identity)
    - participant_name: string
    - participant_sid: string (session ID)
    - metadata: object
    
    Action:
    1. Parse participant role from metadata (host, camera, viewer)
    2. If camera: Update multi_cameras array with participant_id
    3. If host: Update wedding with host info
    4. Track viewer count
    5. Notify other participants
    """
    try:
        payload = await request.json()
        room_name = payload.get("room_name", "")
        participant_id = payload.get("participant_id", "")
        participant_name = payload.get("participant_name", "")
        participant_sid = payload.get("participant_sid", "")
        metadata = payload.get("metadata", {})
        
        logger.info(f"[LIVEKIT_PARTICIPANT_JOINED] Room: {room_name}, Participant: {participant_name}")
        
        if not room_name.startswith("wedding_"):
            return {"status": "ignored"}
        
        wedding_id = room_name.replace("wedding_", "")
        role = metadata.get("role", "viewer")
        
        db = get_db()
        wedding = await db.weddings.find_one({"id": wedding_id})
        
        if not wedding:
            logger.warning(f"Wedding not found: {wedding_id}")
            return {"status": "error", "message": "Wedding not found"}
        
        # Handle different participant roles
        if role == "camera":
            # Update multi-camera with LiveKit participant info
            camera_id = metadata.get("camera_id")
            if camera_id:
                await db.weddings.update_one(
                    {"id": wedding_id, "multi_cameras.camera_id": camera_id},
                    {
                        "$set": {
                            "multi_cameras.$.status": "live",
                            "multi_cameras.$.participant_id": participant_id,
                            "multi_cameras.$.participant_sid": participant_sid,
                            "multi_cameras.$.joined_at": datetime.utcnow()
                        }
                    }
                )
                logger.info(f"📹 Camera {camera_id} joined as LiveKit participant")
        
        elif role == "host":
            # Track host participant
            await db.weddings.update_one(
                {"id": wedding_id},
                {
                    "$set": {
                        "host_participant_id": participant_id,
                        "host_participant_sid": participant_sid
                    }
                }
            )
            logger.info(f"🎙️ Host joined: {participant_name}")
        
        elif role == "viewer":
            # Increment viewer count
            await db.weddings.update_one(
                {"id": wedding_id},
                {"$inc": {"viewers_count": 1}}
            )
            logger.info(f"👁️ Viewer joined (count +1)")
        
        # Notify other participants
        try:
            from app.services.camera_websocket import ws_manager
            await ws_manager.broadcast_to_wedding(wedding_id, {
                "type": "participant_joined",
                "participant_id": participant_id,
                "participant_name": participant_name,
                "role": role
            })
        except Exception as ws_error:
            logger.warning(f"WebSocket notification failed: {ws_error}")
        
        return {
            "status": "success",
            "wedding_id": wedding_id,
            "participant_id": participant_id,
            "role": role
        }
        
    except Exception as e:
        logger.error(f"Error handling participant-joined webhook: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}


@router.post("/webhooks/livekit/participant-left")
async def livekit_participant_left(request: Request):
    """
    Called by LiveKit when a participant leaves a room
    
    Payload:
    - room_name: string
    - participant_id: string
    - participant_name: string
    - duration_seconds: int
    - metadata: object
    
    Action:
    1. Update camera status if camera participant
    2. Decrement viewer count if viewer
    3. Notify other participants
    4. Handle automatic camera switching if needed
    """
    try:
        payload = await request.json()
        room_name = payload.get("room_name", "")
        participant_id = payload.get("participant_id", "")
        participant_name = payload.get("participant_name", "")
        metadata = payload.get("metadata", {})
        
        logger.info(f"[LIVEKIT_PARTICIPANT_LEFT] Room: {room_name}, Participant: {participant_name}")
        
        if not room_name.startswith("wedding_"):
            return {"status": "ignored"}
        
        wedding_id = room_name.replace("wedding_", "")
        role = metadata.get("role", "viewer")
        
        db = get_db()
        wedding = await db.weddings.find_one({"id": wedding_id})
        
        if not wedding:
            logger.warning(f"Wedding not found: {wedding_id}")
            return {"status": "error", "message": "Wedding not found"}
        
        # Handle different participant roles
        if role == "camera":
            camera_id = metadata.get("camera_id")
            if camera_id:
                # Mark camera as offline
                await db.weddings.update_one(
                    {"id": wedding_id, "multi_cameras.camera_id": camera_id},
                    {
                        "$set": {
                            "multi_cameras.$.status": "offline",
                            "multi_cameras.$.left_at": datetime.utcnow()
                        },
                        "$unset": {
                            "multi_cameras.$.participant_id": "",
                            "multi_cameras.$.participant_sid": ""
                        }
                    }
                )
                
                # If this was the active camera, switch to another live camera
                if wedding.get("active_camera_id") == camera_id:
                    logger.warning(f"⚠️ Active camera {camera_id} disconnected")
                    
                    # Find another live camera
                    other_cameras = [
                        c for c in wedding.get("multi_cameras", [])
                        if c.get("status") == "live" and c["camera_id"] != camera_id
                    ]
                    
                    if other_cameras:
                        new_active = other_cameras[0]
                        await db.weddings.update_one(
                            {"id": wedding_id},
                            {"$set": {"active_camera_id": new_active["camera_id"]}}
                        )
                        logger.info(f"🔄 Auto-switched to camera {new_active['camera_id']}")
                    else:
                        logger.warning("No other live cameras available")
        
        elif role == "viewer":
            # Decrement viewer count (don't go below 0)
            await db.weddings.update_one(
                {"id": wedding_id, "viewers_count": {"$gt": 0}},
                {"$inc": {"viewers_count": -1}}
            )
            logger.info(f"👁️ Viewer left (count -1)")
        
        # Notify other participants
        try:
            from app.services.camera_websocket import ws_manager
            await ws_manager.broadcast_to_wedding(wedding_id, {
                "type": "participant_left",
                "participant_id": participant_id,
                "participant_name": participant_name,
                "role": role
            })
        except Exception as ws_error:
            logger.warning(f"WebSocket notification failed: {ws_error}")
        
        return {
            "status": "success",
            "wedding_id": wedding_id,
            "participant_id": participant_id
        }
        
    except Exception as e:
        logger.error(f"Error handling participant-left webhook: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}


@router.post("/webhooks/livekit/egress-started")
async def livekit_egress_started(request: Request):
    """
    Called by LiveKit when an egress (recording/stream) starts
    
    Payload:
    - egress_id: string
    - room_name: string
    - egress_type: string (room_composite, track, stream)
    - status: string (starting, active)
    - started_at: timestamp
    
    Action:
    1. Find wedding by room_name
    2. Create or update recording record
    3. Store egress_id for tracking
    4. Update wedding recording_status
    """
    try:
        payload = await request.json()
        egress_id = payload.get("egress_id", "")
        room_name = payload.get("room_name", "")
        egress_type = payload.get("egress_type", "room_composite")
        status = payload.get("status", "starting")
        
        logger.info(f"[LIVEKIT_EGRESS_STARTED] Egress: {egress_id}, Room: {room_name}, Type: {egress_type}")
        
        if not room_name.startswith("wedding_"):
            return {"status": "ignored"}
        
        wedding_id = room_name.replace("wedding_", "")
        
        db = get_db()
        wedding = await db.weddings.find_one({"id": wedding_id})
        
        if not wedding:
            logger.error(f"Wedding not found: {wedding_id}")
            return {"status": "error", "message": "Wedding not found"}
        
        # Create or update recording record
        recording_service = RecordingService(db)
        
        # Check if recording exists
        existing_recording = await db.recordings.find_one({
            "wedding_id": wedding_id,
            "status": {"$in": ["recording", "processing"]}
        })
        
        if existing_recording:
            # Update with egress_id
            await db.recordings.update_one(
                {"id": existing_recording["id"]},
                {
                    "$set": {
                        "pulse_egress_id": egress_id,
                        "egress_type": egress_type,
                        "status": "recording",
                        "started_at": datetime.utcnow()
                    }
                }
            )
            logger.info(f"📹 Updated recording {existing_recording['id']} with egress_id")
        else:
            # Create new recording
            recording_id = str(uuid.uuid4())
            await db.recordings.insert_one({
                "id": recording_id,
                "wedding_id": wedding_id,
                "pulse_egress_id": egress_id,
                "egress_type": egress_type,
                "status": "recording",
                "started_at": datetime.utcnow(),
                "created_at": datetime.utcnow()
            })
            logger.info(f"📹 Created new recording {recording_id} for egress {egress_id}")
        
        # Update wedding
        await db.weddings.update_one(
            {"id": wedding_id},
            {
                "$set": {
                    "recording_status": "recording",
                    "recording_egress_id": egress_id
                }
            }
        )
        
        return {
            "status": "success",
            "wedding_id": wedding_id,
            "egress_id": egress_id
        }
        
    except Exception as e:
        logger.error(f"Error handling egress-started webhook: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}


@router.post("/webhooks/livekit/egress-ended")
async def livekit_egress_ended(request: Request, background_tasks: BackgroundTasks):
    """
    Called by LiveKit when an egress (recording/stream) ends
    
    Payload:
    - egress_id: string
    - room_name: string
    - status: string (complete, failed)
    - ended_at: timestamp
    - duration_seconds: int
    - file_url: string (recording URL)
    - file_size_bytes: int
    - error: string (if failed)
    
    Action:
    1. Find recording by egress_id
    2. Update recording with final details
    3. If file_url provided, process recording
    4. Upload to Telegram CDN in background
    5. Update wedding recording_status
    """
    try:
        payload = await request.json()
        egress_id = payload.get("egress_id", "")
        room_name = payload.get("room_name", "")
        status = payload.get("status", "complete")
        duration = payload.get("duration_seconds", 0)
        file_url = payload.get("file_url")
        file_size = payload.get("file_size_bytes", 0)
        error = payload.get("error")
        
        logger.info(f"[LIVEKIT_EGRESS_ENDED] Egress: {egress_id}, Status: {status}, Duration: {duration}s")
        
        db = get_db()
        
        # Find recording by egress_id
        recording = await db.recordings.find_one({"pulse_egress_id": egress_id})
        
        if not recording:
            logger.error(f"Recording not found for egress_id: {egress_id}")
            return {"status": "error", "message": "Recording not found"}
        
        recording_id = recording["id"]
        wedding_id = recording["wedding_id"]
        
        # Update recording with final details
        update_data = {
            "status": "completed" if status == "complete" else "failed",
            "ended_at": datetime.utcnow(),
            "duration_seconds": duration,
            "file_size_bytes": file_size,
            "updated_at": datetime.utcnow()
        }
        
        if file_url:
            update_data["recording_urls"] = {
                "r2": file_url,
                "streaming": file_url.replace(".mp4", "/playlist.m3u8")
            }
        
        if error:
            update_data["error"] = error
            logger.error(f"Egress failed: {error}")
        
        await db.recordings.update_one(
            {"id": recording_id},
            {"$set": update_data}
        )
        
        # Update wedding
        await db.weddings.update_one(
            {"id": wedding_id},
            {
                "$set": {
                    "recording_status": "completed" if status == "complete" else "failed",
                    "recording_url": file_url if file_url else None
                },
                "$unset": {"recording_egress_id": ""}
            }
        )
        
        logger.info(f"✅ Recording {recording_id} marked as {status}")
        
        # If successful, upload to Telegram CDN in background
        if status == "complete" and file_url:
            telegram_service = TelegramCDNService()
            
            async def upload_to_telegram():
                try:
                    logger.info(f"📤 Uploading recording {recording_id} to Telegram CDN...")
                    upload_result = await telegram_service.upload_video_from_url(
                        file_url,
                        f"wedding_{wedding_id}_recording.mp4"
                    )
                    
                    if upload_result and upload_result.get("file_id"):
                        await db.recordings.update_one(
                            {"id": recording_id},
                            {
                                "$set": {
                                    "telegram_file_id": upload_result["file_id"],
                                    "recording_urls.telegram_cdn": upload_result.get("cdn_url"),
                                    "status": "uploaded"
                                }
                            }
                        )
                        logger.info(f"✅ Recording uploaded to Telegram: {upload_result['file_id']}")
                except Exception as upload_error:
                    logger.error(f"Failed to upload to Telegram: {upload_error}")
            
            background_tasks.add_task(upload_to_telegram)
        
        return {
            "status": "success",
            "recording_id": recording_id,
            "wedding_id": wedding_id,
            "egress_status": status
        }
        
    except Exception as e:
        logger.error(f"Error handling egress-ended webhook: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}

