# Deployment Guide - Video Template System

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Logging](#monitoring--logging)
8. [Rollback Procedure](#rollback-procedure)

---

## Pre-Deployment Checklist

### Code Review
- [ ] All Phase 1-6 features implemented and tested
- [ ] Backend tests passing (`pytest tests/`)
- [ ] Frontend builds without errors (`yarn build`)
- [ ] No console errors in development
- [ ] All linting passed (Python: ruff, JavaScript: eslint)

### Documentation
- [ ] Admin Guide completed
- [ ] User Guide completed
- [ ] API Documentation updated
- [ ] Developer Guide reviewed

### Dependencies
- [ ] Backend: `requirements.txt` up to date
- [ ] Frontend: `package.json` up to date
- [ ] FFmpeg installed on server (v5.1+)
- [ ] MongoDB running (v6.0+)

### Environment Variables
- [ ] All required env vars documented
- [ ] Secrets stored securely (not in code)
- [ ] Production values configured

---

## Environment Configuration

### Backend Environment Variables

**File**: `/app/backend/.env`

```bash
# Database
MONGO_URL=mongodb://localhost:27017/wedding_db

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_production_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Authentication
JWT_SECRET=your_production_jwt_secret_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server
HOST=0.0.0.0
PORT=8001
DEBUG=false
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=https://your-domain.com

# Video Processing
MAX_VIDEO_SIZE_MB=50
MAX_VIDEO_DURATION_SECONDS=60
SUPPORTED_VIDEO_FORMATS=mp4,webm,mov

# File Storage
TEMP_DIR=/tmp/video_processing
```

**⚠️ CRITICAL**: Never commit `.env` files to version control!

### Frontend Environment Variables

**File**: `/app/frontend/.env`

```bash
# Backend API URL
REACT_APP_BACKEND_URL=https://your-domain.com

# Environment
NODE_ENV=production
NEXT_PUBLIC_ENV=production

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

**Note**: `REACT_APP_BACKEND_URL` is automatically configured in the existing setup. **DO NOT MODIFY** unless changing domain.

---

## Database Setup

### MongoDB Configuration

#### 1. Create Indexes

```javascript
// Connect to MongoDB
use wedding_db

// Create indexes for video_templates
db.video_templates.createIndex({ "id": 1 }, { unique: true })
db.video_templates.createIndex({ "category": 1 })
db.video_templates.createIndex({ "metadata.is_featured": 1 })
db.video_templates.createIndex({ "metadata.is_active": 1 })
db.video_templates.createIndex({ "metadata.created_at": -1 })
db.video_templates.createIndex({ "name": "text", "description": "text", "tags": "text" })

// Create indexes for wedding_template_assignments
db.wedding_template_assignments.createIndex({ "id": 1 }, { unique: true })
db.wedding_template_assignments.createIndex({ "wedding_id": 1 })
db.wedding_template_assignments.createIndex({ "template_id": 1 })
db.wedding_template_assignments.createIndex({ "assigned_at": -1 })
```

#### 2. Create Collections (if not exists)

```javascript
db.createCollection("video_templates")
db.createCollection("wedding_template_assignments")
```

#### 3. Set Up Backup Schedule

```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * mongodump --db wedding_db --out /backups/mongodb/$(date +\%Y\%m\%d)
```

---

## Backend Deployment

### Current Setup

The backend is already configured to run via **Supervisor** on port 8001.

### Verify Configuration

```bash
# Check if backend is running
sudo supervisorctl status backend

# Expected output:
# backend    RUNNING   pid 1234, uptime 0:10:00
```

### Restart Backend (After Changes)

```bash
# Restart backend service
sudo supervisorctl restart backend

# Check logs
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/backend.err.log
```

### Install New Dependencies

```bash
cd /app/backend

# Install new packages
pip install -r requirements.txt

# Restart service
sudo supervisorctl restart backend
```

### Verify Backend Health

```bash
# Test health endpoint
curl http://localhost:8001/api/health

# Test video templates endpoint
curl http://localhost:8001/api/video-templates/endpoints/list
```

---

## Frontend Deployment

### Current Setup

The frontend is already configured to run via **Supervisor** on port 3000.

### Build & Deploy

```bash
cd /app/frontend

# Install dependencies (if new packages added)
yarn install

# Build production bundle
yarn build

# Restart frontend service
sudo supervisorctl restart frontend
```

### Verify Frontend

```bash
# Check if frontend is running
sudo supervisorctl status frontend

# Expected output:
# frontend   RUNNING   pid 5678, uptime 0:10:00

# Test frontend
curl http://localhost:3000
```

---

## Post-Deployment Verification

### Backend Verification

#### 1. API Endpoints Test

```bash
# Test public endpoint
curl http://localhost:8001/api/video-templates

# Test endpoints list
curl http://localhost:8001/api/video-templates/endpoints/list
```

#### 2. Admin Endpoints Test (with auth)

```bash
# Login as admin
TOKEN=$(curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin_password"}' \
  | jq -r .access_token)

# Test admin endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/api/admin/video-templates
```

#### 3. Video Processing Test

```bash
# Check FFmpeg availability
ffmpeg -version
ffprobe -version

# Test video upload (requires admin auth)
curl -X POST http://localhost:8001/api/admin/video-templates/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_video.mp4" \
  -F "name=Test Template" \
  -F "category=general"
```

### Frontend Verification

#### 1. Page Load Test

```bash
# Test main pages
curl http://localhost:3000/
curl http://localhost:3000/admin/video-templates
```

#### 2. Browser Test

Open browser and verify:
- [ ] Admin can access `/admin/video-templates`
- [ ] Template list loads without errors
- [ ] Upload interface accessible
- [ ] Template editor opens
- [ ] User can browse templates
- [ ] Video player works
- [ ] Overlay rendering functional

### Database Verification

```javascript
// Connect to MongoDB
use wedding_db

// Check collections exist
show collections

// Count templates
db.video_templates.countDocuments()

// Check indexes
db.video_templates.getIndexes()
db.wedding_template_assignments.getIndexes()

// Test query performance
db.video_templates.find({ "metadata.is_active": true }).explain("executionStats")
```

---

## Monitoring & Logging

### Application Logs

#### Backend Logs

```bash
# Real-time logs
sudo tail -f /var/log/supervisor/backend.out.log
sudo tail -f /var/log/supervisor/backend.err.log

# Search for errors
sudo grep -i error /var/log/supervisor/backend.err.log

# Check last 100 lines
sudo tail -n 100 /var/log/supervisor/backend.out.log
```

#### Frontend Logs

```bash
# Real-time logs
sudo tail -f /var/log/supervisor/frontend.out.log
sudo tail -f /var/log/supervisor/frontend.err.log
```

### Video Processing Logs

Add logging to track video operations:

```python
# In video_processing_service.py
import logging
logger = logging.getLogger(__name__)

logger.info(f"[VIDEO_UPLOAD] Starting upload: {filename}")
logger.info(f"[THUMBNAIL_GEN] Generated thumbnail for {template_id}")
logger.error(f"[VIDEO_ERROR] Failed to process video: {error}")
```

### Render Job Monitoring

Add monitoring for render jobs:

```python
# In render_service.py
logger.info(f"[RENDER_START] Job {job_id} started")
logger.info(f"[RENDER_PROGRESS] Job {job_id} at {progress}%")
logger.info(f"[RENDER_COMPLETE] Job {job_id} completed in {duration}s")
logger.error(f"[RENDER_FAILED] Job {job_id} failed: {error}")
```

### Template Usage Tracking

Track template usage in database:

```javascript
// MongoDB aggregation for usage stats
db.video_templates.aggregate([
  {
    $project: {
      name: 1,
      usage_count: "$metadata.usage_count"
    }
  },
  {
    $sort: { usage_count: -1 }
  },
  {
    $limit: 10
  }
])
```

### Performance Monitoring

#### Response Time Monitoring

```python
# Add middleware to FastAPI
from fastapi import Request
import time

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"[PERF] {request.method} {request.url.path} - {process_time:.3f}s")
    return response
```

#### Database Performance

```javascript
// Enable MongoDB profiling
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 }).limit(10)
```

---

## Rollback Procedure

### If Deployment Fails

#### 1. Rollback Backend

```bash
# Stop current backend
sudo supervisorctl stop backend

