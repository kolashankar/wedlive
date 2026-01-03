# Dynamic Video Template System for Wedding Layouts

## 📋 Project Overview

A comprehensive video template management system that allows administrators to create dynamic wedding video templates with customizable text overlays. Users can select these templates and automatically populate them with their wedding data, creating personalized video invitations and announcements.

---

## 🎯 Core Features

### 1. **Admin Template Creation & Management**
- Upload template videos (MP4, WebM, MOV formats)
- Define dynamic text endpoints with full customization
- Preview templates with sample data
- Manage template library (CRUD operations)
- Categorize templates (invitations, announcements, save-the-date, etc.)
- Set template as featured/default

### 2. **Dynamic Text Overlay Configuration**
- **Positioning**: Precise x, y coordinates on video canvas
- **Timeline Control**: Start time and end time for each text element
- **Animation Types**: Fade, slide, scale, bounce, rotate, typewriter
- **Font System Integration**: Use existing wedding font system
- **Color Control**: Dynamic color selection per endpoint
- **Size Control**: Responsive sizing with mobile optimization
- **Layer Management**: Z-index control for text stacking

### 3. **User Template Selection & Application**
- Browse available templates with preview thumbnails
- Select template for Slot 1 of wedding layouts
- Automatic population from wedding data
- Real-time preview of customized video
- Export/download personalized video

### 4. **Wedding Data Endpoints**
Dynamic text fields populated from wedding data:
- `bride_name` - Bride's full name
- `groom_name` - Groom's full name
- `bride_first_name` - Bride's first name only
- `groom_first_name` - Groom's first name only
- `couple_names` - Combined "Bride & Groom"
- `event_date` - Formatted wedding date
- `event_time` - Wedding time
- `venue` - Venue name
- `venue_address` - Full venue address
- `city` - City name
- `welcome_message` - Custom welcome text
- `description` - Custom description/story
- `countdown_days` - Days until wedding
- `custom_text_1` to `custom_text_5` - Additional custom fields

---

## 🏗️ System Architecture

### Technology Stack
- **Backend**: FastAPI (Python)
- **Frontend**: Next.js 14 + React
- **Database**: MongoDB (Motor async driver)
- **Media Storage**: Telegram CDN
- **Video Processing**: FFmpeg (server-side)
- **Video Player**: React Player with overlay canvas

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Panel                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Video Upload → Template Editor → Save Configuration  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                     ┌─────────────┐
                     │   MongoDB   │
                     │  Templates  │
                     └─────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Template Gallery → Select → Preview → Apply to Slot  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Collection: `video_templates`

```json
{
  "id": "uuid-v4",
  "name": "Elegant Wedding Invitation",
  "description": "A beautiful template with floral animations",
  "category": "invitation",
  "tags": ["elegant", "floral", "romantic"],
  
  "video_data": {
    "original_url": "https://t.me/file/video_xyz",
    "telegram_file_id": "BAACAgIAAxkBAAI...",
    "duration_seconds": 30,
    "width": 1920,
    "height": 1080,
    "format": "mp4",
    "file_size_mb": 12.5
  },
  
  "preview_thumbnail": {
    "url": "https://t.me/file/thumb_xyz",
    "telegram_file_id": "BAACAgIAAxkBAAI..."
  },
  
  "text_overlays": [
    {
      "id": "overlay_1",
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
        "end_time": 8.0,
        "duration": 6.0
      },
      
      "styling": {
        "font_family": "Playfair Display",
        "font_size": 72,
        "font_weight": "bold",
        "color": "#ffffff",
        "text_align": "center",
        "letter_spacing": 2,
        "line_height": 1.2,
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
        "easing": "ease-in-out",
        "entrance": {
          "enabled": true,
          "type": "fade",
          "duration": 0.8
        },
        "exit": {
          "enabled": true,
          "type": "fade",
          "duration": 0.8
        }
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
  ],
  
  "metadata": {
    "created_at": "2025-08-15T10:30:00Z",
    "updated_at": "2025-08-15T10:30:00Z",
    "created_by": "admin_user_id",
    "is_featured": false,
    "is_active": true,
    "usage_count": 0
  }
}
```

### Collection: `wedding_template_assignments`

