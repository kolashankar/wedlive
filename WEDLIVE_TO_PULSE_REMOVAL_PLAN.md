# WedLive to Pulse Migration & Removal Plan

## 📊 Migration Progress

**Overall Completion: 60%**

### Phase 1: Backend Files to REMOVE (Complete Removal)
**Status: ✅ COMPLETE (100% - 7 of 7 tasks complete)**

| Task | Status | Completion Date |
|------|--------|----------------|
| 1.1 RTMP Server Configuration | ✅ COMPLETE | Feb 7, 2025 |
| 1.2 FFmpeg Composition Service | ✅ COMPLETE | Feb 7, 2025 |
| 1.3 Recording Service Replacement | ✅ COMPLETE | Feb 7, 2025 |
| 1.4 YouTube Service Replacement | ✅ COMPLETE | Feb 7, 2025 |
| 1.5 Stream Service Replacement | ✅ COMPLETE | Feb 7, 2025 |
| 1.6 RTMP Webhook Replacement | ✅ COMPLETE | Feb 7, 2025 |
| 1.7 Stream Routes Replacement | ✅ COMPLETE | Feb 7, 2025 |

**Phase 1 Details:**
- ✅ Removed: `/nginx-rtmp-config-template.conf`
- ✅ Removed: `/NGINX_RTMP_SETUP_GUIDE.md`
- ✅ Removed: `/RTMP_STREAMING_GUIDE.md`
- ✅ Removed: `/app/backend/app/services/ffmpeg_composition.py` (390 lines)
- ✅ Replaced: `/app/backend/app/services/recording_service.py` (460 lines → 410 lines)
  - Now uses Pulse Egress API for all recording operations
  - Removed custom FFmpeg recording logic
  - Removed NGINX-RTMP DVR integration
  - Kept metadata management and auto-recording
- ✅ Replaced: `/app/backend/app/services/youtube_service.py` (445 lines → 359 lines)
  - Removed custom YouTube broadcast creation
  - Removed RTMP stream binding logic
  - Now uses Pulse Egress for YouTube streaming
  - Kept OAuth authentication flow
- ✅ Replaced: `/app/backend/app/services/stream_service.py` (122 lines → 305 lines)
  - Removed custom stream key generation
  - Removed NGINX-RTMP URL construction
  - Now uses Pulse LiveKit token generation
  - Added RTMP ingress support for OBS
- ✅ Updated: `/app/backend/app/routes/rtmp_webhooks.py` (359 lines → 1091 lines)
  - Added 6 new LiveKit webhook handlers:
    * POST `/webhooks/livekit/room-started` - Room lifecycle management
    * POST `/webhooks/livekit/room-finished` - Room cleanup
    * POST `/webhooks/livekit/participant-joined` - Track cameras/viewers
    * POST `/webhooks/livekit/participant-left` - Handle disconnections
    * POST `/webhooks/livekit/egress-started` - Recording start tracking
    * POST `/webhooks/livekit/egress-ended` - Recording completion & upload
  - Kept existing NGINX-RTMP webhooks for backward compatibility
- ✅ Updated: `/app/backend/app/routes/streams.py` (828 lines → 1461 lines)
  - Marked 3 endpoints as DEPRECATED:
    * GET `/credentials` - Use `/token/{wedding_id}` instead
    * GET `/quality/{wedding_id}` - Pulse handles quality
    * POST `/quality/{wedding_id}` - Pulse handles quality
  - Added 5 new Pulse-integrated endpoints:
    * POST `/token/{wedding_id}` - Generate LiveKit access tokens
    * POST `/recordings/{wedding_id}/start` - Start Pulse Egress recording
    * POST `/recordings/{wedding_id}/stop` - Stop Pulse Egress recording
    * POST `/rtmp-ingress/{wedding_id}` - Create RTMP ingress for OBS
    * POST `/youtube-stream/{wedding_id}` - Stream to YouTube via Pulse

**Next Phase:** Phase 3 - Backend Dependencies (Update requirements.txt)

---

### Phase 2: Frontend Files to REMOVE/REPLACE
**Status: ✅ COMPLETE (100% - 4 of 4 tasks complete)**

