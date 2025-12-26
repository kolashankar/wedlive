# WedLive Event System Documentation

## Overview
This document describes all real-time events and webhooks used throughout the WedLive platform. The application uses Socket.IO for real-time communication and custom webhooks for external integrations.

---

## 1. Socket.IO Real-Time Events

### Server-Side Events (Emitted by Backend)

#### 1.1 Connection Events

| Event | Description | Payload | Trigger Condition |
|-------|-------------|---------|-------------------|
| `connected` | Sent when client successfully connects to Socket.IO server | `{ status: 'Connected to WedLive' }` | On client connection |
| `disconnect` | Client disconnects from server | N/A | When client disconnects |

**Files:**
- `backend/app/services/socket_service.py` (lines 23, 26)

---

#### 1.2 Viewer Management Events

| Event | Description | Payload | Trigger Condition |
|-------|-------------|---------|-------------------|
| `viewer_count` | Updates the current viewer count for a wedding | `{ wedding_id: string, count: number }` | When viewer joins/leaves wedding room |
| `viewer_joined` | Notifies all viewers when someone joins | `{ wedding_id: string, viewer_name: string, count: number }` | New viewer joins wedding stream |
| `viewer_left` | Notifies all viewers when someone leaves | `{ wedding_id: string, count: number }` | Viewer leaves wedding stream |

**Files:**
- `backend/app/services/socket_service.py` (lines 36, 61, 67, 94)

**Usage Example:**
```javascript
// Frontend listens to viewer count updates
socket.on('viewer_count', (data) => {
  console.log(`Wedding ${data.wedding_id} has ${data.count} viewers`);
});
```

---

#### 1.3 Chat & Interaction Events

| Event | Description | Payload | Trigger Condition |
|-------|-------------|---------|-------------------|
| `new_message` | Broadcasts new chat message to all viewers | `{ message_id: string, wedding_id: string, user_name: string, message: string, timestamp: string }` | User sends chat message |
| `new_reaction` | Broadcasts emoji reaction to all viewers | `{ reaction_id: string, wedding_id: string, user_name: string, emoji: string, timestamp: string }` | User sends emoji reaction |

**Files:**
- `backend/app/services/socket_service.py` (lines 122, 145)

**Supported Reactions:** ❤️, 👏, 😂, 😮, 🎉

---

#### 1.4 Multi-Camera Events

| Event | Description | Payload | Trigger Condition |
|-------|-------------|---------|-------------------|
| `camera_switched` | Notifies viewers when active camera changes | `{ wedding_id: string, camera_id: string, camera_name: string }` | Creator switches active camera view |

**Files:**
- `backend/app/services/socket_service.py` (line 174)

---

#### 1.5 Generic Broadcast Event

| Function | Description | Parameters | Usage |
|----------|-------------|------------|-------|
| `broadcast_to_wedding()` | Generic function to broadcast any event to all viewers in a wedding room | `wedding_id: str, event: str, data: dict` | Used for custom event broadcasting |

**Files:**
- `backend/app/services/socket_service.py` (line 187)

---

## 2. Webhook Events

### External Webhook Triggers

#### 2.1 Stream Lifecycle Webhooks

| Webhook Event | Description | Payload | Trigger Condition |
|---------------|-------------|---------|-------------------|
| `stream.started` | Triggered when a wedding stream goes live | `{ event: "stream.started", timestamp: string, wedding_id: string, title: string, bride_name: string, groom_name: string, rtmp_url: string, playback_url: string }` | Creator starts streaming |
| `stream.ended` | Triggered when a wedding stream ends | `{ event: "stream.ended", timestamp: string, wedding_id: string, title: string, bride_name: string, groom_name: string, duration: number, total_viewers: number }` | Creator stops streaming |

**Files:**
- `backend/app/services/webhook_service.py` (lines 117-127)
- `backend/app/routes/streams.py` (lines 99-108, 141-151)

**Configuration:**
- Webhooks are configured per user in the database
- HTTP POST requests sent to user-configured URLs
- Includes authentication signature in headers

---

#### 2.2 Razorpay Payment Webhooks

| Webhook Event | Description | Payload Source | Trigger Condition |
|---------------|-------------|----------------|-------------------|
| `payment.captured` | Razorpay notifies successful payment | Razorpay API | User completes payment |
| `subscription.charged` | Razorpay notifies subscription charge | Razorpay API | Monthly/yearly subscription payment |
| `subscription.cancelled` | Razorpay notifies subscription cancellation | Razorpay API | User cancels subscription |

**Files:**
- `backend/app/routes/subscriptions.py` (handles incoming webhooks)
- Backend receives and validates Razorpay webhook signatures

**Webhook URL:** `POST /api/subscriptions/webhook`

---

## 3. NGINX-RTMP Stream Events

### Stream Key Format

