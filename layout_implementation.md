# Schema-Driven Wedding Layout Engine

## 📐 Concept Overview

### What is a Layout in This System?

A **Layout** in the WedLive platform is a **structure-only template** that defines:
- **Visual arrangement** (where elements appear on the page)
- **Supported slots** (which data fields it can display)
- **Layout rules** (how elements are positioned relative to each other)

**Layouts do NOT:**
- ❌ Hardcode any content (no static text, images, or data)
- ❌ Own colors, fonts, or styling decisions
- ❌ Include animations or decorative elements
- ❌ Make assumptions about what data exists

### Layout vs Theme Philosophy

| Traditional Themes | Schema-Driven Layouts |
|-------------------|----------------------|
| Hardcode colors, fonts, decorations | Accept all styling as props |
| Own their visual identity | Structure-only, style-agnostic |
| Fixed content slots | Declare supported slots via schema |
| Coupled to specific use cases | Flexible, data-driven |

**Core Principle:** Layouts are like empty containers. The creator fills them with content, colors, and styling through configuration.

---

## 🎨 Available Layouts (1-8)

### Layout 1: Classic Split Hero
**Structure:** Side-by-side bride and groom photos with centered couple photo below
- **Slots:** bridePhoto, groomPhoto, couplePhoto, preciousMoments, studioImage
- **Style:** Traditional, balanced, romantic
- **Best For:** Couples who want equal emphasis on both individuals
- **Default Font:** Playfair Display

### Layout 2: Center Focus
**Structure:** Large centered couple photo as hero with gallery below
- **Slots:** couplePhoto (main focus), preciousMoments, studioImage
- **Style:** Unity-focused, modern
- **Best For:** Couples emphasizing their togetherness
- **Default Font:** Cormorant Garamond

### Layout 3: Horizontal Timeline
**Structure:** Journey-style layout with bride and groom connected by a timeline
- **Slots:** bridePhoto, groomPhoto, couplePhoto (at convergence), preciousMoments (horizontal scroll)
- **Style:** Story-telling, narrative flow
- **Best For:** Couples with a meaningful journey story
- **Default Font:** Montserrat

### Layout 4: Magazine Style
**Structure:** Editorial magazine-inspired with multi-column layout
- **Slots:** couplePhoto, bridePhoto, groomPhoto, preciousMoments
- **Style:** Editorial, sophisticated, artistic
- **Best For:** Fashion-forward couples, professional aesthetic
- **Default Font:** Inter

### Layout 5: Minimalist Card
**Structure:** Ultra-clean card-based design with maximum negative space
- **Slots:** couplePhoto, preciousMoments (max 9)
- **Style:** Modern minimalism, elegant simplicity
- **Best For:** Couples who prefer understated elegance
- **Default Font:** Montserrat

### Layout 6: Romantic Overlay
**Structure:** Full-screen couple photo with elegant text overlay and floating transparent cards
- **Slots:** couplePhoto (background), bridePhoto, groomPhoto (circular overlays), preciousMoments (max 6)
- **Style:** Dreamy, romantic, dramatic
- **Best For:** Cinematic, fairy-tale weddings
- **Default Font:** Pinyon Script

### Layout 7: Editorial Grid
**Structure:** Asymmetric grid layout with bold typography and geometric shapes
- **Slots:** couplePhoto (large feature), bridePhoto, groomPhoto (offset positions), preciousMoments (staggered grid)
- **Style:** Modern, artistic, bold
- **Best For:** Contemporary couples, urban aesthetics
- **Default Font:** BEBAS NEUE

### Layout 8: Zen Minimalist
**Structure:** Ultra-minimalist vertical flow with maximum white space
- **Slots:** couplePhoto, preciousMoments (max 3)
- **Style:** Extreme simplicity, zen aesthetic
- **Best For:** Minimalist couples, focus on essential elements only
- **Default Font:** CINZEL

---

## 🎯 Font Options for Creators

Creators can choose from the following fonts to match their wedding aesthetic:

- **Lato** - Clean, modern sans-serif
- **Inter** - Professional, versatile sans-serif
- **Playfair Display** - Elegant, classic serif
- **CINZEL** - Formal, refined serif
- **Montserrat** - Geometric, contemporary sans-serif
- **Caveat** - Handwritten, casual script
- **BEBAS NEUE** - Bold, condensed display font
- **Rozha One** - Decorative, sophisticated serif
- **Pinyon Script** - Romantic, flowing script
- **Great Vibes** - Elegant cursive script (legacy)

