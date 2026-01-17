# 🎬 Multi-Camera Live Streaming - Implementation Plan (NGINX-RTMP)

## ✅ Current State Analysis

### You Already Have:
1. ✅ **NGINX-RTMP Server** - Custom streaming engine (Port 1935 RTMP, Port 8080 HLS)
2. ✅ **RTMP Webhooks** - on-publish, on-publish-done, on-update
3. ✅ **Stream Service** - Generates stream keys, manages credentials
4. ✅ **Recording Service** - FFmpeg-based recording
5. ✅ **Multi-Camera API Endpoints** - Add/Remove camera (Premium only)
6. ✅ **Live Status Service** - State management (waiting → live → paused → ended)
7. ✅ **Wedding Management** - Complete CRUD operations
8. ✅ **MongoDB** - Data persistence
9. ✅ **React Frontend** - Wedding management UI

### What You Need to Build:
1. 🔨 **FFmpeg Composition Service** - Real-time camera switching
2. 🔨 **Camera Switching API** - Switch active camera endpoint
3. 🔨 **WebSocket Service** - Real-time UI updates
4. 🔨 **Thumbnail Generation** - Camera preview images
5. 🔨 **Frontend Camera Grid** - Multi-camera UI
6. 🔨 **Multi-Stream Recording** - Record all cameras + output

---

## 🏗️ Architecture (NGINX-RTMP Based)

```
CAMERAS (OBS) → NGINX-RTMP (Port 1935) → HLS Chunks (Port 8080)
                       ↓
                  Webhooks notify FastAPI
                       ↓
                FFmpeg Composition Service
                       ↓
              Output HLS → Viewers (HLS.js)
```

**Flow:**
1. **Creator** adds cameras via UI (generates unique stream keys)
2. **OBS instances** stream to `rtmp://server/live/live_wedding_cam1_xxx`
3. **NGINX** creates HLS chunks at `/tmp/hls/live_wedding_cam1_xxx/`
4. **Webhooks** notify FastAPI when cameras go live/offline
5. **FFmpeg Service** reads camera HLS, composes single output HLS
6. **Viewers** watch output HLS at `/hls/output_wedding_xxx.m3u8`
7. **Creator** switches cameras → FFmpeg restarts with new input
8. **Recording Service** records all camera HLS + output HLS

---

## 📐 Implementation Plan

### **PHASE 1: Backend Foundation** (Day 1-2)

#### 1.1 Database Schema Updates
**File:** MongoDB `weddings` collection

Add fields:
```javascript
{
  "multi_cameras": [  // ✅ Already exists!
    {
      "camera_id": "cam_001",
      "name": "Main Stage",
      "stream_key": "live_wedding123_cam001_abc",
      "status": "live",  // waiting, live, offline
      "hls_url": "/hls/live_wedding123_cam001_abc.m3u8",
      "created_at": "2025-01-10T10:00:00Z"
    }
  ],
  "active_camera_id": "cam_001",  // NEW - Currently broadcasting
  "camera_switches": [  // NEW - Switch log
    {
      "from_camera_id": "cam_001",
      "to_camera_id": "cam_002",
      "switched_at": "2025-01-10T10:15:30Z"
    }
  ],
  "composition_config": {  // NEW - FFmpeg state
    "active": false,
    "ffmpeg_pid": null,
    "output_hls_url": "/hls_output/output_wedding123.m3u8"
  }
}
```

**Tasks:**
- [ ] Add `active_camera_id` field
- [ ] Add `camera_switches` array
- [ ] Add `composition_config` object
- [ ] Create migration script

---

#### 1.2 Camera Switching API
**File:** `/app/backend/app/routes/streams.py` (EXTEND)

