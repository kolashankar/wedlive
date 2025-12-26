# Wedding Themes Testing Guide

## ✅ Implementation Status: COMPLETE

All 7 wedding themes have been successfully implemented and are ready for testing!

---

## 🎨 Themes Available

1. **Floral Garden** - Soft & Romantic (Pink/Purple)
2. **Cinema Scope** - Cinematic Video-First (Dark Gray/Red)
3. **Modern Minimalist** - Clean & Elegant (White/Black)
4. **Royal Palace** - Traditional Luxury (Gold/Crimson)
5. **Premium Wedding Card** - Elegant Invitation (Gold/White)
6. **Romantic Pastel** - Sweet & Lovely (Rose Pink/Lavender)
7. **Traditional South Indian** - Cultural Heritage (Orange/Red)

---

## 🧪 How to Test

### **Step 1: Create a Wedding Event**
1. Login to dashboard at `/dashboard`
2. Click "Create New Wedding"
3. Fill in wedding details:
   - Bride Name
   - Groom Name
   - Wedding Date & Time
   - Location/Venue
4. Click "Create Wedding"

### **Step 2: Access Theme Settings**
1. From dashboard, click "Manage" button on your wedding card
2. Navigate to "Theme Settings" or "Customize" tab
3. You'll see the theme selection dropdown

### **Step 3: Select a Theme**
1. Click on "Theme" dropdown
2. You should see all 7 themes:
   - Floral Garden
   - Cinema Scope
   - Modern Minimalist
   - Royal Palace
   - Premium Wedding Card
   - Romantic Pastel
   - Traditional South Indian
3. Select any theme
4. Click "Save Settings"

### **Step 4: Customize Theme (Optional)**
1. **Colors:**
   - Primary Color: Main theme color
   - Secondary Color: Accent color
2. **Typography:**
   - Select from 10 font options:
     - Inter (modern)
     - Great Vibes (script)
     - Playfair Display (elegant)
     - Cinzel (formal)
     - Montserrat (clean)
     - Lato (simple)
     - Caveat (handwritten)
     - Bebas Neue (bold)
     - Rozha One (traditional)
     - Pinyon Script (calligraphy)
3. **Cover Photos:**
   - Upload 5-10 wedding photos
   - Or select from existing media gallery
4. **Pre-Wedding Video:**
   - Add YouTube/Vimeo URL
5. **Custom Messages:**
   - Welcome text
   - Description/Story
6. **Studio Details:**
   - Select studio from dropdown
   - Or leave empty
7. Click "Save"

### **Step 5: View Public Wedding Page**
1. From dashboard, click the "Eye" icon (👁️) on wedding card
2. Or navigate to `/weddings/{wedding_id}`
3. The selected theme will render!

---

## 📱 Testing Checklist

### **Visual Testing:**
- [ ] Theme loads correctly
- [ ] Bride & Groom names display properly
- [ ] Wedding date shows formatted (MMM d, yyyy)
- [ ] Wedding time shows formatted (h:mm a)
- [ ] Location/venue displays
- [ ] Cover photos render in gallery
- [ ] Studio details show correctly
- [ ] "Watch Live Wedding" button is visible and clickable
- [ ] Animations play smoothly (petals, hearts, sparkles, etc.)
- [ ] Colors match selected primary/secondary colors
- [ ] Font matches selected typography

### **Mobile Responsive Testing:**

**Test on these screen sizes:**
1. **Mobile Portrait (320px - 480px)**
   - [ ] No horizontal scrolling
   - [ ] Text is readable (min 16px)
   - [ ] Buttons are tap-friendly (min 44px)
   - [ ] Images scale properly
   - [ ] Navigation works
   
2. **Mobile Landscape (481px - 768px)**
   - [ ] Layout adapts appropriately
   - [ ] Content is visible
   
3. **Tablet (769px - 1024px)**
   - [ ] Grid layouts display correctly
   - [ ] Images maintain aspect ratio
   
4. **Desktop (1025px - 1920px)**
   - [ ] Full layout renders
   - [ ] Animations at full quality
   
5. **Ultra-wide (1921px+)**
   - [ ] Content centered/contained
   - [ ] No stretching

### **Functional Testing:**

**Test Each Theme:**
- [ ] **Floral Garden:**
  - Book opening animation plays
  - Floral corners visible
  - Fireflies animate
  - Heart-shaped photo frame
  
- [ ] **Cinema Scope:**
  - Film frame borders visible
  - Spotlight effects
  - Film strip at top/bottom
  - Cinematic typography
  
- [ ] **Modern Minimalist:**
  - Clean white background
  - Floating petals
  - Elegant typography
  - Minimal decorations
  
- [ ] **Royal Palace:**
  - Royal red/gold theme
  - Crown animations
  - Gold borders
  - Sparkles floating
  
- [ ] **Premium Wedding Card:**
  - Card opening animation
  - Glitter effects
  - Invitation styling
  - Ornamental corners
  
- [ ] **Romantic Pastel:**
  - Soft pastel colors
  - Floating hearts
  - Butterfly animations
  - Heart photo overlay
  
- [ ] **Traditional South Indian:**
  - Temple bells at top
  - Om (ॐ) symbol
  - Marigold flowers
  - Bilingual text (Tamil/English)

