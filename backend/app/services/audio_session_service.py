"""Audio Session Management Service"""
from typing import Dict, Optional, List
from datetime import datetime
import uuid

from app.database import get_db


class AudioSessionService:
    """Service to manage audio playback sessions"""
    
    @staticmethod
    async def create_session(wedding_id: str) -> Dict:
        """Create a new audio session"""
        db = get_db()
        
        # Check if active session exists
        existing = await db.audio_playback_sessions.find_one({
            "wedding_id": wedding_id,
            "is_active": True
        })
        
        if existing:
            return {
                "session_id": existing["_id"],
                "wedding_id": wedding_id,
                "is_active": True,
                "message": "Active session already exists"
            }
        
        # Create new session
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
        
        return {
            "session_id": session_id,
            "wedding_id": wedding_id,
            "is_active": True,
            "message": "Session created successfully"
        }
    
    @staticmethod
    async def get_active_session(wedding_id: str) -> Optional[Dict]:
        """Get active audio session for wedding"""
        db = get_db()
        
        session = await db.audio_playback_sessions.find_one({
            "wedding_id": wedding_id,
            "is_active": True
        })
        
        return session
    
    @staticmethod
    async def update_session_state(
        wedding_id: str,
        state: Dict,
        mix_config: Optional[Dict] = None
    ) -> bool:
        """Update audio session state"""
        db = get_db()
        
        update_data = {
            "current_state": state,
            "updated_at": datetime.utcnow()
        }
        
        if mix_config:
            update_data["audio_mix_config"] = mix_config
        
        result = await db.audio_playback_sessions.update_one(
            {"wedding_id": wedding_id, "is_active": True},
            {"$set": update_data}
        )
        
        return result.matched_count > 0
    
    @staticmethod
    async def update_background_music(
        wedding_id: str,
        track_id: str,
        playing: bool = True,
        volume: int = 70,
        position: int = 0
    ) -> bool:
        """Update background music in session"""
        db = get_db()
        
        music_state = {
            "track_id": track_id,
            "playing": playing,
            "volume": volume,
            "position": position
        }
        
        result = await db.audio_playback_sessions.update_one(
            {"wedding_id": wedding_id, "is_active": True},
            {
                "$set": {
                    "current_state.background_music": music_state,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return result.matched_count > 0
    
    @staticmethod
    async def add_effect(
        wedding_id: str,
        effect_id: str,
        volume: int = 80
    ) -> bool:
        """Add sound effect to active effects"""
        db = get_db()
        
        effect = {
            "effect_id": effect_id,
            "started_at": datetime.utcnow(),
            "volume": volume
        }
        
        result = await db.audio_playback_sessions.update_one(
            {"wedding_id": wedding_id, "is_active": True},
            {
                "$push": {"current_state.active_effects": effect},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return result.matched_count > 0
    
    @staticmethod
    async def remove_effect(
        wedding_id: str,
        effect_id: str
    ) -> bool:
        """Remove sound effect from active effects"""
        db = get_db()
        
        result = await db.audio_playback_sessions.update_one(
            {"wedding_id": wedding_id, "is_active": True},
            {
                "$pull": {"current_state.active_effects": {"effect_id": effect_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return result.matched_count > 0
    
    @staticmethod
    async def update_volume(
        wedding_id: str,
        master_volume: Optional[int] = None,
        music_volume: Optional[int] = None,
        effects_volume: Optional[int] = None
    ) -> bool:
        """Update volume settings"""
        db = get_db()
        
        update_fields = {}
        if master_volume is not None:
            update_fields["audio_mix_config.master_volume"] = master_volume
        if music_volume is not None:
            update_fields["audio_mix_config.music_volume"] = music_volume
        if effects_volume is not None:
            update_fields["audio_mix_config.effects_volume"] = effects_volume
        
        if not update_fields:
            return False
        
        update_fields["updated_at"] = datetime.utcnow()
        
        result = await db.audio_playback_sessions.update_one(
            {"wedding_id": wedding_id, "is_active": True},
            {"$set": update_fields}
        )
        
        return result.matched_count > 0
    
    @staticmethod
    async def stop_session(wedding_id: str) -> bool:
        """Stop audio session"""
        db = get_db()
        
        result = await db.audio_playback_sessions.update_one(
            {"wedding_id": wedding_id, "is_active": True},
            {
                "$set": {
                    "is_active": False,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return result.matched_count > 0
    
    @staticmethod
    async def cleanup_old_sessions(days: int = 7) -> int:
        """Cleanup old inactive sessions"""
        db = get_db()
        
        from datetime import timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.audio_playback_sessions.delete_many({
            "is_active": False,
            "updated_at": {"$lt": cutoff_date}
        })
        
        return result.deleted_count
