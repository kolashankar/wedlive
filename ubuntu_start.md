# 🚀 WedLive - Complete Setup Guide for Ubuntu 24.04

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [MongoDB Setup](#mongodb-setup)
4. [NGINX-RTMP Setup](#nginx-rtmp-setup)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Starting Services](#starting-services)
8. [Testing the Application](#testing-the-application)
9. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

- **OS**: Ubuntu 24.04 LTS
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 20GB free space
- **CPU**: 2 cores minimum, 4 cores recommended
- **Network**: Stable internet connection

---

## 📦 Prerequisites Installation

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Essential Tools
```bash
sudo apt install -y curl wget git build-essential software-properties-common
```

### 3. Install Python 3.12+
```bash
# Ubuntu 24.04 comes with Python 3.12 by default
python3 --version

# Install pip and venv
sudo apt install -y python3-pip python3-venv
```

### 4. Install Node.js 20.x & Yarn
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install Yarn
npm install -g yarn
yarn --version
```

---

## 🗄️ MongoDB Setup

### Option 1: MongoDB Atlas (Cloud - Recommended for Development)

1. **Create Free Account**:
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free tier (512MB storage)
   - Create a cluster (takes 5-10 minutes)

2. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/wedlive_db`

3. **Configure Network Access**:
   - In Atlas dashboard, go to "Network Access"
   - Add IP Address: `0.0.0.0/0` (Allow from anywhere)
   - Or add your specific IP address

### Option 2: Local MongoDB Installation

```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod

# Your local connection string will be:
# mongodb://localhost:27017/wedlive_db
```

---

## 📹 NGINX-RTMP Setup

### 1. Install NGINX with RTMP Module

```bash
# Install dependencies
sudo apt install -y libpcre3 libpcre3-dev libssl-dev zlib1g-dev

# Download NGINX and RTMP module
cd /tmp
wget http://nginx.org/download/nginx-1.24.0.tar.gz
wget https://github.com/arut/nginx-rtmp-module/archive/master.zip

# Extract files
tar -xzf nginx-1.24.0.tar.gz
unzip master.zip

# Build NGINX with RTMP module
cd nginx-1.24.0
./configure --with-http_ssl_module --add-module=../nginx-rtmp-module-master
make
sudo make install
```

### 2. Configure NGINX-RTMP

```bash
# Create NGINX configuration
sudo nano /usr/local/nginx/conf/nginx.conf
```

**Paste this configuration**:

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

# RTMP Configuration
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        
        application live {
            live on;
            
            # Enable recording
            record all;
            record_path /tmp/recordings;
            record_suffix -%Y-%m-%d-%H-%M-%S.flv;
            record_max_size 1024M;
            
            # HLS Configuration
            hls on;
            hls_path /tmp/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            
            # Allow publishing from anywhere (for development)
            allow publish all;
            allow play all;
        }
    }
}

# HTTP Configuration for HLS
http {
    include mime.types;
    default_type application/octet-stream;
    
    sendfile on;
    keepalive_timeout 65;
    
    server {
        listen 8080;
        server_name localhost;
        
        # CORS headers for HLS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        
        # HLS stream location
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /tmp;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }
        
        # RTMP statistics
        location /stat {
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
        }
    }
}
```

### 3. Create Required Directories

```bash
sudo mkdir -p /tmp/hls /tmp/recordings /var/log/nginx
sudo chmod 777 /tmp/hls /tmp/recordings
```

### 4. Create NGINX Service

```bash
sudo nano /etc/systemd/system/nginx-rtmp.service
```

**Paste this configuration**:

```ini
[Unit]
Description=NGINX RTMP Server
After=network.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStartPre=/usr/local/nginx/sbin/nginx -t
ExecStart=/usr/local/nginx/sbin/nginx
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s QUIT $MAINPID
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### 5. Start NGINX-RTMP

```bash
sudo systemctl daemon-reload
sudo systemctl start nginx-rtmp
sudo systemctl enable nginx-rtmp
sudo systemctl status nginx-rtmp
```

---

## 🔧 Backend Setup

### 1. Clone/Navigate to Project

```bash
cd /path/to/wedlive-project
cd backend
```

### 2. Create Python Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
nano .env
```

**Backend .env Configuration** (Update with your values):

```bash
# ========================================
# MongoDB Configuration
# ========================================
# For MongoDB Atlas (Cloud):
# MONGODB_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/wedlive_db?retryWrites=true&w=majority"

# For Local MongoDB:
MONGODB_URI="mongodb://localhost:27017/wedlive_db"
DB_NAME="wedlive_db"

# ========================================
# CORS Configuration
# ========================================
CORS_ORIGINS="*"
# For production, use specific origins:
# CORS_ORIGINS="http://localhost:3000,https://yourdomain.com"