### **Interactive Elements:**
- [ ] "Watch Live Wedding" button works
- [ ] Gallery photos clickable/viewable
- [ ] Video plays (if pre-wedding video added)
- [ ] Hover effects work on desktop
- [ ] Touch interactions work on mobile
- [ ] Animations don't interfere with content

### **Performance Testing:**
- [ ] Page loads in < 3 seconds
- [ ] Animations run at 60fps (smooth)
- [ ] No console errors
- [ ] Images load progressively
- [ ] No layout shift during load

### **Cross-Browser Testing:**
Test on:
- [ ] Google Chrome (latest)
- [ ] Mozilla Firefox (latest)
- [ ] Safari (latest)
- [ ] Microsoft Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### **Data Integration Testing:**
- [ ] All data comes from API (no hardcoded text)
- [ ] Changing bride/groom name updates theme
- [ ] Changing date/time updates display
- [ ] Uploading new photos updates gallery
- [ ] Switching themes works smoothly
- [ ] Studio details populate correctly

---

## 🐛 Common Issues & Solutions

### **Issue: Theme not displaying**
**Solution:** 
- Check browser console for errors
- Verify wedding has `theme_settings` in database
- Try selecting theme again from dropdown
- Clear browser cache

### **Issue: Animations laggy on mobile**
**Solution:**
- Reduced particle count on mobile (this is expected)
- Some animations disabled on low-end devices
- This is performance optimization

### **Issue: Images not loading**
**Solution:**
- Check image URLs in cover_photos array
- Verify Telegram CDN is accessible
- Check browser network tab for failed requests

### **Issue: Date/Time not displaying**
**Solution:**
- Verify `scheduled_date` field exists in wedding object
- Check date format is ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
- Browser timezone affects time display

### **Issue: Studio details not showing**
**Solution:**
- Verify studio is selected in theme settings
- Check `studio_details` object has required fields
- Ensure studio logo URL is valid

### **Issue: "Watch Live" button not working**
**Solution:**
- Check `onEnter` callback is properly connected
- Verify button has correct event handler
- Test on different browsers

---

## 📊 Expected Results

### **All Themes Should:**
✅ Display couple names prominently  
✅ Show wedding date, time, venue  
✅ Render cover photo gallery  
✅ Show studio details (if configured)  
✅ Display "Watch Live Wedding" button  
✅ Have smooth animations  
✅ Be 100% mobile responsive  
✅ Load in under 3 seconds  
✅ Work across all modern browsers  
✅ Pull all data from API dynamically  

### **Theme-Specific Features:**
Each theme has unique characteristics as documented in `WEDDING_THEMES_IMPLEMENTATION.md`

---

## 🎯 Test Scenarios

### **Scenario 1: Basic Wedding (Minimal Data)**
```
Data:
- Bride: Sarah
- Groom: John
- Date: 2025-12-25 18:00:00
- Location: Grand Hotel
- Theme: Floral Garden
- No photos, no video, no studio

Expected: Theme renders with default styling, all text displays, placeholders for missing photos
```

### **Scenario 2: Full Wedding (Complete Data)**
```
Data:
- Bride: Priya
- Groom: Rahul
- Date: 2025-11-15 19:30:00
- Location: Royal Palace Banquet
- Theme: Royal Palace
- 10 cover photos
- Pre-wedding video
- Studio details with logo
- Custom welcome message

Expected: Theme renders fully with all sections, gallery displays all photos, video player works, studio card shows
```

### **Scenario 3: Theme Switching**
```
Actions:
1. Create wedding with Floral Garden theme
2. View public page
3. Switch to Cinema Scope theme
4. View public page again

Expected: Theme changes completely, all data persists, new styling applies
```

### **Scenario 4: Mobile Wedding Viewing**
```
Device: iPhone 13 (390x844)
Theme: Romantic Pastel

Expected:
- Vertical scrolling works smoothly
- No horizontal overflow
- All content visible
- Buttons easily tappable
- Animations smooth but reduced
```

---

## 📝 Reporting Issues

If you find any issues, please report with:
1. **Theme Name:** Which theme has the issue
2. **Device/Browser:** What you're testing on
3. **Screen Size:** Viewport dimensions
4. **Issue Description:** What's wrong
5. **Expected Behavior:** What should happen
6. **Screenshots:** Visual proof
7. **Console Errors:** Any JavaScript errors

---

## 🚀 Next Steps After Testing

Once testing is complete:
1. Fix any reported bugs
2. Optimize performance further if needed
3. Add additional themes (if requested)
4. Document any new findings
5. Deploy to production

---

## ✅ Sign-Off Checklist

Before considering this feature complete:
- [ ] All 7 themes tested on mobile
- [ ] All 7 themes tested on desktop
- [ ] Theme switching works flawlessly
- [ ] All mandatory sections present
- [ ] No console errors
- [ ] Performance acceptable (< 3s load)
- [ ] Cross-browser compatibility confirmed
- [ ] User accepts implementation

---

**Ready for User Acceptance Testing!** 🎉

---

**Last Updated:** January 2025  
**Status:** READY FOR TESTING  
**Developer:** AI Development Team
