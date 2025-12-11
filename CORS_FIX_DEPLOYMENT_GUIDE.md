# CORS Error Fix - Deployment Guide for Render

## Problem Identified
The CORS error you're experiencing is caused by:
1. Backend returning 500 errors (likely Stream.io API failures)
2. CORS headers not being sent when backend returns errors
3. CORS_ORIGINS environment variable not being used by the backend

## Fixes Applied

### 1. Enhanced CORS Configuration (`/app/backend/server.py`)
✅ **Changes Made:**
- Backend now reads `CORS_ORIGINS` from environment variables
- Added global exception handler to ensure CORS headers are ALWAYS sent, even on 500 errors
- Enhanced logging to show configured CORS origins on startup
- Supports both wildcard (`*`) and specific origin lists

**Key Code:**
```python
# Reads CORS_ORIGINS from .env (default: "*")
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
if cors_origins_env == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",")]

# Global exception handler ensures CORS headers on ALL responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )
```

### 2. Better Error Handling in Wedding Creation (`/app/backend/app/routes/weddings.py`)
✅ **Changes Made:**
- Added try-catch blocks around wedding creation
- Enhanced logging to identify exact failure points
- Proper error messages returned to frontend

### 3. Environment Variables Updated (`/app/backend/.env`)
✅ **Changes Made:**
- Removed deprecated `MONGO_URL` (using `MONGODB_URI` only)
- Updated `JWT_SECRET` to match Render configuration
- Updated `NEXT_PUBLIC_BASE_URL` to point to Vercel frontend

## Deployment Instructions for Render

### Step 1: Deploy Updated Backend Code to Render

**Option A: Via Git**
```bash
# Commit and push the changes
git add backend/server.py backend/app/routes/weddings.py backend/.env
git commit -m "Fix CORS headers and improve error handling"
git push origin main
```

**Option B: Manual Deployment**
- Upload the updated files directly to Render

### Step 2: Verify Environment Variables in Render

Go to your Render backend service → Environment → Verify these variables are set:

```bash
# Essential Variables (Already Set ✅)
MONGODB_URI=mongodb+srv://telegrambot:A1gv8IiGLJyuIvMY@cluster0.3qiiqox.mongodb.net/record_db?appName=Cluster0
DB_NAME=record_db
CORS_ORIGINS=*
JWT_SECRET=YRkWhaHbOhKN4OUqGD4s0MZshreq0VlnNYMeiuTWpsA=
NEXT_PUBLIC_BASE_URL=https://wedlive.vercel.app

# Stream.io Credentials (Already Set ✅)
STREAM_API_KEY=hhdxgg9s2qq2
STREAM_API_SECRET=5yp6t23dw6szzqj9tmeaddp5jqxra4ut2fmkm4f4huf7quc56uqjyb74jyngxjnk
STREAM_APP_ID=1452086

# Razorpay (Already Set ✅)
RAZORPAY_KEY_ID=rzp_test_RohtuBUDnY3DP9
RAZORPAY_KEY_SECRET=Q3F054Tq1UoiysnUaWWlQ4FM
# ... (other Razorpay variables)

# Telegram (Already Set ✅)
TELEGRAM_BOT_TOKEN=8534420328:AAEB3NeeGZJZ53iLP1qK2EwK-5MSoEcWFPQ
TELEGRAM_CHANNEL_ID=-1003471735834
# ... (other Telegram variables)
```

### Step 3: Test Backend on Render

After deployment, test the backend:

```bash
# Test health endpoint
curl https://wedlive.onrender.com/api/health

# Expected Response:
# {"status":"healthy","service":"WedLive API","version":"3.0.0"}

# Check CORS headers
curl -I -H "Origin: https://wedlive.vercel.app" https://wedlive.onrender.com/api/health

# Expected Headers:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Credentials: true
```

### Step 4: Check Render Logs

After deployment, check logs in Render dashboard:

**Look for these success messages:**
```
✅ Razorpay client initialized in TEST mode
🌐 CORS Origins configured: ['*']
Connected to MongoDB: record_db
✅ Database connected
Stream client initialized successfully
```

**Look for any error messages:**
- Stream.io initialization errors
- MongoDB connection errors
- Missing environment variables

### Step 5: Test from Vercel Frontend

Once backend is deployed and healthy:

1. Go to https://wedlive.vercel.app
2. Try to create a wedding
3. Check browser console for errors

## Common Issues and Solutions

### Issue 1: Still Getting CORS Errors
**Cause:** Backend returning 500 error before CORS middleware runs
**Solution:** Check Render logs for the actual error causing 500

### Issue 2: Stream.io API Failures
**Symptom:** Wedding creation fails with "Failed to create stream"
**Cause:** Stream.io API credentials invalid or API down
**Solution:** 
- Verify STREAM_API_KEY and STREAM_API_SECRET are correct
- Check Stream.io dashboard for service status
- Try regenerating API credentials

### Issue 3: MongoDB Connection Failures
**Symptom:** Backend won't start or returns database errors
**Cause:** MONGODB_URI invalid or IP not whitelisted
**Solution:**
- Verify MONGODB_URI connection string
- Check MongoDB Atlas → Network Access → Add Render IPs (or allow all: 0.0.0.0/0)

### Issue 4: Authentication Failures
**Symptom:** Login/Register not working
**Cause:** JWT_SECRET mismatch or missing
**Solution:**
- Ensure JWT_SECRET is set in Render
- Must be the same value across all deployments

## Testing Checklist

After deployment, test these endpoints:

- [ ] `GET /api/health` - Should return 200 OK
- [ ] `POST /api/auth/register` - Create new user
- [ ] `POST /api/auth/login` - Login user
- [ ] `GET /api/auth/me` - Get current user (with token)
- [ ] `POST /api/weddings/` - Create wedding (with token)
- [ ] `GET /api/weddings/` - List weddings

## CORS Configuration Details

### Current Setup
- **Backend (Render):** https://wedlive.onrender.com
- **Frontend (Vercel):** https://wedlive.vercel.app
- **CORS Policy:** Allow all origins (`*`)

### Production Recommendation
For production, change CORS_ORIGINS in Render to:
```bash
CORS_ORIGINS=https://wedlive.vercel.app,https://wedlive.onrender.com
```

This restricts API access to only your domains.

## Files Changed

1. `/app/backend/server.py` - CORS configuration + global error handler
2. `/app/backend/app/routes/weddings.py` - Enhanced error handling
3. `/app/backend/.env` - Environment variable cleanup

## Next Steps

1. ✅ Deploy updated code to Render
2. ✅ Verify environment variables in Render
3. ✅ Check Render logs for successful startup
4. ✅ Test backend health endpoint
5. ✅ Test from Vercel frontend
6. ✅ Monitor for any remaining errors

## Support

If you still encounter issues after deployment:

1. **Check Render Logs:** 
   - Render Dashboard → Your Service → Logs
   - Look for error messages during startup or API calls

2. **Check Browser Console:**
   - Open DevTools → Console tab
   - Look for exact error messages

3. **Test Backend Directly:**
   ```bash
   # Test with curl
   curl -X POST https://wedlive.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","full_name":"Test User"}'
   ```

4. **Contact Stream.io Support:**
   - If Stream.io API is failing
   - Verify API credentials are active

---

**Status:** ✅ All fixes applied locally and ready for deployment
**Last Updated:** December 8, 2024
