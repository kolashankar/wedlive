# Bug Fix: Wedding API 500 Error

## Issue Summary
The wedding details API endpoint (`GET /api/weddings/{wedding_id}`) was returning a 500 Internal Server Error with the message: `'NoneType' object has no attribute 'get'`

## Root Cause Analysis
**Location:** `/app/backend/app/routes/weddings.py` - Line 915

**Problem:** When accessing nested dictionary fields, the code used chained `.get()` calls:
```python
theme_assets_backgrounds = wedding.get("theme_settings", {}).get("theme_assets", {}).get("backgrounds", {})
```

**Issue:** If `wedding["theme_settings"]` exists in the database but is explicitly set to `None`, the `.get("theme_settings", {})` returns `None` instead of the default empty dict `{}`. Then calling `.get("theme_assets", {})` on `None` caused an `AttributeError`.

## Solution Applied
Added proper None-safety checks for nested dictionary access:

```python
# CRITICAL FIX: Add None-safety checks for nested dict access
theme_settings_obj = wedding.get("theme_settings") or {}
theme_assets_obj = theme_settings_obj.get("theme_assets") if isinstance(theme_settings_obj, dict) else {}
theme_assets_backgrounds = theme_assets_obj.get("backgrounds", {}) if isinstance(theme_assets_obj, dict) else {}
```

This ensures:
1. If `theme_settings` is `None`, it defaults to `{}`
2. Each level checks if the object is a dict before calling `.get()`
3. Prevents `AttributeError` when fields are `None`

## Testing Results

### Before Fix:
```bash
curl https://wedlive.onrender.com/api/weddings/b75e23c9-ca5e-4d10-bf20-065169d1a01e
# Response: {"detail":"Internal server error","error":"'NoneType' object has no attribute 'get'"}
# HTTP Status: 500
```

### After Fix:
```bash
curl http://localhost:8001/api/weddings/b75e23c9-ca5e-4d10-bf20-065169d1a01e
# Response: Full wedding data with all fields
# HTTP Status: 200 ✅
```

### 404 Error Handling (Still Works):
```bash
curl http://localhost:8001/api/weddings/non-existent-id
# Response: {"detail":"Wedding not found"}
# HTTP Status: 404 ✅
```

## Impact
- **Fixed:** Wedding details page now loads correctly for all users
- **No Breaking Changes:** Existing functionality preserved
- **Improved Reliability:** Better handling of None/null values in database

## Files Modified
- `/app/backend/app/routes/weddings.py` (Lines 910-921)

## Date Fixed
2025-01-XX (Current session)