# Restore previous version (if using git)
cd /app/backend
git checkout <previous_commit_hash>

# Reinstall dependencies
pip install -r requirements.txt

# Restart backend
sudo supervisorctl start backend
```

#### 2. Rollback Frontend

```bash
# Stop current frontend
sudo supervisorctl stop frontend

# Restore previous version
cd /app/frontend
git checkout <previous_commit_hash>

# Reinstall dependencies
yarn install

# Rebuild
yarn build

# Restart frontend
sudo supervisorctl start frontend
```

#### 3. Rollback Database (if needed)

```bash
# Restore from backup
mongorestore --db wedding_db /backups/mongodb/<backup_date>/wedding_db
```

### Verify Rollback

- [ ] Backend responding correctly
- [ ] Frontend loading without errors
- [ ] Database queries working
- [ ] No critical errors in logs

---

## CDN Configuration

### Telegram CDN Setup

The system uses Telegram Bot API as CDN. Ensure:

1. **Bot Token** is valid and active
2. **Chat ID** is configured correctly
3. **Bot permissions** allow file uploads

**Test CDN:**

```python
# Test upload
from app.services.telegram_service import TelegramCDNService

service = TelegramCDNService()
result = await service.upload_video(
    file_path="test_video.mp4",
    caption="Test upload",
    wedding_id="test"
)
print(result)
```

---

## Security Checklist

### Pre-Production

- [ ] All secrets in environment variables (not code)
- [ ] JWT secret is strong and unique
- [ ] CORS origins restricted to production domain
- [ ] File upload size limits enforced
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] HTTPS enforced (handled by ingress)

### File Upload Security

- [ ] File type validation (whitelist only mp4, webm, mov)
- [ ] File size limits (50MB max)
- [ ] Virus scanning (optional but recommended)
- [ ] Admin-only access to upload endpoints

---

## Scaling Considerations

### Horizontal Scaling

**Backend:**
- Run multiple FastAPI instances
- Use load balancer (Nginx, HAProxy)
- Share session state via Redis

**Frontend:**
- Serve static files via CDN
- Multiple Next.js instances
- Use Redis for session storage

### Vertical Scaling

**Database:**
- Increase MongoDB memory/CPU
- Add replica sets for read scaling
- Enable sharding for large datasets

**Video Processing:**
- Dedicated render server
- Queue system (Celery + Redis)
- Parallel FFmpeg processing

---

## Backup Strategy

### Automated Backups

```bash
# MongoDB backup script
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db wedding_db --out "$BACKUP_DIR/$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