| Task | Status | Completion Date |
|------|--------|----------------|
| 2.1 Stream Video Player | ✅ COMPLETE | Feb 7, 2025 |
| 2.2 Stream Library | ✅ COMPLETE | Feb 7, 2025 |
| 2.3 Camera Management Components | ✅ COMPLETE | Feb 7, 2025 |
| 2.4 Package Dependencies | ✅ COMPLETE | Feb 7, 2025 |

**Phase 2 Details:**
- ✅ Deleted: `/app/frontend/components/StreamVideoPlayer.js` (HLS-based player)
- ✅ Deleted: `/app/frontend/lib/stream.js` (RTMP/HLS utilities)
- ✅ Deleted: `/app/frontend/components/camera/` directory:
  - CameraManagementPanel.js
  - CameraCard.js  
  - ActiveCameraPlayer.js
- ✅ Created: `/app/frontend/components/stream/WeddingLiveStream.tsx`
  - LiveKit-based streaming component
  - WebRTC low-latency playback (<500ms)
  - Automatic quality adaptation
  - Built-in participant management
- ✅ Created: `/app/frontend/components/stream/HostControls.tsx`
  - Camera/mic toggle controls
  - Participant count display
  - End stream functionality
- ✅ Created: `/app/frontend/components/stream/GuestView.tsx`
  - Multi-camera grid layout
  - Live status badges
  - Waiting state UI
- ✅ Created: `/app/frontend/hooks/useWeddingStream.ts`
  - Token management hook
  - Credentials fetching from Pulse API
  - Error handling and retries
- ✅ Updated: `/app/frontend/package.json`
  - Removed: react-player (^2.16.0)
  - Added: @livekit/components-react (^3.0.0)
  - Added: livekit-client (^2.0.0)
  - Added: @livekit/components-styles (^1.1.4)
  - Note: Kept socket.io-client (may be used elsewhere)

**Next Phase:** Phase 3 - Backend Dependencies

---

## Executive Summary

This document outlines the complete removal of custom streaming infrastructure from WedLive and migration to Pulse platform APIs. All live streaming, recording, RTMP, YouTube, multi-camera, and storage features will be handled by Pulse.

**Migration Strategy:** Phased replacement to minimize downtime and risk.

**Timeline:** 8-10 weeks

**Result:** WedLive becomes a pure wedding management application using Pulse for all streaming needs.

---

## Architecture Transformation

### Current Architecture (REMOVE)
```
┌─────────────────────────────────────────────────────┐
│  WEDLIVE - CUSTOM STREAMING INFRASTRUCTURE          │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ NGINX RTMP   │  │   FFmpeg     │                │
│  │   Server     │  │ Composition  │                │
│  │ (Port 1935)  │  │   Service    │                │
│  └──────┬───────┘  └──────┬───────┘                │
│         │                  │                         │
│         │                  │                         │
│  ┌──────┴──────────────────┴───────┐                │
│  │  Custom Recording Service       │                │
│  │  Custom YouTube Integration     │                │
│  │  Custom Stream Management       │                │
│  └─────────────────────────────────┘                │
└─────────────────────────────────────────────────────┘
```

### Target Architecture (USE PULSE)
```
┌─────────────────────────────────────────────────────┐
│  PULSE PLATFORM (External Infrastructure)            │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  LiveKit     │  │  LiveKit     │                │
│  │   Server     │  │   Egress     │                │
│  │  (WebRTC)    │  │ (Recording)  │                │
│  └──────┬───────┘  └──────┬───────┘                │
│         │                  │                         │
│  ┌──────┴──────┐  ┌───────┴───────┐                │
│  │  LiveKit    │  │ Pulse Control │                │
│  │  Ingress    │  │  Plane API    │                │
│  │  (RTMP)     │  │  (Management) │                │
│  └─────────────┘  └───────┬───────┘                │
└────────────────────────────┼────────────────────────┘
                             │
                             │ Pulse APIs
                             ▼
                ┌────────────────────────┐
                │   WEDLIVE (Simplified) │
                │  - Wedding Management  │
                │  - User Auth           │
                │  - Galleries           │
                │  - Business Logic      │
                │  - Pulse API Calls     │
                └────────────────────────┘
```

---

## Phase 1: Backend Files to REMOVE (Complete Removal)

### 1.1 RTMP Server Configuration ❌ REMOVE
```
Files to DELETE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /nginx-rtmp-config-template.conf
📄 /NGINX_RTMP_SETUP_GUIDE.md  
📄 /RTMP_STREAMING_GUIDE.md

Reason: Pulse provides RTMP via LiveKit Ingress
Replacement: Pulse Ingress API
```

