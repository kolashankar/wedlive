# WedLive - Advanced Live Stream Control System
## Implementation Phases

## ✅ COMPLETION STATUS - December 2024

**Phase 1: Backend - Live Status State Machine (CORE)** ✅ COMPLETED
- Added LiveStatus enum (IDLE, WAITING, LIVE, PAUSED, ENDED)
- Added WeddingLiveSession model with full state tracking
- Updated WeddingResponse with live_session and can_go_live fields
- Created LiveStatusService with complete state machine logic
- All transitions validated and tested

**Phase 2: Backend - RTMP Webhook Handler** ✅ COMPLETED  
- Refactored rtmp_webhooks.py to use LiveStatusService
- Added /rtmp/on-publish endpoint for stream start
- Added /rtmp/on-publish-done endpoint for stream stop (PAUSES, not ends)
- Added /rtmp/on-update endpoint for health checks
- Legacy endpoints maintained for backward compatibility

**Phase 3: Backend - Manual Control Endpoints** ✅ COMPLETED
- Created live_controls.py with all control endpoints:
  - POST /api/weddings/{id}/live/go-live (IDLE → WAITING)
  - POST /api/weddings/{id}/live/pause (LIVE → PAUSED)
  - POST /api/weddings/{id}/live/resume (PAUSED → LIVE)
  - POST /api/weddings/{id}/live/end (LIVE/PAUSED → ENDED)
  - GET /api/weddings/{id}/live/status (public)
- All endpoints registered in server.py
- Authorization checks implemented
- Background tasks for recording finalization

---

## Implementation Phases

**Feature**: Complete live stream control with pause/resume capability and manual end-only functionality

**Requirements**:
1. OBS streaming auto-starts LIVE, auto-pauses (never auto-ends)
2. Manual host controls: Go Live, Pause, Resume, End Live
3. Live ends ONLY when host clicks \"End Live\"
4. Recording continues during pause
5. Viewer experience adapts to live status

---

## Phase 1: Backend - Live Status State Machine (CORE)

**Priority**: CRITICAL  
**Estimated Time**: 2-3 hours  
**Dependencies**: None

### 1.1 Update Wedding Live Status Model

**File**: `/app/backend/app/models.py`

**Changes Needed**:
```python
class LiveStatus(str, Enum):
    IDLE = \"idle\"                    # Not started yet
    WAITING = \"waiting\"              # Go Live clicked, waiting for OBS
    LIVE = \"live\"                    # Currently streaming
    PAUSED = \"paused\"                # OBS stopped, but not ended
    ENDED = \"ended\"                  # Manually ended by host (final state)

class WeddingLiveSession(BaseModel):
    wedding_id: str
    status: LiveStatus = LiveStatus.IDLE
    stream_started_at: Optional[datetime] = None
    stream_paused_at: Optional[datetime] = None
    stream_resumed_at: Optional[datetime] = None
    stream_ended_at: Optional[datetime] = None
    pause_count: int = 0              # Track number of pauses
    total_pause_duration: int = 0     # Total seconds paused
    recording_session_id: Optional[str] = None  # Single recording across pauses
    rtmp_url: str
    stream_key: str
    hls_playback_url: str
    
    # Transition timestamps
    status_history: List[Dict[str, Any]] = []  # [{status, timestamp, reason}]
    
    # Recording info
    recording_started: bool = False
    recording_path: Optional[str] = None
    recording_segments: List[str] = []  # Multiple segments if paused/resumed
```

**Add to Wedding Model**:
```python
class Wedding(BaseModel):
    # ... existing fields ...
    live_session: Optional[WeddingLiveSession] = None
    can_go_live: bool = True  # False if ended
```

### 1.2 Create Live Status Service

**File**: `/app/backend/app/services/live_status_service.py` (NEW)

**Functions Needed**:
```python
class LiveStatusService:
    def __init__(self, db):
        self.db = db
    
    async def transition_status(
        self, 
        wedding_id: str, 
        new_status: LiveStatus, 
        reason: str = \"\",
        triggered_by: str = \"system\"  # system, host, rtmp
    ) -> bool:
        \"\"\"
        Safely transition live status with validation
        
        Valid transitions:
        - IDLE → WAITING (host clicks Go Live)
        - WAITING → LIVE (OBS stream detected)
        - LIVE → PAUSED (OBS stops)
        - PAUSED → LIVE (OBS resumes)
        - LIVE/PAUSED → ENDED (host clicks End Live)
        
        Invalid transitions return False
        \"\"\"
        pass
    
    async def handle_go_live(self, wedding_id: str, user_id: str) -> Dict:
        \"\"\"Host clicks Go Live - set WAITING status\"\"\"
        pass
    
    async def handle_stream_start(self, wedding_id: str, stream_key: str) -> Dict:
        \"\"\"OBS starts streaming - WAITING → LIVE or PAUSED → LIVE\"\"\"
        pass
    
    async def handle_stream_stop(self, wedding_id: str, stream_key: str) -> Dict:
        \"\"\"OBS stops streaming - LIVE → PAUSED (NEVER auto-end)\"\"\"
        pass
    
    async def handle_pause_live(self, wedding_id: str, user_id: str) -> Dict:
        \"\"\"Host manually pauses - LIVE → PAUSED\"\"\"
        pass
    
    async def handle_resume_live(self, wedding_id: str, user_id: str) -> Dict:
        \"\"\"Host manually resumes - PAUSED → LIVE (if OBS streaming)\"\"\"
        pass
    
    async def handle_end_live(self, wedding_id: str, user_id: str) -> Dict:
        \"\"\"
        Host clicks End Live - FINAL action
        - Stop recording
        - Finalize video
        - Set status → ENDED
        - Mark can_go_live = False
        \"\"\"
        pass
    
    async def get_live_status(self, wedding_id: str) -> Dict:
        \"\"\"Get current live status for wedding\"\"\"
        pass
    
    async def is_host_authorized(self, wedding_id: str, user_id: str) -> bool:
        \"\"\"Check if user is creator/admin\"\"\"
        pass
    
    async def add_status_history(
        self, 
        wedding_id: str, 
        status: LiveStatus, 
        reason: str,
        triggered_by: str
    ):
        \"\"\"Log status change to history\"\"\"
        pass
```

