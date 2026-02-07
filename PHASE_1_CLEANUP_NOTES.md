# Phase 1 Cleanup Notes

## Completed Tasks (Phase 1.1, 1.2, 1.3)

### ✅ Files Removed
1. `/nginx-rtmp-config-template.conf` - RTMP server configuration
2. `/NGINX_RTMP_SETUP_GUIDE.md` - RTMP setup documentation
3. `/RTMP_STREAMING_GUIDE.md` - RTMP streaming guide
4. `/app/backend/app/services/ffmpeg_composition.py` - FFmpeg composition service (390 lines)

### ✅ Files Replaced
1. `/app/backend/app/services/recording_service.py` 
   - Removed: Custom FFmpeg recording (~460 lines)
   - Added: Pulse Egress API integration (~408 lines)
   - All recording now handled by Pulse LiveKit Egress
   - Metadata management retained for local tracking

## ⚠️ Known Issues - Requires Future Phase Work

### Broken Import References
The following files still import the removed `ffmpeg_composition.py`:

1. **`/app/backend/app/routes/streams.py`**
   - Line 739: `from app.services.ffmpeg_composition import update_composition`
   - Line 786: `from app.services.ffmpeg_composition import composition_service`
   - Line 821: `from app.services.ffmpeg_composition import composition_service`
   - **Impact**: Camera switching endpoints will fail
   - **Fix Required in**: Phase 2 (Multi-Camera Migration to Pulse)

2. **`/app/backend/app/routes/rtmp_webhooks.py`**
   - Line 6: `from app.services.ffmpeg_composition import start_composition`
   - Line 206: `from app.services.ffmpeg_composition import composition_service`
   - **Impact**: RTMP webhooks will fail
   - **Fix Required in**: Phase 1.6 (RTMP Webhook Replacement)

### Affected Endpoints (Currently Non-Functional)
- `POST /camera/{wedding_id}/switch` - Switch active camera
- `GET /camera/{wedding_id}/health` - Get composition health
- `POST /camera/{wedding_id}/recover` - Recover composition
- `POST /rtmp/on-publish` - RTMP publish webhook
- `POST /rtmp/on-publish-done` - RTMP done webhook

## Next Steps

### Immediate (Phase 1.4)
- Replace YouTube service with Pulse RTMP egress

### Phase 1.6
- Replace RTMP webhooks with LiveKit webhooks
- Remove `/app/backend/app/routes/rtmp_webhooks.py`
- Add `/app/backend/app/routes/livekit_webhooks.py`

### Phase 2 (Multi-Camera)
- Replace camera switching logic with Pulse track subscription
- Update camera endpoints in `streams.py` to use Pulse
- Remove old multi-camera composition logic

## Testing Notes

**DO NOT TEST** these endpoints until Phase 2:
- Any `/camera/*` endpoints
- Any `/rtmp/*` webhook endpoints

**CAN TEST** these endpoints:
- `POST /recordings/start` - Start recording (uses Pulse)
- `POST /recordings/stop` - Stop recording (uses Pulse)
- `GET /recordings/{id}/status` - Get recording status
- `GET /recordings/wedding/{wedding_id}` - List wedding recordings

## Migration Status

- Phase 1.1: ✅ COMPLETE
- Phase 1.2: ✅ COMPLETE  
- Phase 1.3: ✅ COMPLETE
- Phase 1.4: ⏳ PENDING (YouTube Service)
- Phase 1.5: ⏳ PENDING (Stream Service)
- Phase 1.6: ⏳ PENDING (RTMP Webhooks)

**Current Progress**: 15% of total migration
