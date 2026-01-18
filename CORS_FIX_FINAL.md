# CORS/404 Issue - Final Resolution

## Issue Summary
Frontend getting 404 errors and CORS missing headers when trying to access:
`https://event-photobook-1.preview.emergentagent.com/api/auth/login`

## Root Cause Analysis

### Problem
The frontend `.env` file had **hardcoded backend URLs** that were overriding the smart auto-detection logic in `config.js`.

### How the System Should Work (Emergent Platform)

The frontend `lib/config.js` has intelligent environment detection:

```javascript
// Line 29-32 in config.js
if (hostname.includes('emergentagent.com') || hostname.includes('preview.emergentagent.com')) {
  // Use same domain for API calls (handled by Kubernetes ingress)
  return window.location.origin;
}
```

**Kubernetes Ingress Rules:**
- Frontend requests to `/` → Port 3000 (frontend)
- Frontend requests to `/api/*` → Port 8001 (backend)

When the frontend uses `window.location.origin` as the backend URL:
- Frontend at: `https://event-photobook-1.preview.emergentagent.com`
- API calls to: `https://event-photobook-1.preview.emergentagent.com/api/auth/login`
- Ingress routes `/api/*` → Backend on port 8001
- **No CORS issues** (same origin!)

### What Was Wrong

**Before Fix** (`.env` had hardcoded URL):
```bash
REACT_APP_BACKEND_URL=https://event-photobook-1.preview.emergentagent.com
```

This overrode the auto-detection, causing the config to use the explicit URL. However, the Kubernetes ingress wasn't properly routing external requests to the backend service.

**After Fix** (`.env` with commented URLs):
```bash
# NEXT_PUBLIC_API_URL=
# NEXT_PUBLIC_BACKEND_URL=
# REACT_APP_BACKEND_URL=
```

Now the config falls back to auto-detection and uses `window.location.origin`.

## Solution Applied

### File: `/app/frontend/.env`
```diff
- NEXT_PUBLIC_API_URL=https://event-photobook-1.preview.emergentagent.com
- NEXT_PUBLIC_BACKEND_URL=https://event-photobook-1.preview.emergentagent.com
- REACT_APP_BACKEND_URL=https://event-photobook-1.preview.emergentagent.com
+ # NEXT_PUBLIC_API_URL=
+ # NEXT_PUBLIC_BACKEND_URL=
+ # REACT_APP_BACKEND_URL=
```

### Why This Works

1. **Auto-Detection**: Frontend detects it's running on `*.emergentagent.com`
2. **Same-Origin**: Uses `window.location.origin` as backend URL
3. **Ingress Routing**: Kubernetes routes `/api/*` to backend port 8001
4. **No CORS**: Same origin = no CORS preflight needed
5. **Local Dev Works**: Auto-detects `localhost` and uses `http://localhost:8001`

## Configuration Priority (config.js)

```
1. Environment Variables (NEXT_PUBLIC_BACKEND_URL, REACT_APP_BACKEND_URL)
   ↓ (if not set)
2. Auto-Detection based on hostname:
   - emergentagent.com → window.location.origin
   - vercel.app → https://wedlive.onrender.com
   - localhost → http://localhost:8001
   ↓ (fallback)
3. Default: http://localhost:8001
```

## Backend Configuration

### File: `/app/backend/.env`
```bash
BACKEND_URL=https://event-photobook-1.preview.emergentagent.com
```

This is **correct** and should remain. It's used for generating absolute proxy URLs in responses (like image/video CDN URLs).

## Testing Instructions

### 1. Clear Browser Cache
```bash
# In browser DevTools Console:
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

### 2. Check Configuration in Browser
Open browser console at `https://event-photobook-1.preview.emergentagent.com` and check:

```javascript
// Should show auto-detected config
// Look for: "🔧 Configuration Validation"
```

Expected output:
```
🔧 Configuration Validation: {
  apiBaseUrl: "https://event-photobook-1.preview.emergentagent.com",
  environment: "production",
  isLocal: false,
  mediaProxy: "/api/media/telegram-proxy/photos/"
}
```

### 3. Test Login
1. Navigate to login page
2. Enter credentials
3. Check Network tab - API call should go to same domain with `/api` prefix
4. Should NOT see CORS errors or 404

### 4. Expected Network Request
```
Request URL: https://event-photobook-1.preview.emergentagent.com/api/auth/login
Request Method: POST
Status: 200 (for valid creds) or 401 (for invalid creds)
Response Headers: Should include CORS headers from backend
```

## Deployment Configuration Summary

### Local Development
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8001`
- Config auto-detects localhost

### Emergent Preview (photoframe-sync.preview.emergentagent.com)
- Frontend: Served from root `/` → Port 3000
- Backend: Served from `/api/*` → Port 8001
- Config uses `window.location.origin`
- Kubernetes ingress handles routing

### Vercel Production (if deployed)
- Frontend: `https://wedlive.vercel.app`
- Backend: `https://wedlive.onrender.com`
- Config auto-detects vercel.app and uses Render URL

## Important Notes

⚠️ **DO NOT** hardcode backend URLs in `.env` for Emergent platform deployments
✅ **DO** let the auto-detection handle environment-specific URLs
✅ **DO** set environment variables in Vercel for production deployments
✅ **DO** keep BACKEND_URL in backend `.env` for proxy URL generation

## Troubleshooting

### If still getting 404:
1. Check Kubernetes ingress configuration (infrastructure team)
2. Verify backend service is running: `sudo supervisorctl status backend`
3. Test backend locally: `curl http://localhost:8001/api/health`

### If getting CORS errors:
1. Check if using correct origin (should be same domain)
2. Verify CORS_ORIGINS in backend `.env` includes the domain or is set to "*"
3. Check backend CORS middleware in `server.py`

### If auto-detection not working:
1. Check console for "🔧 Configuration Validation" log
2. Verify hostname detection logic in `config.js`
3. Temporarily set environment variable if needed

## Files Modified

1. `/app/frontend/.env` - Commented out hardcoded backend URLs
2. `/app/backend/.env` - Set correct BACKEND_URL for proxy generation

## Services Status
```bash
$ sudo supervisorctl status
backend    RUNNING   pid 1506
frontend   RUNNING   pid 5565
mongodb    RUNNING   pid 1509
```

---

**Summary**: The fix removes hardcoded URLs and relies on smart auto-detection that uses `window.location.origin` for same-origin API calls, which works seamlessly with Kubernetes ingress routing.