**Status Transition Matrix**:
```
Current State  | Action                | New State | Recording
---------------|----------------------|-----------|----------
IDLE           | Go Live (host)       | WAITING   | No
WAITING        | Stream Start (OBS)   | LIVE      | Start
LIVE           | Stream Stop (OBS)    | PAUSED    | Continue
LIVE           | Pause (host)         | PAUSED    | Continue
PAUSED         | Stream Start (OBS)   | LIVE      | Continue
PAUSED         | Resume (host)        | LIVE      | Continue
LIVE           | End Live (host)      | ENDED     | Stop & Finalize
PAUSED         | End Live (host)      | ENDED     | Stop & Finalize
ENDED          | Any action           | ENDED     | No action
```

---

## Phase 2: Backend - RTMP Webhook Handler

**Priority**: CRITICAL  
**Estimated Time**: 2-3 hours  
**Dependencies**: Phase 1

### 2.1 Create NGINX RTMP Webhook Receiver

**File**: `/app/backend/app/routes/rtmp_webhooks.py` (NEW)

**Endpoints Needed**:
```python
from fastapi import APIRouter, Request, BackgroundTasks
from app.services.live_status_service import LiveStatusService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post(\"/rtmp/on-publish\")
async def on_publish(
    request: Request,
    background_tasks: BackgroundTasks,
    db = Depends(get_db_dependency)
):
    \"\"\"
    Called by NGINX when OBS starts streaming
    
    NGINX sends: 
    - stream_key
    - client_ip
    - timestamp
    
    Action:
    1. Find wedding by stream_key
    2. Transition WAITING → LIVE or PAUSED → LIVE
    3. Start recording if not already started
    4. Notify viewers via WebSocket
    \"\"\"
    data = await request.form()
    stream_key = data.get(\"name\")  # NGINX sends as 'name'
    
    logger.info(f\"[RTMP_PUBLISH] Stream started: {stream_key}\")
    
    # Find wedding by stream_key
    wedding = await db.weddings.find_one({
        \"live_session.stream_key\": stream_key
    })
    
    if not wedding:
        logger.error(f\"[RTMP_PUBLISH] Wedding not found for key: {stream_key}\")
        return {\"status\": \"error\", \"message\": \"Invalid stream key\"}
    
    # Transition status
    live_service = LiveStatusService(db)
    result = await live_service.handle_stream_start(
        wedding_id=wedding[\"id\"],
        stream_key=stream_key
    )
    
    # Start recording in background
    if result.get(\"should_start_recording\"):
        background_tasks.add_task(start_recording, wedding[\"id\"], stream_key)
    
    # Notify viewers via WebSocket
    background_tasks.add_task(notify_viewers, wedding[\"id\"], \"stream_started\")
    
    return {\"status\": \"success\"}


@router.post(\"/rtmp/on-publish-done\")
async def on_publish_done(
    request: Request,
    background_tasks: BackgroundTasks,
    db = Depends(get_db_dependency)
):
    \"\"\"
    Called by NGINX when OBS stops streaming
    
    CRITICAL: This should PAUSE, not END
    
    Action:
    1. Find wedding by stream_key
    2. Transition LIVE → PAUSED (NEVER end)
    3. Keep recording session active
    4. Notify viewers \"Live will resume shortly\"
    \"\"\"
    data = await request.form()
    stream_key = data.get(\"name\")
    
    logger.info(f\"[RTMP_DONE] Stream stopped: {stream_key}\")
    
    wedding = await db.weddings.find_one({
        \"live_session.stream_key\": stream_key
    })
    
    if not wedding:
        logger.error(f\"[RTMP_DONE] Wedding not found for key: {stream_key}\")
        return {\"status\": \"error\"}
    
    # Check if already ENDED (host ended manually)
    if wedding.get(\"live_session\", {}).get(\"status\") == \"ended\":
        logger.info(f\"[RTMP_DONE] Wedding already ended, ignoring\")
        return {\"status\": \"already_ended\"}
    
    # Transition to PAUSED (not ended)
    live_service = LiveStatusService(db)
    result = await live_service.handle_stream_stop(
        wedding_id=wedding[\"id\"],
        stream_key=stream_key
    )
    
    # Notify viewers
    background_tasks.add_task(notify_viewers, wedding[\"id\"], \"stream_paused\")
    
    return {\"status\": \"success\"}


@router.post(\"/rtmp/on-update\")
async def on_update(request: Request):
    \"\"\"
    Called periodically by NGINX while streaming
    Can be used for health checks
    \"\"\"
    data = await request.form()
    stream_key = data.get(\"name\")
    
    # Update last_seen timestamp
    # Could be used for stale stream detection
    
    return {\"status\": \"success\"}
```

### 2.2 Update NGINX Configuration

**File**: `/etc/nginx/nginx.conf` (or wherever NGINX RTMP is configured)

**Add Webhook Calls**:
```nginx
rtmp {
    server {
        listen 1935;
        chunk_size 4096;

        application live {
            live on;
            record off;
            
            # Webhook on stream start
            on_publish http://localhost:8001/api/rtmp/on-publish;
            
            # Webhook on stream stop
            on_publish_done http://localhost:8001/api/rtmp/on-publish-done;
            
            # Periodic update (every 30 seconds)
            on_update http://localhost:8001/api/rtmp/on-update;
            
            # HLS configuration
            hls on;
            hls_path /tmp/hls;
            hls_fragment 3s;
            hls_playlist_length 60s;
        }
    }
}
```

---

## Phase 3: Backend - Manual Control Endpoints

**Priority**: HIGH  
**Estimated Time**: 2-3 hours  
**Dependencies**: Phase 1, Phase 2

### 3.1 Create Live Control Routes

**File**: `/app/backend/app/routes/live_controls.py` (NEW)