```json
{
  "id": "uuid-v4",
  "wedding_id": "wedding_uuid",
  "template_id": "template_uuid",
  "slot": 1,
  "assigned_at": "2025-08-15T12:00:00Z",
  
  "customizations": {
    "color_overrides": {
      "bride_name": "#ff69b4"
    },
    "font_overrides": {
      "event_date": "Montserrat"
    }
  },
  
  "rendered_video": {
    "url": "https://t.me/file/rendered_xyz",
    "telegram_file_id": "BAACAgIAAxkBAAI...",
    "rendered_at": "2025-08-15T12:05:00Z",
    "status": "completed"
  }
}
```

---

## 🎨 Animation Types

### Available Animations

1. **Fade**
   - `fade-in`: Opacity 0 → 1
   - `fade-out`: Opacity 1 → 0

2. **Slide**
   - `slide-up`: From bottom to position
   - `slide-down`: From top to position
   - `slide-left`: From right to position
   - `slide-right`: From left to position

3. **Scale**
   - `scale-up`: Scale 0 → 1
   - `scale-down`: Scale 1.5 → 1
   - `zoom-in`: Scale 0.5 → 1

4. **Bounce**
   - `bounce-in`: Bouncing entrance
   - `bounce-out`: Bouncing exit

5. **Rotate**
   - `rotate-in`: Rotation with fade
   - `spin`: Continuous rotation

6. **Typewriter**
   - `typewriter`: Character-by-character reveal

7. **Blur**
   - `blur-in`: Blur 10px → 0px
   - `blur-out`: Blur 0px → 10px

8. **Combined**
   - `fade-slide-up`: Fade + slide up
   - `scale-fade`: Scale + fade

---

## 🔌 API Endpoints

### Admin Endpoints

#### 1. Upload Video Template
```
POST /api/admin/video-templates/upload
Authorization: Admin JWT Token
Content-Type: multipart/form-data

Request Body:
{
  "file": File,
  "name": string,
  "description": string,
  "category": string,
  "tags": string[] (comma-separated)
}

Response: 200 OK
{
  "success": true,
  "template_id": "uuid",
  "video_url": "string",
  "duration": number,
  "message": "Template uploaded successfully"
}
```

#### 2. Configure Text Overlays
```
POST /api/admin/video-templates/{template_id}/overlays
Authorization: Admin JWT Token
Content-Type: application/json

Request Body:
{
  "overlays": [
    {
      "endpoint_key": "bride_name",
      "position": { "x": 960, "y": 400 },
      "timing": { "start_time": 2.0, "end_time": 8.0 },
      "styling": { "font_size": 72, "color": "#ffffff" },
      "animation": { "type": "fade", "duration": 1.0 }
    }
  ]
}

Response: 200 OK
{
  "success": true,
  "overlays_count": 5,
  "message": "Overlays configured successfully"
}
```

#### 3. Generate Preview Thumbnail
```
POST /api/admin/video-templates/{template_id}/generate-thumbnail
Authorization: Admin JWT Token

Response: 200 OK
{
  "success": true,
  "thumbnail_url": "string"
}
```

#### 4. List All Templates (Admin)
```
GET /api/admin/video-templates
Authorization: Admin JWT Token
Query Parameters:
  - skip: number (default: 0)
  - limit: number (default: 20)
  - category: string (optional)
  - search: string (optional)

Response: 200 OK
{
  "templates": [
    {
      "id": "uuid",
      "name": "string",
      "category": "string",
      "thumbnail_url": "string",
      "duration": number,
      "usage_count": number,
      "is_featured": boolean
    }
  ],
  "total": number,
  "skip": number,
  "limit": number
}
```

#### 5. Update Template
```
PUT /api/admin/video-templates/{template_id}
Authorization: Admin JWT Token
Content-Type: application/json

Request Body:
{
  "name": string (optional),
  "description": string (optional),
  "category": string (optional),
  "tags": string[] (optional),
  "is_featured": boolean (optional),
  "is_active": boolean (optional)
}

Response: 200 OK
{
  "success": true,
  "template": { ... }
}
```

#### 6. Delete Template
```
DELETE /api/admin/video-templates/{template_id}
Authorization: Admin JWT Token

Response: 200 OK
{
  "success": true,
  "message": "Template deleted successfully"
}
```

