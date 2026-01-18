"""Wedding Music Assignment and Audio Session Management Routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
import uuid

from app.auth import get_current_user
from app.database import get_db
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/weddings", tags=["wedding-music"])

# ==================== MODELS ====================

class PlaylistItemCreate(BaseModel):
    music_id: str
    source: str = Field(..., pattern="^(library|creator)$")  # library or creator
    auto_play: bool = False

class PlaylistItemResponse(BaseModel):
    music_id: str
    source: str
    order: int
    auto_play: bool
    title: Optional[str] = None
    artist: Optional[str] = None
    duration: Optional[int] = None

class PlaylistResponse(BaseModel):
    wedding_id: str
    music_playlist: List[PlaylistItemResponse]
    active_track: Optional[str] = None
    default_volume: int = 70
    effects_enabled: bool = True

class PlaylistReorder(BaseModel):
    music_id: str
    new_order: int

class AudioSessionState(BaseModel):
    background_music: Optional[dict] = None
    active_effects: List[dict] = Field(default_factory=list)

class AudioMixConfig(BaseModel):
    master_volume: int = Field(85, ge=0, le=100)
    music_volume: int = Field(70, ge=0, le=100)
    effects_volume: int = Field(80, ge=0, le=100)

class AudioSessionResponse(BaseModel):
    session_id: str
    wedding_id: str
    is_active: bool
    current_state: AudioSessionState
    audio_mix_config: AudioMixConfig
    session_start: datetime
    updated_at: datetime

# ==================== WEDDING PLAYLIST MANAGEMENT ====================

@router.post("/{wedding_id}/music/playlist", response_model=PlaylistItemResponse)
async def add_music_to_playlist(
    wedding_id: str,
    item: PlaylistItemCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add music to wedding playlist"""
    db = get_db()
    user_id = current_user["user_id"]
    
    # Verify wedding ownership
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this wedding"
        )
    
    # Verify music exists
    music = None
    if item.source == "library":
        music = await db.music_library.find_one({"_id": item.music_id})
    elif item.source == "creator":
        music = await db.creator_music.find_one({
            "_id": item.music_id,
            "creator_id": user_id
        })
    
    if not music:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Music not found"
        )
    
    # Get or create wedding music assignment
    assignment = await db.wedding_music_assignments.find_one({"wedding_id": wedding_id})
    
    if not assignment:
        # Create new assignment
        assignment_id = str(uuid.uuid4())
        assignment = {
            "_id": assignment_id,
            "wedding_id": wedding_id,
            "music_playlist": [],
            "active_track": None,
            "default_volume": 70,
            "effects_enabled": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    
    # Check if music already in playlist
    existing = [p for p in assignment.get("music_playlist", []) if p["music_id"] == item.music_id]
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Music already in playlist"
        )
    
    # Add to playlist
    playlist = assignment.get("music_playlist", [])
    new_order = len(playlist) + 1
    
    playlist_item = {
        "music_id": item.music_id,
        "source": item.source,
        "order": new_order,
        "auto_play": item.auto_play
    }
    
    playlist.append(playlist_item)
    assignment["music_playlist"] = playlist
    assignment["updated_at"] = datetime.utcnow()
    
    # Update or insert
    await db.wedding_music_assignments.update_one(
        {"wedding_id": wedding_id},
        {"$set": assignment},
        upsert=True
    )
    
    return PlaylistItemResponse(
        music_id=item.music_id,
        source=item.source,
        order=new_order,
        auto_play=item.auto_play,
        title=music.get("title"),
        artist=music.get("artist"),
        duration=music.get("duration")
    )

@router.get("/{wedding_id}/music/playlist", response_model=PlaylistResponse)
async def get_wedding_playlist(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get wedding's music playlist"""
    db = get_db()
    user_id = current_user["user_id"]
    
    # Verify wedding ownership
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this wedding"
        )
    
    # Get assignment
    assignment = await db.wedding_music_assignments.find_one({"wedding_id": wedding_id})
    
    if not assignment:
        return PlaylistResponse(
            wedding_id=wedding_id,
            music_playlist=[],
            active_track=None,
            default_volume=70,
            effects_enabled=True
        )
    
    # Enrich playlist with music details
    playlist_items = []
    for item in assignment.get("music_playlist", []):
        music = None
        if item["source"] == "library":
            music = await db.music_library.find_one({"_id": item["music_id"]})
        elif item["source"] == "creator":
            music = await db.creator_music.find_one({"_id": item["music_id"]})
        
        playlist_items.append(PlaylistItemResponse(
            music_id=item["music_id"],
            source=item["source"],
            order=item["order"],
            auto_play=item["auto_play"],
            title=music.get("title") if music else None,
            artist=music.get("artist") if music else None,
            duration=music.get("duration") if music else None
        ))
    
    return PlaylistResponse(
        wedding_id=wedding_id,
        music_playlist=playlist_items,
        active_track=assignment.get("active_track"),
        default_volume=assignment.get("default_volume", 70),
        effects_enabled=assignment.get("effects_enabled", True)
    )

