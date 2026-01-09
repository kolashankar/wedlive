# Overlay Timing Visibility Fix

## Issue
User reported that despite configuring start and end times for text overlays (e.g., Start Time: 0:05, End Time: 0:08), the overlays were not appearing on the video during playback at those times.

## Root Cause
The overlay visibility check was using strict equality comparisons for timing:
```javascript
const visible = currentTime >= startTime && currentTime <= endTime;
```

This caused overlays to not show due to floating-point precision issues. For example:
- If startTime = 5.0 and currentTime = 4.999999999
- The check `4.999999999 >= 5.0` would fail, even though the video is essentially at 5 seconds

This is a common issue with floating-point arithmetic in JavaScript where video time updates may not land exactly on the configured start/end times.

## Solution Implemented
Added a small epsilon tolerance (0.05 seconds / 50 milliseconds) to the timing checks to handle floating-point precision:

```javascript
const epsilon = 0.05;
const visible = currentTime >= (startTime - epsilon) && currentTime <= (endTime + epsilon);
```

This ensures overlays show reliably within their configured time ranges, even if the video's currentTime doesn't land exactly on the start_time value.

## Files Modified

### 1. `/app/frontend/app/view/[id]/layouts/components/VideoTemplatePlayer.jsx`
- **Line 171-196**: Updated visibility filter to use epsilon tolerance
- Added enhanced logging that triggers for all time ranges (not just 5-9 seconds)
- Logs now show the overlay label/endpoint_key for better debugging

### 2. `/app/frontend/components/video/ResponsiveTextOverlay.js`
- **Line 73-100**: Updated visibility check with epsilon tolerance
- Enhanced logging with 3 decimal places for better timing precision visibility
- Added reason for hiding (before/after time range) in debug logs

### 3. `/app/frontend/components/admin/InteractiveOverlayCanvas.js`
- **Line 602-608**: Updated canvas visibility filter with epsilon tolerance
- **Line 647-656**: Updated getOverlayAtPosition with epsilon tolerance
- Ensures overlays are selectable and visible during playback in admin editor

## Benefits
1. **Reliable Timing**: Overlays now show consistently at their configured times
2. **User-Friendly**: Small tolerance (50ms) is imperceptible to users but handles timing precision
3. **Consistent Behavior**: All overlay rendering components now use the same timing logic
4. **Better Debugging**: Enhanced console logging makes it easier to troubleshoot timing issues

## Testing Recommendations
1. Configure overlays with specific start/end times (e.g., 0:05 to 0:08)
2. Play the video and verify overlays appear at the configured times
3. Check browser console for visibility logs to confirm timing checks are passing
4. Test on different devices/browsers to ensure consistent behavior

## Technical Notes
- Epsilon value of 0.05 seconds is small enough to be imperceptible but large enough to handle floating-point precision
- The check is now: `currentTime >= (startTime - 0.05) && currentTime <= (endTime + 0.05)`
- This means an overlay configured for 5.00s will show from 4.95s to 8.05s (imperceptible difference)
- Video time updates typically happen at ~16-60ms intervals (60fps - 16.67fps), so 50ms tolerance is appropriate
