# Multi-Camera Testing & Optimization Checklist

## Phase 5: Comprehensive Testing Protocol

### 5.1 Pre-Testing Setup

#### Prerequisites
- [ ] Backend service running on port 8001
- [ ] Frontend service running on port 3000
- [ ] MongoDB running and accessible
- [ ] NGINX-RTMP server running on port 1935 (RTMP) and 8080 (HLS)
- [ ] OBS Studio installed (for simulating camera streams)
- [ ] Premium wedding account created

#### Test Wedding Setup
```bash
# Create test wedding via API or UI
# Ensure the wedding has:
# - Premium plan enabled
# - Multi-camera feature available
# - At least 5 cameras configured
```

---

### 5.2 Camera Configuration Tests

#### Test 5.2.1: Add Multiple Cameras via UI
**Steps:**
1. Navigate to wedding management page
2. Go to "Multi-Camera Settings" tab
3. Add Camera 1: "Main Stage"
4. Add Camera 2: "Bride Entrance"
5. Add Camera 3: "Guest View"
6. Add Camera 4: "Detail Shots"
7. Add Camera 5: "Aerial View"

**Expected Results:**
- [ ] Each camera gets a unique stream key
- [ ] Cameras appear in the camera list
- [ ] Status shows "WAITING" for all cameras
- [ ] RTMP URLs are displayed correctly
- [ ] No duplicate stream keys generated

#### Test 5.2.2: Camera Status Updates
**Steps:**
1. Open OBS Studio instance 1
2. Configure RTMP stream with Camera 1 stream key
3. Start streaming from OBS
4. Observe camera status in UI

**Expected Results:**
- [ ] Camera status changes from "WAITING" to "LIVE"
- [ ] Status update appears within 3 seconds
- [ ] WebSocket notification received
- [ ] Other cameras remain in "WAITING" status
- [ ] Thumbnail generation starts (if configured)

---

### 5.3 Multi-Camera Switching Tests

#### Test 5.3.1: Basic Camera Switching
**Steps:**
1. Start streaming from all 5 OBS instances
2. Verify all cameras show "LIVE" status
3. Select Camera 1 as active
4. Wait 5 seconds, switch to Camera 2
5. Wait 5 seconds, switch to Camera 3
6. Wait 5 seconds, switch to Camera 4
7. Wait 5 seconds, switch to Camera 5

**Expected Results:**
- [ ] Active camera indicator updates immediately in UI
- [ ] Program output switches to selected camera
- [ ] Switch latency < 3 seconds for each switch
- [ ] No black screens during switch
- [ ] Smooth transitions between cameras
- [ ] Previous camera stream continues in preview (optional)

**Measurements:**
- Switch 1 latency: _____ seconds
- Switch 2 latency: _____ seconds
- Switch 3 latency: _____ seconds
- Switch 4 latency: _____ seconds
- Average latency: _____ seconds

#### Test 5.3.2: Rapid Camera Switching
**Steps:**
1. All 5 cameras streaming
2. Switch cameras every 2 seconds for 1 minute
3. Monitor for errors or degradation

**Expected Results:**
- [ ] All switches complete successfully
- [ ] No memory leaks observed
- [ ] FFmpeg processes remain stable
- [ ] No orphaned processes
- [ ] CPU usage remains reasonable (<80%)

#### Test 5.3.3: Switch to Offline Camera (Edge Case)
**Steps:**
1. Start 5 cameras streaming
2. Make Camera 3 active
3. Stop OBS stream for Camera 3
4. Wait for timeout
5. Observe auto-fallback behavior

**Expected Results:**
- [ ] System detects Camera 3 disconnect
- [ ] Auto-switches to another live camera
- [ ] Notification sent to admin
- [ ] No blank screen shown to viewers
- [ ] Fallback occurs within 5 seconds

---

### 5.4 Viewer Experience Tests

#### Test 5.4.1: Single Viewer
**Steps:**
1. Open viewer page in incognito browser
2. Verify live stream loads
3. Watch for 5 minutes during camera switches

**Expected Results:**
- [ ] Stream loads within 3 seconds
- [ ] Video quality is good (720p+)
- [ ] Audio syncs with video
- [ ] Camera switches are smooth
- [ ] No buffering or stuttering
- [ ] Multi-camera badge displayed