### 1.2 FFmpeg Composition Service ❌ REMOVE
```
Files to DELETE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/backend/app/services/ffmpeg_composition.py

Current Code: 200 lines
- Manages FFmpeg processes for multi-camera
- Switches camera streams
- Composes HLS output
- Process health monitoring

Reason: Pulse LiveKit handles composition natively
Replacement: LiveKit track subscription + Egress composition
```

**Code to Remove:**
```python
# DELETE ENTIRE FILE: ffmpeg_composition.py
class FFmpegCompositionService:
    def __init__(self): ...
    async def start_composition(self, wedding_id, camera): ...
    async def switch_camera(self, wedding_id, new_camera): ...
    async def stop_composition(self, wedding_id): ...
    async def check_health(self, wedding_id): ...
    async def recover_composition(self, wedding_id, camera): ...
```

### 1.3 Recording Service ⚠️ REPLACE
```
Files to REPLACE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/backend/app/services/recording_service.py

Current Code: ~300 lines
- DVR recording via NGINX-RTMP
- FFmpeg recording for composed streams
- File management
- Recording metadata

Reason: Pulse Egress handles all recording
Replacement: Pulse Egress API calls
```

**DELETE Methods:**
```python
# REMOVE from recording_service.py:
- start_recording()        # Use Pulse Egress API
- stop_recording()         # Use Pulse Egress API
- _start_composed_recording()  # Pulse handles
- _stop_composed_recording()   # Pulse handles
- All FFmpeg process management
- All NGINX-RTMP file handling
```

**KEEP (simplified):**
```python
# KEEP these (update to call Pulse):
- get_recording_status()   # Query Pulse API
- get_recording_url()      # Get from Pulse
- list_recordings()        # Query Pulse API
```

### 1.4 YouTube Service ⚠️ REPLACE
```
Files to REPLACE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/backend/app/services/youtube_service.py

Current Code: ~400 lines
- YouTube OAuth flow
- Broadcast creation
- Stream binding
- Custom RTMP setup

Reason: Pulse handles RTMP output to YouTube
Replacement: Pulse Egress RTMP stream
```

**DELETE Methods:**
```python
# REMOVE from youtube_service.py:
- create_live_broadcast()    # No longer needed
- bind_stream()              # Pulse handles RTMP
- start_stream()             # Pulse Egress manages
- transition_broadcast()     # Simplified with Pulse
- delete_broadcast()         # Not needed
```

**KEEP (simplified):**
```python
# KEEP these (for YouTube OAuth only):
- get_oauth_url()            # Still need YouTube auth
- exchange_code_for_tokens() # Still need tokens
- refresh_access_token()     # Token management
```

**NEW Method (replace broadcast logic):**
```python
# ADD this method:
async def start_youtube_stream_via_pulse(
    self, 
    room_name: str, 
    youtube_stream_key: str
) -> Dict:
    """Use Pulse Egress to stream to YouTube"""
    pulse_service = PulseService()
    
    return await pulse_service.create_youtube_stream(
        room_name=room_name,
        youtube_rtmp_url="rtmp://a.rtmp.youtube.com/live2",
        youtube_stream_key=youtube_stream_key
    )
```

### 1.5 Stream Service ⚠️ REPLACE
```
Files to REPLACE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/backend/app/services/stream_service.py

Reason: Custom streaming logic replaced by Pulse
Replacement: Pulse token generation + room management
```

**DELETE Methods:**
```python
# REMOVE entire custom streaming logic:
- generate_stream_key()      # Pulse generates tokens
- validate_stream_key()      # Pulse validates
- get_rtmp_url()             # Pulse provides
- get_playback_url()         # Use LiveKit URLs
```

### 1.6 RTMP Webhook Handlers ⚠️ REPLACE
```
Files to REPLACE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/backend/app/routes/rtmp_webhooks.py

Current Code: ~200 lines
- NGINX RTMP on-publish webhook
- NGINX RTMP on-publish-done webhook
- Camera status updates
- Composition triggering

Reason: Pulse sends webhooks from LiveKit
Replacement: LiveKit webhook handlers
```