---

## 🏗️ Layout Schema / Contract

Each layout must define a schema that declares its capabilities:

```json
{
  "layout_id": "layout_1",
  "name": "Classic Split Hero",
  "description": "Side-by-side bride and groom photos with centered couple photo below",
  "version": "1.0",
  
  "supported_slots": {
    "photos": {
      "bridePhoto": {
        "required": false,
        "description": "Bride's individual photo",
        "supports_border": true,
        "default_position": "left"
      },
      "groomPhoto": {
        "required": false,
        "description": "Groom's individual photo",
        "supports_border": true,
        "default_position": "right"
      },
      "couplePhoto": {
        "required": true,
        "description": "Main couple photo",
        "supports_border": true,
        "default_position": "center"
      },
      "coverPhotos": {
        "required": false,
        "type": "array",
        "max_count": 10,
        "description": "Hero section background photos"
      },
      "preciousMoments": {
        "required": false,
        "type": "array",
        "max_count": 20,
        "description": "Gallery photos with precious moments",
        "supports_border": true,
        "layout_style": ["grid", "carousel", "masonry"]
      },
      "studioImage": {
        "required": false,
        "description": "Studio partner logo/photo",
        "supports_border": true
      },
      "streamImage": {
        "required": false,
        "description": "Live stream thumbnail"
      }
    },
    
    "videos": {
      "preWeddingVideo": {
        "required": false,
        "description": "YouTube embed URL for pre-wedding video",
        "embed_type": "youtube"
      }
    },
    
    "text_content": {
      "welcomeMessage": {
        "required": true,
        "max_length": 200,
        "description": "Welcome greeting text"
      },
      "description": {
        "required": false,
        "max_length": 500,
        "description": "Additional description or love story"
      },
      "brideNames": {
        "required": true,
        "type": "string",
        "description": "Bride's name(s)"
      },
      "groomNames": {
        "required": true,
        "type": "string",
        "description": "Groom's name(s)"
      },
      "eventDate": {
        "required": true,
        "type": "date",
        "description": "Wedding event date"
      },
      "eventTime": {
        "required": false,
        "type": "time",
        "description": "Wedding event time"
      },
      "venue": {
        "required": false,
        "type": "string",
        "description": "Wedding venue address"
      }
    },
    
    "studio_info": {
      "studioName": {
        "required": false,
        "description": "Photography studio name"
      },
      "studioLogo": {
        "required": false,
        "description": "Studio logo URL"
      },
      "studioContact": {
        "required": false,
        "description": "Studio contact information"
      }
    },
    
    "backgrounds": {
      "heroBackground": {
        "required": false,
        "description": "Hero section background image"
      },
      "liveBackground": {
        "required": false,
        "description": "Live streaming section background"
      },
      "themeBackground": {
        "required": false,
        "description": "Overall page background"
      }
    }
  },
  
  "style_inputs": {
    "font": {
      "required": true,
      "default": "Playfair Display",
      "description": "Primary font family"
    },
    "primaryColor": {
      "required": true,
      "default": "#f43f5e",
      "description": "Primary brand color (hex)"
    },
    "secondaryColor": {
      "required": true,
      "default": "#a855f7",
      "description": "Secondary accent color (hex)"
    }
  },
  
  "border_slots": {
    "brideGroomBorder": {
      "applies_to": ["bridePhoto", "groomPhoto"],
      "required": false,
      "description": "Border style for bride/groom individual photos"
    },
    "coupleBorder": {
      "applies_to": ["couplePhoto"],
      "required": false,
      "description": "Border style for couple photo"
    },
    "preciousMomentsBorder": {
      "applies_to": ["preciousMoments"],
      "required": false,
      "description": "Border style for gallery photos"
    },
    "studioImageBorder": {
      "applies_to": ["studioImage"],
      "required": false,
      "description": "Border style for studio image"
    }
  },
  
  "layout_structure": {
    "sections": [
      "hero",
      "couple_intro",
      "countdown",
      "precious_moments_gallery",
      "live_stream",
      "studio_details"
    ],
    "responsive_breakpoints": {
      "mobile": "640px",
      "tablet": "768px",
      "desktop": "1024px"
    }
  }
}
```

