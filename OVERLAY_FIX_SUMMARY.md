# Overlay Style and Animation Persistence Fix

## Issue
User reported that overlay styles (font family, font size, color, text alignment, letter spacing, line height, text stroke) and animations (entrance/exit animations, durations) were not persisting. Changes would be made but would automatically revert back to default values.

## Root Cause Analysis

The issue was caused by a **race condition** between saving changes and updating the UI state:

### Previous Flow (Problematic):
1. User changes a style property (e.g., text color)
2. Frontend updates local `formData` state
3. After 800ms delay, `handleSave()` sends ALL form data to backend
4. Backend processes and returns updated overlay
5. Parent component receives response and updates `overlays` state
6. Parent updates `selectedOverlay` with new data
7. **Child component detects `overlay` prop change**
8. **Child resets `formData` to overlay's values using `useEffect`**
9. If response was stale or another save was in progress, old values are restored

The problem was that:
- Frontend was sending complete payload every time (all fields)
- `useEffect` in `OverlayConfigurator` was resetting form data whenever overlay changed
- Multiple saves could trigger race conditions
- No tracking of which fields actually changed

## Solution Implemented

### 1. Track Pending Changes (`OverlayConfigurator.js`)
- Added `pendingChanges` state to track only fields that user has modified
- Added `isSavingRef` to prevent state resets during save operations
- Modified `handleUpdate()` to track changes in both `formData` and `pendingChanges`

### 2. Send Only Changed Data
- Modified `handleSave()` to build payload containing only sections that have changes
- When styling changes, send complete styling object (required by Pydantic)
- When animation changes, send complete animation object
- This prevents unnecessary data from being sent and processed

### 3. Prevent Race Conditions
- Added `isSavingRef` flag to prevent `useEffect` from resetting form during save
- Changed `useEffect` dependency from `overlay` to `overlay?.id` to prevent resets on data updates
- Added 500ms delay after save before allowing overlay updates
- Parent component now properly throws errors so child knows when save fails

### 4. Enhanced Logging (Backend)
- Added detailed logging in `video_templates.py` to track:
  - Overlay state before update
  - Update dict contents
  - Overlay state after merge
  - This helps debug any future issues

## Files Modified

1. **`/app/frontend/components/admin/OverlayConfigurator.js`**
   - Added `pendingChanges` state tracking
   - Added `isSavingRef` to prevent race conditions
   - Modified `handleUpdate()` to track changes
   - Modified `handleSave()` to send only changed sections
   - Modified `useEffect` to check `isSavingRef` before resetting

2. **`/app/frontend/components/admin/TemplateEditor.js`**
   - Enhanced logging in `handleUpdateOverlay()`
   - Added error re-throwing so child component knows when save fails
   - Added detailed console logs for debugging

3. **`/app/backend/app/routes/video_templates.py`**
   - Added comprehensive logging for overlay updates
   - Logs before/after state and update contents

## Testing Instructions

Please test the following scenarios:

### Test 1: Style Changes
1. Open the admin video template editor
2. Select an existing overlay
3. Go to "Style" tab
4. Change **Text Color** - observe that color persists
5. Change **Font Family** - observe that font persists
6. Change **Font Size** - observe that size persists
7. Change **Font Weight** - observe that weight persists
8. Change **Text Alignment** - observe that alignment persists
9. Change **Letter Spacing** - observe that spacing persists
10. Change **Line Height** - observe that height persists
11. Enable **Text Stroke** and change color/width - observe persistence

### Test 2: Animation Changes
1. Select an overlay
2. Go to "Animation" tab
3. Under "Entrance Animation":
   - Change **Animation Type** (e.g., from fade-in to slide-up)
   - Change **Duration** 
   - Change **Easing**
4. Under "Exit Animation":
   - Change **Animation Type**
   - Change **Duration**
   - Change **Easing**
5. Observe that all animation settings persist

### Test 3: Multiple Changes
1. Make multiple changes across different tabs (content, style, timing, animation)
2. Verify all changes persist together
3. Switch between different overlays and verify settings remain

### Test 4: Rapid Changes
1. Quickly change multiple style properties in succession
2. Verify the final state reflects all changes (no race conditions)

## Debugging

If issues persist, check browser console for:
- `"Saving overlay update with changes:"` - shows what's being sent
- `"Updated overlay data from server:"` - shows what backend returned
- `"Updated overlay animation from server:"` - shows animation data returned

Check backend logs for:
- `[UPDATE_OVERLAY] Before update` - shows overlay state before merge
- `[UPDATE_OVERLAY] Update dict keys` - shows what fields are being updated
- `[UPDATE_OVERLAY] After merge` - shows overlay state after merge

## Additional Notes

- The backend's `deep_merge_dict()` function is working correctly
- The fix ensures that only changed sections are sent, reducing API payload size
- Race conditions are prevented by the `isSavingRef` flag
- The solution maintains backward compatibility with existing overlay data

## Next Steps

After testing, if any specific style or animation property still doesn't persist, please note:
1. Which property is not persisting
2. What value you're trying to set
3. What value it reverts to
4. Any console errors or warnings
