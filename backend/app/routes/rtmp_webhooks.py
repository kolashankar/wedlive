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
