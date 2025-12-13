# Live Control System - Manual Testing Checklist
**Phase 8: Complete Flow Verification**

## 📋 Pre-Test Setup

### Environment Check
- [ ] Backend running on port 8001
  ```bash
  curl http://localhost:8001/health
  ```
- [ ] Frontend running on port 3000
  ```bash
  curl http://localhost:3000
  ```
- [ ] NGINX RTMP running on port 1935
  ```bash
  sudo netstat -tulpn | grep :1935
  ```
- [ ] NGINX HLS server running on port 8080
  ```bash
  curl http://localhost:8080/health
  ```
- [ ] MongoDB running
  ```bash
  sudo systemctl status mongod
  ```
- [ ] OBS Studio installed
  ```bash
  obs --version
  ```

### Test Data Preparation
- [ ] Create test user account
- [ ] Create test wedding event
- [ ] Note wedding ID for testing
- [ ] Have OBS Studio configured and ready

---

## 🧪 Test Scenario 1: Complete Happy Path
**Objective:** Test entire flow from Go Live to End

### Setup (5 min)
- [ ] 1. Log in as creator
- [ ] 2. Navigate to wedding created above
- [ ] 3. Go to Manage Wedding page
- [ ] 4. Open wedding in new tab as viewer (guest)

### Go Live Phase (2 min)
- [ ] 5. Click "Go Live" button on Manage page
- [ ] 6. Verify status badge changes to "WAITING FOR OBS" with animation
- [ ] 7. Verify RTMP credentials are displayed:
  - [ ] RTMP URL shown
  - [ ] Stream Key shown
  - [ ] Copy buttons work
- [ ] 8. Verify viewer tab shows "Not Started Yet" message

### OBS Streaming Phase (5 min)
- [ ] 9. Open OBS Studio
- [ ] 10. Go to Settings → Stream
- [ ] 11. Service: Custom
- [ ] 12. Copy RTMP URL to Server field
- [ ] 13. Copy Stream Key to Stream Key field
- [ ] 14. Click OK to save settings
- [ ] 15. Add a video source to OBS scene
- [ ] 16. Click "Start Streaming" in OBS
- [ ] 17. Wait 5 seconds
- [ ] 18. Verify status changes to "LIVE" on Manage page
- [ ] 19. Verify "LIVE NOW" badge appears with red color and animation
- [ ] 20. Verify recording metrics appear (duration, pause count)

### Viewer Experience - Live (2 min)
- [ ] 21. Switch to viewer tab
- [ ] 22. Verify "LIVE NOW" badge displayed with celebration message
- [ ] 23. Verify video player shows HLS stream
- [ ] 24. Verify stream is playing smoothly
- [ ] 25. Check latency (should be < 15 seconds)

### Pause Test 1: OBS Stop (3 min)
- [ ] 26. In OBS, click "Stop Streaming"
- [ ] 27. Wait 5 seconds
- [ ] 28. Verify status changes to "PAUSED" on Manage page
- [ ] 29. Verify pause count increments to 1
- [ ] 30. Verify recording continues message displayed
- [ ] 31. Switch to viewer tab
- [ ] 32. Verify "Stream Paused - We'll Be Right Back!" message
- [ ] 33. Verify heart animation showing

### Resume Test 1: OBS Restart (3 min)
- [ ] 34. In OBS, click "Start Streaming" again
- [ ] 35. Wait 5 seconds
- [ ] 36. Verify status changes back to "LIVE"
- [ ] 37. Verify stream duration continues from previous value
- [ ] 38. Switch to viewer tab
- [ ] 39. Verify "LIVE NOW" badge returns
- [ ] 40. Verify video playback resumes

