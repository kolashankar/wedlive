from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.models import (
    ViewerSessionCreate, ViewerSessionResponse,
    StreamQualityMetric, StreamQualityResponse,
    EngagementMetrics, AnalyticsDashboard
)
from app.database import get_database
from app.auth import get_current_user, get_current_user_optional

router = APIRouter()

# ==================== VIEWER SESSIONS ====================

@router.post("/sessions", response_model=ViewerSessionResponse)
async def create_viewer_session(
    session: ViewerSessionCreate,
    current_user: dict = Depends(get_current_user_optional)
):
    """Create a viewer session when someone joins a wedding stream"""
    db = await get_database()
    
    # Generate a unique session ID
    session_id = str(uuid.uuid4())
    
    # Check if session already exists for this user/wedding
    existing_session = await db.viewer_sessions.find_one({
        "wedding_id": session.wedding_id,
        "user_id": current_user["user_id"] if current_user else None,
        "leave_time": None
    })
    
    if existing_session:
        return ViewerSessionResponse(**existing_session)
    
    # Create new session
    session_doc = {
        "id": str(uuid.uuid4()),
        "wedding_id": session.wedding_id,
        "session_id": session_id,
        "user_id": current_user["user_id"] if current_user else None,
        "timezone": getattr(session, 'timezone', 'UTC'),
        "user_agent": session.user_agent,
        "ip_address": getattr(session, 'ip_address', None),
        "join_time": datetime.utcnow(),
        "leave_time": None,
        "duration_seconds": 0,
        "chat_messages_count": 0,
        "reactions_count": 0
    }
    
    await db.viewer_sessions.insert_one(session_doc)
    
    # Update wedding viewers count
    await db.weddings.update_one(
        {"id": session.wedding_id},
        {"$inc": {"viewers_count": 1}}
    )
    
    return ViewerSessionResponse(**session_doc)


@router.put("/sessions/{session_id}/end")
async def end_viewer_session(session_id: str, wedding_id: str):
    """End a viewer session when someone leaves"""
    db = await get_database()
    
    session = await db.viewer_sessions.find_one({
        "session_id": session_id,
        "wedding_id": wedding_id,
        "leave_time": None
    })
    
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
    
    leave_time = datetime.utcnow()
    duration = int((leave_time - session["join_time"]).total_seconds())
    
    await db.viewer_sessions.update_one(
        {"session_id": session_id, "wedding_id": wedding_id},
        {
            "$set": {
                "leave_time": leave_time,
                "duration_seconds": duration
            }
        }
    )
    
    return {"message": "Session ended", "duration_seconds": duration}