**NEW Endpoint:**
```python
@router.post("/camera/{wedding_id}/{camera_id}/switch")
async def switch_camera(
    wedding_id: str,
    camera_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Switch to different camera"""
    db = get_db()
    wedding = await db.weddings.find_one({"id": wedding_id})
    
    # Validate ownership
    if wedding["creator_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403)
    
    # Validate camera exists and is live
    cameras = wedding.get("multi_cameras", [])
    camera = next((c for c in cameras if c["camera_id"] == camera_id), None)
    
    if not camera or camera["status"] != "live":
        raise HTTPException(status_code=400, detail="Camera not available")
    
    # Log switch
    switch_event = {
        "from_camera_id": wedding.get("active_camera_id"),
        "to_camera_id": camera_id,
        "switched_at": datetime.utcnow()
    }
    
    # Update DB
    await db.weddings.update_one(
        {"id": wedding_id},
        {
            "$set": {"active_camera_id": camera_id},
            "$push": {"camera_switches": switch_event}
        }
    )
    
    # Update FFmpeg composition
    from app.services.ffmpeg_composition import update_composition
    await update_composition(wedding_id, camera)
    
    # Notify viewers via WebSocket
    from app.services.camera_websocket import broadcast_camera_switch
    await broadcast_camera_switch(wedding_id, camera)
    
    return {"status": "success", "active_camera": camera}
```

**Tasks:**
- [ ] Add switch camera endpoint
- [ ] Add get active camera endpoint
- [ ] Test with Postman

---

#### 1.3 FFmpeg Composition Service
**File:** `/app/backend/app/services/ffmpeg_composition.py` (NEW)

**Purpose:** Manage FFmpeg process that composes cameras into single output

```python
import subprocess
import asyncio
from pathlib import Path

class FFmpegCompositionService:
    def __init__(self):
        self.processes = {}  # wedding_id -> Process
        self.output_dir = Path("/tmp/hls_output")
        self.output_dir.mkdir(exist_ok=True)
    
    async def start_composition(self, wedding_id: str, camera: dict):
        """Start FFmpeg to stream active camera to output"""
        output_path = self.output_dir / f"output_{wedding_id}"
        output_path.mkdir(exist_ok=True)
        
        # Input: Camera HLS
        input_hls = f"http://localhost:8080{camera['hls_url']}"
        output_hls = str(output_path / "output.m3u8")
        
        cmd = [
            "ffmpeg",
            "-i", input_hls,
            "-c", "copy",  # Copy codec (no re-encoding)
            "-f", "hls",
            "-hls_time", "2",
            "-hls_list_size", "5",
            "-hls_flags", "delete_segments",
            output_hls
        ]
        
        process = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        self.processes[wedding_id] = process
        
        return {
            "success": True,
            "pid": process.pid,
            "output_url": f"/hls_output/output_{wedding_id}/output.m3u8"
        }
    
    async def switch_camera(self, wedding_id: str, new_camera: dict):
        """Switch to new camera by restarting FFmpeg"""
        # Stop current
        await self.stop_composition(wedding_id)
        
        # Wait for clean shutdown
        await asyncio.sleep(0.5)
        
        # Start with new camera
        return await self.start_composition(wedding_id, new_camera)
    
    async def stop_composition(self, wedding_id: str):
        """Stop FFmpeg process"""
        if wedding_id in self.processes:
            process = self.processes[wedding_id]
            process.stdin.write(b'q')
            process.stdin.flush()
            process.wait(timeout=5)
            del self.processes[wedding_id]

composition_service = FFmpegCompositionService()

async def update_composition(wedding_id: str, camera: dict):
    """Helper function for routes"""
    await composition_service.switch_camera(wedding_id, camera)
```

**Tasks:**
- [ ] Create FFmpegCompositionService
- [ ] Implement start/stop/switch methods
- [ ] Add process monitoring
- [ ] Test camera switching latency

---

#### 1.4 RTMP Webhook Updates
**File:** `/app/backend/app/routes/rtmp_webhooks.py` (EXTEND)

Update `on_publish` to handle camera streams:

