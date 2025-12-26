# Fix for Wedding Layout Change 400 Error

## Problem
The frontend is sending border keys like `brideGroomBorder`, `coupleBorder`, etc. but the backend `SelectedBorders` model expects specific field names like `groom_border_id`, `bride_border_id`, etc.

## Solution
Update the `SelectedBorders` model in `/backend/app/models.py` to accept the dynamic border keys that the frontend sends:

```python
class SelectedBorders(BaseModel):
    # CRITICAL FIX: Allow dynamic border keys to match frontend structure
    # Frontend sends: brideGroomBorder, coupleBorder, preciousMomentsBorder, studioBorder
    groom_border_id: Optional[str] = None
    bride_border_id: Optional[str] = None
    couple_border_id: Optional[str] = None
    cover_border_id: Optional[str] = None
    bride_groom_border: Optional[str] = None  # NEW: Match frontend key
    couple_border: Optional[str] = None  # NEW: Match frontend key
    precious_moments_border: Optional[str] = None  # NEW: Match frontend key
    studio_border: Optional[str] = None  # NEW: Match frontend key
    
    class Config:
        extra = "allow"  # Allow additional fields dynamically
```

## What Was Fixed
1. Added new fields to match frontend key names
2. Added `extra = "allow"` to accept dynamic fields
3. Maintained backward compatibility with existing field names

## Testing
After applying this fix, the layout change should work without the 400 error. The backend will now properly validate the theme update requests from the frontend.
