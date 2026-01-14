from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models import RecordingCreate, RecordingResponse, RecordingListResponse
from app.services.recording_service import RecordingService
from app.services.socket_service import broadcast_recording_started, broadcast_recording_completed
from app.database import get_database
from app.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/recording", tags=["Recording"])


@router.post("/start", response_model=dict)
async def start_recording(
    recording_data: RecordingCreate,
    db=Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """
    Start DVR recording for a wedding stream
    Requires wedding creator or admin role
    """
    try:
        recording_service = RecordingService(db)
        
        result = await recording_service.start_recording(
            wedding_id=recording_data.wedding_id,
            quality=recording_data.quality,
            user_id=current_user["user_id"]
        )
        
        # Broadcast recording started event via Socket.IO
        if result["status"] == "recording":
            await broadcast_recording_started(
                wedding_id=recording_data.wedding_id,
                recording_data=result
            )
        
        return {
            "success": True,
            "message": "Recording started successfully",
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Failed to start recording: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop/{wedding_id}", response_model=dict)
async def stop_recording(
    wedding_id: str,
    db=Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """
    Stop DVR recording for a wedding stream
    Requires wedding creator or admin role
    """
    try:
        recording_service = RecordingService(db)
        
        result = await recording_service.stop_recording(
            wedding_id=wedding_id,
            user_id=current_user["user_id"]
        )
        
        # Broadcast recording completed event via Socket.IO
        await broadcast_recording_completed(
            wedding_id=wedding_id,
            recording_data=result
        )
        
        return {
            "success": True,
            "message": "Recording stopped successfully",
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Failed to stop recording: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{recording_id}", response_model=dict)
async def get_recording_status(
    recording_id: str,
    db=Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """
    Get status of a specific recording
    """
    try:
        recording_service = RecordingService(db)
        result = await recording_service.get_recording_status(recording_id)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Failed to get recording status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/wedding/{wedding_id}", response_model=List[dict])
async def get_wedding_recordings(
    wedding_id: str,
    db=Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all recordings for a wedding
    Returns list of recordings with metadata
    """
    try:
        recording_service = RecordingService(db)
        recordings = await recording_service.get_wedding_recordings(wedding_id)
        
        return recordings
        
    except Exception as e:
        logger.error(f"Failed to get wedding recordings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{recording_id}")
async def delete_recording(
    recording_id: str,
    db=Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a recording
    TODO: Implement recording deletion from storage
    """
    try:
        # For now, just mark as deleted in database
        recordings_collection = db.recordings
        result = await recordings_collection.delete_one({"_id": recording_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        return {
            "success": True,
            "message": "Recording deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete recording: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
