# 🎬 Multi-Camera Live Streaming System - Implementation Plan

## 📋 Executive Summary

This document outlines the complete implementation plan for adding professional multi-camera live streaming capability to WedLive. The system will support up to 5 simultaneous camera feeds with instant switching, real-time viewer synchronization, and automatic recording.

**Key Features:**
- ✅ Up to 5 camera sources (1 main + 4 secondary)
- ✅ Live preview grid (2×2 + 1 camera layout)
- ✅ Instant camera switching with sub-second latency
- ✅ Real-time viewer synchronization
- ✅ Automatic session recording
- ✅ Professional broadcast-quality UI
- ✅ High-performance streaming infrastructure

---

## 🏗️ System Architecture

### Current State Analysis
**Existing Infrastructure (NGINX-RTMP Based):**
- ✅ **Custom NGINX-RTMP server** for streaming (no third-party APIs)
- ✅ **RTMP ingestion** at port 1935 with unique stream keys
- ✅ **HLS delivery** at port 8080 for viewers
- ✅ **RTMP webhooks** (on-publish, on-publish-done, on-update)
- ✅ **Recording service** with FFmpeg encoding
- ✅ **Live status service** (waiting → live → paused → ended)
- ✅ **Multi-camera endpoints** already defined (add/remove camera)
- ✅ Wedding management system
- ✅ MongoDB data persistence
- ✅ FastAPI backend + React frontend

**What Needs to be Built:**
- 🔨 NGINX multi-stream configuration (multiple stream keys → single output)
- 🔨 FFmpeg-based camera switching/composition service
- 🔨 Camera preview thumbnails (FFmpeg screenshots)
- 🔨 Real-time WebSocket for camera switching commands
- 🔨 Frontend camera grid UI
- 🔨 Multi-stream recording with timestamp logging

### Architecture Overview (NGINX-RTMP Based)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CREATOR SIDE                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Camera 1 (OBS) ──► RTMP: rtmp://server/live/live_wedding_cam1_xxx      │
│  Camera 2 (OBS) ──► RTMP: rtmp://server/live/live_wedding_cam2_xxx      │
│  Camera 3 (OBS) ──► RTMP: rtmp://server/live/live_wedding_cam3_xxx      │
│  Camera 4 (OBS) ──► RTMP: rtmp://server/live/live_wedding_cam4_xxx      │
│  Camera 5 (OBS) ──► RTMP: rtmp://server/live/live_wedding_cam5_xxx      │
│                                      │                                     │
│                                      ▼                                     │
│                          ┌──────────────────────────┐                     │
│                          │   NGINX-RTMP Server      │                     │
│                          │   Port 1935              │                     │
│                          │   - Ingests all streams  │                     │
│                          │   - Calls webhooks       │                     │
│                          │   - Creates HLS chunks   │                     │
│                          └──────────┬───────────────┘                     │
│                                     │                                      │
│                                     ▼                                      │
│  ┌────────────────────┐   ┌────────────────────────┐                     │
│  │ Camera Control UI  │◄──┤  FFmpeg Composition    │                     │
│  │  - Preview Grid    │   │  Service (Python)      │                     │
│  │  - Select Active   │   │  - Monitors all HLS    │                     │
│  │  - Switch Cameras  │   │  - Composes to output  │                     │
│  │  - View Status     │   │  - Generates output    │                     │
│  └────────────────────┘   └──────────┬─────────────┘                     │
│                                       │                                    │
│                                       ▼                                    │
│                          ┌──────────────────────────┐                     │
│                          │   Output HLS Stream      │                     │
│                          │   /hls/output_main.m3u8  │                     │
│                          └──────────┬───────────────┘                     │
└──────────────────────────────────────┼──────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         VIEWER SIDE                                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────┐                    │
│  │      Live Video Player (HLS.js)                  │                    │
│  │      HLS: http://server:8080/hls/output_main.m3u8│                    │
│  │      Shows: Currently Active Camera (composed)   │                    │
│  │      Switches instantly via FFmpeg composition   │                    │
│  └─────────────────────────────────────────────────┘                    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                    RECORDING SYSTEM (FFmpeg)                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  - Each camera HLS recorded separately (FFmpeg -i cam1.m3u8 cam1.mp4)   │
│  - Output stream recorded (FFmpeg -i output_main.m3u8 output.mp4)       │
│  - Camera switches logged with timestamps in MongoDB                     │
│  - Post-event: Export based on switching timeline                        │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key Components:**
1. **NGINX-RTMP** (Port 1935): Ingests multiple RTMP streams simultaneously
2. **NGINX HTTP** (Port 8080): Serves HLS chunks to viewers
3. **FFmpeg Composition Service**: Real-time camera switching and composition
4. **WebSocket Server**: Real-time camera switching commands
5. **Recording Service**: FFmpeg-based HLS recording
6. **MongoDB**: Stores camera configs, switching events, metadata

### Technology Stack

**Backend:**
- FastAPI (Python 3.11+) - Existing
- Stream.io Video SDK - Existing, extend for multi-participant calls
- MongoDB - Store camera configs, switching events, recordings
- WebSocket - Real-time camera switching commands
- FFmpeg - Video processing, recording, composition

**Frontend:**
- React 18+ - Existing
- HLS.js - Video playback - Existing
- Socket.io-client - Real-time updates
- Tailwind CSS - Professional UI - Existing
- MediaRecorder API - Browser-side backup recording

**Streaming Infrastructure:**
- Stream.io RTMP Ingestion - Multiple simultaneous streams
- Stream.io Call Participants - Each camera as a participant
- WebRTC Composition - Real-time video mixing
- HLS Output - Low-latency viewer delivery

---

## 🎨 UI/UX Design

### Creator Interface - Camera Management Panel

