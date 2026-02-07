# Pulse Platform Integration Analysis for WedLive

## Executive Summary

Based on comprehensive analysis of the Pulse (ComboPulse) repository, here's the complete feature set and integration strategy for WedLive.

---

## What is Pulse Platform?

**Pulse** is a complete video streaming infrastructure platform built on LiveKit, providing:
- **Live streaming** (WebRTC)
- **Recording** (Egress to storage)
- **RTMP ingress/egress**
- **Token management**
- **Storage** (Cloudflare R2 + Telegram CDN)

Think of it as: **"Pulse is to streaming what AWS is to cloud computing"**

---

## Pulse Platform Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PULSE PLATFORM COMPONENTS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │  LiveKit Server    │  │  LiveKit Egress    │                │
│  │  (WebRTC Rooms)    │  │  (Recording/RTMP)  │                │
│  │  Port: 7880        │  │  Port: 9090        │                │
│  └──────────┬─────────┘  └──────────┬─────────┘                │
│             │                       │                            │
│             │                       │                            │
│  ┌──────────┴───────────┐  ┌───────┴──────────┐                │
│  │  LiveKit Ingress     │  │ Pulse Control    │                │
│  │  (RTMP Input/OBS)    │  │ Plane (API)      │                │
│  │  Port: 1935          │  │ Port: 8081       │                │
│  └──────────────────────┘  └──────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Pulse APIs
                              ▼
                  ┌──────────────────────┐
                  │   WedLive App        │
                  │   (Your Wedding      │
                  │    Platform)         │
                  └──────────────────────┘
