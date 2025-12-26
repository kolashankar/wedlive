# Phase 10 - Premium Features Guide

## 🎉 Completed Features

### 1. Custom Branding (Premium Only)

Premium users can now customize their wedding platform with their own branding:

**Features:**
- Upload custom logo
- Set primary brand color
- Automatically applied to all weddings
- White-label option (hides WedLive branding)

**API Endpoints:**
```bash
POST /api/phase10/branding          # Create/update branding
GET /api/phase10/branding           # Get user's branding
GET /api/phase10/branding/user/{id} # Get public branding (for guests)
```

**Usage Example:**
```javascript
// Create custom branding
POST /api/phase10/branding
{
  "logo_url": "https://example.com/logo.png",
  "primary_color": "#FF6B6B"
}
```

---

### 2. API Access (Premium Only)

Premium users can generate API keys for programmatic access to WedLive platform:

**Features:**
- Generate secure API keys
- Name and description for each key
- Track last usage
- Active/inactive status

**API Endpoints:**
```bash
POST /api/phase10/api-keys        # Create new API key
GET /api/phase10/api-keys         # List all API keys
DELETE /api/phase10/api-keys/{id} # Delete API key
```

**Usage Example:**
```javascript
// Create API key
POST /api/phase10/api-keys
{
  "name": "Production API",
  "description": "Main API key for production use"
}

// Response includes secure key (shown only once)
{
  "id": "abc-123",
  "key": "wedlive_xxxxxxxxxxxxx",
  "name": "Production API",
  "is_active": true
}
```

---

### 3. Webhook Notifications (Premium Only)

Get real-time notifications for all major events:

**Supported Events:**
- `wedding.created` - New wedding created
- `wedding.started` - Live stream starts
- `wedding.ended` - Live stream ends
- `viewer.joined` - Viewer joins stream
- `viewer.left` - Viewer leaves
- `chat.message` - New chat message
- `recording.ready` - Recording processed

**API Endpoints:**
```bash
POST /api/phase10/webhooks              # Create webhook
GET /api/phase10/webhooks               # List webhooks
DELETE /api/phase10/webhooks/{id}       # Delete webhook
GET /api/phase10/webhooks/{id}/logs     # View delivery logs
```

**Usage Example:**
```javascript
// Create webhook
POST /api/phase10/webhooks
{
  "url": "https://your-app.com/webhook",
  "events": ["wedding.started", "wedding.ended", "viewer.joined"],
  "description": "Main webhook for production"
}

// Webhook payload sent to your URL
{
  "event": "wedding.started",
  "timestamp": "2025-12-06T10:00:00Z",
  "data": {
    "wedding_id": "abc-123",
    "title": "Alice & Bob Wedding",
    "rtmp_url": "rtmp://...",
    "playback_url": "https://..."
  }
}
```

**Security:**
- Each webhook receives a unique secret key
- Signature verification via `X-Webhook-Signature` header
- Automatic retry on failure
- Detailed delivery logs

---

### 4. Advanced Recording Options

**Quality Options by Plan:**

| Plan | Available Qualities |
|------|---------------------|
| Free | 720p only |
| Premium ($18/$180) | 720p, 1080p, 4K |

**Features:**
- Auto-detect available quality options
- Set recording quality per wedding
- Multiple format support (mp4, webm)
- Custom bitrate settings

**API Endpoints:**
```bash
GET /api/phase10/recording-quality/options    # Get available options
POST /api/phase10/recording-quality/settings  # Set wedding recording quality
```

**Usage Example:**
```javascript
// Check available quality options
GET /api/phase10/recording-quality/options
{
  "available_qualities": ["720p", "1080p", "4K"],
  "formats": ["mp4", "webm"],
  "plan": "monthly",
  "is_premium": true
}

// Set recording quality for a wedding
POST /api/phase10/recording-quality/settings
{
  "wedding_id": "abc-123",
  "quality": "4K",
  "format": "mp4",
  "bitrate": 8000
}
```

---

### 5. Recording Downloads (Premium Only)

Premium users can download recordings with quality selection:

**Features:**
- Generate temporary download links
- 24-hour expiry for security
- Select download quality
- Choose format (mp4/webm)

**API Endpoints:**
```bash
POST /api/phase10/recording-quality/download  # Generate download link
```