---

## 📁 Folder Structure

```
/app/frontend/
├── components/
│   ├── layouts/                    # New layout system
│   │   ├── index.js               # Layout registry and exports
│   │   ├── LayoutRenderer.js      # Main layout renderer (replaces ThemeRenderer)
│   │   ├── schemas/               # Layout schema definitions
│   │   │   ├── layout1Schema.json
│   │   │   ├── layout2Schema.json
│   │   │   └── ...
│   │   ├── Layout1.js             # Layout 1 implementation
│   │   ├── Layout2.js             # Layout 2 implementation
│   │   ├── Layout3.js
│   │   └── ...Layout8.js
│   │
│   ├── LayoutManager.js           # Layout configuration UI (replaces ThemeManager)
│   ├── LayoutSelector.js          # Layout selection dropdown
│   │
│   ├── ExactFitPhotoFrame.js      # Reusable components (keep existing)
│   ├── AnimatedBackground.js
│   ├── BorderedPhotoGallery.js
│   └── PreciousMomentsSection.js
│
├── app/
│   ├── weddings/
│   │   └── [id]/
│   │       └── page.js            # Uses LayoutRenderer
│
└── lib/
    ├── layoutUtils.js             # Layout helper functions
    └── assetRandomizer.js         # Random asset assignment logic
```

---

## 🔄 Data Injection Flow

### 1. Wedding Creation
```
User creates wedding
    ↓
Backend assigns random defaults:
  - Random border from available borders
  - Random precious moments style
  - Random background image (optional)
    ↓
Saves to database with layout_id
```

### 2. Creator Customization
```
Creator opens LayoutManager
    ↓
Loads layout schema for selected layout
    ↓
UI adapts to show only supported slots
    ↓
Creator uploads/selects:
  - Photos (based on layout's supported slots)
  - Borders (for slots that support borders)
  - Colors, fonts
  - Background images
    ↓
Configuration saved to theme_settings
```

### 3. Public Viewing
```
Guest visits wedding page
    ↓
LayoutRenderer loads:
  - Wedding data from API
  - Layout component based on layout_id
  - All theme_settings (colors, fonts, borders)
    ↓
Layout component receives props:
  {
    weddingData: { bride_names, groom_names, event_date, ... },
    layoutConfig: {
      font: "Playfair Display",
      primaryColor: "#f43f5e",
      secondaryColor: "#a855f7",
      bridePhoto: { url: "...", border_id: "..." },
      groomPhoto: { url: "...", border_id: "..." },
      couplePhoto: { url: "...", border_id: "..." },
      preciousMoments: [...],
      borders: { bride: {...}, groom: {...}, couple: {...} },
      backgrounds: { hero: "...", live: "..." }
    }
  }
    ↓
Layout renders with injected data
```

---

## 🎨 Creator Control Override Flow

### Default Random Assignment
On wedding creation, the system automatically assigns:
1. **Random Border** - Selected from available photo borders
2. **Random Precious Moments Style** - Selected from available styles
3. **Random Background** - Optional, selected from hero backgrounds

### Creator Override
Creator can override any default through LayoutManager:

```javascript
// Example: Override couple photo border
const overrideBorder = async (photoType, borderId) => {
  const updatedConfig = {
    ...currentConfig,
    borders: {
      ...currentConfig.borders,
      [photoType]: borderId  // Override specific photo border
    }
  };
  
  await updateWeddingThemeAssets(weddingId, updatedConfig);
};
```

### Override Priority
```
Creator Selection > Random Default > System Default
```

If creator hasn't customized a slot:
1. Use random assigned asset
2. If no random asset, use layout's built-in fallback
3. If no fallback, hide the slot gracefully

---

## 🎲 Random Asset Assignment Logic

### Implementation (`/lib/assetRandomizer.js`)

