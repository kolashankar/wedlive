"""Music and Audio Models for Stream View Feature"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

# Audio Category Enums
class AudioCategory(str, Enum):
    BACKGROUND_MUSIC = "background_music"
    SOUND_EFFECT = "sound_effect"
    TRANSITION = "transition"
    EMOTION = "emotion"

class UploadedByRole(str, Enum):
    ADMIN = "admin"
    CREATOR = "creator"

class AudioFormat(str, Enum):
    MP3 = "mp3"
    WAV = "wav"
    AAC = "aac"
    OGG = "ogg"
    M4A = "m4a"

# Music Library Models
class MusicLibraryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    artist: Optional[str] = Field(None, max_length=200)
    category: AudioCategory
    folder_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_public: bool = True

class MusicLibraryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    artist: Optional[str] = Field(None, max_length=200)
    folder_id: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None

class MusicLibraryResponse(BaseModel):
    id: str
    file_id: str
    title: str
    artist: Optional[str] = None
    category: AudioCategory
    folder_id: Optional[str] = None
    folder_name: Optional[str] = None
    file_url: str
    file_size: int
    duration: Optional[int] = None  # seconds
    format: AudioFormat
    uploaded_by: str
    uploaded_by_role: UploadedByRole
    is_public: bool
    tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

# Music Folder Models
class MusicFolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    parent_folder_id: Optional[str] = None
    category: AudioCategory
    icon: Optional[str] = "🎵"

class MusicFolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = None

class MusicFolderResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    parent_folder_id: Optional[str] = None
    category: AudioCategory
    icon: str
    is_system: bool = False
    file_count: int = 0
    created_by: str
    created_at: datetime

# Creator Music Models
class CreatorMusicCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    artist: Optional[str] = Field(None, max_length=200)
    is_private: bool = True

class CreatorMusicResponse(BaseModel):
    id: str
    creator_id: str
    file_id: str
    title: str
    artist: Optional[str] = None
    file_url: str
    file_size: int
    duration: Optional[int] = None
    format: AudioFormat
    storage_used: int
    is_private: bool
    created_at: datetime

# Wedding Music Assignment Models
class PlaylistItem(BaseModel):
    music_id: str
    source: str = "library"  # "library" or "creator"
    order: int
    auto_play: bool = False

class WeddingMusicPlaylistCreate(BaseModel):
    music_id: str
    source: str = "library"
    auto_play: bool = False

class WeddingMusicPlaylistResponse(BaseModel):
    id: str
    wedding_id: str
    music_playlist: List[PlaylistItem] = Field(default_factory=list)
    active_track: Optional[str] = None
    default_volume: int = 70
    effects_enabled: bool = True
    created_at: datetime
    updated_at: datetime

# Audio Playback Session Models
class BackgroundMusicState(BaseModel):
    track_id: Optional[str] = None
    playing: bool = False
    volume: int = 70
    position: int = 0  # seconds

class ActiveEffect(BaseModel):
    effect_id: str
    started_at: datetime
    volume: int = 80

class AudioSessionState(BaseModel):
    background_music: Optional[BackgroundMusicState] = None
    active_effects: List[ActiveEffect] = Field(default_factory=list)

class AudioMixConfig(BaseModel):
    master_volume: int = 85
    music_volume: int = 70
    effects_volume: int = 80
    transitions_volume: int = 80
    emotions_volume: int = 80

class AudioPlaybackSessionCreate(BaseModel):
    wedding_id: str

class AudioPlaybackSessionResponse(BaseModel):
    id: str
    wedding_id: str
    session_start: datetime
    is_active: bool
    current_state: AudioSessionState
    audio_mix_config: AudioMixConfig
    updated_at: datetime

# Audio Playback Control Models
class PlayMusicRequest(BaseModel):
    music_id: str
    position: int = 0  # Start position in seconds

class SetVolumeRequest(BaseModel):
    volume_type: str  # "master", "music", "effects", "transitions", "emotions"
    volume: int = Field(..., ge=0, le=100)

class TriggerEffectRequest(BaseModel):
    effect_id: str
    volume: int = Field(80, ge=0, le=100)

# Storage Tracking Models
class StorageBreakdown(BaseModel):
    music: int = 0
    photos: int = 0
    videos: int = 0

class StorageTrackingResponse(BaseModel):
    user_id: str
    total_storage_limit: int
    used_storage: int
    available_storage: int
    breakdown: StorageBreakdown
    usage_percentage: float
    last_calculated: datetime

# WebSocket Events
class MusicPlaybackEvent(BaseModel):
    event_type: str  # "play", "pause", "stop", "volume_change", "effect_trigger"
    wedding_id: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