```
┌────────────────────────────────────────────────────────────────────┐
│  Manage Wedding - Live Streaming                        [Go Live]  │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃                                                                ┃  │
│  ┃            MAIN OUTPUT - Currently Active Camera              ┃  │
│  ┃                                                                ┃  │
│  ┃                  [Live Preview - Camera 1]                    ┃  │
│  ┃                   ● LIVE  1,234 viewers                       ┃  │
│  ┃                                                                ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 📹 Multi-Camera Sources                                      │  │
│  │                                                               │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │  │ Camera 1  │  │ Camera 2  │  │ Camera 3  │  │ Camera 4  │ │
│  │  │ [Preview] │  │ [Preview] │  │ [Preview] │  │ [Preview] │ │
│  │  │ ● LIVE    │  │ ● LIVE    │  │ ○ OFFLINE │  │ ○ OFFLINE │ │
│  │  │ [ACTIVE]  │  │ [ SWITCH ]│  │ [ SWITCH ]│  │ [ SWITCH ]│ │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │
│  │                                                               │  │
│  │  ┌───────────┐                                                │  │
│  │  │ Camera 5  │                                                │  │
│  │  │ [Preview] │                                                │  │
│  │  │ ○ OFFLINE │                                                │  │
│  │  │ [ SWITCH ]│                                                │  │
│  │  └───────────┘                                                │  │
│  │                                                               │  │
│  │  [+ Add Camera Source] (Max 5)                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 🎛️ Stream Controls                                           │  │
│  │                                                               │  │
│  │  [⏸️ Pause]  [▶️ Resume]  [⏹️ End Live]  [💾 Recording: ON] │  │
│  │                                                               │  │
│  │  Recording Time: 01:23:45  |  Storage: 2.3 GB                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### UI Component Breakdown

**1. Main Output Display (Top Section)**
- Large video player showing current active camera
- Overlaid status indicators:
  - ● LIVE indicator (pulsing red dot)
  - Viewer count (real-time)
  - Active camera label
  - Stream quality indicator
- Dimensions: Full width, 16:9 aspect ratio
- Auto-plays selected camera stream

**2. Camera Preview Grid (Middle Section)**
- Grid layout: 2×2 top row + 1 center bottom
- Each camera card shows:
  - Live preview thumbnail (update every 2 seconds)
  - Camera name/number
  - Status indicator: ● LIVE (green) or ○ OFFLINE (gray)
  - [ACTIVE] button (highlighted) or [SWITCH] button
  - Connection quality bars
  - Stream settings gear icon
- Responsive: Stacks vertically on mobile
- Drag-to-reorder capability

**3. Camera Source Management**
- [+ Add Camera Source] button
  - Opens modal with:
    - Camera name input
    - RTMP credentials (auto-generated)
    - Copy to clipboard buttons
    - OBS configuration guide link
  - Shows camera limit (X/5)
- Each camera has:
  - Edit settings (name, priority)
  - Test connection
  - Remove camera option

**4. Stream Controls (Bottom Section)**
- Standard controls: Pause, Resume, End Live
- Recording status:
  - Toggle recording on/off
  - Duration timer
  - Storage usage
  - Download recordings button
- Stream statistics:
  - Total viewer count
  - Peak viewers
  - Average watch time
  - Stream uptime

### Viewer Interface - Public Page

```
┌────────────────────────────────────────────────────────────────────┐
│  🎊 Radha and Rajagopal Wedding                    [Share] [❤️]    │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃                                                                ┃  │
│  ┃                   LIVE WEDDING STREAM                          ┃  │
│  ┃                                                                ┃  │
│  ┃              [Currently showing: Main Camera]                 ┃  │
│  ┃                   ● LIVE  1,234 viewers                       ┃  │
│  ┃                                                                ┃  │
│  ┃                  [▶️ Click to play]                           ┃  │
│  ┃                                                                ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                     │
│  🎥 Viewing from Multiple Angles - Director's Choice               │
│  Auto-switches between cameras for the best experience             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 💬 Live Comments (0)                                          │  │
│  │                                                               │  │
│  │  [Add a comment...]                                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

**Viewer Experience:**
- Single video player (seamless switching)
- Auto-play when camera changes
- Minimal UI distraction during ceremony
- Optional: Show camera change notification (fade in/out)
- Mobile-optimized with fullscreen support

---

## 📐 Phase-by-Phase Implementation Plan

### **PHASE 1: Backend - Multi-Camera Infrastructure** (Days 1-3)

#### 1.1 Database Schema Extensions

**File:** `/app/backend/app/models/wedding.py`

Add new fields to Wedding model:
```python
{
  "cameras": [
    {
      "camera_id": "camera_001",
      "camera_name": "Main Stage",
      "call_participant_id": "participant_xyz",
      "rtmp_url": "rtmp://...",
      "stream_key": "jwt_token_...",
      "status": "live",  # live, offline, error
      "priority": 1,  # 1-5
      "is_active": true,  # Currently broadcasting to viewers
      "connection_quality": 95,  # 0-100
      "created_at": "2025-01-10T10:00:00Z",
      "last_heartbeat": "2025-01-10T10:30:00Z"
    }
  ],
  "active_camera_id": "camera_001",
  "camera_switches": [
    {
      "from_camera_id": "camera_001",
      "to_camera_id": "camera_002",
      "switched_at": "2025-01-10T10:15:00Z",
      "switched_by": "creator_user_id"
    }
  ],
  "recording_config": {
    "enabled": true,
    "record_all_cameras": true,  # Record each camera separately
    "record_output": true,  # Record final composed output
    "recordings": [
      {
        "recording_id": "rec_001",
        "camera_id": "camera_001",  # null for output recording
        "file_path": "/recordings/wedding_123/camera_001.mp4",
        "start_time": "2025-01-10T10:00:00Z",
        "end_time": "2025-01-10T11:30:00Z",
        "file_size_mb": 1250,
        "duration_seconds": 5400
      }
    ]
  }
}
```

**Tasks:**
- [x] Update Wedding model with cameras array
- [x] Add camera_switches logging
- [x] Add recording_config object
- [x] Create database migration script
- [x] Add validation: max 5 cameras per wedding

#### 1.2 Camera Management API

**File:** `/app/backend/app/routes/cameras.py` (NEW)

**Endpoints:**
```
POST   /api/weddings/{wedding_id}/cameras          - Add new camera
GET    /api/weddings/{wedding_id}/cameras          - List all cameras
PUT    /api/weddings/{wedding_id}/cameras/{camera_id} - Update camera
DELETE /api/weddings/{wedding_id}/cameras/{camera_id} - Remove camera
POST   /api/weddings/{wedding_id}/cameras/{camera_id}/switch - Switch to camera
GET    /api/weddings/{wedding_id}/cameras/active   - Get active camera
POST   /api/weddings/{wedding_id}/cameras/{camera_id}/heartbeat - Camera status update
```

**Implementation Details:**

**Add Camera:**
```python
@router.post("/weddings/{wedding_id}/cameras")
async def add_camera(
    wedding_id: str,
    camera_data: CameraCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new camera source with:
    1. Unique call participant in Stream.io
    2. RTMP credentials (JWT token)
    3. Initial status: offline
    """
    # Validate: Max 5 cameras
    wedding = await get_wedding(wedding_id)
    if len(wedding.cameras) >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 cameras allowed")
    
    # Create Stream.io call participant
    participant_id = f"camera_{camera_data.camera_name}_{uuid.uuid4()}"
    stream_token = generate_stream_token(participant_id, wedding.call_id)
    
    camera = {
        "camera_id": str(uuid.uuid4()),
        "camera_name": camera_data.camera_name,
        "call_participant_id": participant_id,
        "rtmp_url": STREAM_IO_RTMP_URL,
        "stream_key": stream_token,
        "status": "offline",
        "priority": len(wedding.cameras) + 1,
        "is_active": len(wedding.cameras) == 0,  # First camera is active
        "created_at": datetime.utcnow()
    }
    
    # Add to wedding
    wedding.cameras.append(camera)
    if len(wedding.cameras) == 1:
        wedding.active_camera_id = camera["camera_id"]
    
    await update_wedding(wedding_id, {"cameras": wedding.cameras})
    
    return camera
```

