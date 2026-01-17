# Fixes Applied - January 9, 2026

## Issue Summary
User reported two critical issues:
1. **CORS/404 errors on `/api/auth/login` endpoint** - Frontend unable to connect to backend
2. **Asset URLs not being converted to proxy URLs** - `get_asset_url` function returning raw Telegram CDN URLs

---

## Fix 1: CORS/404 Error on Auth Login Endpoint

### Root Cause
The frontend `.env` file was configured to connect to an incorrect backend URL:
- **Old URL**: `https://wedlive-frame.preview.emergentagent.com`
- **Actual deployment**: `https://wedlive-frame.preview.emergentagent.com`

This caused:
- 404 errors when trying to reach `/api/auth/login`
- CORS header missing errors
- "Network Error" messages in frontend

### Solution Applied
**File: `/app/frontend/.env`**
```diff
- NEXT_PUBLIC_API_URL=https://wedlive-frame.preview.emergentagent.com
- NEXT_PUBLIC_BACKEND_URL=https://wedlive-frame.preview.emergentagent.com
- REACT_APP_BACKEND_URL=https://wedlive-frame.preview.emergentagent.com
+ NEXT_PUBLIC_API_URL=https://wedlive-frame.preview.emergentagent.com
+ NEXT_PUBLIC_BACKEND_URL=https://wedlive-frame.preview.emergentagent.com
+ REACT_APP_BACKEND_URL=https://wedlive-frame.preview.emergentagent.com
```

**File: `/app/backend/.env`**
```diff
- BACKEND_URL=https://wedlive.onrender.com
+ BACKEND_URL=https://wedlive-frame.preview.emergentagent.com
```

### Verification
```bash
# Auth login endpoint now returns proper 401 for invalid credentials
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
# Response: {"detail":"Invalid email or password"}

# Valid admin login returns JWT token
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kolashankar113@gmail.com","password":"Shankar@113"}'
# Response: {"access_token":"eyJ...", "user":{...}}
```

---

## Fix 2: Asset URL Proxy Conversion

### Root Cause
The `get_asset_url` helper function in `/app/backend/app/routes/weddings.py` (line 89) was returning `cdn_url` directly from the database without converting it to a proxy URL.

**Example from database** (photo_borders collection):
```json
{
  "id": "30b2c470-39f7-46f3-96a9-631993b59703",
  "name": "frame",
  "cdn_url": "https://api.telegram.org/file/bot8534420328:AAEB3NeeGZJZ53iLP1qK2EwK-5MSoEcWFPQ/documents/file_102.png",
  "telegram_file_id": "BQACAgUAAyEGAATO7nwaAAOQaU_fIOrovv7dezINOwV2YbmCD94AAvIcAALG7oBWyaY-YZXnkyc2BA"
}
```

**Problems with raw Telegram URLs:**
- CORS restrictions (no Access-Control-Allow-Origin header)
- Exposed bot token in frontend code (security risk)
- URLs can become stale/expired
- Network request cancellations (NS_BINDING_ABORTED errors)

### Solution Applied

**File: `/app/backend/app/routes/weddings.py`**

**1. Added imports:**
```python
from app.utils.telegram_url_proxy import telegram_url_to_proxy, telegram_file_id_to_proxy_url
```

**2. Updated `get_asset_url` function (lines 83-102):**
```python
async def get_asset_url(asset_id: str, collection: str, asset_name: str = "") -> str:
    if not asset_id:
        return None
    try:
        asset = await db[collection].find_one({"id": asset_id})
        if asset:
            cdn_url = asset.get("cdn_url", "")
            telegram_file_id = asset.get("telegram_file_id", "")
            
            # Prefer telegram_file_id for more reliable URL generation
            if telegram_file_id:
                # Determine media type based on collection
                media_type = "documents" if collection == "photo_borders" else "photos"
                proxy_url = telegram_file_id_to_proxy_url(telegram_file_id, media_type)
                logger.info(f"[RESOLVE_ASSET] {collection}/{asset_id} -> {proxy_url} (via file_id)")
                return proxy_url
            
            # Fallback to cdn_url with proxy conversion
            if cdn_url:
                proxy_url = telegram_url_to_proxy(cdn_url)
                logger.info(f"[RESOLVE_ASSET] {collection}/{asset_id} -> {proxy_url} (via cdn_url)")
                return proxy_url
            
            logger.warning(f"[RESOLVE_ASSET] No URL available for {collection}/{asset_id} ({asset_name})")
            return None
        else:
            logger.warning(f"[RESOLVE_ASSET] Asset not found: {collection}/{asset_id} ({asset_name})")
            return None
    except Exception as e:
        logger.error(f"[RESOLVE_ASSET] Error resolving {collection}/{asset_id}: {e}")
        return None
```

### How Proxy URLs Work

**Before (Raw Telegram URL):**
```
https://api.telegram.org/file/bot8534420328:AAEB.../documents/file_102.png
```
❌ Exposes bot token
❌ CORS issues
❌ Can become stale