**DELETE Endpoints:**
```python
# REMOVE these NGINX-RTMP webhooks:
@router.post("/rtmp/on-publish")         # Use LiveKit webhooks
@router.post("/rtmp/on-publish-done")    # Use LiveKit webhooks
```

**ADD New Endpoints:**
```python
# ADD these LiveKit webhook handlers:
@router.post("/webhooks/livekit/room-started")
@router.post("/webhooks/livekit/room-finished")
@router.post("/webhooks/livekit/participant-joined")
@router.post("/webhooks/livekit/participant-left")
@router.post("/webhooks/livekit/egress-started")
@router.post("/webhooks/livekit/egress-ended")
```

### 1.7 Stream Routes ⚠️ HEAVY REPLACEMENT
```
Files to REPLACE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/backend/app/routes/streams.py

Current Code: ~600 lines
- Stream start/stop logic
- RTMP credentials generation
- Quality control
- Multi-camera management
- WebSocket camera control
```

**DELETE Methods:**
```python
# REMOVE these endpoints:
@router.get("/credentials")              # Use Pulse tokens
@router.get("/quality/{wedding_id}")     # Pulse handles quality
@router.post("/quality/{wedding_id}")    # Pulse handles quality
```

**REPLACE Methods:**
```python
# REPLACE these (keep endpoint, change implementation):
@router.post("/start")                   # Call Pulse to create room
@router.post("/stop")                    # Call Pulse to end room
@router.get("/live")                     # Query Pulse for active rooms
@router.websocket("/ws/camera-control")  # Use LiveKit participant events
```

**NEW Methods to ADD:**
```python
# ADD these new Pulse-integrated endpoints:
@router.post("/token/{wedding_id}")      # Generate LiveKit token
@router.post("/recordings/{wedding_id}/start")   # Start Pulse Egress
@router.post("/recordings/{wedding_id}/stop")    # Stop Pulse Egress
@router.post("/rtmp-ingress/{wedding_id}")       # Create Pulse Ingress
@router.post("/youtube-stream/{wedding_id}")     # Pulse RTMP to YouTube
```

---

## Phase 2: Frontend Files to REMOVE/REPLACE

### 2.1 Stream Video Player ⚠️ REPLACE
```
Files to REPLACE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/frontend/components/StreamVideoPlayer.js

Current: HLS player for NGINX-RTMP streams
Replace with: LiveKit Components
```

**DELETE Component:**
```javascript
// REMOVE: StreamVideoPlayer.js (HLS-based)
export default function StreamVideoPlayer({ 
  playbackUrl,  // ❌ No more HLS URLs
  autoPlay,
  controls
})
```

**ADD New Component:**
```javascript
// ADD: WeddingLiveStream.tsx (LiveKit-based)
import { LiveKitRoom, VideoConference } from '@livekit/components-react';

export function WeddingLiveStream({
  weddingId,
  token,          // ✅ From Pulse API
  serverUrl       // ✅ From Pulse API
}) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
```

### 2.2 Stream Library ❌ REMOVE
```
Files to DELETE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/frontend/lib/stream.js

Reason: All stream utilities replaced by LiveKit SDK
Replacement: @livekit/components-react
```

### 2.3 Camera Management Components ⚠️ REPLACE
```
Files to REPLACE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/frontend/components/camera/CameraManagementPanel.js
📄 /app/frontend/components/camera/CameraCard.js
📄 /app/frontend/components/camera/ActiveCameraPlayer.js

Current: Custom RTMP camera management
Replace with: LiveKit participant management
```

**Key Changes:**
```javascript
// BEFORE (NGINX-RTMP):
- Display RTMP stream keys
- Show RTMP URLs
- Manual camera switching via WebSocket
- HLS playback

// AFTER (Pulse/LiveKit):
- Display LiveKit room tokens
- Participant-based cameras
- LiveKit track subscription
- WebRTC playback
```

### 2.4 Package Dependencies to CHANGE
```
Files to UPDATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/frontend/package.json

REMOVE Dependencies:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- react-player         # HLS player
- hls.js              # HLS support
- socket.io-client    # WebSocket (if only used for streaming)

ADD Dependencies:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+ @livekit/components-react    ^2.0.0
+ livekit-client               ^2.0.0
+ @livekit/react-core          ^2.0.0
```

---

## Phase 3: Backend Dependencies to CHANGE

