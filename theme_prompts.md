# WedLive Wedding Theme Development Prompts

## Complete Theme Generation Guide for Dynamic Masked Border System

**Project Context:** WedLive is a wedding streaming platform with a sophisticated dynamic border and masking system. Each theme must integrate with the backend's auto-crop engine that applies irregular masked borders to photos.

---

## System Architecture Overview

### Data Flow
1. **Admin uploads border images** with mask definitions (SVG paths or polygon points)
2. **Creator selects border** for each photo section
3. **Backend auto-crop engine** processes photos:
   - Downloads original photo
   - Applies mask based on border definition
   - Crops photo to fit mask shape
   - Composites photo + border
   - Uploads cropped result to Telegram CDN
4. **Frontend theme** displays the pre-cropped bordered images

### Key Sections (All Themes Must Implement)

**Section 1: Cover/Couple Photos**
- Mode A: Single couple photo with border
- Mode B: Separate bride & groom photos (groom border is mirrored)
- Data: `weddingData.section_config.section_1_cover`
- Always use `cropped_url` (has border applied)

**Section 2: Live Stream/YouTube**
- Embeds YouTube Live URL or recorded video
- Data: `weddingData.live_stream_url` or `weddingData.youtube_url`
- Already implemented in existing system

**Section 3: Studio Section**
- Studio photo with border
- Studio details (name, logo, contact, email, phone, website)
- Data: `weddingData.section_config.section_3_studio`

**Section 4: Precious Moments**
- Photo gallery with borders (2-4 photos per theme)
- Each photo has its own masked border
- Data: `weddingData.section_config.section_4_precious.photos`
- Photo count determined by border's mask configuration

**Background**
- Dynamic background image
- Data: `weddingData.section_config.background_url`
- Applied as full-page background

---

## Technical Requirements (All Themes)

### Required Technologies
```javascript
'use client';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Mail, Phone, Globe, MapPin, [ThemeIcon] } from 'lucide-react';
import { useFont } from '@/contexts/FontContext';
```

### Component Structure Template
```javascript
export default function ThemeName({ weddingData, themeSettings }) {
  const { fontMappings, updateFont } = useFont();
  
  // Extract section config
  const sectionConfig = weddingData?.section_config || {};
  const section1 = sectionConfig.section_1_cover || {};
  const section3 = sectionConfig.section_3_studio || {};
  const section4 = sectionConfig.section_4_precious || {};
  const backgroundUrl = sectionConfig.background_url || '';

  // Section 1: Cover photos
  const coverMode = section1.mode || 'single';
  const couplePhoto = section1.couple_photo?.cropped_url || section1.couple_photo?.original_url;
  const bridePhoto = section1.bride_photo?.cropped_url || section1.bride_photo?.original_url;
  const groomPhoto = section1.groom_photo?.cropped_url || section1.groom_photo?.original_url;

  // Section 3: Studio
  const studioPhoto = section3.studio_photo?.cropped_url || section3.studio_photo?.original_url;
  const studioName = section3.studio_name || '';
  const studioLogo = section3.studio_logo_url || '';
  const studioContact = section3.studio_phone || section3.studio_contact || '';
  const studioEmail = section3.studio_email || '';
  const studioWebsite = section3.studio_website || '';

  // Section 4: Precious Moments
  const preciousPhotos = (section4.photos || []).map(photo => ({
    url: photo.cropped_url || photo.original_url,
    id: photo.photo_id
  }));

  // Wedding info
  const brideName = weddingData?.bride_name || 'Bride';
  const groomName = weddingData?.groom_name || 'Groom';
  const scheduledDate = weddingData?.scheduled_date;
  const location = weddingData?.location;
  const customFont = themeSettings?.custom_font || '[DefaultFont]';
  const primaryColor = themeSettings?.primary_color || '#[color]';
  const secondaryColor = themeSettings?.secondary_color || '#[color]';

  // Font setup
  const selectedFont = fontMappings[customFont] || fontMappings['[DefaultFont]'];
  useEffect(() => {
    if (customFont) updateFont(customFont);
  }, [customFont, updateFont]);

  // Return theme JSX
}
```

