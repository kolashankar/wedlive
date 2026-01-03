# API Documentation - Video Template System

## Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:8001/api
```

## Authentication

Most endpoints require JWT authentication.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Admin Endpoints:** Require admin role
**User Endpoints:** Require authenticated user
**Public Endpoints:** No authentication required

---

## Endpoints Overview

### Admin Endpoints (8)
1. POST `/admin/video-templates/upload` - Upload video template
2. POST `/admin/video-templates/{id}/overlays` - Add text overlay
3. GET `/admin/video-templates` - List all templates (admin view)
4. PUT `/admin/video-templates/{id}` - Update template metadata
5. DELETE `/admin/video-templates/{id}` - Delete template
6. PUT `/admin/video-templates/{id}/overlays/{overlay_id}` - Update overlay
7. DELETE `/admin/video-templates/{id}/overlays/{overlay_id}` - Delete overlay
8. PUT `/admin/video-templates/{id}/overlays/reorder` - Reorder overlays

### User Endpoints (7)
9. GET `/video-templates` - List available templates
10. GET `/video-templates/{id}` - Get template details
11. POST `/weddings/{id}/assign-template` - Assign template to wedding
12. GET `/weddings/{id}/template-assignment` - Get wedding's template
13. POST `/video-templates/{id}/preview` - Preview with wedding data
14. DELETE `/weddings/{id}/template-assignment` - Remove template
15. POST `/weddings/{id}/render-template-video` - Start render job
16. GET `/weddings/{id}/render-jobs/{job_id}` - Get render status
17. GET `/weddings/{id}/render-jobs/{job_id}/download` - Download rendered video

### Utility Endpoints (1)
18. GET `/video-templates/endpoints/list` - List available wedding data endpoints

---

## Admin API Reference

### 1. Upload Video Template

**Endpoint:** `POST /admin/video-templates/upload`

**Authentication:** Admin required

**Content-Type:** `multipart/form-data`

**Request Body:**
```
file: File (video file)
name: string (required)
description: string (optional)
category: string (invitation|announcement|save-the-date|general)
tags: string (comma-separated)
```

**Example:**
```bash
curl -X POST https://api.example.com/admin/video-templates/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@wedding_video.mp4" \
  -F "name=Elegant Wedding Invitation" \
  -F "description=Beautiful floral wedding template" \
  -F "category=invitation" \
  -F "tags=elegant,floral,romantic"
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Elegant Wedding Invitation",
  "description": "Beautiful floral wedding template",
  "category": "invitation",
  "tags": ["elegant", "floral", "romantic"],
  "video_data": {
    "original_url": "https://cdn.telegram.org/file/xyz",
    "telegram_file_id": "BAACAgIAAxkBAAI...",
    "duration_seconds": 30,
    "width": 1920,
    "height": 1080,
    "format": "mp4",
    "file_size_mb": 12.5
  },
  "preview_thumbnail": {
    "url": "https://cdn.telegram.org/file/thumb",
    "telegram_file_id": "BAACAgIAAxkBAAI..."
  },
  "text_overlays": [],
  "metadata": {
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "created_by": "admin_user_id",
    "is_featured": false,
    "is_active": true,
    "usage_count": 0
  }
}
```

**Errors:**
- `400 Bad Request`: Invalid file format or size
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not admin user
- `500 Internal Server Error`: Upload or processing failed

---

### 2. Add Text Overlay

**Endpoint:** `POST /admin/video-templates/{template_id}/overlays`

**Authentication:** Admin required

**Request Body:**
```json
{
  "endpoint_key": "bride_name",
  "label": "Bride's Name",
  "placeholder_text": "Sarah",
  "position": {
    "x": 960,
    "y": 400,
    "alignment": "center",
    "anchor_point": "center"
  },
  "timing": {
    "start_time": 2.0,
    "end_time": 8.0
  },
  "styling": {
    "font_family": "Playfair Display",
    "font_size": 72,
    "font_weight": "bold",
    "color": "#ffffff",
    "text_align": "center",
    "text_shadow": "0 2px 4px rgba(0,0,0,0.3)",
    "stroke": {
      "enabled": false,
      "color": "#000000",
      "width": 2
    }
  },
  "animation": {
    "type": "fade",
    "duration": 1.0,
    "easing": "ease-in-out"
  },
  "responsive": {
    "mobile_font_size": 48,
    "mobile_position": {
      "x": 50,
      "y": 30,
      "unit": "percent"
    }
  },
  "layer_index": 1
}
```

**Response:** `200 OK` (Returns updated template with new overlay)

---

### 3. List Templates (Admin)

**Endpoint:** `GET /admin/video-templates`

**Authentication:** Admin required

**Query Parameters:**
- `skip` (integer, default: 0): Number of records to skip
- `limit` (integer, default: 50): Maximum records to return
- `category` (string, optional): Filter by category
- `search` (string, optional): Search in name, description, tags

**Example:**
```bash
curl -X GET "https://api.example.com/admin/video-templates?category=invitation&limit=20" \
  -H "Authorization: Bearer {token}"