### Pause Test 2: Manual Pause (2 min)
- [ ] 41. With OBS still streaming, click "Pause Live" button
- [ ] 42. Verify status changes to "PAUSED"
- [ ] 43. Verify pause count increments to 2
- [ ] 44. Verify OBS connection stays active (doesn't disconnect)
- [ ] 45. Switch to viewer tab
- [ ] 46. Verify pause message displayed

### Resume Test 2: Manual Resume (2 min)
- [ ] 47. Click "Resume Live" button on Manage page
- [ ] 48. Verify status changes back to "LIVE"
- [ ] 49. Switch to viewer tab
- [ ] 50. Verify video playback resumes

### End Live Phase (3 min)
- [ ] 51. Click "End Live (Final)" button
- [ ] 52. Verify confirmation dialog appears with warning
- [ ] 53. Read warning: "This action is PERMANENT"
- [ ] 54. Click "Yes, End Live Stream"
- [ ] 55. Wait 5 seconds
- [ ] 56. Verify status changes to "ENDED"
- [ ] 57. Verify completion message displayed
- [ ] 58. Verify "Go Live" button is no longer available
- [ ] 59. Verify message says "This wedding has already ended"

### Recording Verification (5 min)
- [ ] 60. Switch to viewer tab
- [ ] 61. Verify "Live Stream Has Ended" message
- [ ] 62. Verify "Recording Available" badge
- [ ] 63. Wait 2-3 minutes for recording finalization
- [ ] 64. Refresh page
- [ ] 65. Verify recorded video player appears
- [ ] 66. Verify video plays from beginning
- [ ] 67. Verify total duration matches stream duration

### Status Persistence (2 min)
- [ ] 68. Close and reopen browser
- [ ] 69. Navigate back to wedding
- [ ] 70. Verify status is still "ENDED"
- [ ] 71. Verify recording is still available

**Scenario 1 Result:** ☐ PASS ☐ FAIL

**Notes:**
```
[Add any issues or observations here]
```

---

## 🧪 Test Scenario 2: Manual Pause/Resume Control
**Objective:** Test host manual controls while OBS streaming

### Setup (2 min)
- [ ] 1. Create new test wedding
- [ ] 2. Go Live and start OBS streaming
- [ ] 3. Wait for LIVE status

### Manual Control Tests (5 min)
- [ ] 4. Click "Pause Live" while OBS streaming
- [ ] 5. Verify status = PAUSED
- [ ] 6. Verify viewer sees pause message
- [ ] 7. Verify OBS stays connected (no disconnect)
- [ ] 8. Verify stream metrics still displayed
- [ ] 9. Click "Resume Live"
- [ ] 10. Verify status = LIVE
- [ ] 11. Verify viewer sees video
- [ ] 12. Verify pause count incremented

**Scenario 2 Result:** ☐ PASS ☐ FAIL

---

## 🧪 Test Scenario 3: Multiple Pause/Resume Cycles
**Objective:** Test recording continuity through multiple pauses

### Setup (2 min)
- [ ] 1. Create new test wedding
- [ ] 2. Go Live and start OBS streaming

### Multiple Cycles (10 min)
- [ ] 3. Stream for 30 seconds
- [ ] 4. Stop OBS (pause 1)
- [ ] 5. Wait 10 seconds
- [ ] 6. Start OBS (resume 1)
- [ ] 7. Stream for 30 seconds
- [ ] 8. Click "Pause Live" (pause 2)
- [ ] 9. Wait 10 seconds
- [ ] 10. Click "Resume Live" (resume 2)
- [ ] 11. Stream for 30 seconds
- [ ] 12. Stop OBS (pause 3)
- [ ] 13. Wait 10 seconds
- [ ] 14. Start OBS (resume 3)
- [ ] 15. Stream for 30 seconds
- [ ] 16. Verify pause_count = 3
- [ ] 17. Click "End Live"

### Recording Check (5 min)
- [ ] 18. Wait for recording finalization
- [ ] 19. Verify single recording file exists
- [ ] 20. Play recording from start
- [ ] 21. Verify all segments are included
- [ ] 22. Verify no gaps or corruption

**Scenario 3 Result:** ☐ PASS ☐ FAIL

---

## 🧪 Test Scenario 4: Error Handling & Invalid Transitions
**Objective:** Verify system prevents invalid operations

### Invalid Transitions (10 min)
- [ ] 1. Create new wedding (IDLE state)
- [ ] 2. Try to click "Resume Live" → Should show error or be disabled
- [ ] 3. Try to click "Pause Live" → Should show error or be disabled
- [ ] 4. Try to click "End Live" → Should show error or be disabled
- [ ] 5. Click "Go Live" (transition to WAITING)
- [ ] 6. Try to click "Go Live" again → Should be disabled/hidden
- [ ] 7. Try to click "Resume" → Should fail (not paused)
- [ ] 8. Start OBS to transition to LIVE
- [ ] 9. Stop OBS to transition to PAUSED
- [ ] 10. Try to click "Go Live" → Should be disabled
- [ ] 11. End the live stream
- [ ] 12. Try to click "Go Live" → Should show "already ended" message
- [ ] 13. Verify can_go_live = false in status

### Invalid Stream Keys (5 min)
- [ ] 14. Create new wedding and Go Live
- [ ] 15. In OBS, use incorrect stream key
- [ ] 16. Try to start streaming
- [ ] 17. Verify connection is rejected
- [ ] 18. Check NGINX logs for rejection
- [ ] 19. Verify status remains WAITING

**Scenario 4 Result:** ☐ PASS ☐ FAIL

---

## 🧪 Test Scenario 5: Viewer Experience Across All States
**Objective:** Verify viewer UI updates correctly for all statuses

### Status Messages (10 min)
- [ ] 1. Join wedding as guest when status = IDLE
- [ ] 2. Verify "Not Started Yet" message with clock icon
- [ ] 3. Verify no video player shown
- [ ] 4. Host goes live (status = WAITING)
- [ ] 5. Refresh viewer page
- [ ] 6. Verify still shows "Not Started Yet"
- [ ] 7. OBS starts streaming (status = LIVE)
- [ ] 8. Wait 5 seconds for auto-update
- [ ] 9. Verify "LIVE NOW" badge appears
- [ ] 10. Verify celebration message "🎊 The Ceremony is Live! 🎊"
- [ ] 11. Verify video player shows stream
- [ ] 12. OBS stops (status = PAUSED)
- [ ] 13. Wait 5 seconds
- [ ] 14. Verify "Stream Paused - We'll Be Right Back! 💖"
- [ ] 15. Verify heart animation
- [ ] 16. Verify video player paused or hidden
- [ ] 17. OBS resumes (status = LIVE)
- [ ] 18. Wait 5 seconds
- [ ] 19. Verify "LIVE NOW" returns
- [ ] 20. Verify video resumes
- [ ] 21. Host ends live (status = ENDED)
- [ ] 22. Wait 5 seconds
- [ ] 23. Verify "✨ Live Stream Has Ended ✨"
- [ ] 24. Verify "Thank you for joining us!"
- [ ] 25. Verify "Recording Available" badge

### Auto-Update Verification (5 min)
- [ ] 26. Don't refresh page, let status poll automatically
- [ ] 27. Have host change status and observe viewer page
- [ ] 28. Verify updates appear within 5 seconds
- [ ] 29. Verify no page refresh needed

**Scenario 5 Result:** ☐ PASS ☐ FAIL

---

## 🧪 Test Scenario 6: Authorization & Security
**Objective:** Verify only authorized users can control streams

### Access Control (10 min)
- [ ] 1. User A creates wedding
- [ ] 2. User A goes live
- [ ] 3. Log in as User B
- [ ] 4. Navigate to User A's wedding manage page
- [ ] 5. Verify LiveControlPanel is hidden or disabled
- [ ] 6. Try to call control endpoints with User B token
- [ ] 7. Verify all calls return 403 Forbidden
- [ ] 8. Open wedding as guest (no login)
- [ ] 9. Verify can view status and video
- [ ] 10. Verify cannot see control panel
- [ ] 11. Try to call control endpoints without token
- [ ] 12. Verify calls return 401 Unauthorized

**Scenario 6 Result:** ☐ PASS ☐ FAIL

---

## ⚡ Performance Tests
**Objective:** Verify system performs well under load

### Multiple Viewers (15 min)
- [ ] 1. Go live with test wedding
- [ ] 2. Open 10+ browser tabs/windows as viewers
- [ ] 3. Verify all tabs show LIVE status
- [ ] 4. Verify all tabs play video smoothly
- [ ] 5. Monitor backend CPU and memory usage
- [ ] 6. Monitor NGINX resource usage
- [ ] 7. Verify status updates propagate to all viewers within 5 seconds
- [ ] 8. Pause and resume stream
- [ ] 9. Verify all viewers update correctly
- [ ] 10. Check for memory leaks (memory should be stable)

### Long Stream Test (2+ hours)
- [ ] 1. Start a long test stream (2+ hours)
- [ ] 2. Monitor system resources periodically
- [ ] 3. Verify no memory leaks
- [ ] 4. Verify recording file size reasonable (< 500MB/hour for 720p)
- [ ] 5. Verify HLS latency stays < 15 seconds
- [ ] 6. End stream and verify recording processes correctly
- [ ] 7. Verify recording playback works

### HLS Performance (10 min)
- [ ] 1. Check HLS segment generation
  ```bash
  ls -la /tmp/hls/
  ```
- [ ] 2. Verify segments are created every 3 seconds
- [ ] 3. Verify old segments are cleaned up
- [ ] 4. Check HLS playlist file
  ```bash
  cat /tmp/hls/<stream_key>/index.m3u8
  ```
- [ ] 5. Verify playlist contains 20 segments (60s worth)
- [ ] 6. Measure playback latency with timestamp
- [ ] 7. Verify latency < 15 seconds

**Performance Tests Result:** ☐ PASS ☐ FAIL

---

## 🔥 Edge Cases & Stress Tests
**Objective:** Test system resilience

### Network Issues (15 min)
- [ ] 1. Start live stream
- [ ] 2. Disconnect network for 10 seconds
- [ ] 3. Reconnect network
- [ ] 4. Verify OBS reconnects automatically
- [ ] 5. Verify stream resumes (status updates)
- [ ] 6. Verify recording continues

### Server Restart During Stream (15 min)
- [ ] 1. Start live stream
- [ ] 2. Restart backend:
  ```bash
  sudo supervisorctl restart backend
  ```
- [ ] 3. Verify OBS stays connected to NGINX
- [ ] 4. Wait for backend to restart
- [ ] 5. Refresh manage page
- [ ] 6. Verify status is correct
- [ ] 7. Verify controls still work

### NGINX Restart During Stream (15 min)
- [ ] 1. Start live stream
- [ ] 2. Restart NGINX:
  ```bash
  sudo systemctl restart nginx
  ```
- [ ] 3. Verify OBS disconnects
- [ ] 4. Verify status changes to PAUSED
- [ ] 5. Restart OBS streaming
- [ ] 6. Verify status returns to LIVE

### OBS Crash Simulation (10 min)
- [ ] 1. Start live stream
- [ ] 2. Force close OBS
- [ ] 3. Verify status changes to PAUSED within 5 seconds
- [ ] 4. Verify recording continues
- [ ] 5. Restart OBS and stream
- [ ] 6. Verify status returns to LIVE

### Browser Close During Live (5 min)
- [ ] 1. Creator starts live and leaves browser open
- [ ] 2. Close browser completely
- [ ] 3. Verify stream continues (OBS → NGINX)
- [ ] 4. Reopen browser and navigate to manage page
- [ ] 5. Verify status is correct
- [ ] 6. Verify can still control stream

### Concurrent Control Attempts (10 min)
- [ ] 1. Creator logs in on two different browsers/devices
- [ ] 2. Both open manage page
- [ ] 3. Try clicking controls simultaneously
- [ ] 4. Verify no race conditions
- [ ] 5. Verify state remains consistent
- [ ] 6. Verify both pages show same status

**Edge Cases Result:** ☐ PASS ☐ FAIL

---

## 📊 Test Summary

### Overall Results
- [ ] Scenario 1: Complete Happy Path - ☐ PASS ☐ FAIL
- [ ] Scenario 2: Manual Controls - ☐ PASS ☐ FAIL
- [ ] Scenario 3: Multiple Pauses - ☐ PASS ☐ FAIL
- [ ] Scenario 4: Error Handling - ☐ PASS ☐ FAIL
- [ ] Scenario 5: Viewer Experience - ☐ PASS ☐ FAIL
- [ ] Scenario 6: Authorization - ☐ PASS ☐ FAIL
- [ ] Performance Tests - ☐ PASS ☐ FAIL
- [ ] Edge Cases - ☐ PASS ☐ FAIL

### Critical Issues Found
```
[List any critical issues here]
1. 
2. 
3. 
```

### Non-Critical Issues Found
```
[List any minor issues here]
1. 
2. 
3. 
```

### Performance Metrics
- Average HLS latency: _______ seconds
- CPU usage during live: _______%
- Memory usage during live: _______ MB
- Recording file size (per hour): _______ MB
- Status update delay: _______ seconds
- Max concurrent viewers tested: _______

### Recommendations
```
[Add recommendations for improvements]
1. 
2. 
3. 
```

---

## ✅ Sign-Off

**Tester Name:** _______________________

**Date:** _______________________

**Overall Status:** ☐ APPROVED FOR PRODUCTION ☐ NEEDS FIXES

**Notes:**
```
[Final notes and comments]
```

---

**Testing Duration:** Approximately 2-4 hours for complete testing

**Prerequisites:**
- Stable internet connection (for OBS streaming)
- OBS Studio configured with test video source
- Multiple browser tabs/windows
- Access to server logs
- MongoDB access for data verification