**Usage Example:**
```javascript
// Generate download link
POST /api/phase10/recording-quality/download
{
  "wedding_id": "abc-123",
  "quality": "1080p",
  "format": "mp4"
}

// Response
{
  "download_url": "/api/phase10/recording-quality/download/token_xxxxx",
  "expires_at": "2025-12-07T10:00:00Z",
  "quality": "1080p",
  "format": "mp4",
  "file_size": 1024000000
}
```

---

### 6. Wedding ID Sharing

Simple 6-digit numeric codes for easy wedding access:

**Features:**
- Automatically generated on wedding creation
- Easy to remember and share (e.g., 123456)
- Direct access without authentication
- Works for both live streams and recordings

**Usage:**
```bash
# Access wedding by code
GET /api/weddings/join/123456

# Response includes full wedding details
{
  "id": "abc-123",
  "short_code": "123456",
  "title": "Alice & Bob Wedding",
  "status": "live",
  "playback_url": "https://..."
}
```

**Sharing with Guests:**
1. Creator shares 6-digit code: **123456**
2. Guest enters code on website
3. Instant access to live stream or recording

---

## 🔥 Plan Comparison

### Free Plan
- ❌ Custom branding
- ❌ White-label solution
- ❌ API access
- ❌ Webhooks
- ✅ 720p recording only
- ❌ Recording downloads
- ✅ Wedding ID sharing

### Premium Monthly ($18/month)
- ✅ Custom branding
- ✅ White-label solution
- ✅ API access
- ✅ Webhook notifications
- ✅ 720p, 1080p, 4K recording
- ✅ Recording downloads
- ✅ Wedding ID sharing
- ✅ All other premium features

### Premium Yearly ($180/year)
- ✅ All Monthly features
- 💰 20% discount (save $36/year)

---

## 🚀 Testing Phase 10 Features

### 1. Test Custom Branding

```bash
# Login
curl -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"password"}'

# Get branding
curl -X GET "$API_URL/api/phase10/branding" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test API Keys

```bash
# Create API key
curl -X POST "$API_URL/api/phase10/api-keys" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Key","description":"Testing API access"}'

# List API keys
curl -X GET "$API_URL/api/phase10/api-keys" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Webhooks

```bash
# Create webhook
curl -X POST "$API_URL/api/phase10/webhooks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://webhook.site/your-unique-url",
    "events":["wedding.started","wedding.ended"],
    "description":"Test webhook"
  }'
```

### 4. Test Wedding ID

```bash
# Create wedding (returns short_code)
curl -X POST "$API_URL/api/weddings/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Wedding",
    "bride_name":"Alice",
    "groom_name":"Bob",
    "scheduled_date":"2025-12-25T10:00:00",
    "location":"Mumbai"
  }'

# Access by short code (no auth required)
curl -X GET "$API_URL/api/weddings/join/123456"
```

---

## 📊 Database Collections

Phase 10 adds these new collections:

1. **branding_settings** - Custom branding configurations
2. **api_keys** - API key management
3. **webhooks** - Webhook configurations
4. **webhook_logs** - Delivery logs and responses
5. **download_tokens** - Temporary download links

---

## 🎯 Next Steps

All Phase 10 features are now **LIVE** and ready to use!

**For Creators:**
1. Upgrade to Premium ($18/month or $180/year)
2. Customize your branding
3. Generate API keys for integrations
4. Set up webhooks for notifications
5. Choose recording quality (up to 4K)
6. Share weddings with simple 6-digit codes

**For Developers:**
- Full API documentation available
- Webhook testing with webhook.site
- Secure authentication with JWT tokens
- Real-time updates via webhooks

---

## 🐛 Troubleshooting

### Branding not appearing?
- Ensure you have a premium subscription
- Check if branding was saved successfully
- Verify `hide_wedlive_branding` is set to `true`

### Webhooks not triggering?
- Verify webhook URL is accessible
- Check webhook logs for delivery status
- Ensure events are correctly configured
- Validate signature in webhook endpoint

### Recording quality unavailable?
- Check your subscription plan
- Free users only get 720p
- Premium users get 720p, 1080p, 4K

### Wedding code not working?
- Ensure 6-digit code is correct
- Try case-insensitive search
- Check if wedding still exists

---

## 📞 Support

For issues or questions:
- Email: support@wedlive.com
- Check logs: `/var/log/supervisor/backend.*.log`
- API docs: https://your-domain.com/docs

---

**Built with ❤️ - Phase 10 Complete! 🚀**
