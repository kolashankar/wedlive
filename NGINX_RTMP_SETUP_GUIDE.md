# NGINX-RTMP Setup Guide for WedLive
**Complete Installation and Configuration Instructions**

## 📋 Current Status

✅ **Completed:**
- Phase 1-3: Backend live control system
- Phase 4: Recording service
- Phase 5: Host control UI (LiveControlPanel)
- Phase 6: Viewer status display (ViewerLiveStatus)
- Required directories created (/tmp/hls, /tmp/dash, /tmp/recordings)
- Backend environment configured with RTMP URLs

⚠️ **Pending:**
- NGINX-RTMP module installation
- NGINX configuration
- Testing with OBS Studio

---

## 🚀 Quick Start Options

### Option 1: Install NGINX-RTMP Module (Ubuntu/Debian)

**Step 1: Install NGINX with RTMP module**
```bash
# Update package lists
sudo apt-get update

# Install NGINX with RTMP module
sudo apt-get install -y libnginx-mod-rtmp

# Verify installation
nginx -V 2>&1 | grep rtmp
```

**Step 2: Backup existing NGINX config**
```bash
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
```

**Step 3: Copy WedLive NGINX configuration**
```bash
# Copy the template configuration
sudo cp /app/nginx-rtmp-config-template.conf /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t
```

**Step 4: Create required directories**
```bash
# Already done, but verify
ls -la /tmp/hls /tmp/dash /tmp/recordings

# If needed, recreate:
sudo mkdir -p /tmp/hls /tmp/dash /tmp/recordings
sudo chmod 777 /tmp/hls /tmp/dash /tmp/recordings
```

**Step 5: Restart NGINX**
```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

**Step 6: Verify RTMP is running**
```bash
# Check if RTMP port is listening
sudo netstat -tulpn | grep :1935

# Check if HLS port is listening
sudo netstat -tulpn | grep :8080
```

---

### Option 2: Compile NGINX from Source with RTMP Module

If `libnginx-mod-rtmp` is not available, compile from source:

**Step 1: Install dependencies**
```bash
sudo apt-get update
sudo apt-get install -y build-essential libpcre3 libpcre3-dev \
    zlib1g zlib1g-dev libssl-dev libgd-dev libgeoip-dev \
    libxml2 libxml2-dev libxslt1-dev wget git
```

**Step 2: Download NGINX and RTMP module**
```bash
cd /tmp
wget http://nginx.org/download/nginx-1.24.0.tar.gz
tar -xzf nginx-1.24.0.tar.gz

git clone https://github.com/arut/nginx-rtmp-module.git
```

**Step 3: Configure and compile**
```bash
cd nginx-1.24.0
./configure \
    --with-http_ssl_module \
    --with-http_v2_module \
    --with-http_realip_module \
    --with-http_addition_module \
    --with-http_sub_module \
    --with-http_dav_module \
    --with-http_flv_module \
    --with-http_mp4_module \
    --with-http_gunzip_module \
    --with-http_gzip_static_module \
    --with-http_random_index_module \
    --with-http_secure_link_module \
    --with-http_stub_status_module \
    --with-http_auth_request_module \
    --with-threads \
    --with-stream \
    --with-stream_ssl_module \
    --with-http_slice_module \
    --with-file-aio \
    --add-module=../nginx-rtmp-module

make -j$(nproc)
sudo make install
```

**Step 4: Create systemd service**
```bash
sudo nano /etc/systemd/system/nginx.service
```

Paste:
```ini
[Unit]
Description=The NGINX HTTP and RTMP Server
After=syslog.target network.target remote-fs.target nss-lookup.target

[Service]
Type=forking
PIDFile=/usr/local/nginx/logs/nginx.pid
ExecStartPre=/usr/local/nginx/sbin/nginx -t
ExecStart=/usr/local/nginx/sbin/nginx
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s QUIT $MAINPID
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**Step 5: Enable and start**
```bash
sudo systemctl daemon-reload
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

### Option 3: Use Docker Container (Easiest)

**Step 1: Pull NGINX-RTMP Docker image**
```bash
docker pull tiangolo/nginx-rtmp
```

**Step 2: Create docker-compose.yml**
```yaml
version: '3.8'
services:
  nginx-rtmp:
    image: tiangolo/nginx-rtmp
    ports:
      - "1935:1935"  # RTMP
      - "8080:8080"  # HLS
    volumes:
      - ./nginx-rtmp-config-template.conf:/etc/nginx/nginx.conf:ro
      - /tmp/hls:/tmp/hls
      - /tmp/dash:/tmp/dash
      - /tmp/recordings:/tmp/recordings
    restart: unless-stopped
    network_mode: host
```

**Step 3: Start container**
```bash
docker-compose up -d
```

---

## 🔧 Configuration

### Update Backend Environment Variables

Edit `/app/backend/.env`:

```bash
# For local development
RTMP_SERVER_URL=rtmp://localhost/live
HLS_SERVER_URL=http://localhost:8080/hls