**Endpoints**:
```python
from fastapi import APIRouter, HTTPException, Depends
from app.services.live_status_service import LiveStatusService
from app.auth import get_current_user

router = APIRouter()

@router.post(\"/weddings/{wedding_id}/live/go-live\")
async def go_live(
    wedding_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    \"\"\"
    Host clicks \"Go Live\" button
    
    Actions:
    1. Verify user is creator/admin
    2. Check if wedding can go live (not already ended)
    3. Transition IDLE → WAITING
    4. Return RTMP credentials
    5. Show \"Waiting for OBS stream...\" message
    \"\"\"
    live_service = LiveStatusService(db)
    
    # Check authorization
    if not await live_service.is_host_authorized(wedding_id, current_user[\"id\"]):
        raise HTTPException(
            status_code=403,
            detail=\"Only wedding creator can control live stream\"
        )
    
    # Check if can go live
    wedding = await db.weddings.find_one({\"id\": wedding_id})
    if not wedding.get(\"can_go_live\"):
        raise HTTPException(
            status_code=400,
            detail=\"This wedding has already ended. Cannot go live again.\"
        )
    
    # Transition to WAITING
    result = await live_service.handle_go_live(wedding_id, current_user[\"id\"])
    
    return {
        \"status\": \"waiting\",
        \"message\": \"Waiting for OBS stream to start\",
        \"rtmp_url\": result[\"rtmp_url\"],
        \"stream_key\": result[\"stream_key\"],
        \"hls_playback_url\": result[\"hls_playback_url\"]
    }


@router.post(\"/weddings/{wedding_id}/live/pause\")
async def pause_live(
    wedding_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    \"\"\"
    Host manually pauses live stream
    
    Actions:
    1. Verify authorization
    2. Transition LIVE → PAUSED
    3. Keep recording active
    4. Notify viewers
    \"\"\"
    live_service = LiveStatusService(db)
    
    if not await live_service.is_host_authorized(wedding_id, current_user[\"id\"]):
        raise HTTPException(status_code=403, detail=\"Unauthorized\")
    
    result = await live_service.handle_pause_live(wedding_id, current_user[\"id\"])
    
    return {
        \"status\": \"paused\",
        \"message\": \"Live stream paused. Recording continues.\",
        \"pause_count\": result.get(\"pause_count\", 0)
    }


@router.post(\"/weddings/{wedding_id}/live/resume\")
async def resume_live(
    wedding_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    \"\"\"
    Host manually resumes live stream
    
    Actions:
    1. Verify authorization
    2. Check if OBS is currently streaming
    3. If streaming: PAUSED → LIVE
    4. If not: Show \"Please start OBS first\"
    \"\"\"
    live_service = LiveStatusService(db)
    
    if not await live_service.is_host_authorized(wedding_id, current_user[\"id\"]):
        raise HTTPException(status_code=403, detail=\"Unauthorized\")
    
    result = await live_service.handle_resume_live(wedding_id, current_user[\"id\"])
    
    if not result.get(\"success\"):
        return {
            \"status\": \"error\",
            \"message\": \"Cannot resume. Please start OBS stream first.\"
        }
    
    return {
        \"status\": \"live\",
        \"message\": \"Live stream resumed\"
    }


@router.post(\"/weddings/{wedding_id}/live/end\")
async def end_live(
    wedding_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db_dependency)
):
    \"\"\"
    Host clicks \"End Live\" - FINAL action
    
    Actions:
    1. Verify authorization
    2. Confirm action (should be confirmed in frontend)
    3. Transition → ENDED
    4. Stop recording
    5. Finalize video (merge segments if paused/resumed)
    6. Upload to Telegram CDN
    7. Mark can_go_live = False
    8. Notify all viewers
    \"\"\"
    live_service = LiveStatusService(db)
    
    if not await live_service.is_host_authorized(wedding_id, current_user[\"id\"]):
        raise HTTPException(status_code=403, detail=\"Unauthorized\")
    
    result = await live_service.handle_end_live(wedding_id, current_user[\"id\"])
    
    # Process recording in background
    background_tasks.add_task(
        finalize_and_upload_recording,
        wedding_id,
        result.get(\"recording_session_id\")
    )
    
    # Notify viewers
    background_tasks.add_task(notify_viewers, wedding_id, \"stream_ended\")
    
    return {
        \"status\": \"ended\",
        \"message\": \"Live stream ended. Processing recording...\",
        \"recording_session_id\": result.get(\"recording_session_id\")
    }


@router.get(\"/weddings/{wedding_id}/live/status\")
async def get_live_status(
    wedding_id: str,
    db = Depends(get_db_dependency)
):
    \"\"\"
    Get current live status (public endpoint)
    
    Returns:
    - status: idle, waiting, live, paused, ended
    - stream_started_at
    - pause_count
    - total_duration
    - recording_available (if ended)
    \"\"\"
    live_service = LiveStatusService(db)
    status_data = await live_service.get_live_status(wedding_id)
    
    return status_data
```

### 3.2 Register Routes

**File**: `/app/backend/server.py`

**Add**:
```python
from app.routes import live_controls, rtmp_webhooks

# Register routes
app.include_router(live_controls.router, prefix=\"/api\", tags=[\"live_controls\"])
app.include_router(rtmp_webhooks.router, prefix=\"/api\", tags=[\"rtmp_webhooks\"])
```

---

## Phase 4: Backend - Recording Management

**Priority**: HIGH  
**Estimated Time**: 3-4 hours  
**Dependencies**: Phase 1, Phase 2, Phase 3

### 4.1 Create Recording Service

**File**: `/app/backend/app/services/recording_service.py` (NEW)