```

**Response:** `200 OK`
```json
[
  {
    "id": "template-id-1",
    "name": "Elegant Wedding Invitation",
    "category": "invitation",
    "thumbnail_url": "https://cdn.telegram.org/file/thumb",
    "duration": 30,
    "usage_count": 45,
    "is_featured": true,
    "is_active": true,
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

---

### 4. Update Template

**Endpoint:** `PUT /admin/video-templates/{template_id}`

**Authentication:** Admin required

**Request Body:**
```json
{
  "name": "Updated Template Name",
  "description": "Updated description",
  "category": "announcement",
  "tags": ["modern", "elegant"],
  "is_featured": true,
  "is_active": true
}
```

**Response:** `200 OK` (Returns updated template)

---

### 5. Delete Template

**Endpoint:** `DELETE /admin/video-templates/{template_id}`

**Authentication:** Admin required

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

---

### 6. Update Overlay

**Endpoint:** `PUT /admin/video-templates/{template_id}/overlays/{overlay_id}`

**Authentication:** Admin required

**Request Body:** (Same structure as Add Overlay, all fields optional)

**Response:** `200 OK` (Returns updated template)

---

### 7. Delete Overlay

**Endpoint:** `DELETE /admin/video-templates/{template_id}/overlays/{overlay_id}`

**Authentication:** Admin required

**Response:** `200 OK` (Returns updated template without deleted overlay)

---

### 8. Reorder Overlays

**Endpoint:** `PUT /admin/video-templates/{template_id}/overlays/reorder`

**Authentication:** Admin required

**Request Body:**
```json
{
  "overlay_ids": [
    "overlay-id-1",
    "overlay-id-2",
    "overlay-id-3"
  ]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Overlays reordered successfully"
}
```

---

## User API Reference

### 9. List Available Templates

**Endpoint:** `GET /video-templates`

**Authentication:** Public (no auth required)

**Query Parameters:**
- `skip` (integer, default: 0)
- `limit` (integer, default: 50)
- `category` (string, optional): Filter by category
- `featured` (boolean, optional): Filter featured templates

**Example:**
```bash
curl -X GET "https://api.example.com/video-templates?featured=true"
```

**Response:** `200 OK`
```json
[
  {
    "id": "template-id-1",
    "name": "Elegant Wedding Invitation",
    "description": "Beautiful floral template",
    "category": "invitation",
    "thumbnail_url": "https://cdn.telegram.org/file/thumb",
    "duration": 30,
    "is_featured": true
  }
]
```

---

### 10. Get Template Details

**Endpoint:** `GET /video-templates/{template_id}`

**Authentication:** Public

**Response:** `200 OK`
```json
{
  "id": "template-id-1",
  "name": "Elegant Wedding Invitation",
  "description": "Beautiful floral template",
  "video_url": "https://cdn.telegram.org/file/video",
  "thumbnail_url": "https://cdn.telegram.org/file/thumb",
  "duration": 30,
  "overlays": [
    {
      "id": "overlay-1",
      "endpoint_key": "bride_name",
      "label": "Bride's Name",
      "position": { "x": 960, "y": 400 },
      "timing": { "start_time": 2, "end_time": 8 },
      "styling": { "font_size": 72, "color": "#ffffff" },
      "animation": { "type": "fade", "duration": 1 }
    }
  ]
}
```

---

### 11. Assign Template to Wedding

**Endpoint:** `POST /weddings/{wedding_id}/assign-template`

**Authentication:** User required (must own wedding)

**Request Body:**
```json
{
  "template_id": "template-id-1",
  "slot": 1,
  "customizations": {
    "color_overrides": {
      "bride_name": "#ff69b4",
      "event_date": "#ffd700"
    },
    "font_overrides": {
      "groom_name": "Montserrat"
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "assignment_id": "assignment-id-1",
  "message": "Template assigned successfully"
}
```

---

### 12. Get Wedding Template Assignment

**Endpoint:** `GET /weddings/{wedding_id}/template-assignment`

**Authentication:** User required

**Response:** `200 OK`
```json
{
  "assignment_id": "assignment-id-1",
  "template": { /* template object */ },
  "populated_overlays": [
    {
      "id": "overlay-1",
      "endpoint_key": "bride_name",
      "text_value": "Sarah Johnson",
      "position": { "x": 960, "y": 400 },
      "styling": { "font_size": 72, "color": "#ff69b4" }
    }
  ],
  "customizations": {
    "color_overrides": { "bride_name": "#ff69b4" }
  }
}
```

---

### 13. Preview Template

**Endpoint:** `POST /video-templates/{template_id}/preview`

**Authentication:** User required

**Request Body:**
```json
{
  "wedding_id": "wedding-id-1"
}
```

**Response:** `200 OK`
```json
{
  "preview_data": {
    "video_url": "https://cdn.telegram.org/file/video",
    "duration": 30,
    "overlays": [
      {
        "id": "overlay-1",
        "text": "Sarah Johnson",
        "endpoint_key": "bride_name",
        "position": { "x": 960, "y": 400 },
        "timing": { "start_time": 2, "end_time": 8 },
        "styling": { "font_size": 72, "color": "#ffffff" },
        "animation": { "type": "fade", "duration": 1 }
      }
    ]
  }
}
```

---

### 14. Remove Template Assignment

**Endpoint:** `DELETE /weddings/{wedding_id}/template-assignment`

**Authentication:** User required

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Template removed successfully"
}
```

---

### 15. Start Render Job

**Endpoint:** `POST /weddings/{wedding_id}/render-template-video`

**Authentication:** User required

**Response:** `200 OK`
```json
{
  "success": true,
  "render_job_id": "job-id-1",
  "status": "queued",
  "estimated_time": 120,
  "message": "Render job started"
}
```

---

### 16. Get Render Job Status

**Endpoint:** `GET /weddings/{wedding_id}/render-jobs/{job_id}`

**Authentication:** User required

**Response:** `200 OK`
```json
{
  "job_id": "job-id-1",
  "status": "processing",
  "progress": 75,
  "rendered_video_url": null,
  "error_message": null
}
```

**Status Values:**
- `queued`: Waiting to start
- `processing`: Currently rendering
- `completed`: Ready for download
- `failed`: Error occurred

---

### 17. Download Rendered Video

**Endpoint:** `GET /weddings/{wedding_id}/render-jobs/{job_id}/download`

**Authentication:** User required

**Response:** `200 OK`
```json
{
  "success": true,
  "download_url": "https://cdn.telegram.org/file/rendered_video.mp4",
  "file_id": "BAACAgIAAxkBAAI..."
}
```

---

### 18. List Available Endpoints

**Endpoint:** `GET /video-templates/endpoints/list`

**Authentication:** Public

**Response:** `200 OK`
```json
{
  "endpoints": {
    "bride_name": "Bride's full name",
    "groom_name": "Groom's full name",
    "bride_first_name": "Bride's first name only",
    "groom_first_name": "Groom's first name only",
    "couple_names": "Combined 'Bride & Groom'",
    "event_date": "Formatted wedding date",
    "event_time": "Wedding time",
    "venue": "Venue name",
    "venue_address": "Full venue address",
    "city": "City name",
    "state": "State name",
    "country": "Country name",
    "welcome_message": "Custom welcome text",
    "description": "Custom description/story",
    "countdown_days": "Days until wedding",
    "custom_text_1": "Custom text field 1",
    "custom_text_2": "Custom text field 2",
    "custom_text_3": "Custom text field 3",
    "custom_text_4": "Custom text field 4",
    "custom_text_5": "Custom text field 5"
  }
}
```

---

## Data Models

### VideoTemplate
```typescript
{
  id: string;
  name: string;
  description: string;
  category: "invitation" | "announcement" | "save-the-date" | "general";
  tags: string[];
  video_data: VideoData;
  preview_thumbnail: PreviewThumbnail;
  text_overlays: TextOverlay[];
  metadata: TemplateMetadata;
}
```

### TextOverlay
```typescript
{
  id: string;
  endpoint_key: string;
  label: string;
  placeholder_text: string;
  position: OverlayPosition;
  timing: OverlayTiming;
  styling: OverlayStyling;
  animation: OverlayAnimation;
  responsive: ResponsiveSettings;
  layer_index: number;
}
```

### WeddingTemplateAssignment
```typescript
{
  id: string;
  wedding_id: string;
  template_id: string;
  slot: number;
  assigned_at: string;
  customizations: Customizations;
  rendered_video?: RenderedVideo;
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

- **Public endpoints**: 100 requests/minute
- **Authenticated endpoints**: 300 requests/minute
- **Upload endpoints**: 10 requests/minute
- **Render endpoints**: 5 requests/minute

---

## Webhooks (Future)

Webhooks for render job completion (planned for future release):

```json
{
  "event": "render.completed",
  "job_id": "job-id-1",
  "wedding_id": "wedding-id-1",
  "status": "completed",
  "video_url": "https://cdn.telegram.org/file/video.mp4"
}
```

---

**API Version**: 1.0  
**Last Updated**: January 2025
