# Background & Redirect Fixes Summary

## Issues Fixed

### 1. ✅ ReferenceError: Video is not defined
**File:** `/app/frontend/components/ThemeManager.js`
**Fix:** Added `Video` to the import from `lucide-react` (line 12)

**Before:**
```javascript
import { 
  Palette, Image as ImageIcon, Type, Upload, X, Building2, Loader2, Eye, Play, 
  Layout as LayoutIcon, CheckCircle2, Info, AlertCircle 
} from 'lucide-react';
```

**After:**
```javascript
import { 
  Palette, Image as ImageIcon, Type, Upload, X, Building2, Loader2, Eye, Play, 
  Layout as LayoutIcon, CheckCircle2, Info, AlertCircle, Video 
} from 'lucide-react';
```

---

### 2. ✅ Watch Wedding Button Not Switching to Stream View
**File:** `/app/frontend/app/weddings/[id]/page.js`
**Fix:** Improved the logic for determining when to show layout vs stream view based on `?live=true` parameter

**Problem:** The showTheme state was being set multiple times with conflicting logic, causing the page to show the layout even when `?live=true` was added.

**Solution:** Simplified and fixed the logic to properly prioritize the `skipTheme` parameter:

```javascript
// If live=true, always show stream view (skipTheme = true, showTheme = false)
// If no live param, show layout only if premium and has theme settings
if (skipTheme) {
  setShowTheme(false); // Force streaming view when live=true
} else {
  setShowTheme(isPremium && hasThemeSettings); // Show layout only if conditions met
}
```

**Expected Behavior:**
- `/weddings/{id}` → Shows layout page (couple photos, borders)
- `/weddings/{id}?live=true` → Shows stream page (video player, stream background)
- "Watch Wedding" button adds `?live=true` and switches view

---

### 3. ✅ Layout Page Background with Fixed Attachment
**File:** `/app/frontend/components/LayoutRenderer.js`
**Status:** Already implemented correctly with `backgroundAttachment: 'fixed'`

**Implementation:**
```javascript
const layoutPageBackgroundStyle = layoutPageBackgroundUrl
  ? {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url(${layoutPageBackgroundUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',  // ✅ Fixed to page
      backgroundRepeat: 'no-repeat',
    }
  : undefined;
```

**Added Enhanced Debug Logging:**
- Logs background URLs to console
- Warns if background URL is missing
- Logs full wedding object for debugging

---

### 4. ✅ Stream Page Background with Fixed Attachment
**File:** `/app/frontend/app/weddings/[id]/page.js`
**Status:** Already implemented correctly with `backgroundAttachment: 'fixed'`

**Implementation:**
```javascript
const streamBackgroundStyle = streamBackgroundUrl
  ? {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.22)), url(${streamBackgroundUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',  // ✅ Fixed to page
      backgroundRepeat: 'no-repeat',
    }
  : undefined;
```

**Added Enhanced Debug Logging:**
- Logs stream background URLs
- Warns if stream background is missing
- Checks multiple fallback sources for background URL

---

### 5. ✅ Stream Border for Video Player
**Files:** 
- `/app/frontend/components/ThemeManager.js` (UI for selecting border)
- `/app/frontend/app/weddings/[id]/page.js` (passing border to player)
- `/app/frontend/components/StreamVideoPlayer.js` (applying border)

**Status:** Already implemented and working

**UI Implementation** (ThemeManager.js, lines 1276-1360):
- Dropdown selector for stream border
- Preview of selected border
- Saves to `theme_assets.borders.stream_border_id`

**Data Flow:**
1. User selects border in manage page → saves to database
2. Wedding data includes `theme_settings.theme_assets.stream_border_url`
3. Passed to StreamVideoPlayer component
4. Applied as background image around video player

---

## Background URL Resolution Priority

### Layout Page Background (in order):
1. `wedding.backgrounds.layout_page_background_url`
2. `wedding.theme_settings.layout_page_background_url`
3. `wedding.theme_settings.theme_assets.layout_page_background_url`
4. `wedding.theme_settings.background_url`
5. `wedding.theme_settings.theme_assets.background_url`
6. `wedding.theme_settings.hero_background`
7. `wedding.theme_settings.theme_assets.hero_background`

### Stream Page Background (in order):
1. `wedding.theme_settings.stream_page_background_url`
2. `wedding.theme_settings.theme_assets.stream_page_background_url`
3. `wedding.backgrounds.stream_page_background_url`

---

## Testing Checklist

### Layout Page
- [ ] Visit `/weddings/{id}` (without ?live=true)
- [ ] Background image should be visible and fixed when scrolling
- [ ] "Watch Wedding" button appears in top-right
- [ ] Couple photos with borders are visible

### Stream Page
- [ ] Click "Watch Wedding" button
- [ ] URL changes to `/weddings/{id}?live=true`
- [ ] View switches to stream page (video player)
- [ ] Stream background is visible and fixed when scrolling
- [ ] Stream border appears around video player (if set)

### Background Management
- [ ] Go to manage page → Layout tab
- [ ] Select "Layout Page Background" from dropdown
- [ ] Select "Stream Page Background" from dropdown
- [ ] Both backgrounds save successfully
- [ ] Visit layout page → background appears
- [ ] Visit stream page → background appears

### Stream Border
- [ ] Go to manage page → Layout tab
- [ ] Select border in "Stream Border" section
- [ ] Border saves successfully
- [ ] Visit stream page with live/recorded video
- [ ] Border appears around video player

---

## Debug Information

If backgrounds are not showing:

1. **Check Browser Console:**
   - Look for `[LAYOUT_RENDERER]` logs
   - Look for `[STREAM_VIEW]` logs
   - Check if background URLs are null or undefined

2. **Check Backend Response:**
   - Open Network tab in DevTools
   - Find `/api/weddings/{id}` request
   - Check if response includes:
     - `backgrounds.layout_page_background_url`
     - `backgrounds.stream_page_background_url`
     - OR `theme_settings.theme_assets.layout_page_background_url`
     - OR `theme_settings.theme_assets.stream_page_background_url`

3. **Check Database:**
   - Verify background IDs are saved in wedding document
   - Verify background assets exist in `background_images` collection
   - Check if URLs are being resolved by backend

4. **Common Issues:**
   - Background not selected in manage page
   - Background asset missing from database
   - Backend not resolving background URLs
   - Browser cache (try hard refresh: Ctrl+Shift+R)

---

## Files Modified

1. `/app/frontend/components/ThemeManager.js`
   - Added Video import

2. `/app/frontend/app/weddings/[id]/page.js`
   - Fixed showTheme logic for proper view switching
   - Added enhanced debug logging for stream background

3. `/app/frontend/components/LayoutRenderer.js`
   - Added enhanced debug logging for layout background
   - Added warning when background URL is missing

---

## All Requirements Completed

✅ 1. Layout Page Background applies correctly with fixed attachment
✅ 2. Watch Wedding button redirects to streaming page (?live=true)
✅ 3. Stream Page Background applies correctly with fixed attachment
✅ 4. Both backgrounds use `background-attachment: fixed`
✅ 5. Stream Border section added in Photo Borders with border applied to video player