**Functions**:
```python
import asyncio
import subprocess
from pathlib import Path
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class RecordingService:
    def __init__(self, db):
        self.db = db
        self.recordings_dir = Path(\"/tmp/recordings\")
        self.recordings_dir.mkdir(exist_ok=True)
    
    async def start_recording(
        self, 
        wedding_id: str, 
        hls_url: str
    ) -> str:
        \"\"\"
        Start recording from HLS stream
        
        Uses ffmpeg to record HLS stream to MP4
        Recording continues even if stream pauses
        
        Returns recording_session_id
        \"\"\"
        session_id = f\"{wedding_id}_{int(datetime.utcnow().timestamp())}\"
        output_path = self.recordings_dir / f\"{session_id}.mp4\"
        
        # FFmpeg command to record HLS
        cmd = [
            \"ffmpeg\",
            \"-i\", hls_url,
            \"-c\", \"copy\",
            \"-f\", \"mp4\",
            \"-movflags\", \"frag_keyframe+empty_moov\",  # Enable streaming
            str(output_path)
        ]
        
        # Start recording process
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # Store process info
        await self.db.recordings.insert_one({
            \"session_id\": session_id,
            \"wedding_id\": wedding_id,
            \"started_at\": datetime.utcnow(),
            \"output_path\": str(output_path),
            \"process_pid\": process.pid,
            \"status\": \"recording\",
            \"segments\": []
        })
        
        logger.info(f\"[RECORDING] Started for {wedding_id}: {session_id}\")
        
        return session_id
    
    async def stop_recording(self, session_id: str):
        \"\"\"
        Stop recording process gracefully
        
        Sends SIGTERM to ffmpeg process
        Waits for process to finish
        \"\"\"
        recording = await self.db.recordings.find_one({\"session_id\": session_id})
        
        if not recording:
            logger.error(f\"[RECORDING] Session not found: {session_id}\")
            return False
        
        pid = recording.get(\"process_pid\")
        
        try:
            # Send SIGTERM to gracefully stop
            subprocess.run([\"kill\", \"-TERM\", str(pid)])
            
            # Wait for process to finish (max 10 seconds)
            for _ in range(10):
                await asyncio.sleep(1)
                try:
                    # Check if process still exists
                    subprocess.run([\"kill\", \"-0\", str(pid)], check=True)
                except subprocess.CalledProcessError:
                    # Process ended
                    break
            
            # Update status
            await self.db.recordings.update_one(
                {\"session_id\": session_id},
                {
                    \"$set\": {
                        \"status\": \"stopped\",
                        \"stopped_at\": datetime.utcnow()
                    }
                }
            )
            
            logger.info(f\"[RECORDING] Stopped: {session_id}\")
            return True
            
        except Exception as e:
            logger.error(f\"[RECORDING] Error stopping {session_id}: {e}\")
            return False
    
    async def finalize_recording(
        self, 
        session_id: str
    ) -> Dict:
        \"\"\"
        Finalize recording after stream ends
        
        Steps:
        1. Stop recording process
        2. Verify file exists and is valid
        3. Get video duration and metadata
        4. Return file path for upload
        \"\"\"
        await self.stop_recording(session_id)
        
        recording = await self.db.recordings.find_one({\"session_id\": session_id})
        output_path = Path(recording[\"output_path\"])
        
        if not output_path.exists():
            logger.error(f\"[RECORDING] File not found: {output_path}\")
            return {\"success\": False, \"error\": \"Recording file not found\"}
        
        # Get video metadata
        metadata = await self._get_video_metadata(str(output_path))
        
        # Update recording
        await self.db.recordings.update_one(
            {\"session_id\": session_id},
            {
                \"$set\": {
                    \"status\": \"finalized\",
                    \"finalized_at\": datetime.utcnow(),
                    \"duration\": metadata.get(\"duration\"),
                    \"file_size\": output_path.stat().st_size,
                    \"resolution\": metadata.get(\"resolution\")
                }
            }
        )
        
        logger.info(f\"[RECORDING] Finalized: {session_id}\")
        
        return {
            \"success\": True,
            \"session_id\": session_id,
            \"file_path\": str(output_path),
            \"duration\": metadata.get(\"duration\"),
            \"file_size\": output_path.stat().st_size
        }
    
    async def upload_to_cdn(
        self, 
        session_id: str, 
        wedding_id: str
    ) -> str:
        \"\"\"
        Upload finalized recording to Telegram CDN
        
        Returns CDN URL
        \"\"\"
        recording = await self.db.recordings.find_one({\"session_id\": session_id})
        file_path = recording[\"output_path\"]
        
        from app.services.telegram_service import TelegramCDNService
        telegram_service = TelegramCDNService()
        
        result = await telegram_service.upload_video(
            file_path=file_path,
            caption=f\"Wedding Recording: {wedding_id}\",
            wedding_id=wedding_id
        )
        
        if result.get(\"success\"):
            cdn_url = result[\"cdn_url\"]
            
            # Update wedding with recording URL
            await self.db.weddings.update_one(
                {\"id\": wedding_id},
                {
                    \"$set\": {
                        \"live_session.recording_url\": cdn_url,
                        \"live_session.recording_uploaded_at\": datetime.utcnow()
                    }
                }
            )
            
            logger.info(f\"[RECORDING] Uploaded to CDN: {session_id}\")
            return cdn_url
        else:
            logger.error(f\"[RECORDING] Upload failed: {result.get('error')}\")
            return None
    
    async def _get_video_metadata(self, file_path: str) -> Dict:
        \"\"\"Get video duration and resolution using ffprobe\"\"\"
        try:
            cmd = [
                \"ffprobe\",
                \"-v\", \"quiet\",
                \"-print_format\", \"json\",
                \"-show_format\",
                \"-show_streams\",
                file_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            data = json.loads(result.stdout)
            
            duration = float(data[\"format\"].get(\"duration\", 0))
            
            # Get video stream
            video_stream = next(
                (s for s in data[\"streams\"] if s[\"codec_type\"] == \"video\"),
                {}
            )
            
            width = video_stream.get(\"width\", 0)
            height = video_stream.get(\"height\", 0)
            
            return {
                \"duration\": duration,
                \"resolution\": f\"{width}x{height}\"
            }
        except Exception as e:
            logger.error(f\"[RECORDING] Error getting metadata: {e}\")
            return {}


# Background tasks
async def start_recording(wedding_id: str, hls_url: str):
    \"\"\"Background task to start recording\"\"\"
    from app.database import get_db
    db = await get_db()
    recording_service = RecordingService(db)
    
    await recording_service.start_recording(wedding_id, hls_url)


async def finalize_and_upload_recording(wedding_id: str, session_id: str):
    \"\"\"Background task to finalize and upload\"\"\"
    from app.database import get_db
    db = await get_db()
    recording_service = RecordingService(db)
    
    # Finalize
    result = await recording_service.finalize_recording(session_id)
    
    if result.get(\"success\"):
        # Upload to CDN
        cdn_url = await recording_service.upload_to_cdn(session_id, wedding_id)
        
        if cdn_url:
            logger.info(f\"[RECORDING] Complete: {wedding_id} → {cdn_url}\")
```

---

## Phase 5: Frontend - Host Control UI

**Priority**: HIGH  
**Estimated Time**: 3-4 hours  
**Dependencies**: Phase 1, Phase 2, Phase 3