| Component | Description | Example |
|-----------|-------------|---------|
| **Main Camera** | Stream key for primary wedding camera | `live_{wedding_id}_{random_uuid}` → `live_wed123_4f51a0f9e1cc4020` |
| **Multi-Camera** | Stream key for additional camera angles | `live_{wedding_id}_camera_{camera_id}_{random_uuid}` → `live_wed123_camera_abc123_7d3e5a8b` |

**Files:**
- `backend/app/services/stream_service.py` (lines 22-42)

---

## 4. Frontend Socket.IO Client Events

### Client-Side Emitted Events

| Event | Description | Payload | Sent From |
|-------|-------------|---------|-----------|
| `join_wedding` | Client joins a wedding stream room | `{ wedding_id: string, viewer_name: string }` | Wedding viewer page |
| `leave_wedding` | Client leaves a wedding stream room | `{ wedding_id: string }` | When viewer navigates away |
| `send_message` | Client sends chat message | `{ wedding_id: string, message: string }` | Chat component |
| `send_reaction` | Client sends emoji reaction | `{ wedding_id: string, emoji: string }` | Reaction button click |
| `switch_camera` | Creator switches active camera | `{ wedding_id: string, camera_id: string }` | Multi-camera control panel |

**Files:**
- Frontend Socket.IO integration (if implemented)

---

## 5. Event Flow Diagrams

### Stream Start Flow
```
1. Creator clicks "Start Stream" → POST /api/streams/start
2. Backend updates wedding status to "live"
3. Backend triggers webhook → stream.started
4. Backend broadcasts to Socket.IO → broadcast_to_wedding()
5. All connected viewers receive live notification
```

### Viewer Join Flow
```
1. Viewer opens wedding page → Socket.IO connects
2. Viewer joins room → emit('join_wedding')
3. Backend increments viewer count
4. Backend broadcasts → emit('viewer_count')
5. All viewers see updated count
```

### Chat Message Flow
```
1. Viewer types message → emit('send_message')
2. Backend validates and saves message
3. Backend broadcasts → emit('new_message')
4. All viewers in room receive message
```

---

## 6. Configuration & Environment Variables

### Required for Events

| Variable | Description | Example | Used By |
|----------|-------------|---------|---------|
| `RTMP_SERVER_URL` | NGINX-RTMP server for broadcasting | `rtmp://localhost/live` | Stream service |
| `HLS_SERVER_URL` | HLS playback URL for viewers | `http://localhost:8080/hls` | Stream service |
| `RAZORPAY_WEBHOOK_SECRET` | Signature validation for webhooks | `whsec_***` | Subscription service |

---

## 7. Event Security

### Socket.IO Security
- All Socket.IO connections require valid wedding_id
- Viewer count tracking prevents spam/abuse
- Message rate limiting (if implemented)

### Webhook Security
- Razorpay webhooks validated with HMAC signature
- Custom webhooks include authentication headers
- Webhook URLs must use HTTPS in production

---

## 8. Testing Events

### Manual Testing

**Test Socket.IO Events:**
```bash
# Install wscat
npm install -g wscat

# Connect to Socket.IO
wscat -c "ws://localhost:8001/socket.io/?EIO=4&transport=websocket"

# Send join_wedding event
{"0":"42","1":["join_wedding",{"wedding_id":"test123","viewer_name":"TestUser"}]}
```

**Test Webhooks:**
```bash
# Simulate stream started webhook
curl -X POST http://localhost:8001/api/streams/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"wedding_id": "test123"}'
```

---

## 9. Event Monitoring

### Recommended Tools
- **Socket.IO Admin UI**: Monitor real-time connections
- **Webhook.site**: Test webhook delivery
- **Postman**: Test API endpoints triggering events

### Backend Logs
All events are logged in:
- `/var/log/supervisor/backend.out.log` - Standard output
- `/var/log/supervisor/backend.err.log` - Error logs

**Log Format:**
```
[2024-12-24 10:30:45] INFO: 🎥 Creating stream for wedding: wed123
[2024-12-24 10:30:45] INFO: ✅ STREAM CREATED SUCCESSFULLY
[2024-12-24 10:30:45] INFO: Broadcasting 'stream_started' to wedding room wed123
```

---

## 10. Future Event Enhancements

### Planned Events (Not Yet Implemented)
- `recording.started` - DVR recording begins
- `recording.completed` - DVR recording finished
- `quality.changed` - Stream quality adjustment
- `donation.received` - Live donation notification
- `poll.created` - Interactive poll for viewers
- `photo.uploaded` - New photo added to gallery

---

## Summary

**Total Events Implemented:** 11 Socket.IO events + 5 Webhook events

**Event Categories:**
- ✅ Connection Management (2 events)
- ✅ Viewer Tracking (3 events)  
- ✅ Chat & Reactions (2 events)
- ✅ Multi-Camera Control (1 event)
- ✅ Stream Lifecycle (2 webhooks)
- ✅ Payment Processing (3 webhooks)

**All events are compatible with self-hosted NGINX-RTMP streaming and do not require GetStream.io or any third-party streaming service.**