@router.delete("/{wedding_id}/music/playlist/{music_id}")
async def remove_from_playlist(
    wedding_id: str,
    music_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove music from wedding playlist"""
    db = get_db()
    user_id = current_user["id"]
    
    # Verify wedding ownership
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this wedding"
        )
    
    # Get assignment
    assignment = await db.wedding_music_assignments.find_one({"wedding_id": wedding_id})
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )
    
    # Remove from playlist
    playlist = assignment.get("music_playlist", [])
    playlist = [p for p in playlist if p["music_id"] != music_id]
    
    # Reorder
    for i, item in enumerate(playlist, 1):
        item["order"] = i
    
    await db.wedding_music_assignments.update_one(
        {"wedding_id": wedding_id},
        {
            "$set": {
                "music_playlist": playlist,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"success": True, "message": "Music removed from playlist"}

@router.put("/{wedding_id}/music/playlist/reorder")
async def reorder_playlist(
    wedding_id: str,
    reorder: PlaylistReorder,
    current_user: dict = Depends(get_current_user)
):
    """Reorder playlist"""
    db = get_db()
    user_id = current_user["id"]
    
    # Verify wedding ownership
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this wedding"
        )
    
    # Get assignment
    assignment = await db.wedding_music_assignments.find_one({"wedding_id": wedding_id})
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )
    
    # Reorder
    playlist = assignment.get("music_playlist", [])
    item_to_move = None
    old_index = -1
    
    for i, item in enumerate(playlist):
        if item["music_id"] == reorder.music_id:
            item_to_move = item
            old_index = i
            break
    
    if item_to_move is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Music not found in playlist"
        )
    
    # Remove and insert at new position
    playlist.pop(old_index)
    new_index = reorder.new_order - 1
    playlist.insert(new_index, item_to_move)
    
    # Update order numbers
    for i, item in enumerate(playlist, 1):
        item["order"] = i
    
    await db.wedding_music_assignments.update_one(
        {"wedding_id": wedding_id},
        {
            "$set": {
                "music_playlist": playlist,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"success": True, "message": "Playlist reordered"}

# ==================== AUDIO SESSION MANAGEMENT ====================

@router.post("/{wedding_id}/audio/session/start", response_model=AudioSessionResponse)
async def start_audio_session(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Start audio session for wedding"""
    db = get_db()
    user_id = current_user["id"]
    
    # Verify wedding ownership
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Create session
    session_id = str(uuid.uuid4())
    session = {
        "_id": session_id,
        "wedding_id": wedding_id,
        "session_start": datetime.utcnow(),
        "is_active": True,
        "current_state": {
            "background_music": None,
            "active_effects": []
        },
        "audio_mix_config": {
            "master_volume": 85,
            "music_volume": 70,
            "effects_volume": 80
        },
        "updated_at": datetime.utcnow()
    }
    
    await db.audio_playback_sessions.insert_one(session)
    
    return AudioSessionResponse(
        session_id=session_id,
        wedding_id=wedding_id,
        is_active=True,
        current_state=AudioSessionState(
            background_music=None,
            active_effects=[]
        ),
        audio_mix_config=AudioMixConfig(),
        session_start=session["session_start"],
        updated_at=session["updated_at"]
    )

@router.get("/{wedding_id}/audio/session/state", response_model=AudioSessionResponse)
async def get_audio_session_state(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get current audio session state"""
    db = get_db()
    
    session = await db.audio_playback_sessions.find_one({
        "wedding_id": wedding_id,
        "is_active": True
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active audio session"
        )
    
    return AudioSessionResponse(
        session_id=session["_id"],
        wedding_id=session["wedding_id"],
        is_active=session["is_active"],
        current_state=AudioSessionState(**session["current_state"]),
        audio_mix_config=AudioMixConfig(**session["audio_mix_config"]),
        session_start=session["session_start"],
        updated_at=session["updated_at"]
    )

@router.put("/{wedding_id}/audio/session/state")
async def update_audio_session_state(
    wedding_id: str,
    state: AudioSessionState,
    mix_config: Optional[AudioMixConfig] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update audio session state"""
    db = get_db()
    user_id = current_user["id"]
    
    # Verify wedding ownership
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Update session
    update_data = {
        "current_state": state.dict(),
        "updated_at": datetime.utcnow()
    }
    
    if mix_config:
        update_data["audio_mix_config"] = mix_config.dict()
    
    result = await db.audio_playback_sessions.update_one(
        {"wedding_id": wedding_id, "is_active": True},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active audio session"
        )
    
    return {"success": True, "message": "Audio session state updated"}

@router.post("/{wedding_id}/audio/session/stop")
async def stop_audio_session(
    wedding_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Stop audio session"""
    db = get_db()
    user_id = current_user["id"]
    
    # Verify wedding ownership
    wedding = await db.weddings.find_one({"id": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found"
        )
    
    if wedding["creator_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Stop session
    await db.audio_playback_sessions.update_one(
        {"wedding_id": wedding_id, "is_active": True},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return {"success": True, "message": "Audio session stopped"}