# For production (update with your VPS IP or domain)
RTMP_SERVER_URL=rtmp://YOUR_VPS_IP/live
HLS_SERVER_URL=https://your-domain.com/hls
```

### Firewall Configuration

```bash
# Allow RTMP ingestion (from OBS)
sudo ufw allow 1935/tcp

# Allow HLS playback
sudo ufw allow 8080/tcp

# For production with HTTPS
sudo ufw allow 443/tcp
```

---

## 🧪 Testing

### Test 1: Check NGINX Status

```bash
sudo systemctl status nginx
sudo nginx -t
```

### Test 2: Test RTMP with FFmpeg

```bash
# Install FFmpeg
sudo apt-get install -y ffmpeg

# Test stream
ffmpeg -re -f lavfi -i testsrc=size=1280x720:rate=30 \
    -f flv rtmp://localhost/live/test
```

### Test 3: View HLS Stream

Open browser and navigate to:
```
http://localhost:8080/hls/test.m3u8
```

Use a player like VLC or HLS.js to view.

### Test 4: Test with OBS Studio

**Configure OBS:**
1. Open OBS Studio
2. Go to Settings → Stream
3. Service: Custom
4. Server: `rtmp://localhost/live`
5. Stream Key: `test`
6. Click "Start Streaming"

**Verify Stream:**
```bash
# Check NGINX logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check HLS files
ls -la /tmp/hls/test/
```

---

## 🔍 Troubleshooting

### Issue: RTMP module not found

**Solution:**
```bash
# Check if module is installed
nginx -V 2>&1 | grep rtmp

# If not found, install
sudo apt-get install -y libnginx-mod-rtmp

# Or compile from source (see Option 2 above)
```

### Issue: Permission denied on /tmp directories

**Solution:**
```bash
sudo chmod 777 /tmp/hls /tmp/dash /tmp/recordings
sudo chown -R www-data:www-data /tmp/hls /tmp/dash /tmp/recordings
```

### Issue: Port 1935 already in use

**Solution:**
```bash
# Find process using port
sudo lsof -i :1935

# Kill process or change NGINX RTMP port
sudo kill -9 <PID>
```

### Issue: HLS files not created

**Solution:**
```bash
# Check NGINX error logs
sudo tail -f /var/log/nginx/error.log

# Verify HLS configuration
sudo nginx -t

# Check directory permissions
ls -la /tmp/hls/
```

### Issue: Backend webhooks not called

**Solution:**
```bash
# Check backend is running
curl http://localhost:8001/health

# Check NGINX can reach backend
curl http://localhost:8001/api/rtmp/on-publish

# Verify webhook URLs in nginx.conf match backend port
```

---

## 📊 Monitoring

### View RTMP Statistics

Navigate to: `http://localhost:8080/stat`

This shows:
- Active streams
- Connected clients
- Bandwidth usage
- Stream uptime

### Check Logs

```bash
# NGINX access logs
sudo tail -f /var/log/nginx/access.log

# NGINX error logs
sudo tail -f /var/log/nginx/error.log

# Backend logs
tail -f /var/log/supervisor/backend.*.log
```

---

## 🎯 Production Deployment Checklist

- [ ] NGINX-RTMP installed and configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] HTTPS configured for HLS delivery
- [ ] Firewall rules configured
- [ ] Backend environment variables updated with production URLs
- [ ] DNS configured for domain
- [ ] Test streaming with OBS from external network
- [ ] Verify HLS playback in production
- [ ] Monitor NGINX logs for errors
- [ ] Set up log rotation
- [ ] Configure backup for /tmp/recordings
- [ ] Test webhooks (on-publish, on-publish-done)
- [ ] Verify live status transitions work
- [ ] Test pause/resume functionality
- [ ] Test end live and recording finalization

---

## 📚 Additional Resources

- [NGINX-RTMP Module GitHub](https://github.com/arut/nginx-rtmp-module)
- [NGINX Documentation](https://nginx.org/en/docs/)
- [OBS Studio Documentation](https://obsproject.com/wiki/)
- [HLS Specification](https://datatracker.ietf.org/doc/html/rfc8216)
- Full deployment guide: `/app/nginx-implementation.md`
- Hostinger VPS setup: `/app/hostinger_deploy.md`

---

## 🆘 Support

If you encounter issues:
1. Check logs: `sudo tail -f /var/log/nginx/error.log`
2. Verify configuration: `sudo nginx -t`
3. Test backend webhooks: `curl http://localhost:8001/api/rtmp/on-publish`
4. Review this guide's troubleshooting section
5. Check existing documentation in `/app/` directory

---

**Last Updated:** December 13, 2024
**Status:** Phases 4-6 Complete, Phase 7 Configuration Ready
