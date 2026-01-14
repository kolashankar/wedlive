from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from app.database import get_db
from app.services.recording_service import RecordingService
from app.services.telegram_service import TelegramCDNService
from app.services.live_status_service import LiveStatusService
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
    1. Find wedding by stream_key
    2. Transition WAITING → LIVE or PAUSED → LIVE
    3. Start recording if not already started
    4. Notify viewers via WebSocket
    """
    try:
        # NGINX sends form data, not JSON
        data = await request.form()
        stream_key = data.get("name", "")
        
        logger.info(f"[RTMP_PUBLISH] Stream started: {stream_key}")
        
        # Find wedding by stream_key
        db = get_db()
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
    1. Find wedding by stream_key
    2. Transition LIVE → PAUSED (NEVER end)
    3. Keep recording session active
    4. Notify viewers "Live will resume shortly"
    """
    try:
        data = await request.form()
        stream_key = data.get("name", "")
        
        logger.info(f"[RTMP_DONE] Stream stopped: {stream_key}")
        
        db = get_db()
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