**After (Proxy URL via telegram_file_id):**
```
https://wedlive-frame.preview.emergentagent.com/api/media/telegram-proxy/documents/BQACAgUAAyEGAATO7nwaAAOQaU_fIOrovv7dezINOwV2YbmCD94AAvIcAALG7oBWyaY-YZXnkyc2BA
```
✅ Bot token hidden
✅ CORS headers properly set by backend
✅ Always fresh (calls Telegram API on-demand)

**Alternative (Proxy URL via cdn_url):**
```
https://wedlive-frame.preview.emergentagent.com/api/media/proxy?url=https%3A%2F%2Fapi.telegram.org%2Ffile%2F...
```

### Proxy Strategy (Priority Order)
1. **Prefer `telegram_file_id`**: Most reliable, permanent identifier
   - Calls `/api/media/telegram-proxy/{media_type}/{file_id}`
   - Backend fetches fresh download URL from Telegram
   - Streams file with proper CORS headers
   
2. **Fallback to `cdn_url` conversion**: For backward compatibility
   - Converts to `/api/media/proxy?url={encoded_url}`
   - Backend proxies the request and adds CORS headers

### Verification
```bash
# Test border retrieval - should show proxy URL
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/api/borders/30b2c470-39f7-46f3-96a9-631993b59703" \
  | python3 -c "import json, sys; data=json.load(sys.stdin); print('cdn_url:', data['cdn_url'])"

# Output:
# cdn_url: https://wedlive-frame.preview.emergentagent.com/api/media/telegram-proxy/documents/BQACAgUAAyEGAATO7nwaAAOQaU_fIOrovv7dezINOwV2YbmCD94AAvIcAALG7oBWyaY-YZXnkyc2BA

# Test admin borders list - all borders should have proxy URLs
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8001/api/admin/borders" \
  | python3 -c "import json, sys; data=json.load(sys.stdin); print(f'Total: {len(data)}'); print(f'First URL: {data[0][\"cdn_url\"]}')"

# Output:
# Total: 23
# First URL: https://wedlive-frame.preview.emergentagent.com/api/media/telegram-proxy/documents/BQACAgUAAyEGAATO7nwaAAO4aVYQYVQSUgT1hVeT4lhw7O1hto8AAqUfAAJa2LBWvY9_nCIEKzM4BA
```

---

## Impact Analysis

### Collections Affected by get_asset_url Fix
The `get_asset_url` function is used to resolve asset URLs for:
- **photo_borders**: Border frames for photos
- **layout_backgrounds**: Background images for layouts
- Any other collections that store Telegram assets

### Related Endpoints That Now Return Proxy URLs
- `GET /api/weddings/{id}` - Wedding details with resolved theme asset URLs
- `GET /api/borders/{id}` - Individual border with proxy URL
- `GET /api/admin/borders` - All borders with proxy URLs
- `GET /api/viewer/wedding/{id}/all` - Public viewer data with assets

### Benefits
1. **Security**: Bot tokens no longer exposed in frontend
2. **Reliability**: URLs always work (not stale)
3. **CORS**: Proper headers set by backend proxy
4. **Consistency**: All media accessed through unified proxy system
5. **Debugging**: Better logging for asset resolution

---

## Testing Checklist

- [x] Backend starts successfully
- [x] Auth login endpoint returns 401 for invalid credentials
- [x] Auth login endpoint returns JWT for valid admin credentials
- [x] Border retrieval shows proxy URL (not raw Telegram URL)
- [x] Admin borders list shows proxy URLs for all borders
- [x] Proxy URLs follow expected format: `/api/media/telegram-proxy/{type}/{file_id}`
- [x] Both services (frontend + backend) running on correct ports

---

## Services Status
```bash
$ sudo supervisorctl status
backend                          RUNNING   pid 1506, uptime 0:00:20
frontend                         RUNNING   pid 1508, uptime 0:00:20
mongodb                          RUNNING   pid 1509, uptime 0:00:20
```

---

## Next Steps for User

1. **Clear Browser Cache**: The frontend may have cached the old backend URL
2. **Test Login**: Try logging in via the UI at `https://wedlive-frame.preview.emergentagent.com`
3. **Verify Assets**: Check that photo borders/backgrounds load correctly without CORS errors
4. **Monitor Logs**: Watch for any "stale URL" or CORS issues - should be resolved now

---

## Files Modified

1. `/app/frontend/.env` - Updated backend URLs
2. `/app/backend/.env` - Updated BACKEND_URL for proxy generation
3. `/app/backend/app/routes/weddings.py` - Fixed get_asset_url function

## Additional Notes

- The backend was initially stopped due to missing `pkg_resources` module
- Installed `setuptools` to resolve the dependency issue
- Both services restarted successfully after configuration changes
- The fix maintains backward compatibility with existing database records
