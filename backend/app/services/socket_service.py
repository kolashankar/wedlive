import socketio
from typing import Dict, Set
import logging

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Track active viewers per wedding
active_viewers: Dict[str, Set[str]] = {}

logger = logging.getLogger(__name__)


@sio.on('connect')
async def connect(sid, environ):
    """Handle client connection"""
    logger.info(f"Client connected: {sid}")
    await sio.emit('connected', {'status': 'Connected to WedLive'}, to=sid)


@sio.on('disconnect')
async def disconnect(sid):
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {sid}")
    
    # Remove from all rooms
    for wedding_id, viewers in active_viewers.items():
        if sid in viewers:
            viewers.remove(sid)
            # Broadcast updated viewer count
            await sio.emit('viewer_count', {
                'wedding_id': wedding_id,
                'count': len(viewers)
            }, room=wedding_id)


@sio.on('join_wedding')
async def join_wedding(sid, data):
    """Join a wedding room"""
    wedding_id = data.get('wedding_id')
    guest_name = data.get('guest_name', 'Anonymous')
    
    if not wedding_id:
        return {'error': 'wedding_id required'}
    
    # Add to room
    await sio.enter_room(sid, wedding_id)
    
    # Track viewer
    if wedding_id not in active_viewers:
        active_viewers[wedding_id] = set()
    active_viewers[wedding_id].add(sid)
    
    # Broadcast updated viewer count
    viewer_count = len(active_viewers[wedding_id])
    await sio.emit('viewer_count', {
        'wedding_id': wedding_id,
        'count': viewer_count
    }, room=wedding_id)
    
    # Notify others
    await sio.emit('viewer_joined', {
        'guest_name': guest_name,
        'count': viewer_count
    }, room=wedding_id, skip_sid=sid)
    
    logger.info(f"Client {sid} joined wedding {wedding_id}. Total viewers: {viewer_count}")
    
    return {'status': 'joined', 'viewer_count': viewer_count}


@sio.on('leave_wedding')
async def leave_wedding(sid, data):
    """Leave a wedding room"""
    wedding_id = data.get('wedding_id')
    
    if not wedding_id:
        return {'error': 'wedding_id required'}
    
    # Remove from room
    await sio.leave_room(sid, wedding_id)
    
    # Remove from tracking
    if wedding_id in active_viewers and sid in active_viewers[wedding_id]:
        active_viewers[wedding_id].remove(sid)
        
        # Broadcast updated viewer count
        viewer_count = len(active_viewers[wedding_id])
        await sio.emit('viewer_count', {
            'wedding_id': wedding_id,
            'count': viewer_count
        }, room=wedding_id)
    
    return {'status': 'left'}


@sio.on('send_message')
async def send_message(sid, data):
    """Send a chat message to wedding room"""
    from app.database import get_db
    from app.services.chat_service import ChatService
    from datetime import datetime
    
    wedding_id = data.get('wedding_id')
    message = data.get('message')
    guest_name = data.get('guest_name', 'Anonymous')
    user_id = data.get('user_id')
    
    if not wedding_id or not message:
        return {'error': 'wedding_id and message required'}
    
    # Save message to database
    try:
        db = await get_db()
        chat_service = ChatService(db)
        saved_message = await chat_service.save_message(
            wedding_id=wedding_id,
            message=message,
            guest_name=guest_name,
            user_id=user_id
        )
        
        # Broadcast message to room
        message_data = {
            'message_id': saved_message['message_id'],
            'wedding_id': wedding_id,
            'message': message,
            'guest_name': guest_name,
            'user_id': user_id,
            'timestamp': saved_message['timestamp']
        }
        
        await sio.emit('new_message', message_data, room=wedding_id)
        
        return {'status': 'sent', 'message_id': saved_message['message_id']}
        
    except Exception as e:
        logger.error(f"Failed to save message: {str(e)}")
        # Still broadcast even if save fails
        message_data = {
            'wedding_id': wedding_id,
            'message': message,
            'guest_name': guest_name,
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat()
        }
        await sio.emit('new_message', message_data, room=wedding_id)
        return {'status': 'sent'}