### Critical Rules
1. **Always use `cropped_url`** first (has border applied by backend)
2. **Fallback to `original_url`** only if cropped doesn't exist
3. **Never hardcode data** - always pull from props
4. **Always null-check** before accessing nested properties
5. **Responsive design** - mobile, tablet, desktop
6. **Preserve aspect ratios** - borders are pre-applied, just display the image
7. **Photo count limits** - Precious Moments section respects border's mask count (2-4 photos)

### Animation Guidelines
- Use Framer Motion for all animations
- Keep animations subtle and performant
- Add hover effects on photos and buttons
- Implement entrance animations (fade-in, slide-up, scale)
- Consider theme-specific particle effects (flowers, sparkles, etc.)

### YouTube Integration
```javascript
// YouTube embed example
{weddingData.youtube_url && (
  <div className="aspect-video">
    <iframe
      width="100%"
      height="100%"
      src={weddingData.youtube_url.replace('watch?v=', 'embed/')}
      title="Wedding Live Stream"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
)}
```

---

## Theme 1: BaseThemeStructure (Reference Template)

### Purpose
This is NOT a usable theme - it's a reference template showing the exact data structure and implementation pattern all themes must follow.

### Implementation Prompt
```
Create a comprehensive 900+ line BaseThemeStructure.js component that serves as:
1. Complete reference implementation for all 4 sections
2. Detailed inline documentation explaining:
   - Data sources for each section
   - Border/mask system integration
   - Auto-crop workflow
   - Fallback patterns
   - Null safety patterns
3. Example implementations of:
   - Single vs separate couple mode
   - Studio section with all fields
   - Precious moments photo grid
   - YouTube video embed
   - Dynamic background application
4. Code comments explaining:
   - Why we use cropped_url over original_url
   - How the backend mask system works
   - What happens during auto-crop
   - Migration path for existing themes
5. Advanced features:
   - Multiple photo grid layouts
   - Different border display styles
   - Responsive breakpoints
   - Accessibility patterns
   - Loading states
   - Error boundaries
6. Include comprehensive JSDoc comments
7. Add PropTypes or TypeScript interfaces
8. Example animation variants
9. Performance optimization tips
10. Theme customization examples
```

### Key Features
- Clean, minimal styling (not meant to be beautiful)
- Extensive documentation in comments
- All sections clearly labeled
- Multiple implementation examples
- Shows best practices

### Line Count Target: 900+ lines
- 100 lines: Imports and component setup
- 200 lines: Data extraction with comments
- 300 lines: Section 1 implementation with examples
- 100 lines: Section 2 (video) implementation
- 150 lines: Section 3 (studio) implementation
- 150 lines: Section 4 (precious moments) variations
- 100 lines: Footer and utility functions

---

## Theme 2: CinemaScope (Dark Cinematic)

### Design Concept
**Vibe:** Netflix-style, dramatic movie poster aesthetic, dark mode, film reel motifs