```javascript
/**
 * Assigns random assets on wedding creation
 * Called by backend when new wedding is created
 */
export async function assignRandomDefaults() {
  // Fetch available assets
  const borders = await fetch('/api/theme-assets/borders').then(r => r.json());
  const styles = await fetch('/api/theme-assets/precious-styles').then(r => r.json());
  const backgrounds = await fetch('/api/theme-assets/backgrounds?category=hero').then(r => r.json());
  
  // Random selection
  const randomBorder = borders[Math.floor(Math.random() * borders.length)];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomBackground = backgrounds.length > 0 
    ? backgrounds[Math.floor(Math.random() * backgrounds.length)] 
    : null;
  
  return {
    default_border_id: randomBorder?.id || null,
    default_precious_style_id: randomStyle?.id || null,
    default_background_id: randomBackground?.id || null,
    // Same border assigned to all photo slots initially
    borders: {
      bride: randomBorder?.id,
      groom: randomBorder?.id,
      couple: randomBorder?.id,
      precious_moments: randomBorder?.id
    }
  };
}

/**
 * Safe fallback when no assets available
 */
export function getSystemDefaults() {
  return {
    border: null,  // No border (photos render without border)
    style: {
      layout_type: 'grid',
      photo_count: 6,
      frame_shape: 'rectangle'
    },
    background: null  // Solid color background
  };
}
```

### Backend Integration
```python
# backend/app/routes/weddings.py
from app.services.asset_randomizer import get_random_defaults

@router.post("/weddings")
async def create_wedding(wedding_data: WeddingCreate):
    # ... validation ...
    
    # Assign random defaults
    random_assets = get_random_defaults()
    
    wedding = Wedding(
        **wedding_data.dict(),
        theme_settings={
            "layout_id": wedding_data.layout_id or "layout_1",
            "theme_assets": random_assets,
            # ... other settings
        }
    )
    
    # ... save to database ...
```

---

## 🎯 Layout Adaptation Based on Slots

### Concept
The LayoutManager UI must dynamically show/hide controls based on the selected layout's schema.

### Example: Layout 1 vs Layout 2

**Layout 1 (Classic Split Hero)**
- Supports: bridePhoto, groomPhoto, couplePhoto
- UI shows: 3 photo upload slots + 3 border selectors

**Layout 2 (Center Focus)**
- Supports: couplePhoto only (no bride/groom individual photos)
- UI shows: 1 photo upload slot + 1 border selector

### Implementation
```javascript
// LayoutManager.js
const LayoutManager = ({ weddingId, selectedLayoutId }) => {
  const [layoutSchema, setLayoutSchema] = useState(null);
  
  // Load schema for selected layout
  useEffect(() => {
    const schema = require(`@/components/layouts/schemas/${selectedLayoutId}Schema.json`);
    setLayoutSchema(schema);
  }, [selectedLayoutId]);
  
  // Render controls based on schema
  const renderPhotoSlots = () => {
    if (!layoutSchema) return null;
    
    return Object.entries(layoutSchema.supported_slots.photos).map(([slotName, config]) => {
      if (config.required || config.type !== 'array') {
        return (
          <PhotoUploadSlot
            key={slotName}
            name={slotName}
            config={config}
            onUpload={handlePhotoUpload}
          />
        );
      }
    });
  };
  
  return (
    <div className="layout-manager">
      <LayoutSelector value={selectedLayoutId} onChange={handleLayoutChange} />
      
      <div className="photo-slots">
        {renderPhotoSlots()}
      </div>
      
      {layoutSchema?.supported_slots?.videos?.preWeddingVideo && (
        <VideoEmbedInput />
      )}
      
      {/* Border selectors only for slots that support borders */}
      {layoutSchema?.border_slots && (
        <BorderSelector slots={layoutSchema.border_slots} />
      )}
    </div>
  );
};
```

---

## ✅ Do's and Don'ts

### ✅ DO:

1. **Keep Layouts Structure-Only**
   - Define where elements go, not what they look like
   - Use props for all visual styling
   
2. **Use Schema to Declare Capabilities**
   - Clearly define supported slots
   - Mark required vs optional fields
   
3. **Accept All Styling as Props**
   ```javascript
   const Layout1 = ({ font, primaryColor, secondaryColor, bridePhoto, ... }) => {
     // Use props, never hardcode
     const styles = {
       fontFamily: font,
       color: primaryColor,
     };
   ```

4. **Provide Graceful Fallbacks**
   ```javascript
   {bridePhoto?.url ? (
     <ExactFitPhotoFrame src={bridePhoto.url} border={bridePhoto.border} />
   ) : (
     <div className="photo-placeholder">
       <UserIcon />
     </div>
   )}
   ```