### 5.1 Create Live Control Panel Component

**File**: `/app/frontend/components/LiveControlPanel.js` (NEW)

**Component**:
```jsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, Square, RotateCcw, Radio, Clock, AlertCircle 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function LiveControlPanel({ 
  weddingId, 
  isCreator = false,
  onStatusChange 
}) {
  const [liveStatus, setLiveStatus] = useState('idle');
  const [rtmpCredentials, setRtmpCredentials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);

  // Poll live status every 5 seconds
  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 5000);
    return () => clearInterval(interval);
  }, [weddingId]);

  const fetchLiveStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/weddings/${weddingId}/live/status`
      );
      const data = await response.json();
      setLiveStatus(data.status);
      setPauseCount(data.pause_count || 0);
      setStreamDuration(data.total_duration || 0);
      
      if (onStatusChange) {
        onStatusChange(data);
      }
    } catch (error) {
      console.error('Error fetching live status:', error);
    }
  };

  const handleGoLive = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/weddings/${weddingId}/live/go-live`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setRtmpCredentials({
          rtmp_url: data.rtmp_url,
          stream_key: data.stream_key,
          hls_playback_url: data.hls_playback_url
        });
        setLiveStatus('waiting');
      } else {
        alert(data.detail || 'Failed to start live');
      }
    } catch (error) {
      alert('Error starting live: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/weddings/${weddingId}/live/pause`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.ok) {
        await fetchLiveStatus();
      }
    } catch (error) {
      alert('Error pausing live: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/weddings/${weddingId}/live/resume`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        await fetchLiveStatus();
      } else {
        alert(data.message || 'Cannot resume. Please start OBS first.');
      }
    } catch (error) {
      alert('Error resuming live: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndLive = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/weddings/${weddingId}/live/end`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.ok) {
        await fetchLiveStatus();
      }
    } catch (error) {
      alert('Error ending live: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Only show to creator/admin
  if (!isCreator) {
    return null;
  }

  // Status badge
  const getStatusBadge = () => {
    const badges = {
      idle: <Badge variant=\"secondary\">Not Started</Badge>,
      waiting: <Badge variant=\"warning\" className=\"animate-pulse\">Waiting for OBS...</Badge>,
      live: <Badge variant=\"destructive\" className=\"animate-pulse\"><Radio className=\"w-3 h-3 mr-1\" />LIVE</Badge>,
      paused: <Badge variant=\"secondary\"><Pause className=\"w-3 h-3 mr-1\" />PAUSED</Badge>,
      ended: <Badge variant=\"outline\">ENDED</Badge>
    };
    return badges[liveStatus] || badges.idle;
  };

  return (
    <Card className=\"w-full\">
      <CardHeader>
        <CardTitle className=\"flex items-center justify-between\">
          <span>Live Stream Controls</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className=\"space-y-4\">
        {/* Status Info */}
        <div className=\"grid grid-cols-2 gap-4 text-sm\">
          <div>
            <p className=\"text-gray-500\">Pause Count</p>
            <p className=\"font-semibold\">{pauseCount}</p>
          </div>
          <div>
            <p className=\"text-gray-500\">Stream Duration</p>
            <p className=\"font-semibold\">{Math.floor(streamDuration / 60)}m {streamDuration % 60}s</p>
          </div>
        </div>

        {/* RTMP Credentials (when waiting) */}
        {liveStatus === 'waiting' && rtmpCredentials && (
          <div className=\"bg-blue-50 p-4 rounded-lg space-y-2 border border-blue-200\">
            <h4 className=\"font-semibold text-blue-900 flex items-center gap-2\">
              <AlertCircle className=\"w-4 h-4\" />
              Configure OBS Studio
            </h4>
            <div className=\"space-y-1 text-sm\">
              <div>
                <span className=\"font-medium\">RTMP URL:</span>
                <code className=\"ml-2 bg-white px-2 py-1 rounded text-xs\">
                  {rtmpCredentials.rtmp_url}
                </code>
              </div>
              <div>
                <span className=\"font-medium\">Stream Key:</span>
                <code className=\"ml-2 bg-white px-2 py-1 rounded text-xs\">
                  {rtmpCredentials.stream_key}
                </code>
              </div>
            </div>
            <p className=\"text-xs text-blue-700\">
              Enter these credentials in OBS and click \"Start Streaming\"
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className=\"flex flex-col gap-2\">
          {/* Go Live Button */}
          {liveStatus === 'idle' && (
            <Button
              onClick={handleGoLive}
              disabled={loading}
              className=\"w-full\"
              size=\"lg\"
            >
              <Play className=\"w-4 h-4 mr-2\" />
              Go Live
            </Button>
          )}

          {/* Pause Button */}
          {liveStatus === 'live' && (
            <Button
              onClick={handlePause}
              disabled={loading}
              variant=\"outline\"
              className=\"w-full\"
            >
              <Pause className=\"w-4 h-4 mr-2\" />
              Pause Live
            </Button>
          )}

          {/* Resume Button */}
          {liveStatus === 'paused' && (
            <Button
              onClick={handleResume}
              disabled={loading}
              className=\"w-full\"
            >
              <RotateCcw className=\"w-4 h-4 mr-2\" />
              Resume Live
            </Button>
          )}

          {/* End Live Button (with confirmation) */}
          {(liveStatus === 'live' || liveStatus === 'paused') && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant=\"destructive\"
                  className=\"w-full\"
                  disabled={loading}
                >
                  <Square className=\"w-4 h-4 mr-2\" />
                  End Live (Final)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End Live Stream?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently end the live stream. Recording will be finalized and uploaded.
                    <br /><br />
                    You cannot go live again for this wedding after ending.
                    <br /><br />
                    Are you sure you want to end the live stream?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEndLive}>
                    Yes, End Live Stream
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Info Messages */}
        {liveStatus === 'waiting' && (
          <div className=\"bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800 border border-yellow-200\">
            Waiting for OBS stream to start...
          </div>
        )}

        {liveStatus === 'paused' && (
          <div className=\"bg-orange-50 p-3 rounded-lg text-sm text-orange-800 border border-orange-200\">
            Stream is paused. Recording continues. Click Resume when ready or End to finish.
          </div>
        )}

        {liveStatus === 'ended' && (
          <div className=\"bg-gray-50 p-3 rounded-lg text-sm text-gray-800 border border-gray-200\">
            Live stream has ended. Recording is being processed and will be available shortly.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 5.2 Integrate into Manage Wedding Page

**File**: `/app/frontend/app/weddings/manage/[id]/page.js`

**Add to Stream tab**:
```jsx
import LiveControlPanel from '@/components/LiveControlPanel';

// In the Stream tab
<div className=\"space-y-6\">
  {/* Live Control Panel (visible only to creator) */}
  <LiveControlPanel 
    weddingId={weddingId}
    isCreator={isCreator}
    onStatusChange={(status) => {
      // Update page state based on live status
      setCurrentLiveStatus(status);
    }}
  />
  
  {/* Existing RTMP credentials display */}
  {/* ... */}
</div>
```

---

## Phase 6: Frontend - Viewer Status Display

**Priority**: HIGH  
**Estimated Time**: 2-3 hours  
**Dependencies**: Phase 5

### 6.1 Create Viewer Live Status Component

**File**: `/app/frontend/components/ViewerLiveStatus.js` (NEW)

**Component**:
```jsx
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Pause, Clock, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ViewerLiveStatus({ weddingId }) {
  const [liveStatus, setLiveStatus] = useState('idle');
  const [streamStartedAt, setStreamStartedAt] = useState(null);
  const [pauseCount, setPauseCount] = useState(0);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [weddingId]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/weddings/${weddingId}/live/status`
      );
      const data = await response.json();
      setLiveStatus(data.status);
      setStreamStartedAt(data.stream_started_at);
      setPauseCount(data.pause_count || 0);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  // Status-specific messages and UI
  const renderStatusCard = () => {
    switch (liveStatus) {
      case 'idle':
      case 'waiting':
        return (
          <Card className=\"bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200\">
            <CardContent className=\"py-8 text-center\">
              <Clock className=\"w-12 h-12 mx-auto text-gray-400 mb-4\" />
              <h3 className=\"text-xl font-semibold text-gray-700 mb-2\">
                Live Stream Not Started Yet
              </h3>
              <p className=\"text-gray-500\">
                The ceremony hasn't started. Please check back soon!
              </p>
            </CardContent>
          </Card>
        );

      case 'live':
        return (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className=\"bg-gradient-to-r from-red-50 to-pink-50 border-red-200\">
              <CardContent className=\"py-6 text-center\">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge variant=\"destructive\" className=\"mb-4 px-4 py-2 text-lg\">
                    <Radio className=\"w-5 h-5 mr-2 animate-pulse\" />
                    LIVE NOW
                  </Badge>
                </motion.div>
                <h3 className=\"text-2xl font-bold text-gray-800 mb-2\">
                  🎊 The Ceremony is Live! 🎊
                </h3>
                <p className=\"text-gray-600\">
                  Join us in celebrating this beautiful moment
                </p>
                {pauseCount > 0 && (
                  <p className=\"text-xs text-gray-500 mt-2\">
                    Stream has resumed after brief pause
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'paused':
        return (
          <Card className=\"bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200\">
            <CardContent className=\"py-8 text-center\">
              <Pause className=\"w-12 h-12 mx-auto text-orange-500 mb-4\" />
              <h3 className=\"text-xl font-semibold text-gray-700 mb-2\">
                Stream Paused - We'll Be Right Back! 💖
              </h3>
              <p className=\"text-gray-600 mb-4\">
                The live stream will resume shortly. Please stay tuned!
              </p>
              <div className=\"flex items-center justify-center gap-2\">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Heart className=\"w-5 h-5 text-pink-500\" fill=\"currentColor\" />
                </motion.div>
                <span className=\"text-sm text-gray-500\">Waiting for hosts...</span>
              </div>
            </CardContent>
          </Card>
        );

      case 'ended':
        return (
          <Card className=\"bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200\">
            <CardContent className=\"py-8 text-center\">
              <h3 className=\"text-xl font-semibold text-gray-700 mb-2\">
                ✨ Live Stream Has Ended ✨
              </h3>
              <p className=\"text-gray-600 mb-4\">
                Thank you for joining us! The recorded video will be available below.
              </p>
              <Badge variant=\"outline\" className=\"text-sm\">
                Recording Available
              </Badge>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className=\"w-full\">
      {renderStatusCard()}
    </div>
  );
}
```

### 6.2 Integrate into Public Wedding Page

**File**: `/app/frontend/app/weddings/[id]/page.js`

**Add before video player**:
```jsx
import ViewerLiveStatus from '@/components/ViewerLiveStatus';
import StreamVideoPlayer from '@/components/StreamVideoPlayer';

// In the component
const [liveStatus, setLiveStatus] = useState('idle');

// Display logic
<div className=\"space-y-4\">
  {/* Status Card */}
  <ViewerLiveStatus 
    weddingId={weddingId}
    onStatusChange={(status) => setLiveStatus(status)}
  />
  
  {/* Video Player - only show when live or ended */}
  {(liveStatus === 'live' || liveStatus === 'ended') && (
    <div className=\"aspect-video bg-black rounded-lg overflow-hidden\">
      {liveStatus === 'live' ? (
        <StreamVideoPlayer 
          playbackUrl={wedding.live_session?.hls_playback_url}
          isLive={true}
        />
      ) : (
        <StreamVideoPlayer 
          playbackUrl={wedding.live_session?.recording_url}
          isLive={false}
        />
      )}
    </div>
  )}
  
  {/* Show placeholder when waiting or paused */}
  {(liveStatus === 'idle' || liveStatus === 'waiting' || liveStatus === 'paused') && (
    <div className=\"aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center\">
      <div className=\"text-center\">
        <img 
          src={wedding.cover_photo_url} 
          alt=\"Wedding\" 
          className=\"max-w-md mx-auto rounded-lg shadow-lg mb-4\"
        />
        <p className=\"text-gray-600\">
          {liveStatus === 'paused' ? 'Stream will resume shortly...' : 'Waiting for live stream...'}
        </p>
      </div>
    </div>
  )}
</div>
```

---

## Phase 7: Integration - NGINX RTMP Configuration

**Priority**: CRITICAL  
**Estimated Time**: 1-2 hours  
**Dependencies**: Phase 2

### 7.1 Complete NGINX Configuration

**File**: `/etc/nginx/nginx.conf`

**Full Configuration**:
```nginx
worker_processes auto;
rtmp_auto_push on;

events {
    worker_connections 1024;
}

# RTMP Configuration
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        
        application live {
            live on;
            record off;
            
            # Webhooks to WedLive backend
            on_publish http://localhost:8001/api/rtmp/on-publish;
            on_publish_done http://localhost:8001/api/rtmp/on-publish-done;
            on_update http://localhost:8001/api/rtmp/on-update;
            
            # Allow only specific IPs (optional security)
            # allow publish 127.0.0.1;
            # deny publish all;
            
            # HLS Configuration
            hls on;
            hls_path /tmp/hls;
            hls_fragment 3s;
            hls_playlist_length 60s;
            hls_continuous on;
            hls_cleanup on;
            
            # DASH Configuration (optional)
            dash on;
            dash_path /tmp/dash;
            dash_fragment 3s;
            dash_playlist_length 60s;
            dash_cleanup on;
        }
    }
}

# HTTP Configuration for HLS
http {
    server {
        listen 8080;
        
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /tmp;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }
        
        location /dash {
            root /tmp;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }
        
        # RTMP statistics
        location /stat {
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
        }
    }
}
```

### 7.2 Create HLS Directory

```bash
sudo mkdir -p /tmp/hls
sudo mkdir -p /tmp/dash
sudo chmod 777 /tmp/hls
sudo chmod 777 /tmp/dash
```

### 7.3 Restart NGINX

```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

## Phase 8: Testing - Complete Flow Verification

**Priority**: HIGH  
**Estimated Time**: 2-3 hours  
**Dependencies**: All previous phases

### 8.1 Create Comprehensive Test Script

**File**: `/app/test_live_control_system.py` (NEW)

**Test Coverage**:
```python
\"\"\"
Comprehensive testing for Advanced Live Control System
\"\"\"

import requests
import time
import json

BACKEND_URL = \"http://localhost:8001/api\"
test_results = []

def test_go_live():
    \"\"\"Test Go Live functionality\"\"\"
    # Create test wedding
    # Login as creator
    # Click Go Live
    # Verify status = WAITING
    # Verify RTMP credentials returned
    pass

def test_obs_start():
    \"\"\"Test OBS stream start detection\"\"\"
    # Simulate RTMP webhook on-publish
    # Verify status transitions to LIVE
    # Verify recording starts
    pass

def test_obs_stop():
    \"\"\"Test OBS stream stop (pause, not end)\"\"\"
    # Simulate RTMP webhook on-publish-done
    # Verify status transitions to PAUSED (not ENDED)
    # Verify recording continues
    pass

def test_manual_pause():
    \"\"\"Test manual pause by host\"\"\"
    # Host clicks Pause
    # Verify status = PAUSED
    # Verify OBS can still stream (reconnect works)
    pass

def test_resume():
    \"\"\"Test resume after pause\"\"\"
    # Host clicks Resume
    # If OBS streaming: status = LIVE
    # If OBS not streaming: error message
    pass

def test_end_live():
    \"\"\"Test final end live\"\"\"
    # Host clicks End Live
    # Verify status = ENDED
    # Verify can_go_live = False
    # Verify recording finalized
    # Verify upload to CDN initiated
    pass

def test_viewer_experience():
    \"\"\"Test viewer status display\"\"\"
    # For each status (idle, waiting, live, paused, ended)
    # Verify correct message shown
    # Verify video player shown/hidden correctly
    pass

def test_invalid_transitions():
    \"\"\"Test that invalid transitions are blocked\"\"\"
    # Try to resume when IDLE
    # Try to pause when ENDED
    # Try to go live when already ENDED
    pass

if __name__ == \"__main__\":
    print(\"Running Live Control System Tests...\")
    # Run all tests
    # Generate report
```

### 8.2 Manual Testing Checklist

**File**: `/app/LIVE_CONTROL_TESTING_CHECKLIST.md` (NEW)

```markdown
# Live Control System - Testing Checklist

## Setup
- [ ] Backend running on port 8001
- [ ] Frontend running on port 3000
- [ ] NGINX RTMP running on port 1935
- [ ] MongoDB running
- [ ] OBS Studio installed

## Test Scenario 1: Complete Happy Path
- [ ] 1. Creator logs in
- [ ] 2. Creates wedding
- [ ] 3. Navigates to Manage page
- [ ] 4. Clicks \"Go Live\"
- [ ] 5. Verify status = WAITING
- [ ] 6. Copy RTMP credentials to OBS
- [ ] 7. Start streaming in OBS
- [ ] 8. Verify status changes to LIVE within 5 seconds
- [ ] 9. Verify recording starts
- [ ] 10. Open wedding page as guest
- [ ] 11. Verify \"LIVE NOW\" badge shown
- [ ] 12. Verify video player shows HLS stream
- [ ] 13. Stop OBS stream
- [ ] 14. Verify status changes to PAUSED (not ENDED)
- [ ] 15. Verify viewer sees \"Stream will resume shortly\"
- [ ] 16. Start OBS stream again
- [ ] 17. Verify status changes back to LIVE
- [ ] 18. Verify viewer sees live video again
- [ ] 19. Creator clicks \"End Live\"
- [ ] 20. Confirm dialog
- [ ] 21. Verify status changes to ENDED
- [ ] 22. Verify recording finalization started
- [ ] 23. Wait for upload to CDN
- [ ] 24. Verify recorded video playback available
- [ ] 25. Verify \"Go Live\" button no longer available

## Test Scenario 2: Manual Pause
- [ ] 1. Creator starts live
- [ ] 2. OBS streaming
- [ ] 3. Creator clicks \"Pause Live\"
- [ ] 4. Verify status = PAUSED
- [ ] 5. Verify viewer sees pause message
- [ ] 6. OBS still connected (doesn't disconnect)
- [ ] 7. Creator clicks \"Resume Live\"
- [ ] 8. Verify status = LIVE
- [ ] 9. Verify viewer sees live video

## Test Scenario 3: Multiple Pauses
- [ ] 1. Start live
- [ ] 2. Stop OBS (pause 1)
- [ ] 3. Start OBS (resume 1)
- [ ] 4. Stop OBS (pause 2)
- [ ] 5. Start OBS (resume 2)
- [ ] 6. Verify pause_count = 2
- [ ] 7. End live
- [ ] 8. Verify single recording with all segments

## Test Scenario 4: Error Handling
- [ ] 1. Try to resume when not paused → Error message
- [ ] 2. Try to pause when already paused → No effect
- [ ] 3. Try to go live when already ended → Blocked
- [ ] 4. Try to end live without starting → No effect
- [ ] 5. Invalid stream key in OBS → Rejected

## Test Scenario 5: Viewer Experience
- [ ] 1. Join as guest when status = IDLE → See \"Not started\"
- [ ] 2. Status changes to WAITING → See \"Not started\"
- [ ] 3. Status changes to LIVE → See \"LIVE NOW\" + video
- [ ] 4. Status changes to PAUSED → See \"Will resume shortly\"
- [ ] 5. Status changes to LIVE → See video again
- [ ] 6. Status changes to ENDED → See recorded video

## Performance Tests
- [ ] 1. Multiple viewers (10+) watching simultaneously
- [ ] 2. Recording file size reasonable (<500MB/hour)
- [ ] 3. HLS latency < 15 seconds
- [ ] 4. Status updates propagate within 5 seconds
- [ ] 5. No memory leaks during long streams (2+ hours)

## Edge Cases
- [ ] 1. Network interruption during stream
- [ ] 2. Server restart during live stream
- [ ] 3. NGINX restart during live stream
- [ ] 4. OBS crash during stream
- [ ] 5. Creator closes browser during live
- [ ] 6. Multiple creators try to control simultaneously
```

---

## Implementation Timeline

**Total Estimated Time**: 18-24 hours

| Phase | Description | Priority | Time | Dependencies |
|-------|-------------|----------|------|--------------|
| 1 | Backend Status State Machine | CRITICAL | 2-3h | None |
| 2 | RTMP Webhook Handler | CRITICAL | 2-3h | Phase 1 |
| 3 | Manual Control Endpoints | HIGH | 2-3h | Phase 1, 2 |
| 4 | Recording Management | HIGH | 3-4h | Phase 1-3 |
| 5 | Host Control UI | HIGH | 3-4h | Phase 1-3 |
| 6 | Viewer Status Display | HIGH | 2-3h | Phase 5 |
| 7 | NGINX Configuration | CRITICAL | 1-2h | Phase 2 |
| 8 | Testing & Validation | HIGH | 2-3h | All |

**Suggested Order**:
1. Day 1: Phase 1, 2, 7 (Backend foundation + NGINX)
2. Day 2: Phase 3, 4 (Control endpoints + Recording)
3. Day 3: Phase 5, 6, 8 (Frontend UI + Testing)

---

## Deployment Checklist

### Backend:
- [ ] Install required packages: `ffmpeg`, `ffprobe`
- [ ] Update `requirements.txt` with any new dependencies
- [ ] Create `/tmp/recordings` directory
- [ ] Set proper permissions for recordings directory
- [ ] Add new routes to `server.py`
- [ ] Create new MongoDB indexes if needed
- [ ] Test all API endpoints

### Frontend:
- [ ] Install any new npm packages
- [ ] Update environment variables
- [ ] Build production bundle
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

### NGINX:
- [ ] Install `nginx-rtmp-module`
- [ ] Configure webhooks
- [ ] Create HLS/DASH directories
- [ ] Set proper permissions
- [ ] Test RTMP connection
- [ ] Test HLS playback

### Testing:
- [ ] Run automated tests
- [ ] Complete manual testing checklist
- [ ] Performance testing with multiple viewers
- [ ] Edge case testing
- [ ] Load testing

---

## Success Criteria

✅ **Phase 1-3 Complete When**:
- Wedding status can be IDLE, WAITING, LIVE, PAUSED, ENDED
- All status transitions validated
- RTMP webhooks receive and process correctly
- Manual control endpoints working

✅ **Phase 4 Complete When**:
- Recording starts when stream goes live
- Recording continues during pause
- Recording finalizes and uploads on end
- Video available on CDN after end

✅ **Phase 5-6 Complete When**:
- Host sees all control buttons
- Buttons enabled/disabled based on status
- Viewer sees appropriate status messages
- Video player shown/hidden correctly

✅ **Phase 7-8 Complete When**:
- NGINX receives OBS stream
- Webhooks fire correctly
- All test scenarios pass
- No errors in logs

✅ **Production Ready When**:
- All phases complete
- All tests passing
- Documentation complete
- Performance validated
- Edge cases handled

---

## Monitoring & Debugging

### Log Files to Monitor:
```bash
# Backend logs
tail -f /var/log/supervisor/backend.out.log

# NGINX RTMP logs
tail -f /var/log/nginx/error.log

# Recording service logs
tail -f /tmp/recordings/*.log
```

### Key Metrics to Track:
- Stream uptime %
- Pause count per stream
- Recording file sizes
- Upload success rate
- Status transition timing
- Webhook delivery rate

### Debug Commands:
```bash
# Check NGINX RTMP status
curl http://localhost:8080/stat

# Check wedding live status
curl http://localhost:8001/api/weddings/{wedding_id}/live/status

# Check recording process
ps aux | grep ffmpeg

# Check disk space
df -h /tmp/recordings
```

---

## Future Enhancements

### Priority 1 (Next Sprint):
- [ ] WebSocket for real-time status updates (remove polling)
- [ ] Multi-camera angle support with pause/resume
- [ ] Picture-in-picture for multiple angles
- [ ] Live chat during stream

### Priority 2:
- [ ] Stream quality auto-switching based on viewer bandwidth
- [ ] DVR functionality (rewind live stream)
- [ ] Highlights creation during live
- [ ] Live reactions (hearts, emojis)

### Priority 3:
- [ ] AI-powered highlight detection
- [ ] Automatic scene detection for pause points
- [ ] Stream analytics dashboard
- [ ] Multi-language support for viewer messages

---

**Document Version**: 1.0  
**Created**: January 2025  
**Status**: Ready for Implementation  
**Estimated Completion**: 3-4 days
"