### Visual Identity
- **Colors:** 
  - Background: Slate-900 (#0f172a)
  - Primary: Red-500 (#ef4444)
  - Secondary: Amber-400 (#fbbf24)
  - Text: White with subtle glow
- **Fonts:** 'Cinzel' for names (dramatic serif), 'Inter' for details
- **Special Effects:**
  - Film grain overlay (10% opacity)
  - Floating film particles (80 particles)
  - Red glow around photos
  - Film reel icon decorations
  - Spotlight effects

### Implementation Prompt
```
Create a comprehensive 900+ line CinemaScope.js theme with:

1. BACKGROUND & ATMOSPHERE (100 lines)
   - Full-screen slate-900 background with optional dynamic background image
   - Film grain SVG filter overlay (fixed position, 10% opacity)
   - 80 floating white particles simulating film dust (motion animations)
   - Spotlight gradient effects

2. HERO SECTION (200 lines)
   - Film reel icon at top (Lucide Film icon, 64px, yellow-400)
   - Cover photos with red borders and glow effect:
     * Single mode: Large photo (320px x 384px) with red border, glow shadow
     * Separate mode: Two photos (256px x 320px each) with red borders
     * Bride/Groom name labels below each photo
   - Names in massive Cinzel font (6xl/8xl) with amber glow
   - Date in gray-300 with proper formatting
   - Location with MapPin icon
   - Film strip border decoration

3. YOUTUBE/VIDEO SECTION (150 lines)
   - Movie theater frame around video
   - Red velvet curtain CSS decoration
   - Popcorn/cinema themed icons
   - "NOW SHOWING" banner above video
   - Proper aspect ratio handling
   - Fullscreen button integration

4. STUDIO SECTION (200 lines)
   - "CAPTURED BY" heading in cinematic style
   - Studio photo with film frame border
   - Red carpet themed decoration
   - Studio logo with spotlight effect
   - Contact details with film-themed icons
   - "Visit Website" with camera icon
   - Dark backdrop with blur

5. PRECIOUS MOMENTS GALLERY (200 lines)
   - "OUR PRECIOUS MOMENTS" in glowing text
   - Grid layout: 2 cols mobile, 3 tablet, 4 desktop
   - Each photo in film strip frame with red border
   - Hover effect: scale + increased glow
   - Photo counter badges (like film frames)
   - Masonry layout option
   - Loading skeleton states

6. INTERACTIVE ELEMENTS (100 lines)
   - "Watch Wedding" button: Red pill shape, pulsing animation, Play icon
   - Fixed position (top-right, z-50)
   - Hover: Brighten + scale
   - Click: Opens /weddings/[id]?live=true in new tab
   - Additional "Director's Cut" button option

7. ANIMATIONS (50 lines)
   - Film particles: opacity [0,1,0], scale [0,1,0], 2s duration
   - Photos: entrance fade-in, hover scale 1.05
   - Text: slide-up with stagger
   - Film grain: subtle shifting
   - Spotlight: gentle drift

TECHNICAL REQUIREMENTS:
- Import Film, Camera, Clapperboard icons from lucide-react
- Film grain SVG: <svg><filter><feTurbulence/></filter></svg>
- All animations 60fps smooth
- Lazy load images
- Proper semantic HTML
- ARIA labels for accessibility

DESIGN POLISH:
- Box shadows with red glow: '0 0 50px rgba(239, 68, 68, 0.5)'
- Border style: 4px solid red-500
- Text shadow for names: '0 0 30px #fbbf24'
- Backdrop blur on sections: backdrop-blur-sm
- Footer: slate-950/70 with copyright and WedLive credit

RESPONSIVE:
- Mobile: Stack all elements, reduce particle count to 40
- Tablet: 2-column grid for moments
- Desktop: 4-column grid, full effects

Line count: 900+ with detailed comments
```

### Key Features
- Film grain texture overlay
- Particle system (80 floating dots)
- Red/amber color scheme
- Movie poster layout
- Cinematic typography
- Film reel decorations

### Line Count Target: 900+ lines
- 150 lines: Imports, setup, particle generation
- 200 lines: Hero section with film effects
- 150 lines: Video section with cinema frame
- 150 lines: Studio section with spotlight
- 200 lines: Precious moments with film strips
- 100 lines: Footer, animations, utilities

---

## Theme 3: FloralGarden (Romantic Pastel)

### Design Concept
**Vibe:** Soft, romantic, spring garden with watercolor florals

### Implementation Prompt
```
Create a comprehensive 900+ line FloralGarden.js theme with:

1. BACKGROUND & ATMOSPHERE (100 lines)
   - Gradient background: rose-50 → pink-50 → purple-50
   - Optional dynamic background image overlay
   - 20 floating floral emojis (🌸) with slow animation
   - Watercolor wash effects (CSS gradients)
   - Soft blur overlays

2. HERO SECTION (200 lines)
   - Floral wreath decoration around names
   - Cover photos with rounded-2xl borders and shadows:
     * Single mode: 320px x 384px with soft pink shadow
     * Separate mode: 256px x 320px each, bride=rose-500, groom=purple-600
   - Names in 'Great Vibes' cursive (6xl/8xl) with rose-600 color
   - Soft pastel name badges below separate photos
   - Date with floral icon decoration
   - Location with rose icon
   - Petal trail decorations

3. YOUTUBE/VIDEO SECTION (150 lines)
   - Floral frame around video (CSS border-image with floral pattern)
   - Rose vine decorations on corners
   - "Our Love Story" heading in cursive
   - Play button with rose color
   - Soft shadow effects

4. STUDIO SECTION (200 lines)
   - "CAPTURED BY" with flower icons
   - Studio photo in rounded-2xl frame with shadow
   - White/80 backdrop with blur
   - Soft pastel contact cards
   - Rose and purple themed icons
   - Gentle hover effects

5. PRECIOUS MOMENTS GALLERY (200 lines)
   - "OUR PRECIOUS MOMENTS" in Great Vibes font
   - Grid: 2 cols mobile, 3 tablet, 4 desktop
   - Each photo: rounded-2xl, shadow-lg
   - Gradient overlay: pink-500/20 to transparent
   - Hover: scale 1.05, lift effect
   - Flower border decorations
   - Photo captions with floral bullets

6. INTERACTIVE ELEMENTS (100 lines)
   - "Watch Wedding" button: Pink-purple gradient, rounded-full
   - Fixed top-right with Play icon
   - Soft shadow-lg
   - Hover: brightness increase
   - Petal animation on click

7. ANIMATIONS (50 lines)
   - Floating florals: y [0, -10, 0], rotate [0, 5, 0], 4s ease-in-out
   - Photos: fade-in with scale
   - Text: stagger fade-up
   - Petals: drift and fade
   - Hover: gentle lift

DESIGN DETAILS:
- Box shadows: soft with pink tint
- Border radius: rounded-2xl (16px) for softness
- Gradient overlays for depth
- Watercolor textures (subtle)
- Footer: white/40 with pink-purple text

COLOR PALETTE:
- Primary: #f43f5e (rose-500)
- Secondary: #a855f7 (purple-600)
- Background: Pastel gradient
- Text: Gray-700

Line count: 900+ with extensive floral decorations
```

### Key Features
- Floating floral animations (20 flowers)
- Soft pastel color scheme
- Rounded borders for softness
- Watercolor effects
- Romantic typography

### Line Count Target: 900+ lines

---

## Theme 4: ModernMinimalist (Apple-esque Clean)

### Design Concept
**Vibe:** Maximum whitespace, clean typography, subtle shadows, elegant simplicity

### Implementation Prompt
```
Create a comprehensive 900+ line ModernMinimalist.js theme with:

1. BACKGROUND & ATMOSPHERE (80 lines)
   - Pure white background (#ffffff)
   - Optional subtle dynamic background (desaturated)
   - No particle effects (minimalist)
   - Geometric line decorations (thin, gray-200)

2. HERO SECTION (250 lines)
   - Split layout: 50/50 on desktop, stacked on mobile
   - Left side: Fixed cover photo (full height)
   - Right side: Scrollable content
   - Cover photos with clean shadows (no borders):
     * Single mode: 384px x 500px, shadow-2xl
     * Separate mode: 288px x 384px each, shadow-xl
   - Names in 'Montserrat' light (6xl/8xl), gray-900
   - Minimal name labels (white bg, gray-900 text)
   - Date in clean gray-600
   - Location with minimal MapPin icon
   - Thin divider lines (1px, gray-200)

3. YOUTUBE/VIDEO SECTION (150 lines)
   - Clean video embed with minimal frame
   - Aspect ratio 16:9 preserved
   - Thin border (1px, gray-200)
   - "Watch Our Story" in minimal typography
   - Play button: blue-500, simple circle
   - Lots of whitespace around video

4. STUDIO SECTION (200 lines)
   - "CAPTURED BY" in light weight font
   - Studio photo: clean shadow, no border
   - Gray-50 subtle background
   - Studio info in clean cards
   - Icons: minimal, blue-500
   - Generous spacing
   - Typography hierarchy

5. PRECIOUS MOMENTS GALLERY (200 lines)
   - "OUR PRECIOUS MOMENTS" minimal heading
   - Grid: 2 cols mobile, 3 tablet, 4 desktop
   - Photos: shadow-md, no borders
   - Hover: scale 1.02 (subtle)
   - Clean spacing (16px gaps)
   - Masonry layout option
   - Lazy loading

6. INTERACTIVE ELEMENTS (70 lines)
   - "Watch Wedding" button: Blue-500, rounded-full
   - Minimal shadow
   - Hover: slight brightness
   - Clean transitions

7. ANIMATIONS (50 lines)
   - Smooth scroll behavior
   - Fade-in on scroll
   - Subtle parallax (if dynamic bg)
   - Minimal hover effects
   - All 60fps smooth

DESIGN PRINCIPLES:
- Maximum whitespace (24-32px between sections)
- Typography: font-light for body, font-normal for headings
- Shadows: subtle (shadow-sm to shadow-lg)
- No gradients (solid colors only)
- Clean borders: 1px, gray-200
- Footer: minimal, gray-50 bg

COLOR PALETTE:
- Primary: #3b82f6 (blue-500) - sparingly
- Background: #ffffff
- Text: #000000, #4b5563 (gray-600)
- Borders: #e5e7eb (gray-200)

Line count: 900+ with extensive spacing and layout variations
```

### Key Features
- Split-screen layout
- Maximum whitespace
- Clean shadows (no borders)
- Light typography
- Subtle interactions

### Line Count Target: 900+ lines

---

## Theme 5: PremiumWeddingCard (Gold Luxury)

### Design Concept
**Vibe:** Luxurious invitation card, gold foil effects, amber gradients, sparkle

### Implementation Prompt
```
Create a comprehensive 900+ line PremiumWeddingCard.js theme with:

1. BACKGROUND & ATMOSPHERE (100 lines)
   - Gradient: amber-50 → orange-50
   - Optional dynamic background (warm tones)
   - 40 sparkle particles (Sparkles icon, amber-400, opacity 0.3)
   - Shimmer overlay effect
   - Golden light rays

2. HERO SECTION (200 lines)
   - Invitation card frame: white/90 backdrop-blur
   - Rounded-3xl with shadow-2xl
   - Border: 4px solid amber-200
   - Cover photos with 8px amber-300 borders:
     * Single mode: 320px x 384px in rounded-2xl
     * Separate mode: 256px x 320px each
   - Names in 'Playfair Display' (6xl/7xl) with amber shadow
   - Gold badge labels below photos
   - Date with amber-800 text
   - Location with gold MapPin
   - Ornate corner decorations

3. YOUTUBE/VIDEO SECTION (150 lines)
   - Golden ornate frame around video
   - Corner flourishes (SVG or CSS)
   - "Our Love Journey" in Playfair Display
   - Amber play button
   - Invitation card style container

4. STUDIO SECTION (200 lines)
   - "CAPTURED BY" with gold text
   - White bg with amber border card
   - Studio photo: 4px amber-300 border, rounded-xl
   - Gold themed contact icons
   - Premium card styling
   - Amber-800 text color

5. PRECIOUS MOMENTS GALLERY (200 lines)
   - "OUR PRECIOUS MOMENTS" in Playfair
   - Grid layout with generous spacing
   - Each photo: 4px amber-300 border, rounded-xl
   - Shadow-lg with amber tint
   - Hover: scale 1.05, brightness
   - Gold frame decorations

6. INTERACTIVE ELEMENTS (100 lines)
   - "Watch Wedding" button: Amber gradient, bold
   - Fixed top-right, shadow-lg
   - Sparkle animation on hover
   - Gold Play icon

7. ANIMATIONS (50 lines)
   - Sparkles: static positions with opacity pulse
   - Photos: entrance with scale
   - Shimmer effect on text
   - Card: gentle floating animation

DESIGN DETAILS:
- Box shadows: amber tinted
- Borders: thick (4-8px), amber-300
- Typography: Playfair Display (elegant serif)
- Backdrop blur for layering
- Footer: white/50, amber text

COLOR PALETTE:
- Primary: #d97706 (amber-600)
- Secondary: #92400e (amber-900)
- Accent: #fef3c7 (amber-100)
- Background: Warm gradient

Line count: 900+ with extensive luxury styling
```

### Key Features
- Invitation card frame
- Gold foil effects
- Sparkle particles (40)
- Thick golden borders
- Luxurious typography

### Line Count Target: 900+ lines

---

## Theme 6: RomanticPastel (Hearts & Dreams)

### Design Concept
**Vibe:** Soft pastels, floating hearts, dreamy gradients, fairy tale romance

### Implementation Prompt
```
Create a comprehensive 900+ line RomanticPastel.js theme with:

1. BACKGROUND & ATMOSPHERE (100 lines)
   - Gradient: pink-100 → purple-100 → blue-100
   - Optional dynamic background (pastel)
   - 20 floating hearts (Heart icon, pink-400, fill-pink-400)
   - Dreamy blur effects
   - Soft light particles

2. HERO SECTION (200 lines)
   - Dreamy atmosphere
   - Cover photos with rounded-3xl:
     * Single mode: 320px x 384px, shadow-2xl
     * Gradient overlay: pink-500/30 to transparent
     * Separate mode: 256px x 320px each
     * Bride overlay: pink-500/30, Groom: purple-500/30
   - Names in 'Dancing Script' (6xl/8xl), pink-500
   - Soft rounded-full badges
   - Date: purple-700
   - Location with heart icon

3. YOUTUBE/VIDEO SECTION (150 lines)
   - Dreamy frame with gradient border
   - Heart decorations on corners
   - "Our Love Story" in Dancing Script
   - Pink play button
   - Soft shadows

4. STUDIO SECTION (200 lines)
   - "CAPTURED BY" with heart icons
   - White/80 backdrop blur card
   - Rounded-3xl styling
   - Studio photo: rounded-2xl, shadow-lg
   - Pastel themed contacts
   - Purple-pink gradients

5. PRECIOUS MOMENTS GALLERY (200 lines)
   - "OUR PRECIOUS MOMENTS" in Dancing Script
   - Grid with soft spacing
   - Photos: rounded-2xl
   - Gradient overlays (pink-500/20)
   - Hover: scale 1.05, lift
   - Heart border decorations

6. INTERACTIVE ELEMENTS (100 lines)
   - "Watch Wedding" button: Pink gradient
   - Heart icon animation
   - Rounded-full, soft shadow
   - Dreamy hover effect

7. ANIMATIONS (50 lines)
   - Hearts: float up and fade, y [0, -20, 0]
   - Photos: fade-in with hearts
   - Text: dreamy blur-in
   - Gradient shifts

DESIGN DETAILS:
- Soft shadows with pink tint
- Rounded-3xl for maximum softness
- Gradient overlays on all images
- Pastel color palette
- Footer: white/40, purple text

COLOR PALETTE:
- Primary: #ec4899 (pink-500)
- Secondary: #a855f7 (purple-600)
- Tertiary: #60a5fa (blue-400)
- Background: Soft pastel gradient

Line count: 900+ with extensive romantic decorations
```

### Key Features
- Floating hearts (20)
- Dreamy gradients
- Soft rounded borders
- Fairy tale colors
- Romantic typography

### Line Count Target: 900+ lines

---

## Theme 7: RoyalPalace (Regal Gold)

### Design Concept
**Vibe:** Royal luxury, deep red and gold, crown motifs, palace grandeur

### Implementation Prompt
```
Create a comprehensive 900+ line RoyalPalace.js theme with:

1. BACKGROUND & ATMOSPHERE (100 lines)
   - Gradient: red-900 → red-800 → red-900
   - Optional dynamic background (palace/royal)
   - 25 golden sparkles (gold particles)
   - Royal pattern overlay (mandala/damask)
   - Shimmer effects

2. HERO SECTION (250 lines)
   - Crown icon at top (64px, yellow-400)
   - Royal frame decoration
   - Cover photos with 8px gold borders:
     * Single mode: 320px x 384px, rounded-lg
     * Border: yellow-400, shadow with gold glow
     * Separate mode: 256px x 320px each
   - Names in 'Playfair Display' (6xl/8xl), yellow-400
   - Golden rounded-full badges
   - Date: yellow-100
   - Location with crown icon
   - Palace pillars decoration (CSS)

3. YOUTUBE/VIDEO SECTION (150 lines)
   - Royal theater frame
   - Gold curtain decorations
   - Crown above video
   - "Royal Ceremony" heading
   - Gold play button
   - Red velvet styling

4. STUDIO SECTION (200 lines)
   - "CAPTURED BY" in gold
   - Red-950/80 backdrop
   - Studio photo: 4px yellow-400 border
   - Gold themed contacts
   - Royal card styling
   - Yellow-100 text

5. PRECIOUS MOMENTS GALLERY (200 lines)
   - "OUR PRECIOUS MOMENTS" in gold
   - Grid with royal spacing
   - Photos: 4px yellow-400 border, rounded-lg
   - Gold frame effect
   - Hover: scale 1.05, gold glow
   - Crown decorations

6. INTERACTIVE ELEMENTS (100 lines)
   - "Watch Wedding" button: Yellow gradient
   - Red-900 text, bold
   - Royal shadow
   - Crown icon

7. ANIMATIONS (50 lines)
   - Sparkles: scale [0,1,0], opacity [0,1,0]
   - Photos: royal entrance animation
   - Gold shimmer on text
   - Crown rotation

DESIGN DETAILS:
- Box shadows with gold glow
- Thick gold borders (4-8px)
- Deep red backgrounds
- Royal patterns
- Footer: red-950/70, yellow text

COLOR PALETTE:
- Primary: #8B0000 (deep red)
- Secondary: #FFD700 (gold)
- Accent: #FFA500 (orange-gold)
- Background: Deep red gradient

Line count: 900+ with extensive royal decorations
```

### Key Features
- Crown decorations
- Gold sparkle particles (25)
- Deep red and gold scheme
- Royal patterns
- Palace-inspired layout

### Line Count Target: 900+ lines

---

## Common Development Guidelines

### Photo Border Integration
```javascript
// The backend has already applied borders and masks
// Simply display the cropped_url - do NOT add CSS borders that conflict
<img 
  src={couplePhoto}  // This URL already has the border composited
  alt="Couple"
  className="w-80 h-96 object-cover"  // Size only, no border
/>

// Optional: Add decorative frame AROUND the already-bordered image
<div className="relative p-2 bg-gradient-to-br from-gold to-amber">
  <img src={couplePhoto} alt="Couple" />
</div>
```

### Precious Moments Photo Limit
```javascript
// The photo count is determined by the border's mask configuration
// Backend limits uploads based on border (2-4 photos)
const preciousPhotos = (section4.photos || []).slice(0, 4);  // Max 4

// Display message if no photos yet
{preciousPhotos.length === 0 && (
  <p className="text-center text-gray-500">
    No precious moments uploaded yet
  </p>
)}

// Grid adapts to photo count
<div className={`grid gap-4 ${
  preciousPhotos.length === 2 ? 'grid-cols-2' :
  preciousPhotos.length === 3 ? 'grid-cols-3' :
  'grid-cols-2 md:grid-cols-4'
}`}>
```

### YouTube URL Handling
```javascript
// Check for both live_stream_url and youtube_url
const videoUrl = weddingData.youtube_url || weddingData.live_stream_url;

// Convert watch URL to embed URL
const embedUrl = videoUrl?.includes('youtube.com') 
  ? videoUrl.replace('watch?v=', 'embed/')
  : videoUrl;

// Render if available
{embedUrl && (
  <section className="video-section">
    <h2>Watch Our Wedding</h2>
    <div className="aspect-video">
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  </section>
)}
```

### Responsive Grid Patterns
```javascript
// Mobile-first responsive grid
<div className="
  grid gap-4
  grid-cols-1           // Mobile: single column
  sm:grid-cols-2        // Tablet: 2 columns
  md:grid-cols-3        // Medium: 3 columns
  lg:grid-cols-4        // Desktop: 4 columns
">

// Flexbox alternative for centered items
<div className="
  flex flex-wrap justify-center gap-8
  px-4                  // Mobile padding
  md:px-8               // Tablet padding
  lg:px-16              // Desktop padding
">
```

### Animation Performance
```javascript
// Use transform and opacity for 60fps animations
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: 'easeOut' }
  }
};

// Stagger children animations
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Usage
<motion.div
  initial="hidden"
  animate="visible"
  variants={container}
>
  {items.map(item => (
    <motion.div key={item.id} variants={fadeIn}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Error Boundaries and Loading States
```javascript
// Always check for data before rendering
{studioName ? (
  <section className="studio-section">
    {/* Studio content */}
  </section>
) : (
  <section className="studio-section opacity-50">
    <p>Studio details not available</p>
  </section>
)}

// Image loading states
<img 
  src={couplePhoto} 
  alt="Couple"
  loading="lazy"  // Browser native lazy loading
  onError={(e) => {
    e.target.src = '/placeholder-couple.jpg';  // Fallback image
  }}
/>
```

---

## Testing Checklist

Each theme must be tested for:

### Data Scenarios
- [ ] Single couple mode with border
- [ ] Separate bride/groom mode with mirrored borders
- [ ] Studio section with all fields populated
- [ ] Studio section with missing fields
- [ ] Precious moments with 2 photos
- [ ] Precious moments with 4 photos
- [ ] Precious moments with 0 photos (empty state)
- [ ] YouTube URL present
- [ ] YouTube URL missing
- [ ] Background image present
- [ ] Background image missing

### Responsive Design
- [ ] Mobile (375px): Single column, stacked layout
- [ ] Tablet (768px): 2-3 column grid
- [ ] Desktop (1280px): 4 column grid, full layout
- [ ] Large desktop (1920px): Maximum width container

### Performance
- [ ] Images lazy load
- [ ] Animations are smooth (60fps)
- [ ] No layout shift during load
- [ ] Particle count reasonable (≤50 for mobile)

### Accessibility
- [ ] All images have alt text
- [ ] Buttons have aria-labels
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

### Browser Compatibility
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari
- [ ] Mobile Chrome

---

## File Structure

```
frontend/components/themes/
├── BaseThemeStructure.js    (900+ lines - reference template)
├── CinemaScope.js          (900+ lines - dark cinematic)
├── FloralGarden.js         (900+ lines - romantic pastel)
├── ModernMinimalist.js     (900+ lines - clean minimal)
├── PremiumWeddingCard.js   (900+ lines - gold luxury)
├── RomanticPastel.js       (900+ lines - hearts & dreams)
├── RoyalPalace.js          (900+ lines - regal gold)
└── index.js                (exports all themes)
```

---

## Notes for Developers

1. **Border System:** The backend auto-crop engine applies borders before the frontend receives images. Never add CSS borders that conflict with the embedded borders.

2. **Photo Limits:** Precious moments photo count is controlled by the border's mask configuration (2-4 slots). The backend enforces upload limits.

3. **YouTube Integration:** Support both `youtube_url` and `live_stream_url` fields. Convert YouTube watch URLs to embed URLs.

4. **Responsive Images:** Use `object-cover` to maintain aspect ratios. The cropped images are pre-sized but may need responsive containers.

5. **Performance:** Keep particle counts reasonable (20-50). Use CSS transforms for animations. Lazy load all images.

6. **Accessibility:** Provide alt text, aria-labels, and keyboard navigation. Ensure color contrast meets WCAG standards.

7. **Error Handling:** Always null-check before accessing nested properties. Provide fallbacks for missing data.

8. **Testing:** Test with real wedding data that has varying amounts of content (some fields missing, different photo counts, etc.).

---

**Last Updated:** January 2025
**Version:** 1.0
**Status:** Production Ready