```python
@router.post("/rtmp/on-publish")
async def on_publish(request: Request, background_tasks: BackgroundTasks):
    data = await request.form()
    stream_key = data.get("name", "")
    
    db = get_db()
    
    # Check if camera stream
    wedding = await db.weddings.find_one({
        "multi_cameras.stream_key": stream_key
    })
    
    if wedding:
        # Mark camera as live
        await db.weddings.update_one(
            {"id": wedding["id"], "multi_cameras.stream_key": stream_key},
            {"$set": {"multi_cameras.$.status": "live"}}
        )
        
        # If no active camera, make this one active
        if not wedding.get("active_camera_id"):
            camera = next(c for c in wedding["multi_cameras"] if c["stream_key"] == stream_key)
            await db.weddings.update_one(
                {"id": wedding["id"]},
                {"$set": {"active_camera_id": camera["camera_id"]}}
            )
            
            # Start composition
            background_tasks.add_task(start_composition, wedding["id"], camera)
        
        return {"status": "success", "type": "camera"}
    
    # ... existing main stream logic
```

Similar updates for `on_publish_done` to handle camera offline.

**Tasks:**
- [ ] Extend on_publish for cameras
- [ ] Extend on_publish_done for cameras
- [ ] Auto-switch if active camera goes offline
- [ ] Test with multiple OBS instances

---

#### 1.5 WebSocket Service
**File:** `/app/backend/app/services/camera_websocket.py` (NEW)

```python
from fastapi import WebSocket
from typing import Dict, Set

class CameraWebSocketManager:
    def __init__(self):
        self.connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, ws: WebSocket, wedding_id: str):
        await ws.accept()
        if wedding_id not in self.connections:
            self.connections[wedding_id] = set()
        self.connections[wedding_id].add(ws)
    
    async def broadcast_camera_switch(self, wedding_id: str, camera: dict):
        """Notify all connected clients of camera switch"""
        if wedding_id in self.connections:
            message = {
                "event": "camera_switched",
                "camera_id": camera["camera_id"],
                "camera_name": camera["name"],
                "hls_url": camera["hls_url"]
            }
            
            for ws in self.connections[wedding_id]:
                try:
                    await ws.send_json(message)
                except:
                    pass

ws_manager = CameraWebSocketManager()

# Route
@app.websocket("/ws/camera-control/{wedding_id}")
async def camera_control_ws(websocket: WebSocket, wedding_id: str):
    await ws_manager.connect(websocket, wedding_id)
    try:
        while True:
            await websocket.receive_text()
    except:
        pass
```

**Tasks:**
- [ ] Create WebSocket manager
- [ ] Add broadcast methods
- [ ] Add WebSocket route to main app
- [ ] Test with frontend

---

### **PHASE 2: Frontend Camera UI** (Day 3-4)

#### 2.1 Camera Management Panel
**File:** `/app/frontend/components/camera/CameraManagementPanel.js` (NEW)