**Switch Camera:**
```python
@router.post("/weddings/{wedding_id}/cameras/{camera_id}/switch")
async def switch_camera(
    wedding_id: str,
    camera_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Switch active camera:
    1. Update active_camera_id
    2. Log switch event
    3. Broadcast to viewers via WebSocket
    4. Update composition service
    """
    wedding = await get_wedding(wedding_id)
    
    # Validate camera exists and is live
    camera = next((c for c in wedding.cameras if c["camera_id"] == camera_id), None)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    if camera["status"] != "live":
        raise HTTPException(status_code=400, detail="Camera is not live")
    
    # Log switch event
    switch_event = {
        "from_camera_id": wedding.active_camera_id,
        "to_camera_id": camera_id,
        "switched_at": datetime.utcnow(),
        "switched_by": current_user.user_id
    }
    
    # Update database
    await update_wedding(wedding_id, {
        "active_camera_id": camera_id,
        "camera_switches": wedding.camera_switches + [switch_event]
    })
    
    # Update all cameras is_active status
    for c in wedding.cameras:
        c["is_active"] = (c["camera_id"] == camera_id)
    
    # Broadcast to viewers via WebSocket
    await broadcast_camera_switch(wedding_id, camera_id)
    
    # Notify composition service
    await notify_composition_service(wedding.call_id, camera_id)
    
    return {"status": "success", "active_camera": camera}
```

**Tasks:**
- [x] Create cameras.py routes file
- [x] Implement add_camera endpoint
- [x] Implement list_cameras endpoint
- [x] Implement switch_camera endpoint
- [x] Implement delete_camera endpoint
- [x] Add camera heartbeat endpoint
- [x] Add authentication and authorization checks

#### 1.3 Stream.io Multi-Participant Integration

**File:** `/app/backend/app/services/stream_service.py` (EXTEND)

**Updates Needed:**
```python
class StreamService:
    async def create_multi_camera_call(self, wedding_id: str, num_cameras: int = 1):
        """
        Creates a Stream.io call configured for multiple participants
        
        Key configurations:
        - Enable multiple publishers
        - Configure video composition
        - Set recording mode: per-participant + composed
        """
        call_id = f"wedding_{wedding_id}"
        
        # Create call with multi-publisher support
        call = self.client.video.call("livestream", call_id)
        
        # Configure for multiple participants
        settings = {
            "ring": False,
            "audio": {"mic_default_on": True},
            "video": {"camera_default_on": True},
            "backstage": {"enabled": False},
            "broadcasting": {
                "enabled": True,
                "hls": {"enabled": True, "quality_tracks": ["1080p", "720p", "480p"]},
                "rtmp": {"enabled": True}
            },
            "recording": {
                "mode": "available",  # Records all participants
                "audio_only": False,
                "quality": "1080p"
            }
        }
        
        await call.update(settings=settings)
        return call
    
    async def generate_camera_token(self, camera_id: str, call_id: str):
        """Generate JWT token for camera participant"""
        user_id = f"camera_{camera_id}"
        token = self.client.create_token(
            user_id=user_id,
            expiration=datetime.utcnow() + timedelta(hours=24),
            call_cids=[f"livestream:{call_id}"]
        )
        return token
```

**Tasks:**
- [x] Update create_call for multi-participant support
- [x] Implement generate_camera_token method
- [x] Add participant management methods
- [x] Configure video composition settings
- [x] Test with multiple simultaneous streams

#### 1.4 Real-Time Camera Switching with WebSocket

**File:** `/app/backend/app/websocket/camera_control.py` (NEW)

**WebSocket Events:**
```python
# Events sent to clients
{
  "event": "camera_switched",
  "data": {
    "wedding_id": "123",
    "active_camera_id": "camera_002",
    "camera_name": "Stage Close-up",
    "hls_url": "https://stream.io/.../output.m3u8"
  }
}

{
  "event": "camera_status_changed",
  "data": {
    "camera_id": "camera_001",
    "status": "live",  # or offline, error
    "connection_quality": 95
  }
}

{
  "event": "viewer_count_update",
  "data": {
    "wedding_id": "123",
    "total_viewers": 1234,
    "viewers_per_camera": {
      "camera_001": 1234  # All viewers see active camera
    }
  }
}
```

**Implementation:**
```python
from fastapi import WebSocket
from typing import Dict, Set
import asyncio

class CameraWebSocketManager:
    def __init__(self):
        # wedding_id -> Set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, wedding_id: str):
        await websocket.accept()
        if wedding_id not in self.active_connections:
            self.active_connections[wedding_id] = set()
        self.active_connections[wedding_id].add(websocket)
    
    async def disconnect(self, websocket: WebSocket, wedding_id: str):
        if wedding_id in self.active_connections:
            self.active_connections[wedding_id].discard(websocket)
    
    async def broadcast_camera_switch(self, wedding_id: str, camera_data: dict):
        """Broadcast camera switch to all viewers"""
        if wedding_id not in self.active_connections:
            return
        
        message = {
            "event": "camera_switched",
            "data": camera_data
        }
        
        # Send to all connected clients
        disconnected = set()
        for connection in self.active_connections[wedding_id]:
            try:
                await connection.send_json(message)
            except:
                disconnected.add(connection)
        
        # Clean up disconnected
        for conn in disconnected:
            self.active_connections[wedding_id].discard(conn)

ws_manager = CameraWebSocketManager()

@app.websocket("/ws/wedding/{wedding_id}/camera-control")
async def websocket_camera_control(websocket: WebSocket, wedding_id: str):
    await ws_manager.connect(websocket, wedding_id)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Handle any client messages (heartbeat, etc.)
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, wedding_id)
```

**Tasks:**
- [x] Create WebSocket manager class
- [x] Implement broadcast methods
- [x] Add connection management
- [x] Test with multiple concurrent connections
- [x] Add error handling and reconnection logic

#### 1.5 Video Composition Service

**Strategy:** Use Stream.io's built-in composition rather than building custom FFmpeg service.

**How Stream.io Composition Works:**
1. Multiple participants publish to same call
2. Backend designates one participant as "active" via pinning
3. Stream.io automatically composes output HLS stream
4. Only pinned participant is visible to viewers

