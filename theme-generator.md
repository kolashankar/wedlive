# Wedding Theme System - Theme Generator Prompts

This document contains all 15 theme design prompts for the WedLive wedding streaming platform. Each theme is a complete React component that accepts wedding data and renders a beautiful landing page.

## Theme Component Requirements

### Props Structure
```javascript
const ThemeComponent = ({ wedding, onEnter }) => {
  // wedding object contains:
  // - bride_name, groom_name
  // - scheduled_date, location, description
  // - theme_settings: { custom_font, primary_color, secondary_color, pre_wedding_video, cover_photos, custom_messages, studio_details }
  
  // onEnter: function to navigate to live stream
}
```

### Technical Stack
- **React** (Client Component)
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Player** for video playback (if needed)

---

## Theme 1: "The Floral Garden" (Soft & Romantic)

**Status: ✅ IMPLEMENTED** (See `/app/frontend/components/themes/FloralGarden.js`)

### Design Specifications:
- **Vibe:** Pastel pinks, peaches, and whites. Very airy and clean.
- **Background:** White with watercolor floral borders (roses/peonies) fixed at the corners.
- **Fonts:** 'Great Vibes' (Cursive) for names, 'Montserrat' for details.
- **Hero:** A large circular frame holding the main couple photo, surrounded by animated falling petals.
- **Layout:**
  - Centered hero section with couple names
  - Circular photo frame (if cover photo available)
  - Date and location details
  - Pre-wedding video embed (if available)
  - Photo gallery grid
  - "Watch Live" button (soft pink pill shape with shadow)
- **Animations:**
  - Falling flower petals (continuous loop)
  - Fade-in for text elements
  - Hover effects on buttons
- **Colors:**
  - Primary: #fce7f3 (Pink-100)
  - Secondary: #fbcfe8 (Pink-200)
  - Accent: #f43f5e (Rose-500)
  - Text: #4b5563 (Gray-600)

---

## Theme 2: "The Royal Palace" (Traditional Luxury)

### Design Specifications:
- **Vibe:** Heavy Indian tradition, rich gold and maroon colors.
- **Background:** A subtle mandala pattern on a deep red gradient.
- **Fonts:** 'Cinzel' for headers, 'Lato' for text.
- **Hero:** Bride & Groom names in large gold typography with a "Ganesh" or generic "Mangal Sutra" icon on top.
- **Layout:**
  - Hero Section with golden border
  - Pre-wedding YouTube Video (Gold ornate frame)
  - Photo Gallery (Masonry Grid)
  - "Enter Wedding" Button (Gold, pulsing animation)
- **Decorative Elements:**
  - Corner mandala patterns (CSS-generated or SVG)
  - Golden borders and dividers
  - Shimmer effect on text
- **Animations:**
  - Text shimmer/glow effect
  - Pulsing "Enter" button
  - Fade-in with scale for images
- **Colors:**
  - Primary: #7c2d12 (Red-900)
  - Secondary: #fde68a (Yellow-200)
  - Accent: #f59e0b (Amber-500)
  - Background Gradient: from-red-900 via-red-800 to-red-900

**Key Features:**
- Mandala pattern overlay (opacity: 10%)
- Gold foil text effect
- Traditional Indian motifs
- Regal entrance button

---

## Theme 3: "The Cinema Scope" (Video First)

### Design Specifications:
- **Vibe:** Dark mode, Netflix-style, dramatic.
- **Background:** Full-screen video background (autoplaying the pre-wedding teaser muted), with a dark overlay.
- **Fonts:** 'Bebas Neue' (Tall, bold) for names.
- **Hero:** Text is overlaid at the bottom left (Movie Poster style).
- **Layout:**
  - Full viewport video background
  - Dark gradient overlay (bottom to top)
  - Text content anchored to bottom-left
  - Massive "PLAY MOVIE / WATCH LIVE" button in center
- **Animations:**
  - Fade-in video with blur effect
  - Slide-up text animation
  - Glowing play button
