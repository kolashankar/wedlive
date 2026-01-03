# Admin User Guide - Video Template System

## Table of Contents
1. [Introduction](#introduction)
2. [Accessing the Admin Panel](#accessing-the-admin-panel)
3. [Creating a Video Template](#creating-a-video-template)
4. [Configuring Text Overlays](#configuring-text-overlays)
5. [Managing Templates](#managing-templates)
6. [Best Practices](#best-practices)

---

## Introduction

The Video Template System allows administrators to create dynamic wedding video templates with customizable text overlays. Users can then select these templates and automatically populate them with their wedding data.

**Key Features:**
- Upload video templates (MP4, WebM, MOV)
- Configure dynamic text overlays
- Preview templates with sample data
- Manage template library
- Set featured templates

---

## Accessing the Admin Panel

1. Log in to the admin account
2. Navigate to the Admin Dashboard
3. Click on **"Video Templates"** button
4. You'll see the template management interface

---

## Creating a Video Template

### Step 1: Upload Video

1. Click **"Create New Template"** button
2. Drag and drop a video file or click to browse
3. Fill in template information:
   - **Name**: Template name (e.g., "Elegant Wedding Invitation")
   - **Description**: Brief description of the template
   - **Category**: Select category (invitation, announcement, save-the-date, general)
   - **Tags**: Add comma-separated tags (e.g., "elegant, floral, romantic")

4. Click **"Upload"** and wait for processing
5. A thumbnail will be automatically generated

**Video Requirements:**
- Format: MP4, WebM, or MOV
- Max Size: 50MB
- Max Duration: 60 seconds
- Recommended Resolution: 1920x1080 (Full HD)
- Frame Rate: 24-30 FPS

### Step 2: Configure Overlays

After upload, you'll be redirected to the Template Editor.

---

## Configuring Text Overlays

### Adding an Overlay

1. In the Template Editor, click **"Add Overlay"**
2. Configure the overlay using the tabbed interface:

### Tab 1: Content

- **Endpoint Selection**: Choose which wedding data field to display
  - `bride_name` - Bride's full name
  - `groom_name` - Groom's full name
  - `couple_names` - "Bride & Groom"
  - `event_date` - Wedding date
  - `venue` - Venue name
  - And 14 more options...

- **Label**: Display name for this overlay
- **Placeholder Text**: Sample text shown in preview

### Tab 2: Position

- **X Position**: Horizontal position (0-1920)
- **Y Position**: Vertical position (0-1080)
- **Alignment**: Text alignment (left, center, right)
- **Anchor Point**: Reference point for positioning

**Tip**: Use the canvas preview to drag and position text visually

### Tab 3: Timing

- **Start Time**: When the overlay appears (in seconds)
- **End Time**: When the overlay disappears (in seconds)
- **Duration**: Auto-calculated from start and end time

**Tip**: Use the video timeline scrubber to set exact timings

### Tab 4: Style

**Font Settings:**
- **Font Family**: Choose from 16 fonts
- **Font Size**: 12-200px
- **Font Weight**: normal, bold
- **Color**: Use color picker
- **Text Alignment**: left, center, right

**Advanced:**
- **Text Shadow**: Enable shadow effect
- **Text Stroke**: Add outline to text
- **Letter Spacing**: Adjust spacing
- **Line Height**: Adjust line spacing

**Animation:**
- **Type**: Choose from 18 animation types
  - Fade: fade-in, fade-out
  - Slide: slide-up, slide-down, slide-left, slide-right
  - Scale: scale-up, scale-down, zoom-in
  - Bounce: bounce-in, bounce-out
  - Rotate: rotate-in, spin
  - Blur: blur-in, blur-out
  - Combined: fade-slide-up, scale-fade
  - Special: typewriter

- **Duration**: Animation duration (0.5-3 seconds)
- **Easing**: Animation curve (ease-in-out, ease-in, ease-out)

### Tab 5: Layer

- **Layer Index**: Controls stacking order (higher = on top)

### Responsive Settings

- **Mobile Font Size**: Font size for mobile devices
- **Mobile Position**: Position adjustments for mobile

---

## Managing Templates

### Template List View

**Features:**
- Search templates by name
- Filter by category (all, invitation, announcement, save-the-date, general)
- Sort by date created
- View thumbnail and duration

### Template Actions

**Edit Template:**
1. Click **"Edit"** on any template
2. Modify overlays, position, timing, or styling
3. Click **"Save Changes"**

**Delete Template:**
1. Click **"Delete"** on any template
2. Confirm deletion
3. Template and all assignments will be removed

**Set as Featured:**
1. Click the star icon to toggle featured status
2. Featured templates appear first in user gallery

**Activate/Deactivate:**
- Toggle active status to show/hide templates from users

---

## Best Practices

### Video Selection

✅ **DO:**
- Use high-quality videos (1920x1080)
- Keep duration under 30 seconds for best performance
- Use videos with clear, uncluttered backgrounds
- Test video on mobile devices

❌ **DON'T:**
- Upload videos with baked-in text
- Use extremely long videos (>60 seconds)
- Use low-resolution videos (<720p)

### Overlay Configuration

✅ **DO:**
- Position text in clear areas of the video
- Use contrasting colors for readability
- Test overlays at different video timestamps
- Use appropriate animations for the mood
- Set responsive positions for mobile

❌ **DON'T:**
- Overlap overlays unnecessarily
- Use too many overlays (keep it simple)
- Use unreadable fonts or sizes
- Set overlays outside video bounds

### Timing

✅ **DO:**
- Give overlays enough time to be read (3-5 seconds minimum)
- Use smooth entrance/exit animations (1 second duration)
- Stagger overlay appearances for visual flow

❌ **DON'T:**
- Make overlays flash too quickly (<2 seconds)
- Overlap too many animations simultaneously

### Animation Selection

**Formal/Elegant:** 
- Use: fade, fade-in, fade-out
- Colors: Gold, white, champagne

**Fun/Playful:**
- Use: bounce-in, slide-up, scale-up
- Colors: Bright, vibrant colors

**Romantic:**
- Use: fade-slide-up, blur-in, rotate-in
- Colors: Soft pastels, rose gold

**Modern/Clean:**
- Use: slide-left, slide-right, zoom-in
- Colors: Black, white, minimal

---

## Template Categories

### Invitation
Wedding invitations with formal tone. Include: bride, groom names, date, time, venue.

### Announcement
Wedding announcements and save-the-dates. Include: couple names, date, countdown.

### Save-the-Date
Reminder videos before the wedding. Include: date, venue, countdown.

### General
Multi-purpose templates for any occasion.

---

## Troubleshooting

### Video Upload Issues

**Problem**: Upload fails
**Solution**: 
- Check file size (<50MB)
- Verify format (MP4, WebM, MOV)
- Try converting video to H.264 codec

**Problem**: Thumbnail not generated
**Solution**:
- Video might be corrupted
- Try re-encoding video
- Check video has at least 1 second of content

### Overlay Issues

**Problem**: Overlay not visible
**Solution**:
- Check timing (start_time < end_time)
- Verify position is within bounds (0-1920, 0-1080)
- Check layer index
- Verify color contrast with video

**Problem**: Animation not smooth
**Solution**:
- Reduce animation duration
- Use simpler animation types
- Check browser performance

---

## Support

For additional help:
- Contact technical support
- Refer to API Documentation for advanced features
- Check Developer Guide for system architecture

---

**Last Updated**: January 2025  
**Version**: 1.0