#### 7. Update Overlay Configuration
```
PUT /api/admin/video-templates/{template_id}/overlays/{overlay_id}
Authorization: Admin JWT Token
Content-Type: application/json

Request Body:
{
  "position": { "x": 960, "y": 500 },
  "styling": { "font_size": 80, "color": "#ff0000" },
  "animation": { "type": "slide-up", "duration": 1.5 }
}

Response: 200 OK
{
  "success": true,
  "overlay": { ... }
}
```

#### 8. Reorder Overlays
```
PUT /api/admin/video-templates/{template_id}/overlays/reorder
Authorization: Admin JWT Token
Content-Type: application/json

Request Body:
{
  "overlay_ids": ["overlay_1", "overlay_2", "overlay_3"]
}

Response: 200 OK
{
  "success": true,
  "message": "Overlays reordered successfully"
}
```

### User Endpoints

#### 9. Get Available Templates
```
GET /api/video-templates
Query Parameters:
  - category: string (optional)
  - featured: boolean (optional)
  - skip: number (default: 0)
  - limit: number (default: 20)

Response: 200 OK
{
  "templates": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "category": "string",
      "thumbnail_url": "string",
      "duration": number,
      "is_featured": boolean
    }
  ],
  "total": number
}
```

#### 10. Get Template Details
```
GET /api/video-templates/{template_id}

Response: 200 OK
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "video_url": "string",
  "thumbnail_url": "string",
  "duration": number,
  "overlays": [
    {
      "endpoint_key": "bride_name",
      "label": "Bride's Name",
      "position": { ... },
      "styling": { ... },
      "animation": { ... }
    }
  ]
}
```

#### 11. Assign Template to Wedding
```
POST /api/weddings/{wedding_id}/assign-template
Authorization: User JWT Token
Content-Type: application/json

Request Body:
{
  "template_id": "uuid",
  "slot": 1,
  "customizations": {
    "color_overrides": {
      "bride_name": "#ff69b4"
    },
    "font_overrides": {
      "event_date": "Montserrat"
    }
  }
}

Response: 200 OK
{
  "success": true,
  "assignment_id": "uuid",
  "preview_url": "string"
}
```

#### 12. Get Wedding Template Assignment
```
GET /api/weddings/{wedding_id}/template-assignment
Authorization: User JWT Token

Response: 200 OK
{
  "assignment_id": "uuid",
  "template": { ... },
  "populated_overlays": [
    {
      "endpoint_key": "bride_name",
      "value": "Sarah",
      "position": { ... },
      "styling": { ... }
    }
  ]
}
```

#### 13. Preview Template with Wedding Data
```
POST /api/video-templates/{template_id}/preview
Authorization: User JWT Token
Content-Type: application/json

Request Body:
{
  "wedding_id": "uuid"
}

Response: 200 OK
{
  "preview_data": {
    "video_url": "string",
    "overlays": [
      {
        "text": "Sarah",
        "endpoint_key": "bride_name",
        "position": { ... },
        "styling": { ... },
        "animation": { ... }
      }
    ]
  }
}
```

#### 14. Remove Template from Wedding
```
DELETE /api/weddings/{wedding_id}/template-assignment
Authorization: User JWT Token

Response: 200 OK
{
  "success": true,
  "message": "Template removed successfully"
}
```

#### 15. Render Personalized Video
```
POST /api/weddings/{wedding_id}/render-template-video
Authorization: User JWT Token
Content-Type: application/json

Request Body:
{
  "template_id": "uuid",
  "quality": "hd" | "sd"
}

Response: 200 OK
{
  "success": true,
  "render_job_id": "uuid",
  "status": "queued",
  "estimated_time": 120
}
```

#### 16. Get Render Job Status
```
GET /api/weddings/{wedding_id}/render-jobs/{job_id}
Authorization: User JWT Token

Response: 200 OK
{
  "job_id": "uuid",
  "status": "queued" | "processing" | "completed" | "failed",
  "progress": 75,
  "rendered_video_url": "string" (if completed),
  "error_message": "string" (if failed)
}
```

---

## 🎭 Frontend Components

### Component Structure

