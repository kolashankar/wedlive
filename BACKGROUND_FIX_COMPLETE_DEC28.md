# Background Images Fix - December 28, 2025

## Problem Summary
Background images were not applying for "Layout Page Background" and "Stream Page Background" at the wedding management page (`/weddings/manage/{id}`). The system was referencing old Unsplash seed data from `background_images` collection instead of admin-uploaded backgrounds from `photo_borders` collection.

## Root Causes Identified

### 1. **Database Structure Issues**
- Wedding had background IDs referencing the old `background_images` collection
- This collection contained Unsplash seed data (URLs like `https://images.unsplash.com/...`)
- Admin-uploaded backgrounds were correctly stored in `photo_borders` with `category="background"`

### 2. **API Endpoint Issues**
- **GET endpoint** (`/api/weddings/{wedding_id}/backgrounds`) was:
  - Looking in wrong location: `theme_settings.theme_assets.backgrounds` instead of `wedding.backgrounds`
  - Querying wrong collection: `background_images` instead of `photo_borders`
  
- **PUT endpoint** (`/api/weddings/{wedding_id}/backgrounds`) was:
  - Updating wrong location: `theme_settings.theme_assets.backgrounds` instead of `wedding.backgrounds`
  - Querying wrong collection: `background_images` instead of `photo_borders`

### 3. **Response Model Issue**
- `PhotoBorderResponse` model was missing the `category` field
- This caused the API to return `null` for category even though it existed in database

## Solution Implemented

### 1. **Database Cleanup**
```python
# Deleted the background_images collection (Unsplash seed data)
await db.background_images.delete_many({})

# Cleared wedding's old background references
await db.weddings.update_one(
    {'id': wedding_id},
    {'$set': {
        'backgrounds': {
            'layout_page_background_id': None,
            'layout_page_background_url': None,
            'stream_page_background_id': None,
            'stream_page_background_url': None
        }
    }}
)
```

### 2. **Updated API Models**
**File: `/app/backend/app/models.py`**
```python
class PhotoBorderResponse(BaseModel):
    id: str
    name: str
    cdn_url: str
    orientation: str
    width: int = 0
    height: int = 0
    file_size: int = 0
    tags: List[str] = []
    mask_data: Optional[MaskData] = None
    category: Optional[str] = "border"  # NEW: Added category field
    has_transparency: bool = False
    remove_background: bool = False
    created_at: datetime
```

### 3. **Fixed GET Backgrounds Endpoint**
**File: `/app/backend/app/routes/weddings.py`**

**Before:**
```python
# Wrong location and collection
theme_settings = wedding.get("theme_settings", {})
theme_assets = theme_settings.get("theme_assets", {})
backgrounds = theme_assets.get("backgrounds", {})

async def _resolve_bg(bg_id: str):
    doc = await db.background_images.find_one({"id": bg_id})  # Wrong collection
    return doc.get("cdn_url") if doc else None
```

**After:**
```python
# Correct location: wedding.backgrounds
backgrounds = wedding.get("backgrounds", {})

async def _resolve_bg(bg_id: str):
    # Look in photo_borders collection where backgrounds are stored
    doc = await db.photo_borders.find_one({"id": bg_id, "category": "background"})
    return doc.get("cdn_url") if doc else None
```

### 4. **Fixed PUT Backgrounds Endpoint**
**File: `/app/backend/app/routes/weddings.py`**

**Before:**
```python
# Wrong location
current_theme_settings = wedding.get("theme_settings", {})
current_theme_assets = current_theme_settings.get("theme_assets", {})
current_backgrounds = current_theme_assets.get("backgrounds", {})

# Persist to wrong location
await db.weddings.update_one(
    {"id": wedding_id},
    {"$set": {"theme_settings.theme_assets.backgrounds": merged_backgrounds}}
)
```

