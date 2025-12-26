# WedLive Fixes Implementation

## Issues Identified

### 1. ❌ CRITICAL: Background Assets Showing in Border Dropdowns
**Problem:** Border dropdowns are displaying background images (e.g., "background with custom border")
**Root Cause:** Assets might be miscategorized in database collections
**Fix:** Clean up database collections and ensure strict filtering

### 2. ❌ CRITICAL: Uploaded Photos Not Rendering in Layout
**Problem:** Photos are uploaded successfully but not showing in placeholder boxes on layout
**Root Cause:** Possible API response format mismatch or incorrect key mapping
**Fix:** 
- Verify API response format from `/api/weddings/{id}/layout-photos`
- Ensure correct key mapping in LayoutRenderer (bridePhoto vs bride_photo)
- Add better error logging

### 3. ❌ Missing "Watch Live" Button
**Problem:** No button to redirect to wedding streaming page
**Location Needed:** Top right of wedding layout pages (sticky/scrollable)
**Fix:** Add floating "Watch Live" button on public wedding pages

### 4. ❌ API Timeout Errors (30 seconds)
**Problem:** API calls timing out: `timeout of 30000ms exceeded`
**Fix:** 
- Increase axios timeout in frontend API client
- Optimize backend API responses
- Add retry logic

### 5. ❌ Theme Update 400 Bad Request
**Problem:** `PUT /api/weddings/{id}/theme` returning 400 error
**Root Cause:** Theme settings validation failing
**Fix:** Add better validation and error handling

## Implementation Plan

### Phase 1: Database Cleanup ✅
- Run `fix_asset_categories.py` to move miscategorized assets
- Verify borders collection contains only borders
- Verify background_images collection contains only backgrounds

### Phase 2: Photo Rendering Fix 
- Check API response format
- Fix key mapping in LayoutRenderer
- Add comprehensive logging
- Test photo display in all layouts

### Phase 3: "Watch Live" Button
- Add floating button component
- Make it sticky on scroll
- Link to `?live=true` parameter

### Phase 4: Timeout Fixes
- Increase frontend axios timeout to 60s
- Add retry logic for failed requests
- Optimize backend queries

### Phase 5: Theme Update Fix
- Add validation logging
- Fix any model validation issues
- Better error messages

## Testing Checklist

- [ ] Border dropdowns show ONLY borders
- [ ] Background dropdowns show ONLY backgrounds  
- [ ] Uploaded photos render in layout placeholders
- [ ] "Watch Live" button visible and functional
- [ ] No timeout errors on normal operations
- [ ] Theme updates work without 400 errors