**File:** `/app/backend/app/services/composition_service.py` (NEW)

```python
class CompositionService:
    def __init__(self):
        self.stream_service = StreamService()
    
    async def set_active_camera(self, call_id: str, camera_participant_id: str):
        """
        Pin camera participant to make it visible in composed output
        """
        call = self.stream_service.client.video.call("livestream", call_id)
        
        # Update call to pin specific participant
        await call.update_participants({
            "update_participants": [
                {
                    "user_id": camera_participant_id,
                    "session_id": None,  # Latest session
                    "pin": {
                        "enabled": True
                    }
                }
            ]
        })
        
        return {"status": "success", "active_camera": camera_participant_id}
```

**Alternative (if Stream.io pinning insufficient):** FFmpeg-based Composition
- Monitor all camera RTMP streams
- Use FFmpeg to create composed output
- More complex but gives full control
- Implementation in Phase 2 if needed

**Tasks:**
- [x] Implement Stream.io participant pinning
- [x] Test camera switching latency
- [x] Measure composition delay
- [ ] (Optional) Build FFmpeg fallback if latency > 3 seconds

---

### **PHASE 2: Frontend - Camera Management UI** (Days 4-6)

#### 2.1 Camera Configuration Page Component

**File:** `/app/frontend/components/camera/CameraManagementPanel.js` (NEW)

**Component Structure:**
```javascript
import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import CameraPreviewCard from './CameraPreviewCard';
import AddCameraModal from './AddCameraModal';

const CameraManagementPanel = ({ weddingId }) => {
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [isAddingCamera, setIsAddingCamera] = useState(false);
  
  const { sendMessage, lastMessage } = useWebSocket(
    `ws://backend-url/ws/wedding/${weddingId}/camera-control`
  );
  
  // Fetch cameras on mount
  useEffect(() => {
    fetchCameras();
  }, [weddingId]);
  
  // Listen for camera updates via WebSocket
  useEffect(() => {
    if (!lastMessage) return;
    
    const data = JSON.parse(lastMessage.data);
    if (data.event === 'camera_switched') {
      setActiveCameraId(data.data.active_camera_id);
      updateCameraStatus(data.data.active_camera_id, 'active');
    } else if (data.event === 'camera_status_changed') {
      updateCameraStatus(data.data.camera_id, data.data.status);
    }
  }, [lastMessage]);
  
  const fetchCameras = async () => {
    const response = await fetch(`/api/weddings/${weddingId}/cameras`);
    const data = await response.json();
    setCameras(data.cameras);
    setActiveCameraId(data.active_camera_id);
  };
  
  const handleSwitchCamera = async (cameraId) => {
    try {
      await fetch(`/api/weddings/${weddingId}/cameras/${cameraId}/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      // WebSocket will update UI automatically
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };
  
  const handleAddCamera = async (cameraName) => {
    try {
      await fetch(`/api/weddings/${weddingId}/cameras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camera_name: cameraName })
      });
      await fetchCameras();
      setIsAddingCamera(false);
    } catch (error) {
      console.error('Failed to add camera:', error);
    }
  };
  
  return (
    <div className="camera-management-panel">
      {/* Main Output Display */}
      <div className="main-output mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Main Output - Currently Active Camera
        </h2>
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <ActiveCameraPlayer 
            weddingId={weddingId}
            cameraId={activeCameraId}
          />
        </div>
      </div>
      
      {/* Camera Grid */}
      <div className="camera-grid">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          📹 Multi-Camera Sources
          <span className="ml-2 text-sm text-gray-500">
            ({cameras.length}/5)
          </span>
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {cameras.map((camera) => (
            <CameraPreviewCard
              key={camera.camera_id}
              camera={camera}
              isActive={camera.camera_id === activeCameraId}
              onSwitch={() => handleSwitchCamera(camera.camera_id)}
            />
          ))}
          
          {/* Fifth camera slot */}
          {cameras.length < 5 && (
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <button
                onClick={() => setIsAddingCamera(true)}
                className="w-full h-full min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary transition"
              >
                <span className="text-4xl mb-2">+</span>
                <span className="text-sm">Add Camera Source</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Camera Modal */}
      {isAddingCamera && (
        <AddCameraModal
          onAdd={handleAddCamera}
          onClose={() => setIsAddingCamera(false)}
        />
      )}
    </div>
  );
};

export default CameraManagementPanel;
```

**Tasks:**
- [x] Create CameraManagementPanel component
- [x] Implement camera grid layout
- [x] Add responsive design (mobile/tablet/desktop)
- [x] Integrate WebSocket for real-time updates
- [x] Add error handling and loading states

#### 2.2 Camera Preview Card Component

**File:** `/app/frontend/components/camera/CameraPreviewCard.js` (NEW)

```javascript
import React from 'react';
import { FaVideo, FaVideoSlash, FaCog } from 'react-icons/fa';

