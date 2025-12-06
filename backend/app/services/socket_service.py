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


@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    logger.info(f"Client connected: {sid}")
    await sio.emit('connected', {'status': 'Connected to WedLive'}, to=sid)


@sio.event
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


@sio.event
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


@sio.event
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


@sio.event
async def send_message(sid, data):
    """Send a chat message to wedding room"""
    wedding_id = data.get('wedding_id')
    message = data.get('message')
    guest_name = data.get('guest_name', 'Anonymous')
    user_id = data.get('user_id')
    
    if not wedding_id or not message:
        return {'error': 'wedding_id and message required'}
    
    # Broadcast message to room
    message_data = {
        'wedding_id': wedding_id,
        'message': message,
        'guest_name': guest_name,
        'user_id': user_id,
        'timestamp': data.get('timestamp')
    }
    
    await sio.emit('new_message', message_data, room=wedding_id)
    
    return {'status': 'sent'}


@sio.event
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


@sio.event
async def stream_quality_update(sid, data):
    """Update stream quality metrics"""
    wedding_id = data.get('wedding_id')
    quality_data = data.get('quality')
    
    if not wedding_id or not quality_data:
        return {'error': 'wedding_id and quality data required'}
    
    # Broadcast to admin/creator (optional)
    # For now, just acknowledge
    return {'status': 'recorded'}


@sio.event
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