### 3.1 Requirements.txt Changes
```
File to UPDATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/backend/requirements.txt

REMOVE Dependencies:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# No WebRTC libraries needed
# No FFmpeg Python bindings needed
# No RTMP libraries needed

KEEP Dependencies:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ fastapi
✅ uvicorn
✅ motor (MongoDB)
✅ pymongo
✅ requests (for Pulse API calls)
✅ boto3 (for WedLive galleries - separate R2)
✅ aiohttp (for async HTTP)
✅ python-jose (JWT)
✅ google-api-python-client (YouTube OAuth)
✅ google-auth-oauthlib (YouTube OAuth)

ADD Dependencies:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+ livekit-server-sdk-python    # For LiveKit token generation (optional)
+ livekit                       # LiveKit Python SDK
```

---

## Phase 4: Database Schema Changes

### 4.1 Wedding Model Updates
```
Collection: weddings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REMOVE Fields:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ rtmp_url              # No longer needed
❌ stream_key            # Replaced by Pulse tokens
❌ playback_url          # Use LiveKit URLs
❌ hls_url               # Use LiveKit URLs
❌ live_session          # Replaced by pulse_session

ADD Fields:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ pulse_session: {
    room_name: string           # LiveKit room name
    room_id: string             # Pulse room ID
    server_url: string          # LiveKit WebSocket URL
    created_at: datetime
    status: string              # active, ended
  }

UPDATE Fields:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ multi_cameras: [
    {
      camera_id: string
      name: string
      # REMOVE: stream_key, hls_url, rtmp_url
      # ADD: participant_id (LiveKit participant)
      participant_id: string    # LiveKit participant ID
      track_sid: string         # LiveKit track SID
      status: string            # live, offline
    }
  ]
```

### 4.2 Recording Model Updates
```
Collection: recordings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REMOVE Fields:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ output_file           # NGINX-RTMP local file
❌ ffmpeg_pid            # FFmpeg process ID
❌ recording_path        # Local path

ADD Fields:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ pulse_egress_id       # Pulse Egress ID
✅ pulse_recording_id    # Pulse Recording ID
✅ recording_urls: {
    r2: string                  # Cloudflare R2 URL
    telegram_cdn: string        # Telegram CDN URL
    streaming: string           # HLS streaming URL
  }
✅ metadata: {
    duration_seconds: int
    file_size_bytes: int
    resolution: string
    codec: string
  }
```

---

## Phase 5: NEW Files to CREATE

### 5.1 Pulse Service Layer
```
File to CREATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/backend/app/services/pulse_service.py

Purpose: Single interface to all Pulse APIs
Size: ~400 lines

Methods:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ generate_stream_token()      # Token for room access
✅ create_room()                 # Create LiveKit room
✅ end_room()                    # End LiveKit room
✅ start_recording()             # Start Egress recording
✅ stop_recording()              # Stop Egress recording
✅ get_recording()               # Get recording URLs
✅ create_rtmp_ingress()         # RTMP input (OBS)
✅ create_youtube_stream()       # RTMP to YouTube
✅ list_participants()           # Room participants
✅ get_room_info()               # Room status
```