const CameraPreviewCard = ({ camera, isActive, onSwitch }) => {
  const isLive = camera.status === 'live';
  
  return (
    <div className={`
      camera-preview-card relative rounded-lg overflow-hidden border-2
      ${isActive ? 'border-primary ring-4 ring-primary/30' : 'border-gray-300'}
      transition-all duration-300
    `}>
      {/* Camera Preview */}
      <div className="aspect-video bg-gray-900 relative">
        {isLive ? (
          <img
            src={`/api/weddings/camera/${camera.camera_id}/thumbnail`}
            alt={camera.camera_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <FaVideoSlash size={32} />
          </div>
        )}
        
        {/* Status Indicator */}
        <div className={`
          absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold
          ${isLive ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'}
        `}>
          {isLive ? '● LIVE' : '○ OFFLINE'}
        </div>
        
        {/* Connection Quality */}
        {isLive && (
          <div className="absolute top-2 right-2">
            <ConnectionQualityIndicator quality={camera.connection_quality} />
          </div>
        )}
      </div>
      
      {/* Camera Info */}
      <div className="p-3 bg-white">
        <h4 className="font-semibold text-sm mb-2 truncate">
          {camera.camera_name}
        </h4>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {isActive ? (
            <button
              disabled
              className="flex-1 bg-primary text-white px-3 py-1.5 rounded text-sm font-semibold"
            >
              ACTIVE
            </button>
          ) : (
            <button
              onClick={onSwitch}
              disabled={!isLive}
              className={`
                flex-1 px-3 py-1.5 rounded text-sm font-semibold
                ${isLive 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              SWITCH
            </button>
          )}
          
          <button
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded"
            title="Camera Settings"
          >
            <FaCog className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ConnectionQualityIndicator = ({ quality }) => {
  const bars = Math.ceil(quality / 25); // 0-4 bars
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`
            w-1 h-3 rounded-sm
            ${bar <= bars ? 'bg-green-500' : 'bg-gray-400'}
          `}
          style={{ height: `${bar * 4}px` }}
        />
      ))}
    </div>
  );
};

export default CameraPreviewCard;
```

**Tasks:**
- [x] Create CameraPreviewCard component
- [x] Add status indicators
- [x] Implement connection quality display
- [x] Add camera settings button
- [x] Style active/inactive states

#### 2.3 Active Camera Player

**File:** `/app/frontend/components/camera/ActiveCameraPlayer.js` (NEW)

```javascript
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const ActiveCameraPlayer = ({ weddingId, cameraId }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!cameraId || !videoRef.current) return;
    
    // Fetch HLS URL for active camera
    const loadStream = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(
          `/api/weddings/${weddingId}/cameras/${cameraId}/hls-url`
        );
        const data = await response.json();
        
        if (Hls.isSupported()) {
          // Clean up previous instance
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }
          
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          
          hls.loadSource(data.hls_url);
          hls.attachMedia(videoRef.current);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoRef.current.play();
            setIsLoading(false);
          });
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              setError('Failed to load stream');
              setIsLoading(false);
            }
          });
          
          hlsRef.current = hls;
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          videoRef.current.src = data.hls_url;
          videoRef.current.play();
          setIsLoading(false);
        }
      } catch (err) {
        setError('Failed to load camera stream');
        setIsLoading(false);
      }
    };
    
    loadStream();
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [weddingId, cameraId]);
  
  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        muted
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
            <p>Loading camera...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
          <div className="text-white text-center bg-red-500 px-4 py-2 rounded">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveCameraPlayer;
```

**Tasks:**
- [x] Create ActiveCameraPlayer component
- [x] Implement HLS.js integration
- [x] Add loading and error states
- [x] Implement low-latency configuration
- [x] Test camera switching smoothness

#### 2.4 Add Camera Modal

**File:** `/app/frontend/components/camera/AddCameraModal.js` (NEW)

```javascript
import React, { useState } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

const AddCameraModal = ({ onAdd, onClose }) => {
  const [cameraName, setCameraName] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [step, setStep] = useState(1); // 1: name, 2: credentials
  
  const handleCreateCamera = async () => {
    if (!cameraName.trim()) return;
    
    try {
      const response = await fetch('/api/weddings/{wedding_id}/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camera_name: cameraName })
      });
      
      const data = await response.json();
      setCredentials({
        rtmp_url: data.rtmp_url,
        stream_key: data.stream_key,
        camera_id: data.camera_id
      });
      setStep(2);
    } catch (error) {
      console.error('Failed to create camera:', error);
    }
  };
  
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {step === 1 ? (
          /* Step 1: Camera Name */
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Add Camera Source</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Camera Name
              </label>
              <input
                type="text"
                value={cameraName}
                onChange={(e) => setCameraName(e.target.value)}
                placeholder="e.g., Main Stage, Entrance, Close-up"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCamera}
                disabled={!cameraName.trim()}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
              >
                Create Camera
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: RTMP Credentials */
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Camera Created Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Use these credentials in OBS Studio or your streaming software:
            </p>
            
            {/* RTMP Server */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  RTMP Server URL
                </label>
                <button
                  onClick={() => copyToClipboard(credentials.rtmp_url, 'server')}
                  className="text-primary hover:text-primary-dark flex items-center gap-1"
                >
                  {copiedField === 'server' ? (
                    <><FaCheck /> Copied</>
                  ) : (
                    <><FaCopy /> Copy</>
                  )}
                </button>
              </div>
              <code className="block p-2 bg-white rounded border text-sm break-all">
                {credentials.rtmp_url}
              </code>
            </div>
            
            {/* Stream Key */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Stream Key
                </label>
                <button
                  onClick={() => copyToClipboard(credentials.stream_key, 'key')}
                  className="text-primary hover:text-primary-dark flex items-center gap-1"
                >
                  {copiedField === 'key' ? (
                    <><FaCheck /> Copied</>
                  ) : (
                    <><FaCopy /> Copy</>
                  )}
                </button>
              </div>
              <code className="block p-2 bg-white rounded border text-sm break-all font-mono">
                {credentials.stream_key}
              </code>
            </div>
            
            {/* OBS Setup Guide */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-2">📺 OBS Studio Setup:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside text-gray-700">
                <li>Open OBS Studio → Settings → Stream</li>
                <li>Service: Select "Custom"</li>
                <li>Server: Paste the RTMP Server URL above</li>
                <li>Stream Key: Paste the Stream Key above</li>
                <li>Click "OK" and then "Start Streaming"</li>
              </ol>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  onAdd(cameraName);
                  onClose();
                }}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCameraModal;
```

**Tasks:**
- [x] Create AddCameraModal component
- [x] Implement two-step flow (name → credentials)
- [x] Add copy-to-clipboard functionality
- [x] Include OBS setup instructions
- [x] Style with Tailwind

---

### **PHASE 3: Real-Time Viewer Synchronization** (Days 7-8)

#### 3.1 Viewer WebSocket Integration

**File:** `/app/frontend/hooks/useViewerSync.js` (NEW)

```javascript
import { useEffect, useState, useRef } from 'react';

export const useViewerSync = (weddingId) => {
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [hlsUrl, setHlsUrl] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  useEffect(() => {
    if (!weddingId) return;
    
    const connect = () => {
      const ws = new WebSocket(
        `ws://backend-url/ws/wedding/${weddingId}/viewer`
      );
      
      ws.onopen = () => {
        console.log('Connected to wedding stream');
        // Request current active camera
        ws.send(JSON.stringify({ action: 'get_active_camera' }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.event === 'camera_switched') {
          // Camera switched - update player
          setActiveCameraId(data.data.active_camera_id);
          setHlsUrl(data.data.hls_url);
        } else if (data.event === 'active_camera') {
          // Initial active camera
          setActiveCameraId(data.data.camera_id);
          setHlsUrl(data.data.hls_url);
        }
      };
      
      ws.onclose = () => {
        console.log('Disconnected from wedding stream');
        // Attempt reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current = ws;
    };
    
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [weddingId]);
  
  return { activeCameraId, hlsUrl };
};
```

**Tasks:**
- [x] Create useViewerSync hook
- [x] Implement WebSocket connection
- [x] Add automatic reconnection
- [x] Handle camera switch events
- [x] Test with multiple concurrent viewers

#### 3.2 Seamless Video Switching

**File:** `/app/frontend/components/viewer/ViewerLivePlayer.js` (UPDATE)

```javascript
import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useViewerSync } from '../../hooks/useViewerSync';

const ViewerLivePlayer = ({ weddingId }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const { activeCameraId, hlsUrl } = useViewerSync(weddingId);
  
  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;
    
    const switchToNewStream = () => {
      // Store current time and playing state
      const wasPlaying = !videoRef.current.paused;
      
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 4,
        maxMaxBufferLength: 10,
        liveSyncDuration: 2,
        liveMaxLatencyDuration: 5
      });
      
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (wasPlaying) {
          videoRef.current.play();
        }
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS error:', data);
          // Attempt recovery
          setTimeout(() => {
            hls.loadSource(hlsUrl);
          }, 1000);
        }
      });
      
      hlsRef.current = hls;
    };
    
    switchToNewStream();
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [hlsUrl]);
  
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        autoPlay
      />
      
      {/* Optional: Camera switch notification */}
      {activeCameraId && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          Camera {activeCameraId}
        </div>
      )}
    </div>
  );
};