```
/app/frontend/components/
├── admin/
│   ├── VideoTemplateUploader.js
│   ├── TemplateEditor.js
│   ├── OverlayConfigurator.js
│   ├── TemplateList.js
│   └── TemplatePreview.js
├── user/
│   ├── TemplateGallery.js
│   ├── TemplateCard.js
│   ├── TemplateDetailModal.js
│   ├── VideoPlayerWithOverlays.js
│   └── TemplateSelector.js
└── shared/
    ├── VideoPlayer.js
    ├── TextOverlay.js
    ├── AnimationPreview.js
    └── DraggableTextEditor.js
```

### Key Components Details

#### 1. **VideoTemplateUploader.js** (Admin)
```javascript
Features:
- Video file upload with drag & drop
- File validation (format, size, duration)
- Progress indicator
- Video preview before submission
- Metadata input (name, description, category, tags)
- Automatic thumbnail generation
```

#### 2. **TemplateEditor.js** (Admin)
```javascript
Features:
- Video player with timeline scrubber
- Text overlay management panel
- Add/remove/reorder overlays
- Live preview with sample data
- Save/update configuration
- Drag & drop text positioning
- Timeline markers for overlay timing
```

#### 3. **OverlayConfigurator.js** (Admin)
```javascript
Features:
- Endpoint selection dropdown (bride_name, groom_name, etc.)
- Position controls (x, y coordinates)
- Timing controls (start/end time sliders)
- Animation type selector
- Font family dropdown (from existing system)
- Color picker
- Font size slider
- Text alignment options
- Layer order control
- Real-time preview
```

#### 4. **TemplateGallery.js** (User)
```javascript
Features:
- Grid layout of template cards
- Category filters
- Search functionality
- Featured templates section
- Pagination
- Thumbnail previews
- Quick preview on hover
```

#### 5. **VideoPlayerWithOverlays.js** (User)
```javascript
Features:
- Video playback controls
- Render text overlays at correct timing
- Apply animations
- Responsive sizing
- Canvas-based text rendering
- Synchronized timing with video
```

#### 6. **TemplateDetailModal.js** (User)
```javascript
Features:
- Full template preview with wedding data
- Overlay list with populated values
- Apply/remove template buttons
- Customization options
- Download option
```

---

## 📐 Implementation Phases

### **Phase 1: Backend Foundation** (Days 1-3)

#### Tasks:
1. **Database Models**
   - Create `VideoTemplate` model
   - Create `WeddingTemplateAssignment` model
   - Add validation schemas

2. **Video Upload Service**
   - Integrate FFmpeg for video processing
   - Implement Telegram CDN upload for videos
   - Add video validation (format, size, duration)
   - Generate thumbnail from video

3. **Admin API Endpoints**
   - `POST /api/admin/video-templates/upload`
   - `POST /api/admin/video-templates/{id}/overlays`
   - `GET /api/admin/video-templates`
   - `PUT /api/admin/video-templates/{id}`
   - `DELETE /api/admin/video-templates/{id}`

#### Deliverables:
- Video upload functionality working
- Templates stored in MongoDB
- Admin can create templates via API
- Thumbnails generated automatically

---

### **Phase 2: Overlay Configuration System** (Days 4-6)

#### Tasks:
1. **Overlay Data Structure**
   - Define comprehensive overlay schema
   - Implement validation for all overlay properties
   - Create default overlay templates

2. **Overlay Management APIs**
   - `POST /api/admin/video-templates/{id}/overlays`
   - `PUT /api/admin/video-templates/{id}/overlays/{overlay_id}`
   - `DELETE /api/admin/video-templates/{id}/overlays/{overlay_id}`
   - `PUT /api/admin/video-templates/{id}/overlays/reorder`

3. **Wedding Data Mapping Service**
   - Create service to map wedding data to endpoints
   - Implement dynamic text population
   - Add custom text field support
   - Date/time formatting functions

#### Deliverables:
- Complete overlay CRUD operations
- Wedding data properly mapped to endpoints
- Validation for all overlay configurations

---

### **Phase 3: Admin Template Editor UI** (Days 7-10)

#### Tasks:
1. **Video Upload Interface**
   - Build VideoTemplateUploader component
   - Add drag & drop functionality
   - Progress indicators
   - Preview before upload

