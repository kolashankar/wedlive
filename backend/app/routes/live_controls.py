from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from app.database import get_db
from app.auth import get_current_user
from app.services.live_status_service import LiveStatusService
from app.services.recording_service import RecordingService
from app.services.telegram_service import TelegramCDNService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/weddings/{wedding_id}/live/go-live")
async def go_live(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Host clicks "Go Live" button
    
    Actions:
    1. Verify user is creator/admin
    2. Check if wedding can go live (not already ended)
    3. Transition IDLE → WAITING
    4. Return RTMP credentials
    5. Show "Waiting for OBS stream..." message
    """
    try:
        db = get_db()
        live_service = LiveStatusService(db)
        
        # Check authorization
        if not await live_service.is_host_authorized(wedding_id, current_user["id"]):
            raise HTTPException(
                status_code=403,
                detail="Only wedding creator can control live stream"
            )
        
        # Check if can go live
        wedding = await db.weddings.find_one({"id": wedding_id})
        if not wedding:
            raise HTTPException(
                status_code=404,
                detail="Wedding not found"
            )
        
        if not wedding.get("can_go_live", True):
            raise HTTPException(
                status_code=400,
                detail="This wedding has already ended. Cannot go live again."
            )
        
        # Transition to WAITING
        result = await live_service.handle_go_live(wedding_id, current_user["id"])
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to go live")
            )
        
        return {
            "status": "waiting",
            "message": "Waiting for OBS stream to start",
            "rtmp_url": result["rtmp_url"],
            "stream_key": result["stream_key"],
            "hls_playback_url": result["hls_playback_url"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in go_live: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/weddings/{wedding_id}/live/pause")
async def pause_live(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Host manually pauses live stream
    
    Actions:
    1. Verify authorization
    2. Transition LIVE → PAUSED
    3. Keep recording active
    4. Notify viewers
    """
    try:
        db = get_db()
        live_service = LiveStatusService(db)
        
        if not await live_service.is_host_authorized(wedding_id, current_user["id"]):
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        result = await live_service.handle_pause_live(wedding_id, current_user["id"])
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to pause")
            )
        
        return {
            "status": "paused",
            "message": "Live stream paused. Recording continues.",
            "pause_count": result.get("pause_count", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in pause_live: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/weddings/{wedding_id}/live/resume")
async def resume_live(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Host manually resumes live stream
    
    Actions:
    1. Verify authorization
    2. Check if OBS is currently streaming
    3. If streaming: PAUSED → LIVE
    4. If not: Show "Please start OBS first"
    """
    try:
        db = get_db()
        live_service = LiveStatusService(db)
        
        if not await live_service.is_host_authorized(wedding_id, current_user["id"]):
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        result = await live_service.handle_resume_live(wedding_id, current_user["id"])
        
        if not result.get("success"):
            return {
                "status": "error",
                "message": "Cannot resume. Please start OBS stream first."
            }
        
        return {
            "status": "live",
            "message": "Live stream resumed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in resume_live: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/weddings/{wedding_id}/live/end")
async def end_live(
    wedding_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Host clicks "End Live" - FINAL action
    
    Actions:
    1. Verify authorization
    2. Confirm action (should be confirmed in frontend)
    3. Transition → ENDED
    4. Stop recording
    5. Finalize video (merge segments if paused/resumed)
    6. Upload to Telegram CDN
    7. Mark can_go_live = False
    8. Notify all viewers
    """
    try:
        db = get_db()
        live_service = LiveStatusService(db)
        
        if not await live_service.is_host_authorized(wedding_id, current_user["id"]):
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        result = await live_service.handle_end_live(wedding_id, current_user["id"])
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to end live")
            )
        
        # Process recording in background
        recording_session_id = result.get("recording_session_id")
        if recording_session_id:
            background_tasks.add_task(
                finalize_and_upload_recording,
                wedding_id,
                recording_session_id
            )
        
        # TODO: Notify viewers
        # background_tasks.add_task(notify_viewers, wedding_id, "stream_ended")
        
        return {
            "status": "ended",
            "message": "Live stream ended. Processing recording...",
            "recording_session_id": recording_session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in end_live: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weddings/{wedding_id}/live/status")
async def get_live_status(wedding_id: str):
    """
    Get current live status (public endpoint)
    
    Returns:
    - status: idle, waiting, live, paused, ended
    - stream_started_at
    - pause_count
    - total_duration
    - recording_available (if ended)
    """
    try:
        db = get_db()
        live_service = LiveStatusService(db)
        
        status_data = await live_service.get_live_status(wedding_id)
        
        if not status_data.get("success"):
            raise HTTPException(
                status_code=404,
                detail=status_data.get("error", "Wedding not found")
            )
        
        # Remove success flag from response
        status_data.pop("success", None)
        
        return status_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_live_status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Background task helpers

async def finalize_and_upload_recording(wedding_id: str, recording_session_id: str):
    """
    Finalize recording and upload to Telegram CDN
    
    Steps:
    1. Stop recording if still running
    2. Merge segments if multiple (from pause/resume)
    3. Encode to MP4
    4. Upload to Telegram CDN
    5. Update database with final URL
    """
    try:
        db = get_db()
        recording_service = RecordingService(db)
        
        logger.info(f"[FINALIZE] Starting recording finalization for wedding {wedding_id}")
        
        # Stop recording if still running
        stop_result = await recording_service.stop_recording(wedding_id, "system")
        
        if stop_result and stop_result.get("status") == "completed":
            recording_filename = stop_result.get("recording_url", "").split("/")[-1]
            input_file = f"/tmp/recordings/{recording_filename}"
            
            # Encode to MP4
            logger.info(f"[FINALIZE] Encoding to MP4: {input_file}")
            encoding_result = await recording_service.encoding_service.encode_to_mp4(
                input_file,
                wedding_id
            )
            
            if encoding_result.get("success"):
                mp4_file = encoding_result.get("output_file")
                
                # Upload MP4 to Telegram CDN
                logger.info(f"[FINALIZE] Uploading to Telegram CDN: {mp4_file}")
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
                            "status": "uploaded",
                            "recording_session_id": recording_session_id
                        }}
                    )
                    
                    # Update wedding with recording URL
                    await db.weddings.update_one(
                        {"id": wedding_id},
                        {"$set": {
                            "recording_url": upload_result.get("cdn_url")
                        }}
                    )
                    
                    logger.info(f"[FINALIZE] ✅ Recording uploaded successfully: {upload_result.get('file_id')}")
                else:
                    logger.error(f"[FINALIZE] Failed to upload to Telegram: {upload_result}")
            else:
                logger.error(f"[FINALIZE] Failed to encode: {encoding_result}")
        else:
            logger.error(f"[FINALIZE] Failed to stop recording: {stop_result}")
            
    except Exception as e:
        logger.error(f"[FINALIZE] Error: {str(e)}")
        import traceback
        traceback.print_exc()
