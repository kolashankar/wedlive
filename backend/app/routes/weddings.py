from fastapi import APIRouter, HTTPException, status, Depends
from app.models import (
    WeddingCreate, WeddingUpdate, WeddingResponse,
    StreamStatus, StreamCredentials
)
from app.auth import get_current_user, get_current_creator
from app.database import get_db
from app.services.stream_service import StreamService
from app.utils import generate_short_code
from datetime import datetime
from typing import List
import uuid

router = APIRouter()
stream_service = StreamService()

@router.post("/", response_model=WeddingResponse, status_code=status.HTTP_201_CREATED)
async def create_wedding(
    wedding_data: WeddingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new wedding event"""
    db = get_db()
    
    # Get user's subscription plan
    user = await db.users.find_one({"id": current_user["user_id"]})
    subscription_plan = user.get("subscription_plan", "free") if user else "free"
    
    # Check if user is on free plan and already has a wedding
    if subscription_plan == "free":
        existing_weddings_count = await db.weddings.count_documents({"creator_id": current_user["user_id"]})
        if existing_weddings_count >= 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Free plan users can only create 1 wedding event. Please upgrade to Premium to create unlimited weddings."
            )
    
    # Generate RTMP credentials using Stream.com
    stream_creds = await stream_service.create_stream()
    
    # Generate unique short code for easy sharing
    short_code = generate_short_code()
    # Ensure short code is unique
    while await db.weddings.find_one({"short_code": short_code}):
        short_code = generate_short_code()
    
    wedding_id = str(uuid.uuid4())
    wedding = {
        "id": wedding_id,
        "short_code": short_code,
        "title": wedding_data.title,
        "description": wedding_data.description,
        "bride_name": wedding_data.bride_name,
        "groom_name": wedding_data.groom_name,
        "creator_id": current_user["user_id"],
        "scheduled_date": wedding_data.scheduled_date,
        "location": wedding_data.location,
        "cover_image": wedding_data.cover_image,
        "status": StreamStatus.SCHEDULED.value,
        "stream_call_id": stream_creds["call_id"],
        "rtmp_url": stream_creds["rtmp_url"],
        "stream_key": stream_creds["stream_key"],
        "playback_url": stream_creds["playback_url"],
        "recording_url": None,
        "viewers_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.weddings.insert_one(wedding)
    
    # Get creator info
    creator = await db.users.find_one({"id": current_user["user_id"]})
    
    return WeddingResponse(
        id=wedding["id"],
        short_code=wedding.get("short_code"),
        title=wedding["title"],
        description=wedding.get("description"),
        bride_name=wedding["bride_name"],
        groom_name=wedding["groom_name"],
        creator_id=wedding["creator_id"],
        creator_name=creator.get("full_name") if creator else None,
        scheduled_date=wedding["scheduled_date"],
        location=wedding.get("location"),
        cover_image=wedding.get("cover_image"),
        status=StreamStatus(wedding["status"]),
        stream_credentials=StreamCredentials(
            rtmp_url=wedding["rtmp_url"],
            stream_key=wedding["stream_key"],
            playback_url=wedding["playback_url"]
        ),
        playback_url=wedding["playback_url"],
        recording_url=wedding.get("recording_url"),
        viewers_count=wedding["viewers_count"],
        created_at=wedding["created_at"],
        updated_at=wedding["updated_at"]
    )

@router.get("/", response_model=List[WeddingResponse])
async def list_weddings(skip: int = 0, limit: int = 20):
    """List all public weddings"""
    db = get_db()
    
    cursor = db.weddings.find().sort("scheduled_date", -1).skip(skip).limit(limit)
    weddings = await cursor.to_list(length=limit)
    
    result = []
    for wedding in weddings:
        # Get creator info
        creator = await db.users.find_one({"id": wedding["creator_id"]})
        
        # Don't expose stream credentials in public listing
        result.append(WeddingResponse(
            id=wedding["id"],
            short_code=wedding.get("short_code"),
            title=wedding["title"],
            description=wedding.get("description"),
            bride_name=wedding["bride_name"],
            groom_name=wedding["groom_name"],
            creator_id=wedding["creator_id"],
            creator_name=creator.get("full_name") if creator else None,
            scheduled_date=wedding["scheduled_date"],
            location=wedding.get("location"),
            cover_image=wedding.get("cover_image"),
            status=StreamStatus(wedding["status"]),
            playback_url=wedding["playback_url"] if wedding["status"] in ["live", "recorded"] else None,
            recording_url=wedding.get("recording_url"),
            viewers_count=wedding["viewers_count"],
            created_at=wedding["created_at"],
            updated_at=wedding["updated_at"]
        ))
    
    return result

@router.get("/my-weddings", response_model=List[WeddingResponse])
async def list_my_weddings(current_user: dict = Depends(get_current_user)):
    """List current user's weddings"""
    db = get_db()
    
    cursor = db.weddings.find({"creator_id": current_user["user_id"]}).sort("created_at", -1)
    weddings = await cursor.to_list(length=100)
    
    result = []
    for wedding in weddings:
        creator = await db.users.find_one({"id": wedding["creator_id"]})
        
        result.append(WeddingResponse(
            id=wedding["id"],
            short_code=wedding.get("short_code"),
            title=wedding["title"],
            description=wedding.get("description"),
            bride_name=wedding["bride_name"],
            groom_name=wedding["groom_name"],
            creator_id=wedding["creator_id"],
            creator_name=creator.get("full_name") if creator else None,
            scheduled_date=wedding["scheduled_date"],
            location=wedding.get("location"),
            cover_image=wedding.get("cover_image"),
            status=StreamStatus(wedding["status"]),
            stream_credentials=StreamCredentials(
                rtmp_url=wedding["rtmp_url"],
                stream_key=wedding["stream_key"],
                playback_url=wedding["playback_url"]
            ),
            playback_url=wedding["playback_url"],
            recording_url=wedding.get("recording_url"),
            viewers_count=wedding["viewers_count"],
            created_at=wedding["created_at"],
            updated_at=wedding["updated_at"]
        ))
    
    return result

@router.get("/{wedding_id}", response_model=WeddingResponse)
async def get_wedding(wedding_id: str):
    """Get wedding details"""
    db = get_db()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    creator = await db.users.find_one({"id": wedding["creator_id"]})
    
    return WeddingResponse(
        id=wedding["id"],
        short_code=wedding.get("short_code"),
        title=wedding["title"],
        description=wedding.get("description"),
        bride_name=wedding["bride_name"],
        groom_name=wedding["groom_name"],
        creator_id=wedding["creator_id"],
        creator_name=creator.get("full_name") if creator else None,
        scheduled_date=wedding["scheduled_date"],
        location=wedding.get("location"),
        cover_image=wedding.get("cover_image"),
        status=StreamStatus(wedding["status"]),
        playback_url=wedding["playback_url"] if wedding["status"] in ["live", "recorded"] else None,
        recording_url=wedding.get("recording_url"),
        viewers_count=wedding["viewers_count"],
        created_at=wedding["created_at"],
        updated_at=wedding["updated_at"]
    )

@router.put("/{wedding_id}", response_model=WeddingResponse)
async def update_wedding(
    wedding_id: str,
    wedding_data: WeddingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update wedding details"""
    db = get_db()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    # Check ownership
    if wedding["creator_id"] != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this wedding"
        )
    
    # Update fields
    update_data = wedding_data.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    await db.weddings.update_one(
        {"id": wedding_id},
        {"$set": update_data}
    )
    
    # Get updated wedding
    updated_wedding = await db.weddings.find_one({"id": wedding_id})
    creator = await db.users.find_one({"id": updated_wedding["creator_id"]})
    
    return WeddingResponse(
        id=updated_wedding["id"],
        short_code=updated_wedding.get("short_code"),
        title=updated_wedding["title"],
        description=updated_wedding.get("description"),
        bride_name=updated_wedding["bride_name"],
        groom_name=updated_wedding["groom_name"],
        creator_id=updated_wedding["creator_id"],
        creator_name=creator.get("full_name") if creator else None,
        scheduled_date=updated_wedding["scheduled_date"],
        location=updated_wedding.get("location"),
        cover_image=updated_wedding.get("cover_image"),
        status=StreamStatus(updated_wedding["status"]),
        stream_credentials=StreamCredentials(
            rtmp_url=updated_wedding["rtmp_url"],
            stream_key=updated_wedding["stream_key"],
            playback_url=updated_wedding["playback_url"]
        ),
        playback_url=updated_wedding["playback_url"],
        recording_url=updated_wedding.get("recording_url"),
        viewers_count=updated_wedding["viewers_count"],
        created_at=updated_wedding["created_at"],
        updated_at=updated_wedding["updated_at"]
    )

@router.delete("/{wedding_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_wedding(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a wedding"""
    db = get_db()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    # Check ownership
    if wedding["creator_id"] != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this wedding"
        )
    
    await db.weddings.delete_one({"id": wedding_id})
    return None


@router.get("/join/{short_code}")
async def join_wedding_by_code(short_code: str):
    """Join a wedding using short code"""
    db = get_db()
    
    # Find wedding by short code (case-insensitive)
    wedding = await db.weddings.find_one({"short_code": {"$regex": f"^{short_code}$", "$options": "i"}})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found with this code"
        )
    
    creator = await db.users.find_one({"id": wedding["creator_id"]})
    
    return WeddingResponse(
        id=wedding["id"],
        short_code=wedding.get("short_code"),
        title=wedding["title"],
        description=wedding.get("description"),
        bride_name=wedding["bride_name"],
        groom_name=wedding["groom_name"],
        creator_id=wedding["creator_id"],
        creator_name=creator.get("full_name") if creator else None,
        scheduled_date=wedding["scheduled_date"],
        location=wedding.get("location"),
        cover_image=wedding.get("cover_image"),
        status=StreamStatus(wedding["status"]),
        playback_url=wedding["playback_url"] if wedding["status"] in ["live", "recorded"] else None,
        recording_url=wedding.get("recording_url"),
        viewers_count=wedding["viewers_count"],
        created_at=wedding["created_at"],
        updated_at=wedding["updated_at"]
    )