2. **Template Editor**
   - Build TemplateEditor component
   - Video player with timeline
   - Overlay management panel
   - Draggable text positioning on video
   - Timeline markers for timing

3. **Overlay Configurator**
   - Build OverlayConfigurator component
   - Position controls (drag or input)
   - Timing controls (sliders with video sync)
   - Animation selector with preview
   - Font/color/size controls
   - Layer order management

4. **Template Management**
   - Template list view
   - Search and filter
   - Edit/delete functionality
   - Featured template toggle

#### Deliverables:
- Complete admin interface for template creation
- Drag & drop overlay positioning
- Real-time preview with sample data
- Save/update functionality working

---

### **Phase 4: User Template Gallery & Selection** (Days 11-13)

#### Tasks:
1. **Template Gallery**
   - Build TemplateGallery component
   - Grid layout with thumbnails
   - Category filters
   - Search functionality
   - Featured section

2. **Template Detail & Preview**
   - Build TemplateDetailModal component
   - Video preview with overlays
   - Show populated wedding data
   - Apply template button

3. **User API Endpoints**
   - `GET /api/video-templates`
   - `GET /api/video-templates/{id}`
   - `POST /api/weddings/{id}/assign-template`
   - `GET /api/weddings/{id}/template-assignment`
   - `DELETE /api/weddings/{id}/template-assignment`

4. **Integration with Layout System**
   - Add template selector to Slot 1 configuration
   - Update layout components to support video templates
   - Ensure compatibility with existing borders/backgrounds

#### Deliverables:
- Users can browse templates
- Preview with their wedding data
- Assign template to Slot 1
- Template appears in wedding layout

---

### **Phase 5: Video Player & Overlay Rendering** (Days 14-17)

#### Tasks:
1. **Video Player Component**
   - Build VideoPlayerWithOverlays component
   - Integrate React Player
   - Canvas overlay system
   - Synchronization engine

2. **Text Rendering Engine**
   - Canvas-based text rendering
   - Font loading and application
   - Color and styling application
   - Responsive sizing calculations

3. **Animation System**
   - Implement all animation types
   - Timing synchronization with video
   - Entrance/exit animations
   - Smooth transitions

4. **Timeline Management**
   - Calculate overlay visibility based on current time
   - Handle overlay appearance/disappearance
   - Ensure smooth playback

5. **Mobile Responsive**
   - Scale overlays for mobile devices
   - Adjust font sizes
   - Reposition elements if needed

#### Deliverables:
- Video plays with overlays appearing at correct times
- All animations working smoothly
- Text styled correctly with fonts/colors
- Responsive on all devices
- Wedding data populated in overlays

---

### **Phase 6: Advanced Features** (Days 18-20)

#### Tasks:
1. **Customization Options**
   - Allow users to override colors
   - Allow users to override fonts
   - Custom text fields (custom_text_1-5)

2. **Video Rendering Service**
   - Implement server-side video rendering
   - Use FFmpeg to burn-in overlays
   - Generate downloadable video
   - Queue system for rendering jobs
   - Progress tracking

3. **Render Job APIs**
   - `POST /api/weddings/{id}/render-template-video`
   - `GET /api/weddings/{id}/render-jobs/{job_id}`

4. **Download Functionality**
   - Download rendered video
   - Share on social media
   - Embed options

#### Deliverables:
- Users can customize template colors/fonts
- Server-side rendering produces final video
- Users can download personalized video
- Queue system handles multiple render requests

---

### **Phase 7: Testing & Optimization** (Days 21-23)

#### Tasks:
1. **Backend Testing**
   - Unit tests for all API endpoints
   - Video upload/processing tests
   - Overlay configuration validation tests
   - Wedding data mapping tests

2. **Frontend Testing**
   - Component tests
   - Integration tests
   - Video playback tests
   - Overlay synchronization tests

3. **Performance Optimization**
   - Video loading optimization
   - Overlay rendering performance
   - Animation smoothness
   - Mobile performance

4. **Bug Fixes**
   - Fix any timing issues
   - Fix animation glitches
   - Fix responsive issues
   - Fix upload issues

#### Deliverables:
- All tests passing
- Performance optimized
- No critical bugs
- Smooth user experience

---