# ========================================
# Admin Credentials
# ========================================
ADMIN_EMAIL=admin@wedlive.local
ADMIN_PASSWORD=Admin@12345

# ========================================
# Telegram Bot Configuration (For Media CDN)
# ========================================
# Get these from: https://t.me/BotFather
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=your_api_hash_here
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
# Create a private channel and get its ID (use @userinfobot)
TELEGRAM_CHANNEL_ID=-1001234567890
TELEGRAM_LOG_CHANNEL=-1001234567890

# ========================================
# Razorpay Payment Configuration
# ========================================
# Get test credentials from: https://dashboard.razorpay.com/
# TEST MODE (for development):
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_test_secret_key
RAZORPAY_WEBHOOK_SECRET=whsec_test_webhook_secret
# LIVE MODE (for production):
# RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXX
# RAZORPAY_KEY_SECRET=your_live_secret_key

RAZORPAY_WEBHOOK_URL=http://localhost:3000/razorpay-webhook
# Create plans in Razorpay dashboard and paste IDs here:
RAZORPAY_MONTHLY_PLAN_ID=plan_test_monthly
RAZORPAY_YEARLY_PLAN_ID=plan_test_yearly

# ========================================
# JWT Secret
# ========================================
# Generate with: python3 -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET="your-secret-jwt-key-change-this-in-production"

# ========================================
# Frontend URL Configuration
# ========================================
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# ========================================
# NGINX-RTMP Streaming Configuration
# ========================================
# Local machine URLs:
RTMP_SERVER_URL=rtmp://localhost/live
HLS_SERVER_URL=http://localhost:8080/hls

# For production with domain:
# RTMP_SERVER_URL=rtmp://stream.yourdomain.com/live
# HLS_SERVER_URL=https://stream.yourdomain.com/hls

# ========================================
# Recording Configuration
# ========================================
RECORDING_PATH=/tmp/recordings
```

### 5. Start Backend Server

```bash
# Make sure venv is activated
source venv/bin/activate

# Start with Uvicorn
uvicorn server:socket_app --host 0.0.0.0 --port 8001 --reload

# Or use the startup script:
python3 server.py
```

**Backend will run on**: http://localhost:8001

---

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd /path/to/wedlive-project/frontend
```

### 2. Install Dependencies

```bash
yarn install
# or
npm install
```

### 3. Configure Environment Variables

```bash
nano .env
```

**Frontend .env Configuration**:

```bash
# ========================================
# Backend API URL
# ========================================
# Local development:
NEXT_PUBLIC_API_URL=http://localhost:8001
REACT_APP_BACKEND_URL=http://localhost:8001

# Production:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# REACT_APP_BACKEND_URL=https://api.yourdomain.com

# ========================================
# WebSocket Configuration
# ========================================
WDS_SOCKET_PORT=443

# ========================================
# Feature Flags
# ========================================
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false

# ========================================
# NGINX-RTMP Configuration
# ========================================
# These should match your backend NGINX setup
NEXT_PUBLIC_RTMP_URL=rtmp://localhost/live
NEXT_PUBLIC_HLS_URL=http://localhost:8080/hls
```

### 4. Start Frontend Development Server

```bash
yarn dev
# or
npm run dev
```

**Frontend will run on**: http://localhost:3000

---

## 🚀 Starting Services

### Method 1: Manual Start (Development)

**Terminal 1 - NGINX-RTMP**:
```bash
sudo systemctl start nginx-rtmp
sudo systemctl status nginx-rtmp
```

**Terminal 2 - Backend**:
```bash
cd backend
source venv/bin/activate
uvicorn server:socket_app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 3 - Frontend**:
```bash
cd frontend
yarn dev
```

### Method 2: Using Supervisor (Production-like)

If you want to run services like in the Docker environment:

```bash
# Install Supervisor
sudo apt install -y supervisor

# Create supervisor configs
sudo nano /etc/supervisor/conf.d/wedlive-backend.conf
```

**Backend Supervisor Config**:
```ini
[program:wedlive-backend]
command=/path/to/backend/venv/bin/uvicorn server:socket_app --host 0.0.0.0 --port 8001
directory=/path/to/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/backend.err.log
stdout_logfile=/var/log/supervisor/backend.out.log
user=yourusername
```

**Frontend Supervisor Config**:
```ini
[program:wedlive-frontend]
command=/usr/bin/yarn dev
directory=/path/to/frontend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/frontend.err.log
stdout_logfile=/var/log/supervisor/frontend.out.log
user=yourusername
environment=PORT=3000
```

**Start Supervisor**:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
sudo supervisorctl status
```

---

## 🧪 Testing the Application

### 1. Check Services Status

```bash
# Check NGINX-RTMP
sudo systemctl status nginx-rtmp
curl http://localhost:8080/stat  # RTMP statistics

# Check Backend
curl http://localhost:8001/api/health

# Check Frontend
curl http://localhost:3000
```

