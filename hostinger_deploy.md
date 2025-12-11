# 🚀 Complete Hostinger Deployment Guide - WedLive Platform

**Full-stack wedding livestreaming platform deployment on Hostinger VPS**

---

## 📋 Overview

This guide provides step-by-step instructions for deploying the complete WedLive platform on Hostinger VPS, including:
- **Backend**: FastAPI + MongoDB + NGINX-RTMP streaming
- **Frontend**: Next.js React application
- **Features**: Live streaming, media upload, chat, recordings, payments

**Estimated Time**: 2-3 hours  
**Cost**: €4.99-€15.99/month (VPS only)  
**Difficulty**: Intermediate

---

## 🎯 Quick Start Checklist

- [ ] Purchase Hostinger VPS (KVM 2 or KVM 4)
- [ ] Install Ubuntu 22.04
- [ ] Set up NGINX-RTMP server
- [ ] Deploy backend (FastAPI)
- [ ] Deploy frontend (Next.js)
- [ ] Configure SSL/HTTPS
- [ ] Test OBS streaming
- [ ] Test live playback

---

## 📦 Part 1: Server Provisioning (30 minutes)

### 1.1 Purchase Hostinger VPS

1. **Go to**: [Hostinger VPS Hosting](https://www.hostinger.com/vps-hosting)

2. **Choose Plan** (Recommended):
   | Plan | Price | CPU | RAM | Storage | Use Case |
   |------|-------|-----|-----|---------|----------|
   | **KVM 2** | €4.99/mo | 2 cores | 4GB | 50GB | 1-2 concurrent streams |
   | **KVM 4** | €8.99/mo | 4 cores | 8GB | 100GB | 3-5 streams + quality variants |
   | **KVM 8** | €15.99/mo | 8 cores | 16GB | 200GB | 10+ streams + ABR |

3. **Complete purchase** and payment

### 1.2 Initial VPS Setup

1. **Access hPanel**:
   - Go to [Hostinger hPanel](https://hpanel.hostinger.com)
   - Navigate to **VPS** section
   - Click on your VPS instance

2. **Install Operating System**:
   ```
   hPanel → VPS → Operating System → Ubuntu 22.04 (64-bit) → Change OS
   ```
   Wait 5-10 minutes for installation

3. **Set Root Password**:
   ```
   hPanel → Settings → Root Password → Generate/Set Password
   ```
   **Save this password securely!**

4. **Note Your VPS Details**:
   - **IP Address**: (shown in hPanel dashboard)
   - **Root Password**: (from step 3)
   - **SSH Port**: 22 (default)

### 1.3 Connect to VPS

**Option A: Browser SSH (Easiest)**
```
hPanel → VPS → Browser SSH
```

**Option B: Terminal/PuTTY**
```bash
ssh root@YOUR_VPS_IP
# Enter password when prompted
```

---

## 🔧 Part 2: NGINX-RTMP Server Setup (45 minutes)

### 2.1 Update System

```bash
# Update package lists
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git build-essential software-properties-common

# Enable BBR TCP congestion control (better streaming performance)
echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf
sysctl -p
```

### 2.2 Configure Firewall

```bash
# Install UFW if not present
apt install -y ufw

# Configure firewall rules
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 1935/tcp  # RTMP
ufw allow 8001/tcp  # Backend API
ufw allow 3000/tcp  # Frontend (development)

# Enable firewall
ufw --force enable
ufw status
```

**IMPORTANT**: Also configure Hostinger's firewall in hPanel:
```
hPanel → VPS → Firewall → Add Rules:
- Port 22 (SSH) - TCP
- Port 80 (HTTP) - TCP
- Port 443 (HTTPS) - TCP
- Port 1935 (RTMP) - TCP
- Port 8001 (Backend) - TCP
```

### 2.3 Install NGINX with RTMP Module

```bash
# Install build dependencies
apt install -y \
    build-essential \
    libpcre3 \
    libpcre3-dev \
    zlib1g \
    zlib1g-dev \
    libssl-dev \
    libgd-dev \
    libgeoip-dev \
    libxml2 \
    libxml2-dev \
    libbz2-dev \
    libxslt1-dev \
    libgd-ocaml-dev

# Download NGINX 1.24.0
cd /tmp
wget http://nginx.org/download/nginx-1.24.0.tar.gz
tar -xzf nginx-1.24.0.tar.gz

# Download NGINX-RTMP module
git clone https://github.com/arut/nginx-rtmp-module.git

# Compile NGINX with RTMP module
cd nginx-1.24.0
./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/usr/lib/nginx/modules \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --http-client-body-temp-path=/var/cache/nginx/client_temp \
    --http-proxy-temp-path=/var/cache/nginx/proxy_temp \
    --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp \
    --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp \
    --http-scgi-temp-path=/var/cache/nginx/scgi_temp \
    --user=nginx \
    --group=nginx \
    --with-compat \
    --with-file-aio \
    --with-threads \
    --with-http_addition_module \
    --with-http_auth_request_module \
    --with-http_dav_module \
    --with-http_flv_module \
    --with-http_gunzip_module \
    --with-http_gzip_static_module \
    --with-http_mp4_module \
    --with-http_random_index_module \
    --with-http_realip_module \
    --with-http_secure_link_module \
    --with-http_slice_module \
    --with-http_ssl_module \
    --with-http_stub_status_module \
    --with-http_sub_module \
    --with-http_v2_module \
    --with-mail \
    --with-mail_ssl_module \
    --with-stream \
    --with-stream_realip_module \
    --with-stream_ssl_module \
    --with-stream_ssl_preread_module \
    --add-module=../nginx-rtmp-module

# Compile and install
make -j$(nproc)
make install

# Create nginx user
useradd -r -M -s /sbin/nologin nginx

# Create cache directories
mkdir -p /var/cache/nginx/client_temp
mkdir -p /var/cache/nginx/proxy_temp
mkdir -p /var/cache/nginx/fastcgi_temp
mkdir -p /var/cache/nginx/uwsgi_temp
mkdir -p /var/cache/nginx/scgi_temp
chown -R nginx:nginx /var/cache/nginx
```

### 2.4 Create NGINX Systemd Service

```bash
cat > /etc/systemd/system/nginx.service << 'EOF'
[Unit]
Description=The NGINX HTTP and reverse proxy server
After=syslog.target network-online.target remote-fs.target nss-lookup.target
Wants=network-online.target

[Service]
Type=forking
PIDFile=/var/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t
ExecStart=/usr/sbin/nginx
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s QUIT $MAINPID
PrivateTmp=true
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start NGINX
systemctl daemon-reload
systemctl enable nginx
```

### 2.5 Configure NGINX for RTMP and HLS

```bash
# Backup default config
mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Create production NGINX config
cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

# RTMP Configuration
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        allow publish all;
        
        # Main live application
        application live {
            live on;
            
            # Enable HLS
            hls on;
            hls_path /tmp/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            
            # Enable recording (DVR)
            record all;
            record_path /var/recordings;
            record_unique on;
            record_suffix -%Y%m%d-%H%M%S.flv;
            
            # Transcoding for adaptive bitrate (optional)
            # exec ffmpeg -i rtmp://localhost/live/$name
            #   -c:v libx264 -c:a aac -b:v 256k -b:a 64k -vf scale=640:360 -f flv rtmp://localhost/live360/$name
            #   -c:v libx264 -c:a aac -b:v 512k -b:a 128k -vf scale=854:480 -f flv rtmp://localhost/live480/$name
            #   -c:v libx264 -c:a aac -b:v 1024k -b:a 128k -vf scale=1280:720 -f flv rtmp://localhost/live720/$name;
        }
        
        # Quality variants (if transcoding enabled)
        application live360 { live on; hls on; hls_path /tmp/hls360; hls_fragment 3; }
        application live480 { live on; hls on; hls_path /tmp/hls480; hls_fragment 3; }
        application live720 { live on; hls on; hls_path /tmp/hls720; hls_fragment 3; }
    }
}

# HTTP Configuration
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_size "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
    # HLS streaming server
    server {
        listen 80;
        server_name _;
        
        # CORS headers for HLS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        
        # HLS stream endpoint
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /tmp;
            add_header Cache-Control no-cache;
            add_header 'Access-Control-Allow-Origin' '*' always;
        }
        
        # RTMP statistics page
        location /stat {
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
        }
        
        location /stat.xsl {
            root /etc/nginx/html;
        }
        
        # Health check
        location /health {
            access_log off;
            return 200 "NGINX-RTMP Server Running\n";
            add_header Content-Type text/plain;
        }
        
        # Backend API proxy
        location /api {
            proxy_pass http://localhost:8001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Frontend application
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF

# Create directories
mkdir -p /tmp/hls /tmp/hls360 /tmp/hls480 /tmp/hls720
mkdir -p /var/recordings
chown -R nginx:nginx /tmp/hls /tmp/hls360 /tmp/hls480 /tmp/hls720 /var/recordings

# Copy RTMP stat stylesheet
mkdir -p /etc/nginx/html
wget -O /etc/nginx/html/stat.xsl https://raw.githubusercontent.com/arut/nginx-rtmp-module/master/stat.xsl

# Test and start NGINX
nginx -t
systemctl start nginx
systemctl status nginx
```

### 2.6 Verify NGINX-RTMP Installation

```bash
# Check NGINX is running
systemctl status nginx

# Check RTMP port is listening
netstat -tuln | grep 1935

# Check HTTP port is listening
netstat -tuln | grep 80

# Test health endpoint
curl http://localhost/health

# View RTMP statistics
curl http://localhost/stat
```

**Expected Output**:
- NGINX service: ✅ Active (running)
- Port 1935: ✅ Listening
- Port 80: ✅ Listening
- Health check: ✅ "NGINX-RTMP Server Running"

---

## 🐍 Part 3: Backend Deployment (30 minutes)

### 3.1 Install Python and Dependencies

```bash
# Install Python 3.11
apt install -y python3 python3-pip python3-venv

# Verify Python version
python3 --version  # Should be 3.11+
```

### 3.2 Clone and Setup Application

```bash
# Navigate to home directory
cd /root

# Clone your repository (replace with your actual repo)
# If you don't have git repo, you can upload via SFTP/SCP
git clone https://your-repo-url/wedlive.git
cd wedlive

# Or if uploading manually:
# 1. Create directory: mkdir -p /root/wedlive
# 2. Upload files via FileZilla/WinSCP to /root/wedlive
# 3. cd /root/wedlive
```

### 3.3 Install Backend Dependencies

```bash
cd /root/wedlive/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Install additional system dependencies if needed
apt install -y libpq-dev  # For PostgreSQL (if used)
```

### 3.4 Configure Backend Environment

```bash
cd /root/wedlive/backend

# Create .env file
cat > .env << 'EOF'
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your-user:your-password@cluster0.xxxxx.mongodb.net/wedlive_db?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Backend URL
BACKEND_URL=https://your-domain.com

# NGINX-RTMP Configuration
RTMP_SERVER_URL=rtmp://YOUR_VPS_IP/live
HLS_SERVER_URL=https://your-domain.com/hls

# Razorpay Configuration (for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Telegram Bot Configuration (for media storage)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHANNEL_ID=your_telegram_channel_id
TELEGRAM_LOG_CHANNEL_ID=your_telegram_log_channel_id

# CORS Origins
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Environment
ENVIRONMENT=production
EOF

# Important: Edit the .env file with your actual values!
nano .env
```

**Required Configuration Changes**:
1. **MONGODB_URI**: Your MongoDB Atlas connection string
2. **JWT_SECRET**: Generate with: `openssl rand -hex 32`
3. **BACKEND_URL**: Your domain or VPS IP
4. **RTMP_SERVER_URL**: `rtmp://YOUR_VPS_IP/live`
5. **HLS_SERVER_URL**: `https://your-domain.com/hls` (or `http://YOUR_VPS_IP/hls`)
6. **RAZORPAY_KEY_ID/SECRET**: Your Razorpay credentials
7. **TELEGRAM_BOT_TOKEN**: Your Telegram bot token

### 3.5 Setup Backend Service with Supervisor

```bash
# Install Supervisor
apt install -y supervisor

# Create Supervisor config for backend
cat > /etc/supervisor/conf.d/wedlive-backend.conf << 'EOF'
[program:wedlive-backend]
directory=/root/wedlive/backend
command=/root/wedlive/backend/venv/bin/uvicorn server:socket_app --host 0.0.0.0 --port 8001 --workers 4
user=root
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
stderr_logfile=/var/log/supervisor/wedlive-backend.err.log
stdout_logfile=/var/log/supervisor/wedlive-backend.out.log
environment=PATH="/root/wedlive/backend/venv/bin"
EOF

# Reload Supervisor
supervisorctl reread
supervisorctl update
supervisorctl start wedlive-backend

# Check status
supervisorctl status wedlive-backend

# View logs
tail -f /var/log/supervisor/wedlive-backend.out.log
```

### 3.6 Test Backend

```bash
# Test health endpoint
curl http://localhost:8001/api/health

# Test via public IP
curl http://YOUR_VPS_IP:8001/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "WedLive API",
  "version": "3.0.0"
}
```

---

## ⚛️ Part 4: Frontend Deployment (30 minutes)

### 4.1 Install Node.js and Yarn

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js and npm
node --version  # Should be v20.x
npm --version

# Install Yarn
npm install -g yarn
yarn --version
```

### 4.2 Configure Frontend Environment

```bash
cd /root/wedlive/frontend

# Create .env.production file
cat > .env.production << 'EOF'
# Backend API URL
NEXT_PUBLIC_API_URL=https://your-domain.com
REACT_APP_BACKEND_URL=https://your-domain.com

# Environment
NODE_ENV=production
EOF

# Edit with your actual domain
nano .env.production
```

**Important**: Replace `your-domain.com` with your actual domain or `http://YOUR_VPS_IP`

### 4.3 Build Frontend

```bash
cd /root/wedlive/frontend

# Install dependencies
yarn install

# Build production bundle
yarn build

# This creates optimized production build in .next directory
```

### 4.4 Setup Frontend Service

```bash
# Create Supervisor config for frontend
cat > /etc/supervisor/conf.d/wedlive-frontend.conf << 'EOF'
[program:wedlive-frontend]
directory=/root/wedlive/frontend
command=/usr/bin/yarn start
user=root
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
stderr_logfile=/var/log/supervisor/wedlive-frontend.err.log
stdout_logfile=/var/log/supervisor/wedlive-frontend.out.log
environment=NODE_ENV="production",PORT="3000"
EOF

# Reload Supervisor
supervisorctl reread
supervisorctl update
supervisorctl start wedlive-frontend

# Check status
supervisorctl status wedlive-frontend

# View logs
tail -f /var/log/supervisor/wedlive-frontend.out.log
```

### 4.5 Test Frontend

```bash
# Test locally
curl http://localhost:3000

# Test via public IP
curl http://YOUR_VPS_IP:3000
```

You should see HTML content from Next.js

---

## 🔒 Part 5: SSL/HTTPS Setup with Let's Encrypt (20 minutes)

### 5.1 Configure Domain DNS

Before proceeding, configure your domain's DNS:

1. Go to your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare)
2. Add/Update A Records:
   ```
   Type: A
   Name: @ (or your-domain.com)
   Value: YOUR_VPS_IP
   TTL: 300
   
   Type: A
   Name: www
   Value: YOUR_VPS_IP
   TTL: 300
   ```
3. Wait 5-15 minutes for DNS propagation

**Verify DNS propagation**:
```bash
# On your local machine
nslookup your-domain.com
dig your-domain.com
```

### 5.2 Install Certbot

```bash
# Install Certbot and NGINX plugin
apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### 5.3 Obtain SSL Certificate

```bash
# Stop NGINX temporarily
systemctl stop nginx

# Obtain certificate
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Follow prompts:
# - Enter email address
# - Agree to Terms of Service
# - Choose whether to share email with EFF

# Certificates will be saved to:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 5.4 Update NGINX Configuration for HTTPS

```bash
# Backup current config
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Update NGINX config with SSL
cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

# RTMP Configuration (unchanged)
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        allow publish all;
        
        application live {
            live on;
            hls on;
            hls_path /tmp/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            record all;
            record_path /var/recordings;
            record_unique on;
            record_suffix -%Y%m%d-%H%M%S.flv;
        }
    }
}

# HTTP Configuration with SSL
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_size "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;
    
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$host$request_uri;
        }
    }
    
    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;
        
        # SSL Configuration
        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # CORS headers for HLS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        
        # HLS stream endpoint
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /tmp;
            add_header Cache-Control no-cache;
            add_header 'Access-Control-Allow-Origin' '*' always;
        }
        
        # RTMP statistics
        location /stat {
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
        }
        
        location /stat.xsl {
            root /etc/nginx/html;
        }
        
        # Health check
        location /health {
            access_log off;
            return 200 "NGINX-RTMP Server Running\n";
            add_header Content-Type text/plain;
        }
        
        # Backend API proxy
        location /api {
            proxy_pass http://localhost:8001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # Socket.IO proxy
        location /socket.io {
            proxy_pass http://localhost:8001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffering off;
            proxy_cache_bypass $http_upgrade;
        }
        
        # Frontend application
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# IMPORTANT: Replace 'your-domain.com' with your actual domain!
nano /etc/nginx/nginx.conf

# Test configuration
nginx -t

# Restart NGINX
systemctl restart nginx
```

### 5.5 Setup Auto-Renewal

```bash
# Test renewal
certbot renew --dry-run

# Certificate will auto-renew via systemd timer
systemctl status certbot.timer

# View renewal logs
journalctl -u certbot.timer
```

### 5.6 Update Application Environment for HTTPS

```bash
# Update backend .env
cd /root/wedlive/backend
nano .env

# Update these values:
# BACKEND_URL=https://your-domain.com
# HLS_SERVER_URL=https://your-domain.com/hls
# CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Update frontend .env.production
cd /root/wedlive/frontend
nano .env.production

# Update:
# NEXT_PUBLIC_API_URL=https://your-domain.com
# REACT_APP_BACKEND_URL=https://your-domain.com

# Rebuild frontend
yarn build

# Restart services
supervisorctl restart wedlive-backend
supervisorctl restart wedlive-frontend
supervisorctl status
```

---

## 🎥 Part 6: OBS Studio Configuration & Testing (15 minutes)

### 6.1 Download and Install OBS Studio

1. **Download OBS**:
   - Windows: [OBS Studio Download](https://obsproject.com/download)
   - Mac: Download from website
   - Linux: `sudo apt install obs-studio`

2. **Install and Launch OBS Studio**

### 6.2 Configure OBS for RTMP Streaming

1. **Open OBS Settings** (File → Settings or Ctrl+Comma)

2. **Stream Settings**:
   ```
   Service: Custom...
   Server: rtmp://YOUR_VPS_IP/live
   Stream Key: (Get from WedLive dashboard - wedding RTMP credentials)
   ```

3. **Output Settings**:
   ```
   Output Mode: Simple
   Video Bitrate: 2500 Kbps (for 720p)
   Encoder: x264
   Audio Bitrate: 160
   ```

4. **Video Settings**:
   ```
   Base Resolution: 1920x1080
   Output Resolution: 1280x720
   FPS: 30
   ```

5. **Advanced Settings**:
   ```
   Process Priority: High
   Color Format: NV12
   Color Space: 709
   ```

### 6.3 Add Sources to OBS

1. **Add Video Source**:
   - Click **+** under Sources
   - Select **Video Capture Device** (webcam) or **Display Capture** (screen)
   - Configure and click OK

2. **Add Audio**:
   - OBS automatically captures desktop audio and mic

3. **Test Setup**:
   - Click **Start Streaming**
   - Check OBS status bar (should show green "Live" indicator)
   - Bitrate and FPS should be stable

### 6.4 Test Live Streaming

1. **Start Streaming from OBS**:
   ```
   OBS → Start Streaming
   ```

2. **Check NGINX-RTMP Status**:
   ```bash
   # On server
   curl http://YOUR_VPS_IP/stat
   
   # Should show active stream with your stream key
   ```

3. **Verify HLS Playlist Created**:
   ```bash
   # Check HLS files exist
   ls -lh /tmp/hls/
   
   # Should see .m3u8 and .ts files
   ```

4. **Test Playback in Browser**:
   - Open: `https://your-domain.com`
   - Navigate to your wedding
   - Click "View Live Stream"
   - Video should start playing (may take 10-15 seconds to start)

### 6.5 Troubleshooting OBS Connection Issues

**If OBS shows "Failed to connect to server":**

1. **Check RTMP Port**:
   ```bash
   # On server
   netstat -tuln | grep 1935
   ```
   Should show: `0.0.0.0:1935`

2. **Check Firewall**:
   ```bash
   # On server
   ufw status | grep 1935
   ```
   Should show: `1935/tcp ALLOW Anywhere`

3. **Check NGINX RTMP Logs**:
   ```bash
   tail -f /var/log/nginx/error.log
   ```
   Look for RTMP connection attempts

4. **Verify Stream Key Format**:
   - Should be: `live_<wedding_id>_<random_id>`
   - Example: `live_wedding123_4f51a0f9e1cc4020`

5. **Test RTMP Connection with FFmpeg**:
   ```bash
   # On your local machine (if FFmpeg installed)
   ffmpeg -re -f lavfi -i testsrc=size=1280x720:rate=30 \
     -f flv rtmp://YOUR_VPS_IP/live/test_stream_key
   ```

6. **Common Issues**:
   - ❌ **"Connection timed out"**: Firewall blocking port 1935
   - ❌ **"Connection refused"**: NGINX RTMP not running
   - ❌ **"Invalid stream key"**: Check wedding RTMP credentials
   - ❌ **Stream starts but no playback**: Check HLS_SERVER_URL in backend .env

---

## ✅ Part 7: Final Testing & Verification (15 minutes)

### 7.1 Backend API Tests

```bash
# Health check
curl https://your-domain.com/api/health

# Register new user
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "full_name": "Test User"
  }'

# Login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### 7.2 Frontend Tests

1. **Homepage**: `https://your-domain.com` ✅
2. **Register**: `https://your-domain.com/register` ✅
3. **Login**: `https://your-domain.com/login` ✅
4. **Dashboard**: `https://your-domain.com/dashboard` ✅
5. **Pricing**: `https://your-domain.com/pricing` ✅

### 7.3 Streaming Tests

1. **Create Wedding**:
   - Login → Dashboard → Create Wedding
   - Fill in details and create

2. **Get RTMP Credentials**:
   - Dashboard → Manage Wedding → Stream Tab
   - Copy RTMP URL and Stream Key

3. **Configure OBS**:
   - Paste credentials into OBS
   - Start Streaming

4. **Test Live Playback**:
   - Open wedding viewer page
   - Should see live video within 10-15 seconds

5. **Test Chat**:
   - Send chat messages from viewer page
   - Should appear in real-time

6. **Test Recording** (if enabled):
   - Start recording from manage page
   - Check `/var/recordings` for .flv files

### 7.4 Performance Tests

```bash
# Check CPU usage
top

# Check memory usage
free -h

# Check disk space
df -h

# Check network connections
netstat -an | grep :1935

# Monitor NGINX access log
tail -f /var/log/nginx/access.log

# Monitor backend logs
tail -f /var/log/supervisor/wedlive-backend.out.log

# Monitor frontend logs
tail -f /var/log/supervisor/wedlive-frontend.out.log
```

### 7.5 System Status Check

```bash
# Check all services
supervisorctl status
systemctl status nginx
systemctl status mongodb

# Should all show: Active (running) ✅
```

---

## 🔧 Part 8: Common Issues & Solutions

### Issue 1: "Failed to connect to server" in OBS

**Symptoms**: OBS can't connect to RTMP server

**Solutions**:
```bash
# 1. Check NGINX is running
systemctl status nginx

# 2. Check port 1935 is open
ufw status | grep 1935
netstat -tuln | grep 1935

# 3. Check NGINX RTMP config
nginx -t
cat /etc/nginx/nginx.conf | grep -A 20 "rtmp {"

# 4. Restart NGINX
systemctl restart nginx

# 5. Check firewall in Hostinger hPanel
# Ensure port 1935/TCP is allowed
```

### Issue 2: React Error #130 (Minified React error)

**Symptoms**: White screen or error in browser console

**Solutions**:
```bash
# 1. Clear Next.js build cache
cd /root/wedlive/frontend
rm -rf .next
yarn build

# 2. Check environment variables
cat .env.production

# 3. Restart frontend
supervisorctl restart wedlive-frontend

# 4. Clear browser cache and reload
```

### Issue 3: Stream Plays in OBS but Not in Browser

**Symptoms**: OBS shows streaming, but no video in web player

**Solutions**:
```bash
# 1. Check HLS files are being created
ls -lh /tmp/hls/
# Should see .m3u8 and .ts files

# 2. Check HLS endpoint is accessible
curl https://your-domain.com/hls/STREAM_KEY.m3u8

# 3. Check CORS headers
curl -I https://your-domain.com/hls/test.m3u8 | grep Access-Control

# 4. Check backend HLS_SERVER_URL
cd /root/wedlive/backend
grep HLS_SERVER_URL .env

# Should be: https://your-domain.com/hls

# 5. Restart services
supervisorctl restart all
systemctl restart nginx
```

### Issue 4: Socket.IO Connection Failed

**Symptoms**: Chat not working, viewer count not updating

**Solutions**:
```bash
# 1. Check Socket.IO endpoint
curl https://your-domain.com/socket.io/

# 2. Check NGINX Socket.IO proxy config
cat /etc/nginx/nginx.conf | grep -A 10 "location /socket.io"

# 3. Check backend logs
tail -f /var/log/supervisor/wedlive-backend.out.log | grep socket

# 4. Verify WebSocket upgrade headers in NGINX config
# Should have: proxy_set_header Upgrade $http_upgrade
```

### Issue 5: 502 Bad Gateway

**Symptoms**: Website shows 502 error

**Solutions**:
```bash
# 1. Check backend is running
supervisorctl status wedlive-backend

# 2. Check backend logs
tail -100 /var/log/supervisor/wedlive-backend.err.log

# 3. Test backend directly
curl http://localhost:8001/api/health

# 4. Restart backend
supervisorctl restart wedlive-backend

# 5. Check NGINX error log
tail -50 /var/log/nginx/error.log
```

### Issue 6: SSL Certificate Issues

**Symptoms**: "Your connection is not private" error

**Solutions**:
```bash
# 1. Check certificate files exist
ls -lh /etc/letsencrypt/live/your-domain.com/

# 2. Test certificate renewal
certbot renew --dry-run

# 3. Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -noout -dates

# 4. Renew certificate if needed
certbot renew --force-renewal

# 5. Restart NGINX
systemctl restart nginx
```

### Issue 7: High CPU/Memory Usage

**Symptoms**: Server slow, services crashing

**Solutions**:
```bash
# 1. Check resource usage
top
htop  # Install: apt install htop

# 2. Check specific processes
ps aux | grep python
ps aux | grep node

# 3. Reduce backend workers
nano /etc/supervisor/conf.d/wedlive-backend.conf
# Change: --workers 4 to --workers 2

# 4. Enable swap if not present
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 5. Restart services
supervisorctl restart all
```

---

## 📊 Part 9: Monitoring & Maintenance

### 9.1 Daily Checks

```bash
# Create monitoring script
cat > /root/daily_check.sh << 'EOF'
#!/bin/bash
echo "=== WedLive System Status Check ==="
echo "Date: $(date)"
echo ""

echo "--- Services Status ---"
supervisorctl status
systemctl status nginx --no-pager

echo ""
echo "--- Disk Usage ---"
df -h /

echo ""
echo "--- Memory Usage ---"
free -h

echo ""
echo "--- CPU Load ---"
uptime

echo ""
echo "--- Active Streams ---"
curl -s http://localhost/stat | grep -E "application|clients"

echo ""
echo "--- Recent Backend Errors ---"
tail -20 /var/log/supervisor/wedlive-backend.err.log

echo ""
echo "=== End of Check ==="
EOF

chmod +x /root/daily_check.sh

# Run daily check
/root/daily_check.sh
```

### 9.2 Log Rotation

```bash
# Configure logrotate for application logs
cat > /etc/logrotate.d/wedlive << 'EOF'
/var/log/supervisor/wedlive-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        supervisorctl restart wedlive-backend wedlive-frontend
    endscript
}

/var/recordings/*.flv {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
EOF
```

### 9.3 Backup Strategy

```bash
# Create backup script
cat > /root/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MongoDB (if using local MongoDB)
# mongodump --out $BACKUP_DIR/mongodb_$DATE

# Backup application code
tar -czf $BACKUP_DIR/wedlive_$DATE.tar.gz /root/wedlive

# Backup NGINX config
cp /etc/nginx/nginx.conf $BACKUP_DIR/nginx_$DATE.conf

# Backup environment files
cp /root/wedlive/backend/.env $BACKUP_DIR/backend_env_$DATE
cp /root/wedlive/frontend/.env.production $BACKUP_DIR/frontend_env_$DATE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /root/backup.sh

# Setup daily backup cron job
crontab -e
# Add: 0 2 * * * /root/backup.sh >> /var/log/backup.log 2>&1
```

### 9.4 Update Procedures

```bash
# Create update script
cat > /root/update.sh << 'EOF'
#!/bin/bash
echo "=== Updating WedLive Application ==="

cd /root/wedlive

# Pull latest code
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install --upgrade -r requirements.txt
deactivate

# Update frontend
cd ../frontend
yarn install
yarn build

# Restart services
supervisorctl restart wedlive-backend wedlive-frontend

echo "=== Update Complete ==="
supervisorctl status
EOF

chmod +x /root/update.sh
```

---

## 🎉 Conclusion

### You Now Have:

- ✅ **Complete wedding livestreaming platform** running on Hostinger VPS
- ✅ **NGINX-RTMP server** for low-latency streaming
- ✅ **FastAPI backend** with MongoDB, Razorpay, Telegram CDN
- ✅ **Next.js frontend** with live chat, recordings, media gallery
- ✅ **SSL/HTTPS** with auto-renewal
- ✅ **OBS Studio integration** for professional streaming
- ✅ **Monitoring and maintenance** scripts

### Next Steps:

1. **Test all features thoroughly**
2. **Add custom domain branding**
3. **Configure payment gateway in production mode**
4. **Setup analytics and monitoring (optional)**
5. **Create user documentation**
6. **Launch and promote your platform!**

### Support & Resources:

- **NGINX-RTMP Documentation**: https://github.com/arut/nginx-rtmp-module
- **OBS Studio Guide**: https://obsproject.com/wiki/
- **Let's Encrypt Help**: https://letsencrypt.org/docs/
- **Hostinger Support**: https://www.hostinger.com/support

---

## 📝 Quick Reference

### Important File Locations:
```
Application: /root/wedlive
Backend: /root/wedlive/backend
Frontend: /root/wedlive/frontend
NGINX Config: /etc/nginx/nginx.conf
Supervisor Configs: /etc/supervisor/conf.d/
SSL Certificates: /etc/letsencrypt/live/your-domain.com/
Recordings: /var/recordings/
HLS Streams: /tmp/hls/
Logs: /var/log/supervisor/ and /var/log/nginx/
```

### Important Commands:
```bash
# Service Management
supervisorctl status
supervisorctl restart wedlive-backend
supervisorctl restart wedlive-frontend
systemctl restart nginx

# Logs
tail -f /var/log/supervisor/wedlive-backend.out.log
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Health Checks
curl https://your-domain.com/api/health
curl https://your-domain.com/stat

# RTMP Status
curl http://localhost/stat | grep -E "application|clients"
ls -lh /tmp/hls/
```

### Emergency Recovery:
```bash
# Full restart
supervisorctl restart all
systemctl restart nginx
systemctl restart mongodb  # If using local MongoDB

# Reset NGINX
nginx -t && systemctl restart nginx

# View all errors
tail -100 /var/log/supervisor/*.err.log
```

---

**Deployment Guide Version**: 1.0  
**Last Updated**: December 2024  
**Platform**: WedLive v3.0  
**Tested On**: Hostinger VPS KVM 2/4, Ubuntu 22.04

---

🎊 **Congratulations on deploying your wedding livestreaming platform!** 🎊