- **Colors:**
  - Background: #0f172a (Slate-900)
  - Overlay: rgba(0, 0, 0, 0.6)
  - Primary: #ef4444 (Red-500)
  - Text: #ffffff

**Key Features:**
- Auto-playing background video
- Cinematic overlay effects
- Large play button with glow
- Movie poster style layout

---

## Theme 4: "The South Indian Temple" (Divine)

### Design Specifications:
- **Vibe:** Temple architecture, banana leaves, marigolds.
- **Colors:** Mustard yellow, leaf green, and white.
- **Decorative Elements:**
  - CSS-generated hanging marigold (genda phool) strings at the top
  - Banana leaf borders on sides
  - Temple gopuram silhouette at top
- **Font:** 'Rozha One' (High contrast serif).
- **Layout:**
  - Temple arch frame around hero section
  - Names with golden glow
  - Traditional kolam pattern in background
  - Mango leaf toranam across top
- **Animations:**
  - Swaying marigold garlands
  - Gentle fade-in for all elements
  - Oil lamp flickering effect (optional)
- **Colors:**
  - Primary: #fef3c7 (Amber-100)
  - Secondary: #84cc16 (Lime-500)
  - Accent: #f59e0b (Amber-500)
  - Background: #fffbeb (Amber-50)

---

## Theme 5: "The Modern Minimalist" (Clean)

### Design Specifications:
- **Vibe:** Apple-esque, lots of whitespace, black text on white.
- **Layout:** Split screen. Left side is the Couple Photo (fixed), Right side is the scrolling details and video.
- **Font:** 'Inter' or 'Helvetica'.
- **Design Principles:**
  - Maximum whitespace
  - Clean typography
  - Subtle shadows
  - Elegant transitions
- **Layout Structure:**
  - 50/50 split on desktop
  - Stacked on mobile
  - Left: Fixed image
  - Right: Scrollable content
- **Animations:**
  - Smooth scroll
  - Fade-in on scroll
  - Subtle parallax
- **Colors:**
  - Background: #ffffff
  - Text: #000000
  - Accent: #3b82f6 (Blue-500)
  - Borders: #e5e7eb (Gray-200)

---

## Theme 6: "The Bollywood Glam" (Sparkle)

### Design Specifications:
- **Vibe:** Glitzy, stars, purple and gold gradients.
- **Animation:** Subtle "glitter" particle effect in the background.
- **Font:** 'Playfair Display' (Italic).
- **Layout:**
  - Dramatic gradient background
  - Sparkle/star particles animation
  - Golden accent borders
  - Glamorous photo frames
- **Effects:**
  - Continuous sparkle particles
  - Shimmer effect on text
  - Lens flare effects
  - Elegant transitions
- **Colors:**
  - Primary: #7c3aed (Violet-600)
  - Secondary: #fbbf24 (Amber-400)
  - Background Gradient: from-purple-900 via-purple-700 to-pink-800
  - Stars: #fef3c7 with glow

---

## Theme 7: "The Rustic Vintage" (Wood & Earth)

### Design Specifications:
- **Vibe:** Wooden textures, twine, polaroid photo styling.
- **Background:** Wood grain texture image.
- **Photos:** Display the couple photos as "Polaroids" scattered on the table (tilted slightly).
- **Layout:**
  - Wooden texture background
  - Polaroid-style photo grid
  - Handwritten font for names
  - Twine decorative elements
  - Vintage paper texture overlays
- **Animations:**
  - Photos rotate slightly on hover
  - Fade-in with scale
  - Paper texture subtle movement