### **Phase 8: Documentation & Deployment** (Days 24-25)

#### Tasks:
1. **Documentation**
   - Admin user guide for creating templates
   - User guide for using templates
   - API documentation
   - Developer documentation

2. **Deployment**
   - Deploy backend changes
   - Deploy frontend changes
   - Database migrations
   - CDN configuration

3. **Monitoring**
   - Set up logging for video processing
   - Monitor rendering jobs
   - Track template usage

#### Deliverables:
- Complete documentation
- System deployed to production
- Monitoring in place
- Ready for user onboarding

---

## 🔧 Technical Implementation Details

### Video Processing with FFmpeg

#### Thumbnail Generation
```python
import subprocess

def generate_thumbnail(video_path, output_path, timestamp=1.0):
    """Generate thumbnail from video at specific timestamp"""
    command = [
        'ffmpeg',
        '-i', video_path,
        '-ss', str(timestamp),
        '-vframes', '1',
        '-q:v', '2',
        output_path
    ]
    subprocess.run(command, check=True)
```

#### Video Rendering with Overlays
```python
def render_video_with_overlays(video_path, overlays, output_path):
    """Burn-in text overlays to video"""
    
    # Build FFmpeg drawtext filters
    filter_complex = []
    
    for overlay in overlays:
        drawtext = (
            f"drawtext="
            f"text='{overlay['text']}':"
            f"x={overlay['position']['x']}:"
            f"y={overlay['position']['y']}:"
            f"fontfile={overlay['font_path']}:"
            f"fontsize={overlay['font_size']}:"
            f"fontcolor={overlay['color']}:"
            f"enable='between(t,{overlay['start_time']},{overlay['end_time']})'"
        )
        filter_complex.append(drawtext)
    
    filter_string = ','.join(filter_complex)
    
    command = [
        'ffmpeg',
        '-i', video_path,
        '-vf', filter_string,
        '-codec:a', 'copy',
        output_path
    ]
    
    subprocess.run(command, check=True)
```

### Frontend Video Player with Canvas Overlays

```javascript
import React, { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';

const VideoPlayerWithOverlays = ({ videoUrl, overlays, weddingData }) => {
  const playerRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  
  useEffect(() => {
    renderOverlays();
  }, [currentTime]);
  
  const renderOverlays = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render each overlay if within time range
    overlays.forEach(overlay => {
      if (currentTime >= overlay.timing.start_time && 
          currentTime <= overlay.timing.end_time) {
        
        // Get text from wedding data
        const text = weddingData[overlay.endpoint_key] || '';
        
        // Apply styling
        ctx.font = `${overlay.styling.font_weight} ${overlay.styling.font_size}px ${overlay.styling.font_family}`;
        ctx.fillStyle = overlay.styling.color;
        ctx.textAlign = overlay.styling.text_align;
        
        // Apply animation
        const animationProgress = calculateAnimationProgress(overlay, currentTime);
        applyAnimation(ctx, overlay.animation, animationProgress);
        
        // Render text
        ctx.fillText(text, overlay.position.x, overlay.position.y);
      }
    });
  };
  
  const calculateAnimationProgress = (overlay, time) => {
    const { start_time, end_time } = overlay.timing;
    const duration = overlay.animation.duration;
    
    // Entrance animation
    if (time < start_time + duration) {
      return (time - start_time) / duration;
    }
    
    // Exit animation
    if (time > end_time - duration) {
      return 1 - ((time - (end_time - duration)) / duration);
    }
    
    return 1; // Fully visible
  };
  
  const applyAnimation = (ctx, animation, progress) => {
    switch (animation.type) {
      case 'fade':
        ctx.globalAlpha = progress;
        break;
        
      case 'scale':
        const scale = 0.5 + (progress * 0.5);
        ctx.scale(scale, scale);
        break;
        
      case 'slide-up':
        ctx.translate(0, (1 - progress) * 100);
        break;
        
      // ... other animation types
    }
  };
  
  return (
    <div className="relative">
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        playing
        controls
        width="100%"
        height="100%"
        onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        width={1920}
        height={1080}
      />
    </div>
  );
};

export default VideoPlayerWithOverlays;
```

### Wedding Data Mapper Service