#### Test 5.4.2: Multiple Concurrent Viewers
**Steps:**
1. Open viewer page in 10 different browsers/tabs
2. All viewers watch simultaneously
3. Perform camera switches
4. Monitor for 10 minutes

**Expected Results:**
- [ ] All 10 viewers stream successfully
- [ ] Viewer count updates correctly
- [ ] No performance degradation
- [ ] All viewers see same content (synchronized)
- [ ] Switches appear smoothly for all viewers

#### Test 5.4.3: Viewer on Mobile Device
**Steps:**
1. Open viewer page on iOS device
2. Open viewer page on Android device
3. Test landscape and portrait modes
4. Watch during camera switches

**Expected Results:**
- [ ] Stream plays on iOS
- [ ] Stream plays on Android
- [ ] Orientation changes handled gracefully
- [ ] Touch controls work properly
- [ ] Multi-camera indicator visible

---

### 5.5 Recording Tests

#### Test 5.5.1: Record Composed Stream
**Steps:**
1. Start multi-camera stream with 3 active cameras
2. Start recording via UI
3. Switch between cameras 5 times
4. Record for 5 minutes
5. Stop recording
6. Download and review recording

**Expected Results:**
- [ ] Recording starts successfully
- [ ] All camera switches captured in recording
- [ ] Recording file generated (MP4 format)
- [ ] Video quality matches live stream
- [ ] Audio quality is clear
- [ ] File size reasonable (not corrupted)
- [ ] Playback smooth with no errors

#### Test 5.5.2: Auto-Record on Stream Start
**Steps:**
1. Enable auto-record in wedding settings
2. Start streaming from Camera 1
3. Add Camera 2 and switch to it
4. End stream
5. Verify recording available

**Expected Results:**
- [ ] Recording starts automatically with stream
- [ ] Multi-camera switches included
- [ ] Recording stops with stream
- [ ] Recording URL saved to wedding
- [ ] Recording accessible from viewer page

---

### 5.6 Performance & Optimization Tests

#### Test 5.6.1: CPU Usage Monitoring
**Steps:**
1. Start 5 camera streams
2. Monitor CPU usage with `htop` or `top`
3. Perform 10 camera switches
4. Record peak CPU usage

**Metrics:**
- Idle CPU: _____% 
- 5 cameras streaming CPU: _____%
- During camera switch CPU: _____%
- Peak CPU: _____%

**Expected:**
- [ ] CPU usage < 80% sustained
- [ ] No CPU spikes > 95%
- [ ] CPU returns to baseline after switch

#### Test 5.6.2: Memory Usage Monitoring
**Steps:**
1. Check memory before starting
2. Start 5 cameras
3. Run for 30 minutes with switches
4. Monitor for memory leaks

**Metrics:**
- Initial memory: _____ MB
- After 5 cameras: _____ MB
- After 30 minutes: _____ MB
- Memory leak: _____ MB/hour

**Expected:**
- [ ] Memory usage stable
- [ ] No significant memory leaks
- [ ] Memory usage < 2GB total

#### Test 5.6.3: Latency Optimization
**Steps:**
1. Measure end-to-end latency
2. Time from camera action to viewer seeing it
3. Test with optimized HLS settings

**Metrics:**
- Camera to HLS latency: _____ seconds
- HLS to viewer latency: _____ seconds
- Total latency: _____ seconds

**Target:**
- [ ] Total latency < 10 seconds
- [ ] Switching latency < 3 seconds

---

### 5.7 Error Handling & Recovery Tests

#### Test 5.7.1: FFmpeg Process Crash Recovery
**Steps:**
1. Start composition with Camera 1
2. Manually kill FFmpeg process: `kill -9 <PID>`
3. Observe system behavior
4. Trigger recovery via health check

**Expected Results:**
- [ ] System detects process crash
- [ ] Auto-recovery triggered (or manual recovery works)
- [ ] Composition restarted successfully
- [ ] No data loss
- [ ] Viewers experience minimal disruption

#### Test 5.7.2: Camera Disconnect/Reconnect
**Steps:**
1. All 5 cameras streaming
2. Stop Camera 2 (active camera)
3. Wait 10 seconds
4. Restart Camera 2
5. Switch back to Camera 2

**Expected Results:**
- [ ] System detects disconnect within 5 seconds
- [ ] Auto-switches to backup camera
- [ ] Camera 2 reconnection detected
- [ ] Can manually switch back to Camera 2
- [ ] No composition restart needed

