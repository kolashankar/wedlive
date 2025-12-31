from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List
from datetime import datetime
import uuid
import base64
import os

from app.models import (
    EmailInvitationCreate, EmailInvitationResponse,
    CameraStreamCreate, CameraStreamResponse,
    PhotoBoothCreate, PhotoBoothResponse
)
from app.database import get_database
from app.auth import get_current_user, get_current_user_optional
from app.services.stream_service import create_stream_call

router = APIRouter()

# ==================== EMAIL INVITATIONS ====================

@router.post("/invitations", response_model=List[EmailInvitationResponse])
async def send_email_invitations(
    invitation: EmailInvitationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send email invitations for a wedding (creator only)"""
    db = await get_database()
    
    # Verify wedding exists and user is creator
    wedding = await db.weddings.find_one({"id": invitation.wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    if wedding["creator_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create invitation records
    invitations = []
    for email in invitation.recipient_emails:
        invitation_doc = {
            "id": str(uuid.uuid4()),
            "wedding_id": invitation.wedding_id,
            "recipient_email": email,
            "custom_message": invitation.custom_message,
            "sent_at": datetime.utcnow(),
            "status": "sent",  # In production, this would be "pending" until EmailJS confirms
            "opened_at": None
        }
        
        await db.email_invitations.insert_one(invitation_doc)
        invitations.append(EmailInvitationResponse(
            id=invitation_doc["id"],
            wedding_id=invitation_doc["wedding_id"],
            recipient_email=invitation_doc["recipient_email"],
            sent_at=invitation_doc["sent_at"],
            status=invitation_doc["status"]
        ))
    
    return invitations


@router.get("/invitations/{wedding_id}", response_model=List[EmailInvitationResponse])
async def get_email_invitations(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get email invitations for a wedding"""
    db = await get_database()
    
    # Verify user is creator or admin
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    if wedding["creator_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    invitations = await db.email_invitations.find(
        {"wedding_id": wedding_id}
    ).sort("sent_at", -1).to_list(length=1000)
    
    return [EmailInvitationResponse(
        id=inv["id"],
        wedding_id=inv["wedding_id"],
        recipient_email=inv["recipient_email"],
        sent_at=inv["sent_at"],
        status=inv["status"]
    ) for inv in invitations]


# ==================== MULTI-CAMERA SUPPORT ====================

@router.post("/cameras", response_model=CameraStreamResponse)
async def create_camera_stream(
    camera: CameraStreamCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create additional camera stream for multi-camera setup"""
    db = await get_database()
    
    # Verify wedding exists and user is creator
    wedding = await db.weddings.find_one({"id": camera.wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    if wedding["creator_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create stream call for this camera with wedding_id for proper stream key format
    try:
        stream_data = await create_stream_call(camera.wedding_id)
        
        camera_doc = {
            "id": str(uuid.uuid4()),
            "wedding_id": camera.wedding_id,
            "camera_name": camera.camera_name,
            "camera_angle": camera.camera_angle,
            "stream_call_id": stream_data["call_id"],
            "rtmp_url": stream_data["rtmp_url"],
            "stream_key": stream_data["stream_key"],
            "playback_url": stream_data["playback_url"],
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        
        await db.camera_streams.insert_one(camera_doc)
        
        return CameraStreamResponse(**camera_doc)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create camera stream: {str(e)}")


@router.get("/cameras/{wedding_id}", response_model=List[CameraStreamResponse])
async def get_camera_streams(wedding_id: str):
    """Get all camera streams for a wedding (public access)"""
    db = await get_database()
    
    cameras = await db.camera_streams.find(
        {"wedding_id": wedding_id}
    ).sort("created_at", 1).to_list(length=100)
    
    return [CameraStreamResponse(**cam) for cam in cameras]


@router.put("/cameras/{camera_id}/toggle")
async def toggle_camera_stream(
    camera_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Toggle camera stream active status"""
    db = await get_database()
    
    camera = await db.camera_streams.find_one({"id": camera_id})
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Verify user is creator
    wedding = await db.weddings.find_one({"id": camera["wedding_id"]})
    if wedding["creator_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_status = not camera["is_active"]
    await db.camera_streams.update_one(
        {"id": camera_id},
        {"$set": {"is_active": new_status}}
    )
    
    return {"message": "Camera status updated", "is_active": new_status}


@router.delete("/cameras/{camera_id}")
async def delete_camera_stream(
    camera_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a camera stream"""
    db = await get_database()
    
    camera = await db.camera_streams.find_one({"id": camera_id})
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Verify user is creator
    wedding = await db.weddings.find_one({"id": camera["wedding_id"]})
    if wedding["creator_id"] != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.camera_streams.delete_one({"id": camera_id})
    
    return {"message": "Camera stream deleted successfully"}


# ==================== PHOTO BOOTH ====================

@router.post("/photobooth", response_model=PhotoBoothResponse)
async def create_photo_booth_photo(
    photo: PhotoBoothCreate,
    current_user: dict = Depends(get_current_user_optional)
):
    """Create a photo booth photo"""
    db = await get_database()
    
    # Verify wedding exists
    wedding = await db.weddings.find_one({"id": photo.wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    try:
        # In production, upload to Telegram CDN or cloud storage
        # For now, we'll store the photo_data URL directly
        photo_url = photo.photo_data  # This should be a data URL or uploaded image URL
        
        photo_doc = {
            "id": str(uuid.uuid4()),
            "wedding_id": photo.wedding_id,
            "user_id": current_user["user_id"] if current_user else None,
            "guest_name": current_user.get("full_name") if current_user else photo.guest_name,
            "photo_url": photo_url,
            "filter_used": photo.filter_used,
            "created_at": datetime.utcnow()
        }
        
        await db.photo_booth.insert_one(photo_doc)
        
        return PhotoBoothResponse(**photo_doc)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create photo: {str(e)}")


@router.get("/photobooth/{wedding_id}", response_model=List[PhotoBoothResponse])
async def get_photo_booth_photos(
    wedding_id: str,
    limit: int = 100,
    offset: int = 0
):
    """Get photo booth photos for a wedding (public access)"""
    db = await get_database()
    
    photos = await db.photo_booth.find(
        {"wedding_id": wedding_id}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
    
    return [PhotoBoothResponse(**p) for p in photos]


@router.delete("/photobooth/{photo_id}")
async def delete_photo_booth_photo(
    photo_id: str,
    current_user: dict = Depends(get_current_user_optional)
):
    """Delete a photo booth photo"""
    db = await get_database()
    
    photo = await db.photo_booth.find_one({"id": photo_id})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Allow deletion by photo owner, wedding creator, or admin
    wedding = await db.weddings.find_one({"id": photo["wedding_id"]})
    
    is_owner = current_user and photo.get("user_id") == current_user["user_id"]
    is_creator = current_user and wedding["creator_id"] == current_user["user_id"]
    is_admin = current_user and current_user["role"] == "admin"
    
    if not (is_owner or is_creator or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.photo_booth.delete_one({"id": photo_id})
    
    return {"message": "Photo deleted successfully"}


# ==================== CALENDAR INTEGRATION ====================

@router.get("/calendar/{wedding_id}/ical")
async def get_ical_file(wedding_id: str):
    """Generate iCal file for wedding event"""
    db = await get_database()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    # Generate iCal format
    ical_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WedLive//Wedding Event//EN
BEGIN:VEVENT
UID:{wedding['id']}@wedlive.com
DTSTAMP:{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}
DTSTART:{wedding['scheduled_date'].strftime('%Y%m%dT%H%M%SZ')}
SUMMARY:{wedding['title']}
DESCRIPTION:{wedding.get('description', '')}\\n\\nWatch live at: {os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')}/weddings/{wedding['id']}
LOCATION:{wedding.get('location', 'Online')}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR"""
    
    return {
        "content": ical_content,
        "filename": f"wedding-{wedding['bride_name']}-{wedding['groom_name']}.ics"
    }


@router.get("/calendar/{wedding_id}/google")
async def get_google_calendar_link(wedding_id: str):
    """Get Google Calendar add link for wedding event"""
    db = await get_database()
    
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    # Format date for Google Calendar
    start_date = wedding['scheduled_date'].strftime('%Y%m%dT%H%M%SZ')
    # Assume 2-hour duration
    end_date = (wedding['scheduled_date'].replace(hour=wedding['scheduled_date'].hour + 2)).strftime('%Y%m%dT%H%M%SZ')
    
    title = wedding['title']
    description = f"{wedding.get('description', '')} Watch live at: {os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')}/weddings/{wedding['id']}"
    location = wedding.get('location', 'Online')
    
    # Build Google Calendar URL
    google_url = f"https://calendar.google.com/calendar/render?action=TEMPLATE&text={title}&dates={start_date}/{end_date}&details={description}&location={location}"
    
    return {"url": google_url}