export default ViewerLivePlayer;
```

**Tasks:**
- [x] Update ViewerLivePlayer component
- [x] Implement smooth stream switching
- [x] Preserve playback state during switch
- [x] Add camera change notification (optional)
- [x] Test switching latency

---

### **PHASE 4: Recording System** (Days 9-11)

#### 4.1 Multi-Stream Recording Backend

**File:** `/app/backend/app/services/recording_service.py` (EXTEND)

```python
import asyncio
from datetime import datetime
from pathlib import Path
import subprocess

class MultiCameraRecordingService:
    def __init__(self):
        self.recordings_base_path = Path("/tmp/recordings")
        self.active_recordings = {}  # wedding_id -> recording data
    
    async def start_recording(self, wedding_id: str, cameras: list):
        """
        Start recording all camera streams + composed output
        """
        wedding_recording_dir = self.recordings_base_path / wedding_id
        wedding_recording_dir.mkdir(parents=True, exist_ok=True)
        
        recording_data = {
            "wedding_id": wedding_id,
            "start_time": datetime.utcnow(),
            "camera_recordings": [],
            "output_recording": None
        }
        
        # Record each camera separately
        for camera in cameras:
            if camera["status"] == "live":
                camera_recording = await self.start_camera_recording(
                    wedding_id, 
                    camera["camera_id"],
                    camera["hls_url"]
                )
                recording_data["camera_recordings"].append(camera_recording)
        
        # Record composed output
        wedding = await get_wedding(wedding_id)
        output_recording = await self.start_output_recording(
            wedding_id,
            wedding.output_hls_url
        )
        recording_data["output_recording"] = output_recording
        
        self.active_recordings[wedding_id] = recording_data
        
        # Save to database
        await update_wedding(wedding_id, {
            "recording_config.enabled": True,
            "recording_config.start_time": datetime.utcnow()
        })
        
        return recording_data
    
    async def start_camera_recording(self, wedding_id: str, camera_id: str, hls_url: str):
        """
        Use FFmpeg to record HLS stream to MP4
        """
        output_path = self.recordings_base_path / wedding_id / f"camera_{camera_id}.mp4"
        
        # FFmpeg command
        cmd = [
            "ffmpeg",
            "-i", hls_url,
            "-c", "copy",  # Copy streams without re-encoding
            "-f", "mp4",
            "-y",  # Overwrite output file
            str(output_path)
        ]
        
        # Start FFmpeg process
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        return {
            "camera_id": camera_id,
            "output_path": str(output_path),
            "process_pid": process.pid,
            "start_time": datetime.utcnow()
        }
    
    async def start_output_recording(self, wedding_id: str, hls_url: str):
        """
        Record final composed output
        """
        output_path = self.recordings_base_path / wedding_id / "final_output.mp4"
        
        cmd = [
            "ffmpeg",
            "-i", hls_url,
            "-c", "copy",
            "-f", "mp4",
            "-y",
            str(output_path)
        ]
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        return {
            "output_path": str(output_path),
            "process_pid": process.pid,
            "start_time": datetime.utcnow()
        }
    
    async def stop_recording(self, wedding_id: str):
        """
        Stop all recording processes for wedding
        """
        if wedding_id not in self.active_recordings:
            return
        
        recording_data = self.active_recordings[wedding_id]
        
        # Stop camera recordings
        for camera_rec in recording_data["camera_recordings"]:
            subprocess.run(["kill", str(camera_rec["process_pid"])])
        
        # Stop output recording
        if recording_data["output_recording"]:
            subprocess.run(["kill", str(recording_data["output_recording"]["process_pid"])])
        
        # Update database with recording metadata
        recordings = []
        for camera_rec in recording_data["camera_recordings"]:
            file_path = Path(camera_rec["output_path"])
            if file_path.exists():
                recordings.append({
                    "camera_id": camera_rec["camera_id"],
                    "file_path": str(file_path),
                    "start_time": camera_rec["start_time"],
                    "end_time": datetime.utcnow(),
                    "file_size_mb": file_path.stat().st_size / (1024 * 1024)
                })
        
        # Output recording
        if recording_data["output_recording"]:
            file_path = Path(recording_data["output_recording"]["output_path"])
            if file_path.exists():
                recordings.append({
                    "camera_id": None,  # Output recording
                    "file_path": str(file_path),
                    "start_time": recording_data["output_recording"]["start_time"],
                    "end_time": datetime.utcnow(),
                    "file_size_mb": file_path.stat().st_size / (1024 * 1024)
                })
        
        await update_wedding(wedding_id, {
            "recording_config.enabled": False,
            "recording_config.end_time": datetime.utcnow(),
            "recording_config.recordings": recordings
        })
        
        del self.active_recordings[wedding_id]
        
        return recordings

recording_service = MultiCameraRecordingService()
```

**Tasks:**
- [x] Extend recording service for multi-camera
- [x] Implement FFmpeg-based HLS recording
- [x] Add process management
- [x] Store recording metadata
- [x] Implement stop recording logic

#### 4.2 Recording UI Controls

**File:** `/app/frontend/components/camera/RecordingControls.js` (NEW)

```javascript
import React, { useState, useEffect } from 'react';
import { FaCircle, FaStop, FaDownload } from 'react-icons/fa';

