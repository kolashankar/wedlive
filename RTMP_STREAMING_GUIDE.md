# 🎥 RTMP Streaming Configuration Guide

## ✅ Stream Credentials Format

Your WedLive application now generates **dynamic RTMP credentials** using Stream.io's infrastructure:

### **Main Camera & Multi-Camera**

```
Server:     rtmp://<region>-rtmp.stream-io-video.com/live (Dynamic from Stream.io)
Stream Key: <JWT_Token> (Long alphanumeric authentication token)
```

**Example:**
```
Server:     rtmp://us-east-1-rtmp.stream-io-video.com/live
Stream Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic3RyZWFtZXJfMTIzNDU2Nzg5...
```

**Note:** The exact RTMP server URL is dynamically assigned by Stream.io based on your region and is automatically retrieved when you create a wedding event.

---

## 🎬 OBS Studio Configuration

### Step 1: Open OBS Studio Settings
1. Click **Settings** in the bottom right
2. Go to **Stream** tab

### Step 2: Configure Stream
1. **Service:** Select "Custom"
2. **Server:** Copy the full RTMP URL from your wedding dashboard (e.g., `rtmp://us-east-1-rtmp.stream-io-video.com/live`)
3. **Stream Key:** Copy the JWT token from your wedding dashboard (long alphanumeric string)

### Step 3: Start Streaming
1. Click **Start Streaming** in OBS
2. Your stream will appear on your wedding page
3. Viewers can watch via the playback URL

---

## 📋 Technical Details

### Stream Key Format
- **Type:** JWT (JSON Web Token)
- **Authentication:** Signed with Stream.io API secret
- **Expiration:** 24 hours by default
- **Total Length:** ~200-300 characters (varies)
- **Format:** Standard JWT (header.payload.signature)

### RTMP Server
- **Protocol:** RTMP (not RTMPS)
- **URL:** Dynamic, assigned by Stream.io per call (e.g., `rtmp://us-east-1-rtmp.stream-io-video.com/live`)
- **Port:** Default RTMP port (1935)
- **Region-Based:** Automatically assigned based on geographic location

### Backend Implementation
- RTMP URLs and JWT tokens are generated during wedding creation via Stream.io API
- Each wedding gets unique credentials with a unique call ID
- JWT tokens authenticate the stream with Stream.io servers
- Credentials are stored in MongoDB for persistence
- Auto-loaded in wedding management dashboard
- SDK Fix Applied: Manually constructs correct protobuf messages to work with stream-video==0.0.6

---

## 🔍 Verification

To verify your stream credentials are working:

1. **Check Dashboard:** Login → My Weddings → Manage → Stream tab
2. **Main Camera Section:** Should display:
   - Server URL: Dynamic RTMP URL (e.g., `rtmp://us-east-1-rtmp.stream-io-video.com/live`)
   - Stream Key: Long JWT token (starts with `eyJ...`)
3. **Multi-Camera Section:** Each additional camera has unique JWT credentials with the same RTMP server

---

## ❗ Troubleshooting

### "Failed to connect to server"
- ✅ Copy the RTMP server URL exactly from your dashboard (it should be dynamic, not a hardcoded URL)
- ✅ Check your internet connection
- ✅ Ensure firewall allows outbound RTMP (port 1935)
- ✅ Verify the RTMP URL includes the region (e.g., `us-east-1-rtmp`)

### "Invalid connection parameters"
- ✅ Copy stream key (JWT token) exactly from dashboard - it's a very long string
- ✅ Ensure the entire JWT token is copied (no truncation, no extra spaces)
- ✅ JWT tokens expire after 24 hours - create a new wedding if token is expired
- ✅ Do not modify or edit the JWT token in any way

### Stream key not showing
- ✅ Refresh the wedding management page
- ✅ Check you're logged in as wedding creator
- ✅ Verify wedding was created successfully

---

## 🎯 Example Configuration

**Call ID:** `550e8400-e29b-41d4-a716-446655440000`

**Generated Credentials:**
```
Server:     rtmp://us-east-1-rtmp.stream-io-video.com/live
Stream Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic3RyZWFtZXJfNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwIiwiZXhwIjoxNzM0NTYyODAwLCJpYXQiOjE3MzQ0NzY0MDB9.abcd1234efgh5678ijkl9012mnop3456
```

**OBS Settings Screenshot:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ Service:     Custom                                                  │
│ Server:      rtmp://us-east-1-rtmp.stream-io-video.com/live        │
│ Stream Key:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lk...  │
│                                                                      │
│ Use authentication: ☐ (unchecked)                                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📞 Support

If you encounter any issues:
1. Check backend logs: `tail -f /var/log/supervisor/backend.out.log`
2. Verify database contains stream credentials
3. Restart backend: `sudo supervisorctl restart backend`

---

**Last Updated:** December 2024
**Status:** ✅ Fixed - Dynamic RTMP URLs with JWT Authentication
**SDK Version:** stream-video==0.0.6 (with protobuf fix applied)
