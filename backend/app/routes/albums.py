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

@router.get("/detail/{album_id}")
async def get_album_detail(album_id: str):
    """Get album details with enriched slide media data"""
    db = get_db()
    
    try:
        logger.info(f"Fetching album detail for album_id: {album_id}")
        album = await db.albums.find_one({"id": album_id})
        if not album:
            logger.warning(f"Album not found: {album_id}")
            raise HTTPException(status_code=404, detail="Album not found")
        
        logger.info(f"Album found: {album.get('title')}, slides: {len(album.get('slides', []))}")
        
        # Remove MongoDB ObjectId to prevent serialization issues
        if "_id" in album:
            del album["_id"]
        
        # Enrich slides with media data
        if "slides" in album and album["slides"]:
            try:
                media_ids = [s["media_id"] for s in album["slides"] if "media_id" in s]
                logger.info(f"Processing {len(media_ids)} media items")
                
                if media_ids:
                    media_list = await db.media.find({"id": {"$in": media_ids}}).to_list(length=len(media_ids))
                    logger.info(f"Found {len(media_list)} media items in database")
                    media_map = {m["id"]: m for m in media_list}
                    
                    for slide in album["slides"]:
                        if "media_id" in slide and slide["media_id"] in media_map:
                            # Construct URL (same logic as media routes)
                            media_item = media_map[slide['media_id']]
                            if "file_id" in media_item:
                                file_id = media_item['file_id']
                                slide["media_url"] = f"/api/media/telegram-proxy/photos/{file_id}"
                            else:
                                logger.warning(f"Media item {slide['media_id']} missing file_id")
                                slide["media_url"] = None
                        else:
                            logger.warning(f"Media {slide.get('media_id')} not found in database")
                            slide["media_url"] = None
                        
                        # Ensure duration is a valid number
                        if "duration" not in slide or not isinstance(slide.get("duration"), (int, float)):
                            slide["duration"] = 5.0
                            logger.info(f"Set default duration 5.0 for slide with media_id: {slide.get('media_id')}")
                            
            except Exception as e:
                logger.error(f"Error enriching album slides: {str(e)}", exc_info=True)
                # Don't fail the whole request, just log the error
        
        logger.info(f"Successfully returning album detail for {album_id}")
        return album
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching album detail for {album_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

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