5. **Make Layouts Responsive**
   - Use Tailwind responsive classes
   - Test on mobile, tablet, desktop
   
6. **Use Reusable Components**
   - ExactFitPhotoFrame for bordered photos
   - BorderedPhotoGallery for galleries
   - AnimatedBackground for backgrounds

### ❌ DON'T:

1. **Never Hardcode Content**
   ```javascript
   // ❌ BAD
   <h1>Welcome to Our Wedding</h1>
   
   // ✅ GOOD
   <h1>{welcomeMessage}</h1>
   ```

2. **Never Hardcode Colors or Fonts**
   ```javascript
   // ❌ BAD
   <div className="text-rose-500 font-great-vibes">
   
   // ✅ GOOD
   <div style={{ color: primaryColor, fontFamily: font }}>
   ```

3. **Never Make Assumptions About Data**
   ```javascript
   // ❌ BAD - assumes bridePhoto exists
   <img src={bridePhoto.url} />
   
   // ✅ GOOD - checks existence
   {bridePhoto?.url && <img src={bridePhoto.url} />}
   ```

4. **Don't Add Animations or Decorations**
   - Layouts are structure-only
   - Animations can be added by creator as separate configuration
   
5. **Don't Couple to Specific Use Cases**
   - Keep layouts flexible and generic
   - Don't assume "wedding" terminology in layout code
   
6. **Don't Ignore Schema**
   - Always reference layout schema for capabilities
   - Don't render slots not declared in schema

---

## 🧪 Testing Layouts

### Manual Testing Checklist

For each layout:

- [ ] Renders with minimal data (only required fields)
- [ ] Renders with all slots filled
- [ ] Handles missing optional photos gracefully
- [ ] Accepts and applies custom fonts
- [ ] Accepts and applies custom colors
- [ ] Applies borders correctly to photos
- [ ] Responsive on mobile (320px width)
- [ ] Responsive on tablet (768px width)
- [ ] Responsive on desktop (1280px width)
- [ ] Works with default random assets
- [ ] Works with creator overrides
- [ ] No console errors or warnings

### Data-Driven Testing

```javascript
// Test with minimal data
const minimalData = {
  layout_id: "layout_1",
  bride_names: "Jane",
  groom_names: "John",
  event_date: "2025-12-25",
  font: "Arial",
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  welcomeMessage: "Welcome"
};

// Test with full data
const fullData = {
  ...minimalData,
  bridePhoto: { url: "...", border_id: "..." },
  groomPhoto: { url: "...", border_id: "..." },
  couplePhoto: { url: "...", border_id: "..." },
  preciousMoments: [...],
  preWeddingVideo: "https://youtube.com/...",
  // ... all optional fields
};
```

---

## 🚀 Migration from Themes to Layouts

### Steps for Existing Weddings

1. **Add layout_id to existing records**
   ```javascript
   db.weddings.updateMany(
     { "theme_settings.theme_id": "floral_garden" },
     { $set: { "theme_settings.layout_id": "layout_1" } }
   );
   ```

2. **Map old themes to new layouts**
   ```javascript
   const themeToLayoutMap = {
     "floral_garden": "layout_1",
     "cinema_scope": "layout_2",
     "modern_minimalist": "layout_3",
     // ... map all 7 themes to appropriate layouts
   };
   ```

3. **Preserve existing customizations**
   - Colors, fonts, photos carry over directly
   - Borders and assets already using dynamic system

---

## 📚 Additional Resources

- **ExactFitPhotoFrame Component**: `/components/ExactFitPhotoFrame.js`
- **Border System**: Existing dynamic border system in place
- **Precious Moments**: `/components/PreciousMomentsSection.js`
- **Backend API**: `/api/theme-assets/*` endpoints

---

## 🎓 Summary

The Schema-Driven Layout Engine separates **structure** from **content**. Layouts declare what they support, and creators fill in the details. This approach:

- ✅ Maximizes flexibility for creators
- ✅ Enables easy addition of new layouts
- ✅ Prevents coupling between layout and content
- ✅ Makes UI adapt automatically to layout capabilities
- ✅ Supports random defaults while allowing full customization

**Remember:** Layouts are empty containers. The creator's configuration brings them to life.