```python
from datetime import datetime
from typing import Dict, Any

class WeddingDataMapper:
    """Maps wedding data to template endpoints"""
    
    @staticmethod
    def map_wedding_data(wedding: Dict[str, Any]) -> Dict[str, str]:
        """Convert wedding data to template endpoint values"""
        
        return {
            'bride_name': wedding.get('bride_name', ''),
            'groom_name': wedding.get('groom_name', ''),
            'bride_first_name': wedding.get('bride_name', '').split()[0] if wedding.get('bride_name') else '',
            'groom_first_name': wedding.get('groom_name', '').split()[0] if wedding.get('groom_name') else '',
            'couple_names': f"{wedding.get('bride_name', '')} & {wedding.get('groom_name', '')}",
            'event_date': WeddingDataMapper.format_date(wedding.get('event_date')),
            'event_time': wedding.get('event_time', ''),
            'venue': wedding.get('venue', ''),
            'venue_address': wedding.get('venue_address', ''),
            'city': wedding.get('city', ''),
            'welcome_message': wedding.get('welcome_message', ''),
            'description': wedding.get('description', ''),
            'countdown_days': WeddingDataMapper.calculate_countdown(wedding.get('event_date')),
            'custom_text_1': wedding.get('custom_text_1', ''),
            'custom_text_2': wedding.get('custom_text_2', ''),
            'custom_text_3': wedding.get('custom_text_3', ''),
            'custom_text_4': wedding.get('custom_text_4', ''),
            'custom_text_5': wedding.get('custom_text_5', ''),
        }
    
    @staticmethod
    def format_date(date_string: str) -> str:
        """Format date string to readable format"""
        if not date_string:
            return ''
        try:
            date_obj = datetime.fromisoformat(date_string)
            return date_obj.strftime('%B %d, %Y')
        except:
            return date_string
    
    @staticmethod
    def calculate_countdown(date_string: str) -> str:
        """Calculate days until wedding"""
        if not date_string:
            return ''
        try:
            date_obj = datetime.fromisoformat(date_string)
            today = datetime.now()
            delta = date_obj - today
            return str(max(0, delta.days))
        except:
            return ''
```

---

## 🎯 Integration Points

### 1. **Admin Panel Integration**
- Add "Video Templates" menu item to admin sidebar
- Route: `/admin/video-templates`
- Accessible only to admin users

### 2. **Layout Configuration Integration**
- Add template selector in Slot 1 configuration
- Located in wedding management → layout settings
- Dropdown showing available templates with thumbnails

### 3. **Wedding Data Integration**
- Use existing wedding data structure
- Map fields automatically
- Support for custom text fields

### 4. **Font System Integration**
- Use existing font dropdown/selection system
- Apply same fonts to video overlays
- Maintain consistency across platform

### 5. **Color System Integration**
- Use existing color picker components
- Primary/secondary colors from wedding theme
- Override capability for users

### 6. **Telegram CDN Integration**
- Use existing TelegramCDNService
- Store videos same as photos
- Maintain consistent CDN usage

---

## 📊 Success Metrics

### Key Performance Indicators (KPIs)

1. **Template Creation**
   - Admin can upload and configure template in < 10 minutes
   - Template save success rate > 99%

2. **User Adoption**
   - 40%+ of users select a video template
   - Template assignment success rate > 98%

3. **Performance**
   - Video loads in < 3 seconds
   - Overlay rendering at 60 FPS
   - Mobile performance maintained

4. **Video Rendering**
   - Render completion rate > 95%
   - Average render time < 2 minutes for 30-second video
   - Queue processing without delays

---

## 🔐 Security Considerations

1. **Video Upload**
   - File type validation (whitelist: mp4, webm, mov)
   - File size limits (max 50MB)
   - Virus scanning
   - Admin-only upload access

2. **Template Access**
   - Public read access for template gallery
   - Admin-only write/delete access
   - Wedding-specific template assignments protected by user auth

3. **Video Rendering**
   - Rate limiting on render requests
   - User quota for rendered videos
   - Cleanup of temporary files

4. **Data Validation**
   - Sanitize text inputs for overlays
   - Validate overlay positions (within video bounds)
   - Validate timing (start < end, within video duration)

---

## 🚀 Future Enhancements