@sio.on('send_reaction')
async def send_reaction(sid, data):
    """Send an emoji reaction to wedding room"""
    wedding_id = data.get('wedding_id')
    emoji = data.get('emoji')
    guest_name = data.get('guest_name', 'Anonymous')
    
    if not wedding_id or not emoji:
        return {'error': 'wedding_id and emoji required'}
    
    # Broadcast reaction to room
    reaction_data = {
        'wedding_id': wedding_id,
        'emoji': emoji,
        'guest_name': guest_name,
        'timestamp': data.get('timestamp')
    }
    
    await sio.emit('new_reaction', reaction_data, room=wedding_id)
    
    return {'status': 'sent'}


@sio.on('stream_quality_update')
async def stream_quality_update(sid, data):
    """Update stream quality metrics"""
    wedding_id = data.get('wedding_id')
    quality_data = data.get('quality')
    
    if not wedding_id or not quality_data:
        return {'error': 'wedding_id and quality data required'}
    
    # Broadcast to admin/creator (optional)
    # For now, just acknowledge
    return {'status': 'recorded'}


@sio.on('camera_switch')
async def camera_switch(sid, data):
    """Handle multi-camera switch"""
    wedding_id = data.get('wedding_id')
    camera_id = data.get('camera_id')
    
    if not wedding_id or not camera_id:
        return {'error': 'wedding_id and camera_id required'}
    
    # Broadcast camera switch to all viewers
    await sio.emit('camera_switched', {
        'wedding_id': wedding_id,
        'camera_id': camera_id
    }, room=wedding_id)
    
    return {'status': 'switched'}


async def get_viewer_count(wedding_id: str) -> int:
    """Get current viewer count for a wedding"""
    return len(active_viewers.get(wedding_id, set()))


async def broadcast_to_wedding(wedding_id: str, event: str, data: dict):
    """Broadcast an event to all viewers of a wedding"""
    await sio.emit(event, data, room=wedding_id)


# Recording Events
async def broadcast_recording_started(wedding_id: str, recording_data: dict):
    """Broadcast when DVR recording starts"""
    await sio.emit('recording_started', {
        'wedding_id': wedding_id,
        'recording_id': recording_data.get('recording_id'),
        'quality': recording_data.get('quality', '720p'),
        'started_at': recording_data.get('started_at'),
        'timestamp': recording_data.get('started_at')
    }, room=wedding_id)
    logger.info(f"📹 Broadcast recording_started to wedding {wedding_id}")


async def broadcast_recording_completed(wedding_id: str, recording_data: dict):
    """Broadcast when DVR recording completes"""
    await sio.emit('recording_completed', {
        'wedding_id': wedding_id,
        'recording_id': recording_data.get('recording_id'),
        'recording_url': recording_data.get('recording_url'),
        'duration_seconds': recording_data.get('duration_seconds'),
        'completed_at': recording_data.get('completed_at'),
        'timestamp': recording_data.get('completed_at')
    }, room=wedding_id)
    logger.info(f"✅ Broadcast recording_completed to wedding {wedding_id}")


# Quality Control Events
async def broadcast_quality_changed(wedding_id: str, quality_data: dict):
    """Broadcast when stream quality changes"""
    await sio.emit('quality_changed', {
        'wedding_id': wedding_id,
        'quality': quality_data.get('quality'),
        'changed_by': quality_data.get('changed_by', 'creator'),
        'bitrate': quality_data.get('bitrate'),
        'timestamp': quality_data.get('timestamp')
    }, room=wedding_id)
    logger.info(f"📊 Broadcast quality_changed to wedding {wedding_id}: {quality_data.get('quality')}")


# Photo Upload Events
async def broadcast_photo_uploaded(wedding_id: str, photo_data: dict):
    """Broadcast when new photo is uploaded"""
    await sio.emit('photo_uploaded', {
        'wedding_id': wedding_id,
        'media_id': photo_data.get('media_id'),
        'media_type': photo_data.get('media_type', 'photo'),
        'thumbnail_url': photo_data.get('thumbnail_url'),
        'caption': photo_data.get('caption'),
        'folder_id': photo_data.get('folder_id'),
        'folder_name': photo_data.get('folder_name'),
        'uploaded_by': photo_data.get('uploaded_by'),
        'timestamp': photo_data.get('timestamp')
    }, room=wedding_id)
    logger.info(f"📸 Broadcast photo_uploaded to wedding {wedding_id}")