**Implementation:**
```python
import os
import requests
from typing import Dict, Optional
from datetime import datetime

class PulseService:
    """
    Unified service for Pulse Platform API calls
    Replaces all custom streaming infrastructure
    """
    
    def __init__(self):
        self.pulse_api_url = os.getenv("PULSE_API_URL", "https://api.pulse.example.com")
        self.pulse_api_key = os.getenv("PULSE_API_KEY", "pulse_mock_key_xxx")
        self.pulse_api_secret = os.getenv("PULSE_API_SECRET", "pulse_mock_secret_xxx")
    
    async def generate_stream_token(
        self,
        room_name: str,
        participant_name: str,
        participant_id: str,
        can_publish: bool = False,
        can_subscribe: bool = True,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Generate LiveKit access token via Pulse"""
        url = f"{self.pulse_api_url}/v1/tokens/create"
        
        payload = {
            "room_name": room_name,
            "participant_name": participant_name,
            "participant_identity": participant_id,
            "can_publish": can_publish,
            "can_subscribe": can_subscribe,
            "can_publish_data": True,
            "metadata": metadata or {}
        }
        
        headers = {
            "X-Pulse-Key": self.pulse_api_key,
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        return response.json()
    
    async def start_recording(
        self,
        room_name: str,
        wedding_id: str,
        quality: str = "1080p"
    ) -> Dict:
        """Start recording via Pulse Egress"""
        url = f"{self.pulse_api_url}/v1/egress/room"
        
        payload = {
            "room_name": room_name,
            "file": {
                "filename": f"wedding_{wedding_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.mp4"
            },
            "options": {
                "preset": f"H264_{quality.upper()}_30",
                "upload_to_telegram": True
            },
            "metadata": {
                "wedding_id": wedding_id,
                "platform": "wedlive"
            }
        }
        
        headers = {
            "X-Pulse-Key": self.pulse_api_key,
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        return response.json()
    
    async def create_youtube_stream(
        self,
        room_name: str,
        youtube_rtmp_url: str,
        youtube_stream_key: str
    ) -> Dict:
        """Stream to YouTube via Pulse Egress"""
        url = f"{self.pulse_api_url}/v1/egress/stream"
        
        payload = {
            "room_name": room_name,
            "stream": {
                "protocol": "rtmp",
                "urls": [f"{youtube_rtmp_url}/{youtube_stream_key}"]
            },
            "video": {
                "codec": "H264_MAIN",
                "width": 1920,
                "height": 1080,
                "framerate": 30,
                "bitrate": 5000
            },
            "audio": {
                "codec": "AAC",
                "bitrate": 128,
                "channels": 2
            }
        }
        
        headers = {
            "X-Pulse-Key": self.pulse_api_key,
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        return response.json()
    
    # ... more methods ...
```

### 5.2 Frontend LiveKit Components
```
Files to CREATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/frontend/components/stream/WeddingLiveStream.tsx
📄 /app/frontend/components/stream/HostControls.tsx
📄 /app/frontend/components/stream/GuestView.tsx
📄 /app/frontend/hooks/useWeddingStream.ts

Purpose: LiveKit-based streaming UI
```

### 5.3 Environment Configuration
```
Files to UPDATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 /app/backend/.env

REMOVE Variables:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ RTMP_SERVER_URL
❌ RTMP_SERVER_PORT
❌ HLS_SERVER_URL
❌ RECORDING_PATH
❌ NGINX_RTMP_*

ADD Variables:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Pulse Platform Integration
PULSE_API_URL=https://api.pulse.example.com
PULSE_API_KEY=pulse_mock_key_wedlive_xxx
PULSE_API_SECRET=pulse_mock_secret_wedlive_xxx
PULSE_LIVEKIT_URL=wss://livekit.pulse.example.com

# WedLive Storage (Separate from Pulse)
WEDLIVE_R2_ACCOUNT_ID=your_account_id
WEDLIVE_R2_ACCESS_KEY=your_key
WEDLIVE_R2_SECRET_KEY=your_secret
WEDLIVE_R2_BUCKET=wedlive-galleries
WEDLIVE_R2_PUBLIC_URL=https://pub-xyz.r2.dev

# WedLive Telegram CDN (Separate from Pulse)
WEDLIVE_TELEGRAM_BOT_TOKEN=5678901234:XYZ
WEDLIVE_TELEGRAM_CHANNEL_ID=-1009876543210
```

---

## Phase 6: Infrastructure to REMOVE

### 6.1 NGINX-RTMP Server ❌ REMOVE COMPLETELY
```
Infrastructure to DECOMMISSION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ NGINX with RTMP module
❌ RTMP port (1935)
❌ HLS output directory
❌ Recording storage directory
❌ FFmpeg installed on server (unless used elsewhere)

Reason: Pulse handles all streaming infrastructure
Cost Savings: No need for dedicated streaming server
```

### 6.2 Server Requirements Change
```
BEFORE (Custom Infrastructure):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- VPS with 4 vCPU, 8GB RAM      # For FFmpeg encoding
- NGINX compiled with RTMP module
- Large disk for recordings
- High CPU for encoding
- RTMP firewall rules (port 1935)

AFTER (Pulse Integration):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- VPS with 2 vCPU, 4GB RAM      # Just API server
- Standard NGINX (no RTMP module)
- Minimal disk (no recordings)
- Low CPU (no encoding)
- No special firewall rules
```