1. **Advanced Animations**
   - Particle effects
   - 3D transformations
   - Motion paths

2. **Multi-Video Templates**
   - Support for multiple video clips
   - Transitions between clips
   - Background music

3. **AI-Powered Features**
   - Auto-suggest overlay positions
   - AI-generated animations based on video content
   - Smart text sizing based on content length

4. **Collaboration Features**
   - Template sharing between users
   - Community template marketplace
   - Template rating and reviews

5. **Advanced Customization**
   - User-uploaded background videos
   - Custom animation curves
   - Advanced text effects (gradients, patterns)

6. **Analytics**
   - Template popularity tracking
   - Usage analytics per category
   - A/B testing for template designs

---

## 📝 Notes & Constraints

1. **Video Format Support**
   - Primary: MP4 (H.264)
   - Secondary: WebM (VP9)
   - Fallback: MOV

2. **Video Specifications**
   - Recommended resolution: 1920x1080 (Full HD)
   - Maximum duration: 60 seconds
   - Maximum file size: 50MB
   - Frame rate: 24-30 FPS

3. **Browser Compatibility**
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

4. **Mobile Considerations**
   - Responsive overlay scaling
   - Touch controls for timeline
   - Reduced video quality for data savings

5. **Server Requirements**
   - FFmpeg installed and configured
   - Adequate storage for video files
   - Processing power for rendering
   - Queue system for concurrent renders

---

## 🎓 Glossary

- **Template**: A pre-designed video with configurable text overlays
- **Overlay**: Dynamic text element displayed on top of video
- **Endpoint**: Wedding data field (e.g., bride_name, venue)
- **Slot**: Position in layout where content is placed (Slot 1 = video template)
- **Render**: Process of creating final video with burned-in overlays
- **Timeline**: Visual representation of video duration with overlay markers
- **Canvas**: HTML5 canvas used for rendering overlays in browser
- **FFmpeg**: Command-line tool for video processing

---

## ✅ Success Criteria

### Phase Completion Checklist

- [ ] Admin can upload videos successfully
- [ ] Admin can configure multiple overlays per template
- [ ] Overlays support all required properties (position, timing, animation, styling)
- [ ] Template gallery displays all templates with thumbnails
- [ ] Users can preview templates with their wedding data
- [ ] Users can assign template to Slot 1
- [ ] Video plays with overlays appearing at correct times
- [ ] All animations work smoothly
- [ ] Overlays are responsive on mobile
- [ ] Users can customize colors and fonts
- [ ] Server-side rendering produces downloadable video
- [ ] All API endpoints tested and working
- [ ] Admin documentation complete
- [ ] User documentation complete
- [ ] System deployed to production

---

## 📞 Support & Maintenance

### Ongoing Maintenance Tasks

1. **Regular Monitoring**
   - Monitor render queue for failures
   - Check video upload success rates
   - Monitor storage usage

2. **Content Moderation**
   - Review uploaded templates
   - Remove inappropriate content
   - Ensure quality standards

3. **Performance Optimization**
   - Optimize video loading
   - Improve render times
   - Cache frequently used templates

4. **User Support**
   - Help users with template customization
   - Troubleshoot rendering issues
   - Provide template creation guidance for admins

---

## 📚 References & Resources

1. **FFmpeg Documentation**: https://ffmpeg.org/documentation.html
2. **React Player**: https://github.com/cookpete/react-player
3. **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
4. **Framer Motion**: https://www.framer.com/motion/
5. **Video.js**: https://videojs.com/
6. **WebVTT Specification**: https://www.w3.org/TR/webvtt1/

---

## 🎉 Conclusion

This Dynamic Video Template System will provide a powerful, flexible solution for creating personalized wedding video invitations and announcements. The phased approach ensures systematic development, with each phase building on the previous one. The system integrates seamlessly with the existing wedding management platform while adding significant value through dynamic video capabilities.

**Estimated Total Development Time**: 25 days

**Total API Endpoints**: 16 (8 Admin + 8 User)

**Total Components**: 11 (5 Admin + 4 User + 2 Shared)

**Database Collections**: 2 (video_templates, wedding_template_assignments)

---

*Document Version: 1.0*  
*Last Updated: August 2025*  
*Status: Planning Phase*