```

---

## Features Pulse Provides (Complete List)

### 1. ✅ Live Streaming (WebRTC via LiveKit)
**What it does:**
- Real-time video/audio streaming
- Multi-party video rooms (like Zoom)
- Low latency (<500ms)
- Automatic quality adaptation
- Screen sharing support
- Chat/data channels

**WedLive Use Case:**
- Wedding guests join live stream
- Host streams from mobile/browser
- Multiple camera angles (if premium)
- Real-time chat between guests

**API Endpoints:**
- `POST /v1/tokens/create` - Generate room access tokens
- `GET /v1/rooms/{room_name}` - Get room info
- `GET /v1/rooms/{room_name}/participants` - List participants

---

### 2. ✅ Recording (Pulse Egress)
**What it does:**
- Automatic recording to MP4/WebM
- Records entire room (composite)
- Records individual tracks
- Uploads to storage automatically
- Multiple quality presets

**WedLive Use Case:**
- Record entire wedding ceremony
- Save to Cloudflare R2
- Mirror to Telegram CDN (free delivery)
- Permanent wedding archive

**API Endpoints:**
- `POST /v1/egress/room` - Start room recording
- `POST /v1/egress/track` - Record specific track
- `GET /v1/egress/{egress_id}` - Get recording status
- `POST /v1/egress/{egress_id}/stop` - Stop recording
- `GET /v1/recordings/{recording_id}` - Get recording URLs

**Recording Output:**
```json
{
  "egress_id": "EG_abc123",
  "status": "active",
  "recording_urls": {
    "r2": "https://pub-xyz.r2.dev/wedding_123.mp4",
    "telegram_cdn": "https://t.me/file/wedding_123.mp4",
    "streaming_url": "https://cdn.wedlive.com/wedding_123/playlist.m3u8"
  },
  "duration": 3600,
  "file_size": 2147483648
}
```

---

### 3. ✅ RTMP Ingress (for OBS/encoders)
**What it does:**
- Accept RTMP streams from external encoders
- Professional videographer support
- OBS Studio integration
- Hardware encoder support (Teradek, LiveU)

**WedLive Use Case:**
- Professional wedding videographer streams via OBS
- Multi-camera professional setup
- Higher quality than mobile streaming
- Professional audio equipment

**API Endpoints:**
- `POST /v1/ingress/rtmp` - Create RTMP ingress
- `GET /v1/ingress/{ingress_id}` - Get ingress details
- `DELETE /v1/ingress/{ingress_id}` - Delete ingress

**Response:**
```json
{
  "ingress_id": "IN_xyz789",
  "rtmp_url": "rtmp://ingress.pulse.com/live",
  "stream_key": "sk_abc123def456",
  "room_name": "wedding_smith_jones",
  "status": "ready"
}
```

---

### 4. ✅ YouTube Live Streaming (via Pulse Egress)
**What it does:**
- Stream to YouTube Live (and Facebook, Twitch)
- RTMP output to any destination
- Simultaneous multi-platform streaming
- Professional encoding (H.264 1080p 60fps)

**WedLive Use Case:**
- Stream wedding to YouTube channel
- Family members watch on YouTube
- Permanent YouTube recording
- Wide public reach

**API Endpoints:**
- `POST /v1/egress/stream` - Start RTMP stream

**Request:**
```json
{
  "room_name": "wedding_123",
  "stream": {
    "protocol": "rtmp",
    "urls": [
      "rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY"
    ]
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
```

**Supported Platforms:**
- ✅ YouTube Live
- ✅ Facebook Live
- ✅ Twitch
- ✅ Custom RTMP servers

---

### 5. ✅ Multi-Camera Switching
**What Pulse provides:**
- Multiple participants in same room
- Selective subscription (choose which camera to view)
- Layout composition (grid, spotlight, etc.)

**WedLive Implementation:**
- Add multiple cameras to wedding room
- Switch active camera via API
- Compose final output for viewers
- Record composed stream

**Status:** Your current WedLive already has multi-camera implemented using NGINX+FFmpeg. With Pulse:
- **Keep:** Multi-camera business logic
- **Update:** Use LiveKit rooms instead of RTMP
- **Benefit:** No FFmpeg management needed

---

### 6. ✅ Storage Management (Cloudflare R2 + Telegram CDN)
**What Pulse provides:**
- Automatic upload to Cloudflare R2
- Optional mirror to Telegram CDN (FREE bandwidth)
- 90-day retention (configurable)
- Dual storage for reliability

**WedLive Storage Strategy:**
```
┌─────────────────────────────────────────────────────────┐
│  PULSE STORAGE (Separate Account)                       │
│  - Wedding stream recordings                             │
│  - Live session videos                                   │
│  - Managed by Pulse Egress                              │
│  R2: pulse_recordings/                                  │
│  Telegram: @pulse_cdn_bot                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  WEDLIVE STORAGE (Separate Account)                     │
│  - Wedding photo galleries                               │
│  - Guest uploaded photos/videos                          │
│  - Non-live content                                      │
│  R2: wedlive_galleries/                                 │
│  Telegram: @wedlive_cdn_bot                             │
└─────────────────────────────────────────────────────────┘
```

**Cost Breakdown:**
- Cloudflare R2: $0.015/GB/month (storage)
- Cloudflare R2 Egress: $0/GB (FREE!)
- Telegram CDN: $0/GB (FREE!)
- Total: ~$10-20/month for 100 weddings

---

### 7. ✅ Token Generation & Access Control
**What Pulse provides:**
- JWT token generation
- Room-based permissions
- Participant identity management
- Time-limited access

**WedLive Use:**
```python
# Generate token for wedding guest
token_data = pulse_service.generate_stream_token(
    room_name="wedding_smith_2025",
    participant_name="John Doe",
    participant_id="user_123",
    metadata={
        "is_host": False,
        "can_publish": False,  # Guest can't stream
        "can_subscribe": True,  # Guest can watch
        "wedding_id": "wedding_123"
    }
)
```

---

### 8. ❌ Multi-Camera Switching (LiveKit Native)
**Status:** Pulse provides the infrastructure, but WedLive needs to implement the logic

**What LiveKit Provides:**
- Multiple participants in room
- Selective track subscription
- Layout composition APIs

**What WedLive Must Implement:**
- Camera management UI
- Active camera selection
- Composition service (already have FFmpeg version)
- WebSocket notifications

**Migration Strategy:**
- **Option A:** Keep current NGINX+FFmpeg multi-camera implementation
- **Option B:** Migrate to LiveKit-native multi-camera (use `ParticipantTrackPublication` APIs)
- **Recommendation:** Option A initially (less work), Option B long-term (more scalable)

---

### 9. ❌ Storage NOT Provided by Pulse (WedLive must handle separately)
**What WedLive must handle:**
- Photo gallery uploads (non-live)
- Wedding templates/themes
- User profile images
- Wedding invitations/documents

**Solution:** WedLive uses separate Cloudflare R2 + Telegram CDN accounts

---

## Integration Strategy: What WedLive Should Use from Pulse

### **Recommended Integration (Full Replacement)**

```
✅ USE PULSE FOR:
  1. Live streaming (WebRTC) - Replace custom RTMP
  2. Recording - Replace current recording service
  3. RTMP ingress - Replace NGINX RTMP for OBS support
  4. YouTube streaming - Use Pulse Egress RTMP output
  5. Token generation - Use Pulse API instead of custom logic

❌ REMOVE FROM WEDLIVE:
  1. Custom WebRTC implementation
  2. RTMP server setup (NGINX RTMP modules)
  3. Custom video encoding/transcoding
  4. Custom token generation logic
  5. Custom CDN management for streams

✅ KEEP IN WEDLIVE:
  1. Wedding management (create/edit/delete)
  2. User authentication (login/register)
  3. Photo galleries (use separate storage)
  4. Payment integration
  5. Guest features (RSVP, messages)
  6. Business logic (wedding workflows)
  7. UI/UX components

⚠️ UPDATE IN WEDLIVE:
  1. Stream models (store Pulse references)
  2. API endpoints (call Pulse instead of custom code)
  3. Frontend components (use LiveKit SDK)
  4. Database schema (simplified)
```

---

## Multi-Camera Strategy

### Current WedLive Multi-Camera (NGINX + FFmpeg)
```
Camera 1 (RTMP) ──┐
Camera 2 (RTMP) ──┤─→ NGINX RTMP ──→ FFmpeg Composer ──→ HLS Output
Camera 3 (RTMP) ──┘
```

### With Pulse Integration (Two Options)

**Option A: Hybrid (Recommended for Phase 1)**
```
Camera 1 (WebRTC) ──┐
Camera 2 (WebRTC) ──┤─→ LiveKit Room ──→ FFmpeg Composer ──→ HLS Output
Camera 3 (WebRTC) ──┘
```
- Keep current multi-camera switching logic
- Use LiveKit instead of RTMP
- Keep FFmpeg composition
- Less migration work

**Option B: Full LiveKit (Long-term)**
```
Camera 1 (WebRTC) ──┐
Camera 2 (WebRTC) ──┤─→ LiveKit Room ──→ LiveKit Egress ──→ Composed Recording
Camera 3 (WebRTC) ──┘
```
- Use LiveKit's native track selection
- Use Egress for composition
- Remove FFmpeg dependency
- More scalable, less infrastructure

---

## Cost Comparison

### Current WedLive Infrastructure
```
Component                     Monthly Cost
──────────────────────────────────────────
VPS (4 vCPU, 8GB RAM)        $40
NGINX RTMP Setup             $0 (self-hosted)
FFmpeg Processing            Included in VPS
MongoDB                      $15
Storage (current)            $20
Domain/SSL                   $5
──────────────────────────────────────────
TOTAL                        $80/month
```

### With Pulse Integration
```
Component                     Monthly Cost
──────────────────────────────────────────
Pulse Platform Access        $50-100 (API fees)
WedLive VPS (smaller)        $20 (less CPU needed)
MongoDB                      $15
WedLive Storage (R2)         $20
Pulse Storage (R2)           $10
Telegram CDN                 $0 (FREE!)
Domain/SSL                   $5
──────────────────────────────────────────
TOTAL                        $120-170/month
```

**Trade-offs:**
- 📈 +$40-90/month cost increase
- ✅ Zero infrastructure maintenance
- ✅ YouTube Live out of box
- ✅ Professional RTMP ingress
- ✅ Automatic scaling
- ✅ Built-in redundancy

---

## Recommended Integration Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Setup Pulse platform credentials
- [ ] Create `pulse_service.py` in WedLive backend
- [ ] Test token generation
- [ ] Test basic room creation

### Phase 2: Replace Streaming (Week 3-4)
- [ ] Install LiveKit SDK in frontend
- [ ] Replace WebRTC components with LiveKit
- [ ] Update streaming endpoints to use Pulse
- [ ] Test basic wedding stream

### Phase 3: Recording (Week 5)
- [ ] Implement recording start/stop via Pulse
- [ ] Setup Pulse R2 storage
- [ ] Test recording upload
- [ ] Verify Telegram CDN delivery

### Phase 4: RTMP & YouTube (Week 6)
- [ ] Implement RTMP ingress for OBS
- [ ] Add YouTube streaming feature
- [ ] Test multi-platform streaming
- [ ] Verify recording quality

### Phase 5: Multi-Camera (Week 7-8)
- [ ] Decide on hybrid vs full LiveKit approach
- [ ] Update multi-camera logic
- [ ] Test camera switching
- [ ] Verify composed output

### Phase 6: Cleanup (Week 9)
- [ ] Remove old streaming code
- [ ] Update documentation
- [ ] Load testing
- [ ] Production deployment

---

## Summary: Features Provided by Pulse

| Feature | Pulse Provides | WedLive Must Implement | Status |
|---------|---------------|----------------------|--------|
| **Live Streaming (WebRTC)** | ✅ Full infrastructure | UI components, business logic | Use Pulse |
| **Recording** | ✅ Automatic to storage | Start/stop controls, playback UI | Use Pulse |
| **RTMP Ingress (OBS)** | ✅ RTMP server, encoding | Setup UI, credentials management | Use Pulse |
| **YouTube Streaming** | ✅ RTMP output capability | YouTube key collection, UI | Use Pulse |
| **Multi-Camera** | ⚠️ Partial (room infrastructure) | Switching logic, composition | Hybrid approach |
| **Storage (Recordings)** | ✅ R2 + Telegram upload | File management UI | Use Pulse |
| **Storage (Galleries)** | ❌ Not provided | Full implementation needed | WedLive handles |
| **Token Generation** | ✅ Full API | Request logic, permissions | Use Pulse |
| **Access Control** | ✅ Token-based | User permissions logic | Use Pulse |
| **Analytics** | ⚠️ Basic metrics | Dashboard, detailed tracking | WedLive enhances |

---

## Final Recommendation

### Use Pulse For:
1. ✅ **Live Streaming** - Full replacement of custom WebRTC
2. ✅ **Recording** - Replace current recording service
3. ✅ **RTMP Ingress** - Enable professional videographer support
4. ✅ **YouTube Live** - Easy multi-platform streaming

### Keep Custom for Multi-Camera:
- **Phase 1:** Hybrid approach (LiveKit rooms + FFmpeg composition)
- **Phase 2:** Migrate to LiveKit-native composition

### Use Separate Storage for:
- Wedding photo galleries (non-live content)
- User uploads
- Templates and themes

---

**Next Steps:**
1. Get Pulse API credentials (or use mock for development)
2. Start with Phase 1 (Foundation)
3. Test token generation and basic streaming
4. Gradually migrate features
5. Keep existing multi-camera as-is initially

**Total Migration Time:** 8-10 weeks
**Effort Level:** Medium (mostly API integration)
**Benefits:** Professional features, less infrastructure, better scalability