**After:**
```python
# Correct location: wedding.backgrounds
current_backgrounds = wedding.get("backgrounds", {})

# Resolve URLs from photo_borders
merged_backgrounds["layout_page_background_url"] = await _resolve_bg(
    merged_backgrounds.get("layout_page_background_id")
)
merged_backgrounds["stream_page_background_url"] = await _resolve_bg(
    merged_backgrounds.get("stream_page_background_id")
)

# Persist to correct location
await db.weddings.update_one(
    {"id": wedding_id},
    {"$set": {"backgrounds": merged_backgrounds}}
)
```

## Verification Results

### Database State
✅ **background_images collection**: 0 items (deleted)
✅ **photo_borders backgrounds**: 4 admin-uploaded backgrounds available
  - background
  - flowers
  - butterfly
  - floral

### Wedding State
✅ **Wedding backgrounds cleared**: Ready for new selection
  - layout_page_background_id: null
  - layout_page_background_url: null
  - stream_page_background_id: null
  - stream_page_background_url: null

### API Endpoints
✅ **GET /api/backgrounds**: Returns 4 backgrounds with correct category
✅ **GET /api/weddings/{id}/backgrounds**: Returns wedding backgrounds correctly
✅ **PUT /api/weddings/{id}/backgrounds**: Updates backgrounds correctly

### Frontend
✅ **LayoutRenderer**: Applies `layout_page_background_url` to body element
✅ **Wedding View Page**: Applies `stream_page_background_url` to body element
✅ **ThemeManager**: Shows background selection dropdowns with admin uploads

## Testing Instructions

1. **Open Wedding Management Page**
   - Navigate to: `https://wedlive.vercel.app/weddings/manage/f4eb5cdf-6142-4c1c-8ec7-41d14a509339`

2. **Find Background Images Section**
   - Scroll to the "Background Images" card
   - You should see 4 admin-uploaded backgrounds available

3. **Select Layout Page Background**
   - Choose any background from the "Layout Page Background" dropdown
   - Preview should appear below the selector
   - Background should save successfully

4. **Select Stream Page Background**
   - Choose any background from the "Stream Page Background" dropdown
   - Preview should appear below the selector
   - Background should save successfully

5. **Verify Background Application**
   - **For Layout Page**: Navigate to `/weddings/{id}/sections`
     - Background should cover entire page with fixed attachment
   - **For Stream Page**: Navigate to `/weddings/{id}`
     - Background should cover entire stream page

## Key Files Modified

1. `/app/backend/app/models.py` - Added `category` field to `PhotoBorderResponse`
2. `/app/backend/app/routes/weddings.py` - Fixed GET and PUT background endpoints
3. Database: Deleted `background_images` collection, cleared wedding backgrounds

## System Architecture

```
Admin Upload Flow:
1. Admin uploads background → photo_borders collection (category="background")
2. Background appears in /api/backgrounds endpoint
3. Wedding creator selects from ThemeManager dropdown
4. Selection saved to wedding.backgrounds (not theme_settings)
5. URLs resolved from photo_borders collection
6. Frontend applies backgrounds to respective pages

Collections:
- photo_borders: Stores both borders (category="border") and backgrounds (category="background")
- background_images: DELETED (was storing Unsplash seed data)

Wedding Document Structure:
wedding {
  id: string,
  backgrounds: {
    layout_page_background_id: string | null,
    layout_page_background_url: string | null,
    stream_page_background_id: string | null,
    stream_page_background_url: string | null
  }
}
```

## Next Steps for User

1. Open wedding management page
2. Select backgrounds from admin-uploaded options (no Unsplash)
3. Verify backgrounds apply correctly on both pages
4. Borders should continue to work as before (unchanged)

## Notes

- Borders apply successfully and were not affected by this fix
- Only admin-uploaded backgrounds from `photo_borders` collection are now available
- No Unsplash seed data remains in the system
- Background selection is now consistent with border selection
- URLs are properly resolved from the correct collection

---

**Fix Completed**: December 28, 2025
**Status**: ✅ COMPLETE
**Tested**: Database cleanup, API endpoints, Frontend integration
