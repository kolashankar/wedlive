from fastapi import APIRouter, HTTPException, status, Depends, Body
from app.auth import get_current_user
from app.database import get_db
from app.models import Album, AlbumCreate, AlbumUpdate, AlbumSlide, SlideTransition
from typing import List
from datetime import datetime
import uuid
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=Album)
async def create_album(album: AlbumCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # Verify wedding access
    wedding = await db.weddings.find_one({"id": album.wedding_id})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
        
    if wedding["creator_id"] != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    album_id = str(uuid.uuid4())
    new_album = Album(
        id=album_id,
        wedding_id=album.wedding_id,
        title=album.title,
        description=album.description,
        cover_photo_url=album.cover_photo_url,
        music_url=album.music_url,
        slides=[],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        created_by=current_user["user_id"]
    )
    
    await db.albums.insert_one(new_album.dict())
    return new_album

@router.get("/{wedding_id}", response_model=List[Album])
async def get_albums(wedding_id: str):
    db = get_db()
    cursor = db.albums.find({"wedding_id": wedding_id}).sort("created_at", -1)
    return await cursor.to_list(length=100)

@router.get("/detail/{album_id}", response_model=Album)
async def get_album_detail(album_id: str):
    db = get_db()
    album = await db.albums.find_one({"id": album_id})
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album

@router.put("/{album_id}", response_model=Album)
async def update_album(album_id: str, update: AlbumUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    existing = await db.albums.find_one({"id": album_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Album not found")
        
    # Check auth
    if existing["created_by"] != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    update_data = update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    # If slides are being updated, ensure they are converted to dicts if they are objects
    if "slides" in update_data and update_data["slides"]:
        update_data["slides"] = [s.dict() if hasattr(s, "dict") else s for s in update_data["slides"]]

    await db.albums.update_one({"id": album_id}, {"$set": update_data})
    
    updated_album = await db.albums.find_one({"id": album_id})
    return updated_album

@router.delete("/{album_id}")
async def delete_album(album_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db.albums.find_one({"id": album_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Album not found")
        
    if existing["created_by"] != current_user["user_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    await db.albums.delete_one({"id": album_id})
    return {"success": True}

@router.post("/{album_id}/slides", response_model=Album)
async def add_slides(album_id: str, media_ids: List[str] = Body(...), current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db.albums.find_one({"id": album_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Album not found")
        
    # Create new slides
    current_count = len(existing.get("slides", []))
    new_slides = []
    for i, mid in enumerate(media_ids):
        new_slides.append(AlbumSlide(
            media_id=mid,
            order=current_count + i,
            duration=5.0,
            transition=SlideTransition.FADE
        ).dict())
        
    await db.albums.update_one(
        {"id": album_id}, 
        {
            "$push": {"slides": {"$each": new_slides}},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return await db.albums.find_one({"id": album_id})