@router.get("/sessions/{wedding_id}", response_model=List[ViewerSessionResponse])
async def get_wedding_sessions(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all viewer sessions for a wedding (creator/admin only)"""
    db = await get_database()
    
    # Verify user is creator or admin
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    if current_user["role"] != "admin" and wedding["creator_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    sessions = await db.viewer_sessions.find(
        {"wedding_id": wedding_id}
    ).sort("join_time", -1).to_list(length=1000)
    
    return [ViewerSessionResponse(**s) for s in sessions]


# ==================== STREAM QUALITY ====================

@router.post("/quality", response_model=StreamQualityResponse)
async def record_stream_quality(metric: StreamQualityMetric):
    """Record stream quality metrics"""
    db = await get_database()
    
    # Use the timestamp from the metric if provided, otherwise use current time
    timestamp = getattr(metric, 'timestamp', datetime.utcnow())
    
    metric_doc = {
        "id": str(uuid.uuid4()),
        "wedding_id": metric.wedding_id,
        "session_id": getattr(metric, 'session_id', None),
        "bitrate": metric.bitrate,
        "resolution": getattr(metric, 'resolution', '720p'),
        "buffering_events": getattr(metric, 'buffering_events', 0),
        "buffering_duration_ms": getattr(metric, 'buffering_duration_ms', 0),
        "fps": metric.fps,
        "dropped_frames": getattr(metric, 'dropped_frames', 0),
        "timestamp": timestamp
    }
    
    await db.stream_quality_metrics.insert_one(metric_doc)
    
    return StreamQualityResponse(**metric_doc)


@router.get("/quality/{wedding_id}")
async def get_stream_quality_stats(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get aggregated stream quality statistics"""
    db = await get_database()
    
    # Verify user is creator or admin
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    if current_user["role"] != "admin" and wedding["creator_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Aggregate quality metrics
    pipeline = [
        {"$match": {"wedding_id": wedding_id}},
        {
            "$group": {
                "_id": None,
                "avg_bitrate": {"$avg": "$bitrate"},
                "avg_fps": {"$avg": "$fps"},
                "total_buffering_events": {"$sum": "$buffering_events"},
                "total_buffering_duration": {"$sum": "$buffering_duration_ms"},
                "resolutions": {"$push": "$resolution"}
            }
        }
    ]
    
    result = await db.stream_quality_metrics.aggregate(pipeline).to_list(length=1)
    
    if not result:
        return {
            "avg_bitrate": 0,
            "avg_fps": 0,
            "total_buffering_events": 0,
            "total_buffering_duration": 0,
            "resolutions": []
        }
    
    return result[0]


# ==================== ENGAGEMENT METRICS ====================

@router.get("/engagement/{wedding_id}", response_model=EngagementMetrics)
async def get_engagement_metrics(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get engagement metrics for a wedding"""
    db = await get_database()
    
    # Verify user is creator or admin
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    if current_user["role"] != "admin" and wedding["creator_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get viewer statistics
    sessions = await db.viewer_sessions.find({"wedding_id": wedding_id}).to_list(length=10000)
    
    total_viewers = len(sessions)
    
    # Calculate peak viewers
    if sessions:
        # Group by 5-minute intervals
        time_buckets = {}
        for session in sessions:
            bucket_time = session["join_time"].replace(second=0, microsecond=0)
            bucket_time = bucket_time.replace(minute=(bucket_time.minute // 5) * 5)
            time_buckets[bucket_time] = time_buckets.get(bucket_time, 0) + 1
        
        peak_viewers = max(time_buckets.values()) if time_buckets else 0
        peak_time = max(time_buckets, key=time_buckets.get) if time_buckets else None
        
        # Calculate average watch duration
        durations = [s["duration_seconds"] for s in sessions if s.get("duration_seconds", 0) > 0]
        avg_duration = sum(durations) / len(durations) if durations else 0
    else:
        peak_viewers = 0
        peak_time = None
        avg_duration = 0
    
    # Count chat messages
    total_chat = await db.chat_messages.count_documents({"wedding_id": wedding_id})
    
    # Count reactions
    total_reactions = await db.reactions.count_documents({"wedding_id": wedding_id})
    
    # Count guest book entries
    total_guest_book = await db.guest_book.count_documents({"wedding_id": wedding_id})
    
    # Count photo booth photos
    total_photo_booth = await db.photo_booth.count_documents({"wedding_id": wedding_id})
    
    # Get timezone distribution
    timezone_distribution = {}
    for session in sessions:
        tz = session.get("timezone", "Unknown")
        timezone_distribution[tz] = timezone_distribution.get(tz, 0) + 1
    
    return EngagementMetrics(
        total_viewers=total_viewers,
        peak_concurrent_viewers=peak_viewers,
        average_watch_time_seconds=avg_duration,
        total_chat_messages=total_chat,
        total_reactions=total_reactions,
        unique_viewers=total_viewers  # Assuming all viewers are unique for now
    )


# ==================== ANALYTICS DASHBOARD ====================

@router.get("/dashboard/{wedding_id}", response_model=AnalyticsDashboard)
async def get_analytics_dashboard(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get complete analytics dashboard for a wedding"""
    db = await get_database()
    
    # Verify user is creator or admin
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    if current_user["role"] != "admin" and wedding["creator_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get engagement metrics
    engagement = await get_engagement_metrics(wedding_id, current_user)
    
    # Get stream quality stats
    quality_stats = await get_stream_quality_stats(wedding_id, current_user)
    
    # Get viewer stats
    sessions = await db.viewer_sessions.find({"wedding_id": wedding_id}).to_list(length=10000)
    
    active_sessions = [s for s in sessions if s.get("leave_time") is None]
    completed_sessions = [s for s in sessions if s.get("leave_time") is not None]
    
    viewer_stats = {
        "total_viewers": len(sessions),
        "active_viewers": len(active_sessions),
        "completed_sessions": len(completed_sessions),
        "avg_duration": sum([s.get("duration_seconds", 0) for s in completed_sessions]) / len(completed_sessions) if completed_sessions else 0
    }
    
    # Build peak viewership timeline (15-minute intervals)
    timeline = []
    if sessions:
        time_buckets = {}
        for session in sessions:
            bucket_time = session["join_time"].replace(second=0, microsecond=0)
            bucket_time = bucket_time.replace(minute=(bucket_time.minute // 15) * 15)
            time_buckets[bucket_time] = time_buckets.get(bucket_time, 0) + 1
        
        timeline = [
            {"time": time, "viewers": count}
            for time, count in sorted(time_buckets.items())
        ]
    
    # Get timezone distribution
    timezone_dist = {}
    for session in sessions:
        tz = session.get("timezone", "Unknown")
        timezone_dist[tz] = timezone_dist.get(tz, 0) + 1
    
    return AnalyticsDashboard(
        wedding_id=wedding_id,
        engagement=engagement,
        quality_metrics=quality_stats,
        viewer_sessions=[ViewerSessionResponse(**s) for s in sessions]
    )