```javascript
const CameraManagementPanel = ({ weddingId }) => {
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  
  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`ws://backend/ws/camera-control/${weddingId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'camera_switched') {
        setActiveCameraId(data.camera_id);
      }
    };
    
    return () => ws.close();
  }, [weddingId]);
  
  const handleSwitchCamera = async (cameraId) => {
    await fetch(`/api/stream/camera/${weddingId}/${cameraId}/switch`, {
      method: 'POST'
    });
  };
  
  return (
    <div className="camera-management">
      {/* Main Output */}
      <div className="main-output">
        <ActiveCameraPlayer weddingId={weddingId} cameraId={activeCameraId} />
      </div>
      
      {/* Camera Grid */}
      <div className="camera-grid grid grid-cols-2 gap-4">
        {cameras.map(camera => (
          <CameraCard
            key={camera.camera_id}
            camera={camera}
            isActive={camera.camera_id === activeCameraId}
            onSwitch={() => handleSwitchCamera(camera.camera_id)}
          />
        ))}
      </div>
    </div>
  );
};
```

**Tasks:**
- [ ] Create CameraManagementPanel component
- [ ] Add camera grid layout
- [ ] Implement WebSocket integration
- [ ] Add responsive design

---

#### 2.2 Camera Preview Card
**File:** `/app/frontend/components/camera/CameraCard.js` (NEW)

```javascript
const CameraCard = ({ camera, isActive, onSwitch }) => {
  return (
    <div className={`camera-card ${isActive ? 'border-primary' : 'border-gray-300'}`}>
      {/* Thumbnail */}
      <div className="aspect-video bg-black">
        <img src={`/api/camera-thumbnail/${camera.camera_id}`} alt={camera.name} />
      </div>
      
      {/* Status */}
      <div className="p-3">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">{camera.name}</h4>
          <span className={`status ${camera.status === 'live' ? 'text-green-500' : 'text-gray-400'}`}>
            {camera.status === 'live' ? '● LIVE' : '○ OFFLINE'}
          </span>
        </div>
        
        {/* Actions */}
        {isActive ? (
          <button disabled className="btn-active">ACTIVE</button>
        ) : (
          <button 
            onClick={onSwitch}
            disabled={camera.status !== 'live'}
            className="btn-switch"
          >
            SWITCH
          </button>
        )}
      </div>
    </div>
  );
};
```

---

### **PHASE 3: Testing & Optimization** (Day 5)

#### 3.1 Testing Checklist
- [ ] Add 5 cameras via UI
- [ ] Start 5 OBS instances with different stream keys
- [ ] Verify all cameras show as "LIVE"
- [ ] Switch between cameras 10 times
- [ ] Measure switching latency (target < 3 seconds)
- [ ] Test with 10 concurrent viewers
- [ ] Verify recording captures all cameras
- [ ] Test camera disconnect/reconnect
- [ ] Test active camera going offline (auto-switch)

#### 3.2 Performance Optimization
- [ ] Optimize FFmpeg command flags
- [ ] Reduce HLS segment size for lower latency
- [ ] Add thumbnail caching
- [ ] Implement WebSocket heartbeat
- [ ] Add FFmpeg process health monitoring
- [ ] Optimize database queries

---

## 🎯 Success Criteria

✅ **Functional:**
- Support 5 simultaneous cameras
- Camera switching < 3 seconds
- Real-time status updates
- Auto-recording works

✅ **Performance:**
- CPU usage < 70% with 5 cameras
- Memory usage < 4GB
- 100+ concurrent viewers
- 1080p @ 30fps quality

✅ **Reliability:**
- Graceful camera failure handling
- Auto-reconnection
- Recording integrity
- 99.9% uptime

---

## 📊 Estimated Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1 | 2 days | Backend APIs, FFmpeg service, WebSocket |
| Phase 2 | 2 days | Frontend UI, camera grid, switching |
| Phase 3 | 1 day | Testing, optimization, bug fixes |
| **Total** | **5 days** | **Full implementation** |

---

## 🚀 Deployment Steps

1. **Backend:**
   ```bash
   # Install dependencies
   pip install asyncio subprocess
   
   # Create output directories
   mkdir -p /tmp/hls_output
   chmod 777 /tmp/hls_output
   
   # Restart backend
   sudo supervisorctl restart backend
   ```

2. **Frontend:**
   ```bash
   cd /app/frontend
   yarn install
   sudo supervisorctl restart frontend
   ```

3. **Test:**
   - Configure 2-3 OBS instances
   - Add cameras via UI
   - Start streaming
   - Test switching

---

## 📝 Key Differences from Original Plan

| Original (Stream.io) | Your System (NGINX-RTMP) |
|---------------------|---------------------------|
| Stream.io API calls | NGINX webhooks |
| JWT tokens | Simple stream keys |
| WebRTC composition | FFmpeg composition |
| Stream.io HLS | Custom HLS delivery |
| Participant management | Stream key management |

**Advantage:** Full control, no third-party costs, simpler architecture

**Trade-off:** Need to manage FFmpeg processes manually

---

## 🎬 Next Steps

1. **Review this plan** - Confirm approach aligns with your vision
2. **Phase 1 implementation** - Start with backend foundation
3. **Incremental testing** - Test each component before moving forward
4. **Phase 2 implementation** - Build frontend UI
5. **End-to-end testing** - Test complete flow
6. **Production deployment** - Roll out to users

---

**Ready to start? Let's begin with Phase 1!** 🚀
