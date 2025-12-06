from fastapi import APIRouter, HTTPException, status, Depends
from app.models import StreamResponse, StreamStatus
from app.auth import get_current_user
from app.database import get_db
from typing import List

router = APIRouter()

@router.get("/live", response_model=List[StreamResponse])
async def get_live_streams():
    """Get all currently live streams"""
    db = get_db()
    
    cursor = db.weddings.find({"status": StreamStatus.LIVE.value})
    weddings = await cursor.to_list(length=100)
    
    return [
        StreamResponse(
            id=w["id"],
            wedding_id=w["id"],
            stream_call_id=w.get("stream_call_id"),
            status=StreamStatus(w["status"]),
            started_at=w.get("started_at"),
            ended_at=w.get("ended_at"),
            recording_url=w.get("recording_url"),
            viewers_count=w.get("viewers_count", 0)
        )
        for w in weddings
    ]

@router.post("/{wedding_id}/start")
async def start_stream(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Start a stream"""
    db = get_db()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    # Check ownership
    if wedding["creator_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Update status to live
    from datetime import datetime
    await db.weddings.update_one(
        {"id": wedding_id},
        {"$set": {"status": StreamStatus.LIVE.value, "started_at": datetime.utcnow()}}
    )
    
    # Trigger webhook
    try:
        from app.services.webhook_service import trigger_stream_started
        await trigger_stream_started(wedding["creator_id"], wedding_id, {
            "title": wedding["title"],
            "bride_name": wedding["bride_name"],
            "groom_name": wedding["groom_name"]
        })
    except:
        pass  # Don't fail if webhook fails
    
    return {"message": "Stream started", "status": "live"}

@router.post("/{wedding_id}/end")
async def end_stream(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """End a stream"""
    db = get_db()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    # Check ownership
    if wedding["creator_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Update status to ended
    from datetime import datetime
    await db.weddings.update_one(
        {"id": wedding_id},
        {"$set": {"status": StreamStatus.ENDED.value, "ended_at": datetime.utcnow()}}
    )
    
    # Trigger webhook
    try:
        from app.services.webhook_service import trigger_stream_ended
        await trigger_stream_ended(wedding["creator_id"], wedding_id, {
            "title": wedding["title"],
            "bride_name": wedding["bride_name"],
            "groom_name": wedding["groom_name"]
        })
    except:
        pass  # Don't fail if webhook fails
    
    return {"message": "Stream ended", "status": "ended"}