**Cost Impact:**
- Before: $40-80/month (streaming server)
- After: $12-24/month (API server)
- Savings: $28-56/month on infrastructure
- Add: $50-100/month for Pulse API fees
- Net: Similar cost but zero maintenance

---

## Phase 7: Migration Phases (Detailed Timeline)

### Week 1-2: Foundation & Setup
```
Tasks:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Get Pulse API credentials
✅ Create pulse_service.py
✅ Add Pulse environment variables
✅ Test basic token generation
✅ Test room creation/deletion
✅ Update database schema (add pulse_session)

Deliverable: Pulse API connectivity working
Risk: Low - No production changes yet
```

### Week 3-4: Backend Core Migration
```
Tasks:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Replace /api/streams/start endpoint
⚠️ Replace /api/streams/stop endpoint
⚠️ Add /api/streams/token endpoint
⚠️ Update recording service to use Pulse
⚠️ Test recording start/stop
⚠️ Migrate database models

Deliverable: Backend using Pulse APIs
Risk: Medium - Core functionality changes
Rollback: Keep old code as fallback
```

### Week 5-6: Frontend Migration
```
Tasks:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 Install LiveKit SDK
🎨 Create WeddingLiveStream component
🎨 Replace StreamVideoPlayer
🎨 Update camera management UI
🎨 Test guest joining flow
🎨 Test host streaming

Deliverable: Frontend using LiveKit
Risk: High - User-facing changes
Testing: Extensive UAT required
```

### Week 7: YouTube & RTMP Features
```
Tasks:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📺 Update YouTube integration to use Pulse
📺 Test YouTube Live streaming
📹 Add RTMP ingress (OBS support)
📹 Test OBS → Pulse → Wedding flow
📹 Verify recording quality

Deliverable: All streaming features via Pulse
Risk: Medium - New features
```

### Week 8: Multi-Camera Migration
```
Tasks:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎥 Migrate camera management to LiveKit
🎥 Replace FFmpeg composition with LiveKit
🎥 Update camera switching logic
🎥 Test multi-camera switching
🎥 Verify composed recording

Deliverable: Multi-camera via LiveKit
Risk: High - Complex feature
Decision: Consider hybrid approach initially
```

### Week 9-10: Cleanup & Decommission
```
Tasks:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧹 Delete old streaming code
🧹 Remove NGINX-RTMP configuration
🧹 Decommission streaming server
🧹 Update documentation
🧹 Remove unused dependencies
🧹 Final testing
🧹 Monitor production for 1 week

Deliverable: Clean Pulse-only codebase
Risk: Low - Just cleanup
```

---

## Phase 8: Testing Checklist

### 8.1 Backend API Testing
```
Tests to Run:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Generate token for wedding
✅ Token works with LiveKit
✅ Start recording via Pulse
✅ Stop recording via Pulse
✅ Recording uploaded to R2
✅ Recording mirrored to Telegram CDN
✅ YouTube streaming works
✅ RTMP ingress accepts OBS
✅ Multi-camera switching works
✅ Webhooks received from Pulse
```

### 8.2 Frontend UI Testing
```
Tests to Run:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Guest can join wedding stream
✅ Host can start/stop stream
✅ Video quality is good
✅ Audio is synchronized
✅ Chat/data channels work
✅ Mobile responsiveness
✅ Camera switching smooth
✅ Recording controls work
✅ YouTube Live button works
```

### 8.3 Integration Testing
```
Tests to Run:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ End-to-end wedding stream
✅ Recording playback after stream
✅ Multi-platform streaming (YouTube + WedLive)
✅ Professional videographer via OBS
✅ Multi-camera wedding
✅ Gallery uploads (separate storage)
✅ Access control (authorized guests only)
✅ Payment integration still works
```

---

## Phase 9: Rollback Plan

### 9.1 If Migration Fails
```
Rollback Strategy:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Keep old code in separate branch
2. Use feature flags to toggle Pulse
3. Database schema supports both systems
4. NGINX-RTMP server kept for 1 month
5. Gradual migration (new weddings use Pulse)
6. Old weddings can still use RTMP
7. Full rollback possible within 24 hours
```

### 9.2 Feature Flags
```python
# Add to .env:
USE_PULSE_STREAMING=true      # Toggle Pulse vs RTMP
PULSE_MIGRATION_ENABLED=true  # Enable/disable migration

# In code:
if os.getenv("USE_PULSE_STREAMING") == "true":
    # Use Pulse APIs
    return pulse_service.start_stream(wedding_id)
else:
    # Use old RTMP system
    return legacy_stream_service.start_rtmp(wedding_id)
```

