# How to Deploy Fixes to Vercel

## Quick Summary
Your wedding pages are showing errors on the deployed version (wedlive.vercel.app) because the latest fixes haven't been deployed yet. Follow these steps to deploy the fixes.

## What Was Fixed?
✅ React Error #130 on wedding preview page  
✅ "theme_settings undefined" error on manage page  
✅ Manage page redirecting to dashboard issue  
✅ Eye icon navigation from dashboard  

## Deployment Methods

### Option 1: Auto-Deploy via Git Push (Recommended)
If your Vercel is connected to GitHub/GitLab:

```bash
# 1. Commit all changes
git add .
git commit -m "fix: React error #130 and theme_settings undefined errors"

# 2. Push to your repository
git push origin main
# (or 'master' if that's your branch name)
```

Vercel will automatically detect the push and deploy within 2-3 minutes.

### Option 2: Manual Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your WedLive project
3. Go to "Deployments" tab
4. Click "Redeploy" on the latest deployment
5. Confirm and wait for deployment to complete

### Option 3: Deploy via Vercel CLI

```bash
# 1. Install Vercel CLI (if not installed)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel --prod
```

## After Deployment

### 1. Verify the Deployment
- Wait for "Deployment Complete" notification
- Check the deployment URL in Vercel dashboard

### 2. Test the Fixes
Visit these URLs to verify fixes:

✅ **Public Wedding Page**:
```
https://wedlive.vercel.app/weddings/6b3f606d-015b-48ac-a34d-730a553c419a
```
Should load without React error #130

✅ **Manage Wedding Page**:
```
https://wedlive.vercel.app/weddings/manage/6b3f606d-015b-48ac-a34d-730a553c419a
```
Should load without redirecting to dashboard

✅ **Dashboard Eye Icon**:
- Go to dashboard
- Click eye icon on any wedding
- Should open wedding page correctly

### 3. Clear Browser Cache
If you still see errors after deployment:

**Chrome/Edge**:
- Press `Ctrl + Shift + R` (Windows)
- Press `Cmd + Shift + R` (Mac)

**Firefox**:
- Press `Ctrl + F5` (Windows)
- Press `Cmd + Shift + R` (Mac)

**Or Clear Cache Manually**:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

## Troubleshooting

### Issue: Auto-deploy not working
**Solution**: 
- Check if GitHub/GitLab integration is enabled in Vercel
- Verify the correct branch is connected
- Check Vercel deployment logs for errors

### Issue: Still seeing errors after deployment
**Solution**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache completely
3. Try in incognito/private window
4. Check Vercel deployment logs for build errors

### Issue: Build fails on Vercel
**Solution**:
1. Check Vercel build logs
2. Ensure all dependencies are in package.json
3. Check that frontend builds locally: `cd frontend && yarn build`
4. Contact support with build logs

## Expected Results After Deployment

✅ **Public Wedding Page**:
- Loads theme preview for premium users
- No React error #130
- All theme elements render correctly
- Socket features work

✅ **Manage Page**:
- Loads without redirecting
- Theme settings accessible
- No "undefined" errors
- All management features work

✅ **Overall**:
- Smooth navigation
- No console errors
- All features functional

## Need Help?

If you encounter any issues:
1. Check Vercel deployment logs
2. Look at browser console for errors (F12 → Console)
3. Share error messages for specific help

## Files Changed in This Fix
- `/app/frontend/app/weddings/[id]/page.js`
- `/app/frontend/app/weddings/manage/[id]/page.js`
- `/app/frontend/components/ThemeRenderer.js`

See `/app/CRITICAL_FIXES_DEC_2024.md` for detailed technical explanation.