### 2. Test Complete Flow

1. **Open Browser**: http://localhost:3000
2. **Register Account**: Create a new user account
3. **Create Wedding**: Create a test wedding event
4. **Get RTMP Credentials**: Go to wedding management page
5. **Test Streaming with OBS**:
   - Download OBS Studio: https://obsproject.com/
   - Settings → Stream
   - Service: Custom
   - Server: `rtmp://localhost/live`
   - Stream Key: Copy from wedding management page
   - Click "Start Streaming"
6. **View Stream**: Open the wedding viewer page
7. **Test Chat**: Send messages in live chat
8. **Test Recording**: Start/stop DVR recording
9. **Upload Media**: Upload photos/videos to wedding

### 3. Database Verification

```bash
# For local MongoDB
mongosh

use wedlive_db
show collections
db.users.find()
db.weddings.find()
exit
```

---

## 🔧 Troubleshooting

### Backend Issues

**Issue**: Module not found errors
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

**Issue**: MongoDB connection failed
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Check connection string in .env
cat .env | grep MONGODB_URI

# Test connection
python3 -c "from pymongo import MongoClient; client = MongoClient('mongodb://localhost:27017'); print('Connected:', client.server_info())"
```

**Issue**: Port 8001 already in use
```bash
# Find and kill process
lsof -i :8001
kill -9 <PID>
```

### Frontend Issues

**Issue**: Node modules errors
```bash
cd frontend
rm -rf node_modules package-lock.json yarn.lock
yarn install
```

**Issue**: Port 3000 already in use
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or change port
PORT=3001 yarn dev
```

### NGINX-RTMP Issues

**Issue**: NGINX won't start
```bash
# Check configuration
/usr/local/nginx/sbin/nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Check if port 1935 is available
lsof -i :1935
```

**Issue**: Can't publish stream
```bash
# Check NGINX is running
sudo systemctl status nginx-rtmp

# Check HLS directory permissions
ls -la /tmp/hls
sudo chmod 777 /tmp/hls

# Restart NGINX
sudo systemctl restart nginx-rtmp
```

**Issue**: Stream plays but no HLS files
```bash
# Check HLS directory
ls -la /tmp/hls/

# Check NGINX config
cat /usr/local/nginx/conf/nginx.conf | grep hls_path

# Monitor live
watch -n 1 'ls -lah /tmp/hls/'
```

### OBS Streaming Issues

**Issue**: Connection failed
- Verify RTMP URL: `rtmp://localhost/live`
- Verify stream key from wedding management page
- Check firewall: `sudo ufw allow 1935/tcp`

**Issue**: High CPU usage
- Lower output resolution in OBS
- Change encoder to x264 (CPU) or use hardware encoding if available
- Reduce bitrate

### Database Issues

**Issue**: Collections not created
```bash
mongosh
use wedlive_db
db.createCollection('users')
db.createCollection('weddings')
db.createCollection('media')
db.createCollection('recordings')
db.createCollection('media_folders')
```

---

## 📝 Quick Reference

### Service Management

```bash
# NGINX-RTMP
sudo systemctl start nginx-rtmp
sudo systemctl stop nginx-rtmp
sudo systemctl restart nginx-rtmp
sudo systemctl status nginx-rtmp

# MongoDB (if local)
sudo systemctl start mongod
sudo systemctl stop mongod
sudo systemctl restart mongod
sudo systemctl status mongod

# Supervisor (if using)
sudo supervisorctl start all
sudo supervisorctl stop all
sudo supervisorctl restart all
sudo supervisorctl status
```

### Logs

```bash
# Backend logs
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/backend.err.log

# Frontend logs
tail -f /var/log/supervisor/frontend.out.log

# NGINX-RTMP logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs
- **HLS Streams**: http://localhost:8080/hls/
- **RTMP Stats**: http://localhost:8080/stat
- **RTMP Publish**: rtmp://localhost/live/{stream_key}

---

## 🎉 Success!

Your WedLive application should now be running successfully!

### Next Steps:
1. Create your first user account
2. Subscribe to a plan (use Razorpay test mode)
3. Create a wedding event
4. Test live streaming with OBS
5. Upload photos and organize into folders
6. Test live chat and reactions
7. Try DVR recording

### Production Deployment:
- Set up proper domain names
- Configure SSL certificates (Let's Encrypt)
- Use production MongoDB (Atlas or hosted)
- Update CORS origins
- Set strong JWT secret
- Configure firewall rules
- Set up automated backups
- Monitor logs and errors

---

## 📞 Support

For issues or questions:
- Check logs first
- Review this guide
- Check GitHub issues
- Contact support

---

**Made with ❤️ for wedding creators**