---

## Phase 10: Post-Migration Monitoring

### 10.1 Metrics to Track
```
Monitor These:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Stream success rate
📊 Recording success rate
📊 Average stream quality
📊 Latency (should be <500ms)
📊 Concurrent viewers per wedding
📊 YouTube streaming success rate
📊 RTMP ingress connection success
📊 Error rates from Pulse API
📊 Cost per wedding (Pulse fees)
📊 User satisfaction (NPS surveys)
```

### 10.2 Alerts to Setup
```
Critical Alerts:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 Pulse API unavailable
🚨 Recording failed
🚨 Stream quality degraded
🚨 High error rate (>5%)
🚨 Latency spike (>2 seconds)
🚨 YouTube stream dropped
🚨 Cost spike (unexpected Pulse charges)
```

---

## Summary

### Files to DELETE (Complete Removal)
```
Backend:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ /app/backend/app/services/ffmpeg_composition.py
❌ /nginx-rtmp-config-template.conf
❌ /NGINX_RTMP_SETUP_GUIDE.md
❌ /RTMP_STREAMING_GUIDE.md

Frontend:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ /app/frontend/lib/stream.js
❌ /app/frontend/components/StreamVideoPlayer.js (replace with LiveKit)
```

### Files to REPLACE (Heavy Changes)
```
Backend:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ /app/backend/app/services/recording_service.py
⚠️ /app/backend/app/services/youtube_service.py
⚠️ /app/backend/app/services/stream_service.py
⚠️ /app/backend/app/routes/streams.py
⚠️ /app/backend/app/routes/rtmp_webhooks.py
⚠️ /app/backend/requirements.txt

Frontend:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ /app/frontend/components/camera/CameraManagementPanel.js
⚠️ /app/frontend/components/camera/CameraCard.js
⚠️ /app/frontend/components/camera/ActiveCameraPlayer.js
⚠️ /app/frontend/package.json

Database:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ weddings collection (add pulse_session, remove rtmp fields)
⚠️ recordings collection (add pulse_egress_id, remove ffmpeg fields)
```

### Files to CREATE (New Pulse Integration)
```
Backend:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ /app/backend/app/services/pulse_service.py
✅ /app/backend/app/routes/livekit_webhooks.py

Frontend:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ /app/frontend/components/stream/WeddingLiveStream.tsx
✅ /app/frontend/components/stream/HostControls.tsx
✅ /app/frontend/components/stream/GuestView.tsx
✅ /app/frontend/hooks/useWeddingStream.ts
```

### Infrastructure to REMOVE
```
Decommission:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ NGINX with RTMP module
❌ RTMP server (Port 1935)
❌ FFmpeg encoding server
❌ HLS output directory
❌ Recording storage directory
❌ High-CPU streaming VPS

Replace with:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Standard API server (2 vCPU, 4GB RAM)
✅ Pulse Platform subscription
✅ Minimal infrastructure
```

---

## Conclusion

**Result:** WedLive becomes a **lightweight wedding management platform** that uses **Pulse for all streaming needs**.

**Code Reduction:**
- Remove ~1,500 lines of streaming code
- Remove ~500 lines of FFmpeg logic
- Remove ~300 lines of RTMP handling
- Add ~600 lines of Pulse integration
- **Net: -1,700 lines of complex code**

**Infrastructure Simplification:**
- No NGINX-RTMP server
- No FFmpeg processes
- No recording file management
- No RTMP port management
- **Zero streaming infrastructure to maintain**

**Feature Gains:**
- ✅ Professional RTMP ingress (OBS support)
- ✅ YouTube Live streaming (built-in)
- ✅ Better video quality (WebRTC)
- ✅ Lower latency (<500ms vs 3-5s)
- ✅ Automatic recording to cloud
- ✅ Free CDN via Telegram
- ✅ Built-in scalability

**Timeline:** 8-10 weeks for complete migration

**Recommendation:** Start with Phase 1 (Foundation) and proceed incrementally with thorough testing at each stage.

---

**Last Updated:** February 2025
**Version:** 1.0
**Status:** Ready for Implementation