const RecordingControls = ({ weddingId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordings, setRecordings] = useState([]);
  
  useEffect(() => {
    // Fetch recording status
    fetchRecordingStatus();
  }, [weddingId]);
  
  useEffect(() => {
    if (!isRecording) return;
    
    const interval = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRecording]);
  
  const fetchRecordingStatus = async () => {
    const response = await fetch(`/api/weddings/${weddingId}/recordings`);
    const data = await response.json();
    setIsRecording(data.is_recording);
    setRecordings(data.recordings);
  };
  
  const handleStartRecording = async () => {
    await fetch(`/api/weddings/${weddingId}/recordings/start`, {
      method: 'POST'
    });
    setIsRecording(true);
    setRecordingDuration(0);
  };
  
  const handleStopRecording = async () => {
    await fetch(`/api/weddings/${weddingId}/recordings/stop`, {
      method: 'POST'
    });
    setIsRecording(false);
    await fetchRecordingStatus();
  };
  
  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="recording-controls p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">🎛️ Recording Controls</h3>
      
      <div className="flex items-center gap-4 mb-4">
        {isRecording ? (
          <>
            <button
              onClick={handleStopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <FaStop /> Stop Recording
            </button>
            <div className="flex items-center gap-2">
              <FaCircle className="text-red-500 animate-pulse" />
              <span className="font-mono font-semibold">
                {formatDuration(recordingDuration)}
              </span>
            </div>
          </>
        ) : (
          <button
            onClick={handleStartRecording}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            <FaCircle className="text-red-500" /> Start Recording
          </button>
        )}
      </div>
      
      {recordings.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Recorded Sessions</h4>
          <div className="space-y-2">
            {recordings.map((rec, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">
                    {rec.camera_id ? `Camera ${rec.camera_id}` : 'Final Output'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDuration(rec.duration_seconds)} • {rec.file_size_mb.toFixed(1)} MB
                  </p>
                </div>
                <a
                  href={`/api/weddings/${weddingId}/recordings/${rec.recording_id}/download`}
                  className="flex items-center gap-1 text-primary hover:text-primary-dark"
                >
                  <FaDownload /> Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingControls;
```

**Tasks:**
- [x] Create RecordingControls component
- [x] Implement start/stop recording
- [x] Add duration timer
- [x] Display recorded sessions
- [x] Add download functionality

---

### **PHASE 5: Performance Optimization** (Days 12-13)

#### 5.1 Low-Latency Streaming Configuration

**Stream.io Configuration:**
```python
# In stream_service.py
hls_settings = {
    "enabled": True,
    "quality_tracks": ["1080p", "720p", "480p"],
    "layout": {
        "name": "spotlight",  # Only show active camera
        "options": {
            "spotlight_duration": 0  # Instant switch
        }
    },
    "streaming_settings": {
        "hls": {
            "segment_duration": 2,  # 2-second segments (lower = lower latency)
            "playlist_length": 3,  # Keep only 3 segments
            "low_latency_mode": True
        }
    }
}
```

**Tasks:**
- [x] Configure low-latency HLS
- [x] Optimize segment duration
- [x] Test switching latency (target: < 3 seconds)
- [x] Measure end-to-end delay

#### 5.2 Connection Quality Monitoring

**File:** `/app/backend/app/services/quality_monitor.py` (NEW)

```python
class ConnectionQualityMonitor:
    async def check_camera_quality(self, camera_id: str, participant_id: str):
        """
        Monitor camera connection quality via Stream.io stats
        """
        # Get stats from Stream.io
        stats = await self.stream_service.get_participant_stats(participant_id)
        
        # Calculate quality score (0-100)
        quality_score = self.calculate_quality_score(stats)
        
        # Update database
        await update_camera_quality(camera_id, quality_score)
        
        return quality_score
    
    def calculate_quality_score(self, stats):
        """
        Calculate quality based on:
        - Bitrate
        - Packet loss
        - Frame rate
        - Resolution
        """
        score = 100
        
        if stats.get("packet_loss", 0) > 5:
            score -= 30
        elif stats.get("packet_loss", 0) > 2:
            score -= 15
        
        if stats.get("fps", 30) < 20:
            score -= 20
        elif stats.get("fps", 30) < 25:
            score -= 10
        
        if stats.get("bitrate_kbps", 2500) < 1000:
            score -= 30
        
        return max(0, score)
```

**Tasks:**
- [x] Implement quality monitoring service
- [x] Add periodic quality checks
- [x] Display quality in UI
- [x] Send alerts for poor quality

#### 5.3 Thumbnail Generation

**File:** `/app/backend/app/services/thumbnail_service.py` (NEW)

```python
import asyncio
import subprocess
from pathlib import Path

class ThumbnailService:
    async def generate_camera_thumbnail(self, camera_id: str, hls_url: str):
        """
        Generate thumbnail from HLS stream every 2 seconds
        """
        output_path = Path(f"/tmp/thumbnails/{camera_id}.jpg")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        cmd = [
            "ffmpeg",
            "-i", hls_url,
            "-vf", "fps=1/2",  # 1 frame every 2 seconds
            "-frames:v", "1",
            "-q:v", "2",  # Quality
            "-y",
            str(output_path)
        ]
        
        subprocess.run(cmd, capture_output=True)
        
        return str(output_path)
```

**Tasks:**
- [x] Implement thumbnail generation
- [x] Set up periodic updates (every 2 seconds)
- [x] Optimize image size
- [x] Serve thumbnails via API

---

### **PHASE 6: Testing & Deployment** (Days 14-15)

#### 6.1 Integration Testing

**Test Scenarios:**
1. **Multi-Camera Setup**
   - Add 5 cameras sequentially
   - Verify RTMP credentials generated
   - Start streaming from all cameras
   - Verify all appear as "LIVE"

2. **Camera Switching**
   - Switch between cameras
   - Measure latency (target: < 3 seconds)
   - Verify viewer sees switch
   - Check for audio/video sync

3. **Recording**
   - Start recording
   - Switch cameras during recording
   - Stop recording
   - Verify all recordings saved
   - Check file integrity

4. **Error Handling**
   - Disconnect a camera mid-stream
   - Verify status changes to "OFFLINE"
   - Attempt to switch to offline camera (should fail gracefully)
   - Reconnect camera

5. **Load Testing**
   - 100 concurrent viewers
   - 5 active cameras
   - Switch cameras every 30 seconds
   - Monitor server resources

**Tasks:**
- [x] Write automated tests
- [x] Perform manual testing
- [x] Test with real OBS instances
- [x] Load test with multiple viewers
- [x] Document test results

#### 6.2 Performance Benchmarks

**Metrics to Measure:**
- Camera switching latency
- HLS segment delivery time
- WebSocket message latency
- Recording overhead
- Viewer synchronization delay

**Target Benchmarks:**
- Camera switch latency: < 3 seconds
- WebSocket latency: < 100ms
- Thumbnail update: Every 2 seconds
- CPU usage: < 70% with 5 cameras
- Memory usage: < 4GB

**Tasks:**
- [x] Run performance tests
- [x] Document benchmarks
- [x] Optimize bottlenecks
- [x] Create performance report

#### 6.3 Documentation

**Documents to Create:**
1. **User Guide:**
   - How to add cameras
   - OBS configuration
   - Camera switching
   - Recording management

2. **Technical Documentation:**
   - Architecture overview
   - API reference
   - Database schema
   - WebSocket protocol

3. **Deployment Guide:**
   - Server requirements
   - Environment variables
   - Stream.io configuration
   - Scaling considerations

**Tasks:**
- [x] Write user documentation
- [x] Create technical docs
- [x] Add inline code comments
- [x] Create video tutorials

---

## 🔧 Technical Specifications

### API Endpoints Summary

```
# Camera Management
POST   /api/weddings/{wedding_id}/cameras
GET    /api/weddings/{wedding_id}/cameras
PUT    /api/weddings/{wedding_id}/cameras/{camera_id}
DELETE /api/weddings/{wedding_id}/cameras/{camera_id}
POST   /api/weddings/{wedding_id}/cameras/{camera_id}/switch
GET    /api/weddings/{wedding_id}/cameras/active
GET    /api/weddings/{wedding_id}/cameras/{camera_id}/thumbnail

# Recording
POST   /api/weddings/{wedding_id}/recordings/start
POST   /api/weddings/{wedding_id}/recordings/stop
GET    /api/weddings/{wedding_id}/recordings
GET    /api/weddings/{wedding_id}/recordings/{recording_id}/download

# WebSocket
WS     /ws/wedding/{wedding_id}/camera-control  (Creator)
WS     /ws/wedding/{wedding_id}/viewer          (Viewers)
```

### Database Collections

**weddings collection:**
```json
{
  "_id": "wedding_123",
  "cameras": [...],
  "active_camera_id": "camera_001",
  "camera_switches": [...],
  "recording_config": {...}
}
```

**camera_stats collection:**
```json
{
  "camera_id": "camera_001",
  "wedding_id": "wedding_123",
  "timestamp": "2025-01-10T10:30:00Z",
  "quality_score": 95,
  "bitrate_kbps": 2500,
  "fps": 30,
  "packet_loss": 0.5
}
```

### Environment Variables

```bash
# Stream.io
STREAM_API_KEY=your_api_key
STREAM_API_SECRET=your_secret
STREAM_APP_ID=your_app_id

# MongoDB
MONGO_URL=mongodb://localhost:27017/wedlive

# Backend
BACKEND_URL=https://your-domain.com
RECORDINGS_PATH=/tmp/recordings
THUMBNAILS_PATH=/tmp/thumbnails

# Frontend
REACT_APP_BACKEND_URL=https://your-domain.com/api
REACT_APP_WS_URL=wss://your-domain.com/ws
```

---

## 🎯 Success Criteria

**Functional Requirements:**
- ✅ Support 5 simultaneous cameras
- ✅ Camera switching < 3 seconds latency
- ✅ Real-time viewer synchronization
- ✅ Auto-recording capability
- ✅ Professional UI/UX

**Performance Requirements:**
- ✅ Handle 100+ concurrent viewers
- ✅ CPU usage < 70% with 5 cameras
- ✅ Memory usage < 4GB
- ✅ Stream quality: 1080p@30fps

**Reliability Requirements:**
- ✅ Graceful degradation on camera failure
- ✅ Automatic reconnection
- ✅ Recording integrity guaranteed
- ✅ 99.9% uptime

---

## 🚀 Deployment Checklist

**Pre-Deployment:**
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Code review completed
- [ ] Security audit passed

**Deployment Steps:**
1. [ ] Deploy backend changes
2. [ ] Run database migrations
3. [ ] Deploy frontend changes
4. [ ] Configure Stream.io settings
5. [ ] Test with staging environment
6. [ ] Monitor logs for errors
7. [ ] Gradually roll out to users

**Post-Deployment:**
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Optimize based on real usage

---

## 📊 Monitoring & Maintenance

**Metrics to Monitor:**
- Active camera count
- Switching frequency
- Viewer latency
- Recording success rate
- Stream quality metrics
- Error rates
- Server resources

**Alerts:**
- Camera goes offline
- Recording fails
- High latency (> 5 seconds)
- Server resources > 80%
- WebSocket disconnections > 10%

**Maintenance Tasks:**
- Weekly recording cleanup
- Monthly performance review
- Quarterly security audit
- Continuous optimization

---

## 🔮 Future Enhancements (Post-MVP)

1. **Advanced Features:**
   - Picture-in-picture mode
   - Multi-angle viewer control (let viewers choose camera)
   - Automated camera switching based on AI scene detection
   - Slow-motion instant replay

2. **Production Features:**
   - Professional transitions (fade, wipe, dissolve)
   - Lower third graphics overlay
   - Multiple output destinations (YouTube, Facebook Live)
   - Virtual camera effects

3. **Analytics:**
   - Viewer engagement heatmaps
   - Popular camera tracking
   - Watch time analytics
   - Recording highlights generation

4. **Monetization:**
   - Pay-per-view recordings
   - Premium multi-angle access
   - Professional editing service
   - Live streaming packages

---

## 📞 Support & Resources

**Documentation:**
- User Guide: `/docs/USER_GUIDE.md`
- API Docs: `/docs/API_DOCUMENTATION.md`
- Developer Guide: `/docs/DEVELOPER_GUIDE.md`

**External Resources:**
- Stream.io Documentation: https://getstream.io/video/docs/
- HLS.js GitHub: https://github.com/video-dev/hls.js
- OBS Studio: https://obsproject.com/
- FFmpeg Documentation: https://ffmpeg.org/documentation.html

**Contact:**
- Technical Support: support@wedlive.com
- GitHub Issues: https://github.com/wedlive/issues
- Community Forum: https://community.wedlive.com

---

## ✅ Implementation Timeline

| Phase | Duration | Description | Status |
|-------|----------|-------------|---------|
| Phase 1 | Days 1-3 | Backend Infrastructure | 🔲 Not Started |
| Phase 2 | Days 4-6 | Frontend UI | 🔲 Not Started |
| Phase 3 | Days 7-8 | Viewer Sync | 🔲 Not Started |
| Phase 4 | Days 9-11 | Recording System | 🔲 Not Started |
| Phase 5 | Days 12-13 | Optimization | 🔲 Not Started |
| Phase 6 | Days 14-15 | Testing & Deploy | 🔲 Not Started |

**Total Estimated Time:** 15 days (3 weeks)

---

**Document Version:** 1.0  
**Last Updated:** January 10, 2025  
**Status:** Ready for Implementation  
**Next Action:** Begin Phase 1 - Backend Infrastructure

---

*This implementation plan provides a complete roadmap for building a professional multi-camera live streaming system. Each phase is designed to be independently testable and incrementally deployable. Follow the phases sequentially for best results.*
