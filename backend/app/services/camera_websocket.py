
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import logging
import json

logger = logging.getLogger(__name__)

class CameraWebSocketManager:
    def __init__(self):
        # wedding_id -> Set[WebSocket]
        self.connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, ws: WebSocket, wedding_id: str):
        await ws.accept()
        if wedding_id not in self.connections:
            self.connections[wedding_id] = set()
        self.connections[wedding_id].add(ws)
        logger.info(f"Client connected to camera control for wedding {wedding_id}")
    
    def disconnect(self, ws: WebSocket, wedding_id: str):
        if wedding_id in self.connections:
            self.connections[wedding_id].remove(ws)
            if not self.connections[wedding_id]:
                del self.connections[wedding_id]
        logger.info(f"Client disconnected from camera control for wedding {wedding_id}")
    
    async def broadcast_camera_switch(self, wedding_id: str, camera: dict):
        """Notify all connected clients of camera switch"""
        if wedding_id in self.connections:
            message = {
                "event": "camera_switched",
                "camera_id": camera.get("camera_id"),
                "camera_name": camera.get("name"),
                "stream_key": camera.get("stream_key"),
                "hls_url": camera.get("hls_url"), # Make sure this is populated
                "status": "live"
            }
            
            to_remove = []
            for ws in self.connections[wedding_id]:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.warning(f"Error sending to WS: {e}")
                    to_remove.append(ws)
            
            for ws in to_remove:
                self.disconnect(ws, wedding_id)

# Singleton instance
ws_manager = CameraWebSocketManager()

async def broadcast_camera_switch(wedding_id: str, camera: dict):
    """Helper function for routes/services"""
    await ws_manager.broadcast_camera_switch(wedding_id, camera)