### Manual Backup Before Major Changes

```bash
# Before deployment
mongodump --db wedding_db --out /backups/pre_deployment_$(date +%Y%m%d)

# After successful deployment
echo "Deployment successful on $(date)" >> /backups/deployment_log.txt
```

---

## Health Checks

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 8001
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Custom Health Endpoint

```python
# Add to FastAPI
@app.get("/api/health")
async def health_check():
    # Check database connection
    try:
        await db.command("ping")
        db_status = "healthy"
    except:
        db_status = "unhealthy"
    
    # Check FFmpeg
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        ffmpeg_status = "healthy"
    except:
        ffmpeg_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" and ffmpeg_status == "healthy" else "degraded",
        "database": db_status,
        "ffmpeg": ffmpeg_status,
        "timestamp": datetime.utcnow().isoformat()
    }
```

---

## Troubleshooting Deployment Issues

### Issue: Backend won't start

**Check:**
```bash
# Check logs
sudo tail -n 50 /var/log/supervisor/backend.err.log

# Common causes:
# - Missing environment variables
# - MongoDB not accessible
# - Port 8001 already in use
# - Python package errors
```

**Solutions:**
```bash
# Verify env vars
cat /app/backend/.env

# Test MongoDB connection
mongo --eval "db.adminCommand('ping')"

# Check port
netstat -tulpn | grep 8001
```

### Issue: Frontend build fails

**Check:**
```bash
# Check logs
sudo tail -n 50 /var/log/supervisor/frontend.err.log

# Common causes:
# - Missing dependencies
# - TypeScript errors
# - Environment variable issues
```

**Solutions:**
```bash
# Clean install
cd /app/frontend
rm -rf node_modules .next
yarn install
yarn build
```

### Issue: Videos not uploading

**Check:**
```bash
# Test FFmpeg
ffmpeg -version

# Test Telegram bot
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe"

# Check file permissions
ls -la /tmp/video_processing
```

---

## Production Checklist

### Before Go-Live

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Environment variables configured
- [ ] Database indexed
- [ ] Backups configured
- [ ] Monitoring in place
- [ ] Logs accessible
- [ ] Rollback plan ready

### After Go-Live

- [ ] Monitor logs for errors
- [ ] Check database performance
- [ ] Verify video uploads working
- [ ] Test user flows
- [ ] Monitor render jobs
- [ ] Check CDN uploads

### Week 1 Post-Launch

- [ ] Review performance metrics
- [ ] Analyze user feedback
- [ ] Fix critical bugs
- [ ] Optimize slow queries
- [ ] Review logs for patterns

---

## Contact & Support

**Technical Issues:**
- Check logs first
- Review troubleshooting section
- Contact DevOps team

**Documentation:**
- [Admin Guide](./ADMIN_GUIDE.md)
- [User Guide](./USER_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Ready for Production Deployment
