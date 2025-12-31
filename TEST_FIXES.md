# Test Guide for Bug Fixes

#### How to Test Each Fix:

### Issue 1: Background Removal Delay ✅

**Test Steps:**
1. Go to `https://wedlive.vercel.app/admin/borders`
2. Click "Browse..." and select an image with a black background
3. Check the "Remove Background" checkbox
4. **Expected Result:** 
   - Background removal should start processing IMMEDIATELY
   - Progress bar should show
   - Processed preview should appear within seconds
   - No more "Waiting" status that never completes

**Alternative Test:**
1. Upload an image (don't check the box yet)
2. After image loads, CHECK the "Remove Background" box
3. **Expected Result:** Processing starts immediately (within 100ms)

**CSP Test:**
- Check browser console - should see NO CSP errors like:
  - ❌ "Content-Security-Policy: The page's settings blocked the loading of a resource (connect-src) at data:image/png..."
  - ✅ No CSP errors should appear

---

### Issue 2: Category Filtering ✅

**Test Steps:**
1. Go to `https://wedlive.vercel.app/admin/borders`
2. Upload a new border:
   - Select Border Category: "Border" (not Background)
   - Complete upload
3. Upload another border:
   - Select Border Category: "Background"
   - Complete upload
4. Check the tabs at bottom of page:
   - "All Borders (X)" - should show total count
   - "Border (Y)" - should show count of borders with category="border"
   - "Background (Z)" - should show count of borders with category="background"

**Expected Result:**
- Tabs should show correct counts (not all zeros)
- Clicking each tab filters the list correctly

**Note:** If still showing 0, it means:
- Old borders were uploaded without category selection
- Need to re-upload or manually update category in database

---

### Issue 3: Photo Loading Failure ✅

**Test Steps:**
1. Go to `https://wedlive.vercel.app/weddings/manage/f4eb5cdf-6142-4c1c-8ec7-41d14a509339`
2. Check the "Layout" tab → "Photos" section
3. Look for any images showing "Failed to load"

**Expected Behavior:**
- Images with VALID Telegram file_ids: Should load correctly
- Images with PLACEHOLDER file_ids (like `file_93`, `file_91`): Should be FILTERED OUT (not shown at all)
- Browser console should show warnings like:
  ```
  Skipping media <id> with invalid placeholder file_id: file_93
  ```

**How to Fix Remaining Issues:**
1. If you see "Failed to load" errors, those photos have invalid file_ids
2. **Solution:** Delete those photos and re-upload actual images from Telegram
3. The system will automatically filter them out of the gallery

**Console Check:**
- Open browser console (F12)
- Look for logs like: `Photo failed to load: https://wedlive.onrender.com/api/media/telegram-proxy/photos/file_93`
- These indicate placeholder images that need to be replaced

---

### Issue 4: Border Positioning ✅

**Test Steps:**
1. Go to `https://wedlive.vercel.app/weddings/f4eb5cdf-6142-4c1c-8ec7-41d14a509339`
2. Look at the photos with borders (bride, groom, couple photos)

**Expected Result:**
✅ **CORRECT Layering:**
- Border should be in the BACKGROUND (behind the photo)
- Photo should be on TOP (in foreground)
- Border should be TRANSPARENT (showing through the parts where photo isn't)

❌ **OLD Behavior (Fixed):**
- Border was on top of photo (wrong!)
- Photo was in background (wrong!)

**Size Check:**
- Border should extend **3px beyond the photo on ALL four sides**
- This means border is 6px wider and 6px taller total (3px on each side)

**Visual Test:**
1. Look at a photo with a border
2. The border frame should be visible AROUND the photo edges
3. The photo should show THROUGH the transparent center of the border
4. The border should NOT cover the photo

---

### Issue 5: Layout Page Background ✅

**Test Steps:**
1. Go to wedding management: `https://wedlive.vercel.app/weddings/manage/f4eb5cdf-6142-4c1c-8ec7-41d14a509339`
2. Go to "Theme" or "Settings" tab
3. Look for "Layout Page Background" or "Hero Background" setting
4. Verify a background image is selected
5. Click "Save"
6. Navigate to public page: `https://wedlive.vercel.app/weddings/f4eb5cdf-6142-4c1c-8ec7-41d14a509339`

**Expected Result:**
- The hero section (top of page) should show the selected background image
- Background should have a gradient overlay
- If no background showing, check:
  1. Was background image URL saved correctly in settings?
  2. Is the image URL accessible?
  3. Check browser console for 404 errors on image

**Debug Steps if Not Working:**
1. Open browser console (F12)
2. Check Network tab for failed image requests
3. Look in Elements inspector for hero section style
4. Verify `backgroundImage` CSS property is set
5. If still not showing, may need to check database:
   ```
   theme_settings.layout_page_background_url
   theme_settings.theme_assets.layout_page_background_url
   ```

---

## Quick Visual Test Summary:

| Issue | Where to Check | What to Look For |
|-------|---------------|------------------|
| 1. Background Removal | Admin → Borders → Upload | Processing starts immediately when checkbox checked |
| 2. Category Filter | Admin → Borders → Bottom tabs | Correct counts for Border/Background tabs |
| 3. Photo Loading | Manage → Layout → Photos | No "failed to load" for valid images, placeholders filtered |
| 4. Border Position | Public wedding page | Border in background, photo on top, 3px padding |
| 5. Layout Background | Public wedding page hero | Background image visible with gradient overlay |

---

## Common Issues & Solutions:

### "Background removal still not working"
- Clear browser cache (Ctrl+F5)
- Make sure checkbox is being checked (watch for checkmark)
- Check console for any JavaScript errors

### "Categories still showing 0"
- Old borders need to be re-uploaded with category selected
- Or manually update category in database

### "Photos still showing 'failed to load'"
- Those specific photos have invalid file_ids (placeholders)
- Delete them and re-upload actual photos
- System is working correctly by rejecting invalid images

### "Borders still on top of photos"
- Hard refresh browser (Ctrl+F5) to clear CSS cache
- Check if photo has a border URL assigned
- Verify border image has transparency (PNG with alpha channel)

### "Background not showing"
- Verify background was saved in theme settings
- Check if image URL is valid and accessible
- Look for 404 errors in browser console Network tab

---

## Browser Console Commands for Debugging:

```javascript
// Check if border image has transparency
let img = new Image();
img.src = 'YOUR_BORDER_URL';
img.onload = () => console.log('Border loaded:', img.width, 'x', img.height);

// Check computed styles of photo frame
document.querySelector('.photo-frame img').style

// Check theme settings
// (In manage page, open console)
console.log(wedding?.theme_settings)
```

---

## Success Criteria:

✅ Issue 1: Background removes instantly when checkbox checked, no CSP errors
✅ Issue 2: Category tabs show correct counts for uploaded borders
✅ Issue 3: Invalid placeholder file_ids are filtered, valid photos load
✅ Issue 4: Borders display behind photos with 3px padding all sides
✅ Issue 5: Layout background displays on public wedding page

---

## Need More Help?

If issues persist after testing:
1. Check `/app/BUG_FIXES_SUMMARY.md` for technical details
2. Check browser console for error messages
3. Verify all services are running: `sudo supervisorctl status`
4. Check logs: `tail -f /var/log/supervisor/backend.err.log`
5. Check logs: `tail -f /var/log/supervisor/frontend.err.log`