- **Colors:**
  - Primary: #78350f (Brown-800)
  - Secondary: #fef3c7 (Amber-100)
  - Accent: #d97706 (Amber-600)
  - Background: Wood texture (#8b4513)

---

## Theme 8: "The Islamic Nikah" (Elegant Green)

### Design Specifications:
- **Vibe:** Emerald green and gold, Islamic geometric patterns (Jali work).
- **Font:** 'Amiri' or 'Scheherazade New' (Arabic style calligraphy look).
- **Header:** "Bismillah" calligraphy at the top.
- **Layout:**
  - Islamic geometric pattern background
  - "Bismillah" calligraphy header
  - Emerald and gold color scheme
  - Jali-inspired borders
  - Crescent moon decorative elements
- **Animations:**
  - Pattern reveal animation
  - Calligraphy stroke animation (optional)
  - Elegant fade transitions
- **Colors:**
  - Primary: #059669 (Emerald-600)
  - Secondary: #fbbf24 (Amber-400)
  - Background: #ecfdf5 (Emerald-50)
  - Patterns: #064e3b (Emerald-900) at low opacity

---

## Theme 9: "The Christian White Wedding" (Classic)

### Design Specifications:
- **Vibe:** Silver, White, Dove Grey.
- **Font:** 'Pinyon Script' for names.
- **Decorative Elements:** Subtle lace patterns on the sides.
- **Layout:**
  - Clean white background
  - Lace border patterns
  - Silver accent elements
  - Cross or dove motifs (subtle)
  - Elegant script typography
- **Animations:**
  - Gentle fade-in
  - Soft glow effects
  - Lace pattern animation
- **Colors:**
  - Primary: #ffffff
  - Secondary: #d1d5db (Gray-300)
  - Accent: #9ca3af (Gray-400)
  - Text: #374151 (Gray-700)

---

## Theme 10: "The Retro 90s" (Nostalgic)

### Design Specifications:
- **Vibe:** Cassette tapes, neon colors, fun and funky.
- **Font:** 'Righteous' or Pixel font.
- **Frame:** The video player looks like an old TV set.
- **Layout:**
  - Neon gradient background
  - Cassette tape decorations
  - TV frame for video
  - Pixel art elements
  - Retro color palette
- **Animations:**
  - VHS tracking effect
  - Neon glow pulse
  - Pixel art hover effects
- **Colors:**
  - Primary: #ec4899 (Pink-500)
  - Secondary: #06b6d4 (Cyan-500)
  - Tertiary: #fbbf24 (Amber-400)
  - Background: #1f2937 (Gray-800) with neon accents

---

## Theme 11: "The Destination Beach" (Breezy)

### Design Specifications:
- **Vibe:** Blue ocean gradient, palm tree silhouettes.
- **Animation:** Gentle wave animation at the bottom of the screen.
- **Font:** 'Caveat' (Handwritten style).
- **Layout:**
  - Ocean gradient background (light to deep blue)
  - Palm tree silhouettes on sides
  - Animated waves at bottom
  - Beach-themed decorations
  - Seashell and starfish elements
- **Animations:**
  - Wave motion (continuous)
  - Palm trees swaying
  - Clouds drifting
- **Colors:**
  - Primary: #0ea5e9 (Sky-500)
  - Secondary: #22d3ee (Cyan-400)
  - Accent: #fbbf24 (Amber-400)
  - Background Gradient: from-sky-200 to-blue-500

---

## Theme 12: "The Royal Blue" (Formal)

### Design Specifications:
- **Vibe:** Deep Navy Blue and Silver. Very corporate/formal invitation style.
- **Typography:** Centered, very structured, looks like a printed invitation card.
- **Layout:**
  - Navy blue background
  - Silver borders and accents
  - Formal invitation card style
  - Centered symmetrical layout
  - Elegant serif typography
- **Animations:**
  - Subtle fade-in
  - Elegant transitions
  - Silver shimmer effects
- **Colors:**
  - Primary: #1e3a8a (Blue-900)
  - Secondary: #cbd5e1 (Slate-300)
  - Accent: #94a3b8 (Slate-400)
  - Background: #0f172a (Slate-900)

---

## Theme 13: "The Instagram Story" (Mobile Gen-Z)

### Design Specifications:
- **Vibe:** Looks exactly like an Instagram UI.
- **Layout:** Vertical scrolling, stories at the top (photos), "Live" badge pulsing red.
- **Design Elements:**
  - Instagram story circles at top
  - Story-style photo display
  - IG-like UI elements
  - "Live" badge (animated)
  - Modern mobile-first design
- **Animations:**
  - Story circle animations
  - Pulsing live badge
  - Swipe-up indicator
- **Colors:**
  - Background: #000000
  - UI Elements: Instagram colors
  - Live Badge: #ef4444 (Red-500)
  - Text: #ffffff

---

## Theme 14: "The Newspaper" (Vintage Print)

### Design Specifications:
- **Vibe:** Black and white, "The Daily News" style.
- **Layout:** Columns, "Breaking News: They are getting married!" headlines.
- **Design Elements:**
  - Newspaper masthead
  - Column layout
  - Vintage newspaper texture
  - Headline-style typography
  - Classified ad aesthetics
- **Font:** 'Times New Roman' or 'Playfair Display'
- **Layout Structure:**
  - Newspaper header/masthead
  - Multiple column grid
  - Photos as newspaper images
  - "Above the fold" hero content
- **Animations:**
  - Page turn effect
  - Typewriter text reveal
  - Print press texture
- **Colors:**
  - Background: #f9fafb (Gray-50)
  - Text: #000000
  - Accent: #6b7280 (Gray-500)
  - Aged paper effect

---

## Theme 15: "The Telugu Trad" (Pelli Pandiri)

### Design Specifications:
- **Vibe:** Specific focus on Telugu traditions (Mutyala Talambralu).
- **Colors:** White silk (Pattu) texture with Red borders.
- **Decorative Elements:** Mango leaf (Toranam) vector across the top.
- **Layout:**
  - White silk texture background
  - Red and gold borders (Pattu style)
  - Mango leaf toranam at top
  - Kalash (pot) motifs
  - Traditional Telugu patterns
- **Cultural Elements:**
  - Mutyala Talambralu (pearl shower) animation
  - Ganesha imagery
  - Traditional Telugu text/quotes
  - Muhurtham time display
- **Animations:**
  - Falling pearls/rice animation
  - Diya (lamp) flickering
  - Toranam swaying
- **Colors:**
  - Primary: #ffffff (White)
  - Secondary: #dc2626 (Red-600)
  - Accent: #fbbf24 (Amber-400)
  - Borders: Gold gradient

---

## Implementation Guidelines

### Component Structure
```javascript
'use client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ReactPlayer from 'react-player';

export default function ThemeName({ wedding, onEnter }) {
  return (
    <div className="theme-container">
      {/* Hero Section */}
      {/* Video Section (if pre_wedding_video exists) */}
      {/* Photo Gallery (if cover_photos exist) */}
      {/* Enter Button */}
      {/* Studio Footer (if studio_details exist) */}
    </div>
  );
}
```

### Testing Checklist
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Performance (animations don't cause lag)
- [ ] Accessibility (proper contrast, keyboard navigation)
- [ ] Fallbacks (when videos/images aren't available)
- [ ] Cross-browser compatibility
- [ ] Theme customization (fonts, colors) working

### Font Loading
All Google Fonts should be loaded in the main layout or via `next/font`:
```javascript
import { Inter, Great_Vibes, Playfair_Display } from 'next/font/google';
```

---

## Development Priority

1. **COMPLETED:** Floral Garden ✅
2. **Next:** Royal Palace, Modern Minimalist, Cinema Scope
3. **Cultural Themes:** South Indian Temple, Telugu Trad, Islamic Nikah
4. **Fun Themes:** Bollywood Glam, Retro 90s, Instagram Story
5. **Classic Themes:** Rustic Vintage, Beach, Royal Blue, Newspaper, Christian White

---

*Each theme should be developed as a standalone component in `/app/frontend/components/themes/[ThemeName].js`*
