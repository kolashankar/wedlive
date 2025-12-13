from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from app.database import get_db
from app.services.recording_service import RecordingService
from app.services.telegram_service import TelegramCDNService
from datetime import datetime
import re
import logging
import asyncio
import os

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/rtmp/start")
async def rtmp_stream_start(request: Request, background_tasks: BackgroundTasks):
    """Called by NGINX when RTMP stream starts"""
    try:
        data = await request.json()
        stream_key = data.get("name", "")
        
        # Extract wedding_id from stream_key (format: live_{wedding_id}_{uuid})
        match = re.match(r"live_(.+?)_", stream_key)
        if not match:
            logger.error(f"Invalid stream key format: {stream_key}")
            return {"status": "error", "message": "Invalid stream key format"}
        
        wedding_id = match.group(1)
        db = get_db()
        
        # Update wedding status to live and set playback URL
        hls_server_url = os.getenv("HLS_SERVER_URL", "http://localhost:8080").rstrip("/hls")
        playback_url = f"{hls_server_url}/hls/{stream_key}/index.m3u8"
        
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {
                "status": "live", 
                "started_at": datetime.utcnow(),
                "playback_url": playback_url
            }}
        )
        
        # Start auto-recording
        background_tasks.add_task(start_auto_recording, wedding_id, stream_key)
        
        logger.info(f"Stream started for wedding {wedding_id}")
        return {"status": "success", "wedding_id": wedding_id}
        
    except Exception as e:
        logger.error(f"Error in rtmp_stream_start: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/rtmp/stop")
async def rtmp_stream_stop(request: Request, background_tasks: BackgroundTasks):
    """Called by NGINX when RTMP stream stops"""
    try:
        data = await request.json()
        stream_key = data.get("name", "")
        
        # Extract wedding_id from stream_key
        match = re.match(r"live_(.+?)_", stream_key)
        if not match:
            return {"status": "error", "message": "Invalid stream key format"}
        
        wedding_id = match.group(1)
        db = get_db()
        
        # Update wedding status to ended and clear playback URL
        await db.weddings.update_one(
            {"id": wedding_id},
            {"$set": {
                "status": "ended", 
                "ended_at": datetime.utcnow(),
                "playback_url": None
            }}
        )
        
        # Stop recording and upload to Telegram
        background_tasks.add_task(stop_recording_and_upload, wedding_id, stream_key)
        
        logger.info(f"Stream stopped for wedding {wedding_id}")
        return {"status": "success", "wedding_id": wedding_id}
        
    except Exception as e:
        logger.error(f"Error in rtmp_stream_stop: {str(e)}")
        return {"status": "error", "message": str(e)}

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
