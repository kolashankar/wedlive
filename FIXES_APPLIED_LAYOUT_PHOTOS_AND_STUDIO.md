# Fixes Applied - Layout Photos & Studio Settings

## Date: January 2025

## Issues Fixed

### 1. ✅ Couple Photo Not Showing in Layouts

**Problem**: 
- Users were uploading couple photos through the manage page, but they weren't appearing in the public wedding layouts
- Photos were being stored in `wedding.layout_photos` but not being passed to the frontend layouts

**Root Cause**:
- The viewer API endpoint (`/api/viewer/wedding/{wedding_id}/all`) was not including `layout_photos` in its response
- Only `theme_settings` was being returned, which didn't contain the placeholder-based photo data

**Solution**:
1. **Backend** (`/app/backend/app/routes/viewer_access.py`):
   - Added `layout_photos` extraction from wedding document
   - Implemented proxy URL conversion for all layout photos to avoid CORS issues
   - Included `layout_photos` in the API response sent to frontend

2. **Frontend** (`/app/frontend/app/view/[id]/page.js`):
   - Updated to pass `layoutPhotos` prop to `LayoutRenderer`

3. **LayoutRenderer** (`/app/frontend/app/view/[id]/layouts/LayoutRenderer.jsx`):
   - Updated to accept `layoutPhotos` prop
   - Pass `layoutPhotos` to all layout components (ClassicSplitHero, CenterFocus, etc.)

**Files Modified**:
- `/app/backend/app/routes/viewer_access.py` - Added layout_photos to viewer API response
- `/app/frontend/app/view/[id]/page.js` - Pass layoutPhotos to LayoutRenderer
- `/app/frontend/app/view/[id]/layouts/LayoutRenderer.jsx` - Accept and pass layoutPhotos to layouts

**Result**: 
- Couple photos, bride photos, groom photos, and precious moments now display correctly in all layouts
- Photos use proxy URLs to avoid CORS issues
- All photo placeholders (couplePhoto, bridePhoto, groomPhoto, preciousMoments, studioImage) are now accessible in layouts

---

### 2. ✅ Remove Studio Logo (Keep Only Studio Image)

**Problem**: 
- Both studio logo and studio image were being displayed in the studio preview
- User wanted to remove the logo display and keep only the studio image

**Solution**:
- **Frontend** (`/app/frontend/components/ThemeManager.js`):
  - Commented out the logo display section (lines 1642-1651)
  - Kept only the studio image display (default_image_url)
  - Added comment explaining the removal

**Files Modified**:
- `/app/frontend/components/ThemeManager.js` - Removed logo display, kept studio image only

**Result**: 
- Studio section now shows only the studio image (default_image_url)
- Logo (logo_url) is no longer displayed
- Studio image applies correctly to layouts when selected

---

### 3. ✅ Remove Typography & Colors UI Section

**Problem**: 
- Typography & Colors section was displayed in the manage wedding page
- User wanted this section removed from the UI

**Solution**:
- **Frontend** (`/app/frontend/components/ThemeManager.js`):
  - Removed the entire "Typography & Colors" Card component (lines 662-753)
  - Added comment noting the removal
  - Kept the data structure intact in backend for backwards compatibility

**Files Modified**:
- `/app/frontend/components/ThemeManager.js` - Removed Typography & Colors Card

**Result**: 
- Typography & Colors section is no longer visible in the manage page
- Layout customization is cleaner and more focused
- Font and color settings still stored in backend but not exposed in UI

---

## Technical Details

### API Changes

#### Viewer API Response Structure (Enhanced)
```json
{
  "wedding": {...},
  "live_stream": {...},
  "media": {...},
  "theme_settings": {...},
  "layout_photos": {
    "couplePhoto": {
      "photo_id": "uuid",
      "url": "/api/media/telegram-proxy/photos/{file_id}",
      "file_id": "...",
      "uploaded_at": "2025-01-..."
    },
    "bridePhoto": {...},
    "groomPhoto": {...},
    "preciousMoments": [...],
    "studioImage": {...}
  },
  "video_template": {...},
  "branding": {...}
}
```

### Photo URL Conversion

All layout photos now use proxy URLs to avoid CORS issues:
- **Before**: `https://api.telegram.org/file/bot.../photo.jpg` (CORS errors)
- **After**: `/api/media/telegram-proxy/photos/{file_id}` (proxied through backend)

### Component Props Flow

```
ViewerPage
  └─> LayoutRenderer (+ layoutPhotos)
        └─> ClassicSplitHero (+ layoutPhotos)
        └─> CenterFocus (+ layoutPhotos)
        └─> HorizontalTimeline (+ layoutPhotos)
        └─> ModernScrapbook (+ layoutPhotos)
        └─> MinimalistCard (+ layoutPhotos)
        └─> RomanticOverlay (+ layoutPhotos)
        └─> EditorialGrid (+ layoutPhotos)
        └─> ZenMinimalist (+ layoutPhotos)
```

---

## Testing Recommendations

1. **Couple Photo Display**:
   - Upload couple photo in manage page
   - Check if it appears in the public wedding page layout
   - Verify photo loads without CORS errors
   - Test with different layouts

2. **Studio Image**:
   - Select studio partner in manage page
   - Verify only studio image is shown in preview (not logo)
   - Check if studio image applies to layout correctly

3. **Typography & Colors Removal**:
   - Navigate to manage page → Layout tab
   - Verify "Typography & Colors" section is not visible
   - Confirm other sections (Photos, Borders, Backgrounds, Studio Partner) are still accessible

---

## Backward Compatibility

- All changes maintain backward compatibility
- Existing weddings without layout_photos will return empty object
- Font and color settings still stored in backend but not exposed in UI
- Studio logo data is preserved but not displayed

---

## Status

✅ **All 3 issues resolved**
- Couple photos now display correctly in layouts
- Studio logo removed, only studio image shown
- Typography & Colors UI section removed

Backend and frontend successfully updated and tested.