#### Test 5.7.3: Network Interruption Simulation
**Steps:**
1. Start streaming
2. Simulate network drop (disconnect WiFi/Ethernet)
3. Restore network after 10 seconds
4. Observe recovery

**Expected Results:**
- [ ] Stream pauses gracefully
- [ ] Reconnection attempted automatically
- [ ] Stream resumes when network restored
- [ ] No manual intervention required
- [ ] Viewer sees buffering indicator

---

### 5.8 Database & State Management Tests

#### Test 5.8.1: Camera Switch Logging
**Steps:**
1. Perform 10 camera switches
2. Query database for switch history
3. Verify all switches logged

**Expected Results:**
- [ ] All 10 switches recorded in `camera_switches` array
- [ ] Timestamps accurate
- [ ] From/To camera IDs correct
- [ ] Switch order preserved

#### Test 5.8.2: Active Camera Persistence
**Steps:**
1. Set Camera 3 as active
2. Restart backend service
3. Check active camera in UI

**Expected Results:**
- [ ] Camera 3 still active after restart
- [ ] Composition state restored
- [ ] No camera reset to default

---

### 5.9 API Endpoint Tests

#### Test 5.9.1: Switch Camera API
```bash
# Test camera switching via API
curl -X POST "http://localhost:8001/api/streams/camera/{wedding_id}/{camera_id}/switch" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Expected:**
- [ ] Returns 200 status
- [ ] Switch executes successfully
- [ ] Response includes active camera details

#### Test 5.9.2: Get Active Camera API
```bash
curl -X GET "http://localhost:8001/api/streams/camera/{wedding_id}/active" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- [ ] Returns 200 status
- [ ] Correct active camera returned
- [ ] Camera details complete

#### Test 5.9.3: Health Check API
```bash
curl -X GET "http://localhost:8001/api/streams/camera/{wedding_id}/health" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- [ ] Returns composition health status
- [ ] Includes process PID
- [ ] Shows healthy/unhealthy state

---

### 5.10 Security Tests

#### Test 5.10.1: Authorization Checks
**Steps:**
1. Try to switch camera without authentication
2. Try to switch camera with different user's token
3. Try to access admin endpoints as viewer

**Expected Results:**
- [ ] 401 Unauthorized without token
- [ ] 403 Forbidden with wrong user
- [ ] Admin endpoints protected
- [ ] Viewer endpoints remain public

#### Test 5.10.2: Stream Key Security
**Steps:**
1. Generate stream keys for multiple cameras
2. Verify uniqueness
3. Test stream key in RTMP URL

**Expected Results:**
- [ ] All stream keys unique
- [ ] Keys sufficiently long (32+ chars)
- [ ] Invalid keys rejected by NGINX
- [ ] Keys not exposed to public viewers

---

### 5.11 Load Testing

#### Test 5.11.1: Sustained Load
**Steps:**
1. Stream 5 cameras continuously
2. 10 concurrent viewers
3. Camera switch every 30 seconds
4. Run for 2 hours

**Expected Results:**
- [ ] System remains stable
- [ ] No performance degradation
- [ ] No memory leaks
- [ ] All switches successful
- [ ] Viewer experience consistent

---

## Testing Summary

### Pass/Fail Criteria
- **PASS**: All critical tests (marked 🔴) pass
- **ACCEPTABLE**: Minor issues in non-critical tests (marked 🟡)
- **FAIL**: Any critical test fails or major performance issues

### Critical Tests (Must Pass)
- 5.2.1 Add Multiple Cameras
- 5.3.1 Basic Camera Switching
- 5.4.1 Single Viewer
- 5.5.1 Record Composed Stream
- 5.6.1 CPU Usage < 80%
- 5.7.1 FFmpeg Crash Recovery

### Performance Targets
- Switch latency: < 3 seconds ✅
- Total stream latency: < 10 seconds ✅
- CPU usage: < 80% sustained ✅
- Memory usage: < 2GB ✅
- Concurrent viewers: 10+ ✅

---

## Issues & Resolutions

| Test | Issue | Resolution | Status |
|------|-------|------------|--------|
| 5.3.1 | Switch latency 5s | Optimized HLS settings | ✅ Fixed |
| | | | |

---

## Final Sign-Off

- [ ] All critical tests passed
- [ ] Performance targets met
- [ ] No blocking issues
- [ ] Ready for production

**Tested by:** _____________
**Date:** _____________
**Approved by:** _____________
