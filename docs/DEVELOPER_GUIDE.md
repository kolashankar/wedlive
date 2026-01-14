# Developer Guide - Video Template System

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Development Setup](#development-setup)
5. [Core Components](#core-components)
6. [Database Schema](#database-schema)
7. [Video Processing Pipeline](#video-processing-pipeline)
8. [Frontend Architecture](#frontend-architecture)
9. [Testing](#testing)
10. [Deployment](#deployment)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────────────┐  ┌─────────────────────────────┐ │
│  │   Admin Interface    │  │     User Interface          │ │
│  │  - Template Upload   │  │  - Template Gallery         │ │
│  │  - Overlay Editor    │  │  - Preview & Apply          │ │
│  │  - Template Mgmt     │  │  - Customization            │ │
│  └──────────────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS/REST
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (FastAPI)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes: video_templates.py                          │  │
│  │  - Admin endpoints (8)                               │  │
│  │  - User endpoints (7)                                │  │
│  │  - Utility endpoints (1)                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │  Video       │ │  Wedding     │ │  Render          │   │
│  │  Processing  │ │  Data        │ │  Service         │   │
│  │  Service     │ │  Mapper      │ │  (FFmpeg)        │   │
│  └──────────────┘ └──────────────┘ └──────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Telegram CDN Service                                 │  │
│  │  - Video upload                                       │  │
│  │  - Thumbnail upload                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MongoDB (Motor)                                      │  │
│  │  - video_templates collection                         │  │
│  │  - wedding_template_assignments collection            │  │
│  │  - weddings collection                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Storage Layer                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Telegram CDN                                         │  │
│  │  - Video files                                        │  │
│  │  - Thumbnails                                         │  │
│  │  - Rendered videos                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11+
- **Database**: MongoDB (Motor async driver)
- **Video Processing**: FFmpeg 5.1+
- **Storage**: Telegram Bot API (CDN)
- **Authentication**: JWT (existing system)
- **Validation**: Pydantic
- **Async**: asyncio, aiofiles

### Frontend
- **Framework**: Next.js 14
- **Language**: React 18 + JavaScript
- **Styling**: Tailwind CSS
- **Video Player**: react-player
- **File Upload**: react-dropzone
- **UI Components**: shadcn/ui
- **State Management**: React hooks
- **HTTP Client**: fetch API

### Infrastructure
- **Server**: Kubernetes
- **Process Manager**: Supervisor
- **Reverse Proxy**: Nginx (ingress)
- **Environment**: Docker containers

---

## Project Structure

### Backend Structure
```
/app/backend/
├── app/
│   ├── models_video_templates.py    # Pydantic models
│   ├── routes/
│   │   └── video_templates.py        # API routes
│   ├── services/
│   │   ├── video_processing_service.py
│   │   ├── wedding_data_mapper.py
│   │   ├── render_service.py
│   │   └── telegram_service.py
│   ├── auth.py                       # Authentication
│   └── database.py                   # MongoDB connection
├── tests/
│   ├── test_video_template_routes.py
│   └── test_render_service.py
├── server.py                         # Main FastAPI app
└── requirements.txt
```

### Frontend Structure
```
/app/frontend/
├── app/
│   └── admin/
│       └── video-templates/
│           ├── page.js              # Template list
│           ├── new/page.js          # Upload page
│           └── [id]/page.js         # Editor page
├── components/
│   ├── admin/
│   │   ├── VideoTemplateUploader.js
│   │   ├── TemplateEditor.js
│   │   └── OverlayConfigurator.js
│   └── user/
│       ├── TemplateGallery.js
│       ├── TemplateCard.js
│       ├── TemplateDetailModal.js
│       └── VideoPlayerWithOverlays.js
├── tests/
│   ├── component.test.js
│   └── performance-optimization.js
└── package.json
```

---

## Development Setup

### Prerequisites

```bash
# System requirements
- Python 3.11+
- Node.js 18+
- MongoDB 6.0+
- FFmpeg 5.1+
- Yarn package manager
```

### Backend Setup

```bash
# Navigate to backend
cd /app/backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export MONGO_URL="mongodb://localhost:27017/wedding_db"
export TELEGRAM_BOT_TOKEN="your_bot_token"
export JWT_SECRET="your_secret"

# Run development server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend Setup

```bash
# Navigate to frontend
cd /app/frontend

# Install dependencies
yarn install

# Set environment variables
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Run development server
yarn dev
```

### FFmpeg Installation

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install ffmpeg

# Verify installation
ffmpeg -version
ffprobe -version
```

---

## Core Components

### 1. Video Processing Service

**File**: `/app/backend/app/services/video_processing_service.py`

**Responsibilities:**
- Validate video files (format, size, duration)
- Extract metadata using FFprobe
- Generate thumbnails at specific timestamps
- Video format conversion (if needed)

**Key Methods:**
```python
class VideoProcessingService:
    async def validate_video(video_path: str) -> Dict
    async def generate_thumbnail(video_path: str, output_path: str, timestamp: float) -> Dict
    async def get_video_metadata(video_path: str) -> Dict
```

### 2. Wedding Data Mapper

**File**: `/app/backend/app/services/wedding_data_mapper.py`

**Responsibilities:**
- Map wedding database fields to template endpoints
- Format dates and times
- Calculate countdown days
- Populate overlay text with wedding data

**Key Methods:**
```python
class WeddingDataMapper:
    def map_wedding_data(wedding: Dict) -> Dict[str, str]
    def format_date(date_string: str) -> str
    def calculate_countdown(date_string: str) -> str
    def populate_overlay_text(overlay: Dict, wedding_data: Dict) -> str
    def get_available_endpoints() -> Dict[str, str]
```

### 3. Render Service

**File**: `/app/backend/app/services/render_service.py`

**Responsibilities:**
- Manage render job queue
- Render videos with FFmpeg
- Burn-in text overlays
- Track render progress and status

**Key Methods:**
```python
class VideoRenderService:
    def create_render_job(wedding_id: str, template_id: str, quality: str) -> RenderJob
    async def render_video_async(job_id: str, video_url: str, overlays: List, output_path: str, quality: str) -> Dict
    def get_render_job(job_id: str) -> RenderJob
    def get_job_status(job_id: str) -> Dict
```

### 4. Video Player with Overlays

**File**: `/app/frontend/components/user/VideoPlayerWithOverlays.js`

**Responsibilities:**
- Play video with ReactPlayer
- Render text overlays on canvas
- Synchronize overlays with video timeline
- Apply animations
- Handle responsive scaling

**Key Features:**
- Canvas-based overlay rendering
- 18+ animation types
- Mobile responsive
- Custom video controls
- Font loading and rendering

---

## Database Schema

### Collection: `video_templates`

```javascript
{
  _id: ObjectId,
  id: "uuid-v4",  // String UUID for API
  name: String,
  description: String,
  category: "invitation" | "announcement" | "save-the-date" | "general",
  tags: [String],
  
  video_data: {
    original_url: String,
    telegram_file_id: String,
    duration_seconds: Number,
    width: Number,
    height: Number,
    format: String,
    file_size_mb: Number
  },
  
  preview_thumbnail: {
    url: String,
    telegram_file_id: String
  },
  
  text_overlays: [{
    id: String,
    endpoint_key: String,
    label: String,
    placeholder_text: String,
    position: {
      x: Number,
      y: Number,
      alignment: String,
      anchor_point: String
    },
    timing: {
      start_time: Number,
      end_time: Number
    },
    styling: {
      font_family: String,
      font_size: Number,
      font_weight: String,
      color: String,
      text_align: String,
      text_shadow: String,
      stroke: {
        enabled: Boolean,
        color: String,
        width: Number
      }
    },
    animation: {
      type: String,
      duration: Number,
      easing: String
    },
    responsive: {
      mobile_font_size: Number,
      mobile_position: {
        x: Number,
        y: Number,
        unit: String
      }
    },
    layer_index: Number
  }],
  
  metadata: {
    created_at: ISODate,
    updated_at: ISODate,
    created_by: String,
    is_featured: Boolean,
    is_active: Boolean,
    usage_count: Number
  }
}
```

**Indexes:**
```javascript
db.video_templates.createIndex({ "id": 1 }, { unique: true })
db.video_templates.createIndex({ "category": 1 })
db.video_templates.createIndex({ "metadata.is_featured": 1 })
db.video_templates.createIndex({ "metadata.is_active": 1 })
```

### Collection: `wedding_template_assignments`

```javascript
{
  _id: ObjectId,
  id: "uuid-v4",
  wedding_id: String,  // References weddings.id
  template_id: String, // References video_templates.id
  slot: Number,        // Always 1 for now
  assigned_at: ISODate,
  
  customizations: {
    color_overrides: {
      [endpoint_key]: String  // e.g., "bride_name": "#ff69b4"
    },
    font_overrides: {
      [endpoint_key]: String  // e.g., "groom_name": "Montserrat"
    }
  },
  
  rendered_video: {
    url: String,
    file_id: String,
    rendered_at: ISODate,
    status: "completed" | "failed"
  }
}
```

**Indexes:**
```javascript
db.wedding_template_assignments.createIndex({ "id": 1 }, { unique: true })
db.wedding_template_assignments.createIndex({ "wedding_id": 1 })
db.wedding_template_assignments.createIndex({ "template_id": 1 })
```

---

## Video Processing Pipeline

### Upload Flow

```
1. Admin uploads video file
   ↓
2. validate_and_save_video()
   - Check file size (<50MB)
   - Validate MIME type
   - Save to temp file
   ↓
3. VideoProcessingService.validate_video()
   - Run FFprobe to get metadata
   - Check duration (<60s)
   - Verify codec and format
   ↓
4. VideoProcessingService.generate_thumbnail()
   - Extract frame at 1 second
   - Save as JPEG
   ↓
5. TelegramCDNService.upload_video()
   - Upload to Telegram
   - Get CDN URL and file_id
   ↓
6. TelegramCDNService.upload_photo() [thumbnail]
   - Upload thumbnail
   - Get CDN URL and file_id
   ↓
7. Save to MongoDB
   - Create VideoTemplate document
   - Include video_data and preview_thumbnail
   ↓
8. Cleanup temp files
   - Delete temporary video
   - Delete temporary thumbnail
```

### Render Flow

```
1. User requests render
   ↓
2. Create RenderJob
   - Generate job_id
   - Set status: "queued"
   - Store in memory
   ↓
3. Get wedding data
   - Fetch from MongoDB
   - Map to endpoints
   ↓
4. Populate overlays
   - Replace endpoint_keys with actual values
   - Apply customizations
   ↓
5. Start async rendering
   - Run in background task
   - Update status: "processing"
   ↓
6. Download source video
   - Fetch from Telegram CDN
   - Save to temp file
   ↓
7. Run FFmpeg
   - Build drawtext filters for each overlay
   - Apply timing constraints
   - Render with overlays burned in
   ↓
8. Upload rendered video
   - Upload to Telegram CDN
   - Get final URL and file_id
   ↓
9. Update job status
   - Set status: "completed"
   - Set rendered_video_url
   - Store in assignment
   ↓
10. Cleanup
    - Delete temp files
```

---

## Frontend Architecture

### Component Hierarchy

```
Admin Flow:
Admin Dashboard
  └─ Video Templates Button
      └─ Template List Page
          ├─ Search & Filters
          ├─ Template Cards
          │   ├─ Edit Button → Template Editor
          │   └─ Delete Button
          └─ Create New Button → Upload Page
              └─ VideoTemplateUploader
                  └─ On Success → Template Editor
                      ├─ ReactPlayer (video)
                      ├─ Canvas (overlay preview)
                      └─ OverlayConfigurator
                          ├─ Content Tab
                          ├─ Position Tab
                          ├─ Timing Tab
                          └─ Style Tab

User Flow:
Wedding Dashboard
  └─ Browse Templates Button
      └─ TemplateGallery
          ├─ Search & Category Filters
          └─ Template Cards
              └─ Preview Button → TemplateDetailModal
                  ├─ Preview Tab
                  │   └─ VideoPlayerWithOverlays
                  ├─ Customize Tab
                  │   └─ TemplateCustomization
                  ├─ Render Tab
                  │   └─ RenderJobStatus
                  └─ Apply Button
```

### State Management

**Admin Editor State:**
```javascript
const [template, setTemplate] = useState(null);
const [overlays, setOverlays] = useState([]);
const [selectedOverlay, setSelectedOverlay] = useState(null);
const [currentTime, setCurrentTime] = useState(0);
const [playing, setPlaying] = useState(false);
```

**User Gallery State:**
```javascript
const [templates, setTemplates] = useState([]);
const [selectedTemplate, setSelectedTemplate] = useState(null);
const [filters, setFilters] = useState({ category: 'all', search: '' });
const [loading, setLoading] = useState(false);
```

### API Integration Pattern

```javascript
// Example: Fetching templates
const fetchTemplates = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/video-templates?category=${category}`);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    setTemplates(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## Testing

### Backend Tests

**Location**: `/app/backend/tests/`

**Run Tests:**
```bash
cd /app/backend
pytest tests/ -v
```

**Test Coverage:**
- API endpoint tests
- Service layer tests
- Data mapper tests
- Validation tests

### Frontend Tests

**Location**: `/app/frontend/tests/`

**Run Tests:**
```bash
cd /app/frontend
yarn test
```

**Test Categories:**
- Component rendering
- User interactions
- API integration
- Animation system

---

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

---

## Performance Considerations

### Backend Optimization

1. **Database Queries**
   - Use indexes for frequently queried fields
   - Limit result sets with pagination
   - Use projections to fetch only needed fields

2. **Video Processing**
   - Process videos asynchronously
   - Use queue system for rendering
   - Cleanup temp files immediately

3. **CDN Usage**
   - Leverage Telegram CDN for caching
   - Serve videos directly from CDN
   - Use CDN URLs in responses

### Frontend Optimization

1. **Video Loading**
   - Lazy load videos
   - Preload metadata only
   - Use adaptive bitrate if available

2. **Canvas Rendering**
   - Use requestAnimationFrame
   - Debounce render calls
   - Clear canvas properly

3. **Component Optimization**
   - Use React.memo for expensive components
   - Implement virtual scrolling for large lists
   - Code splitting for admin routes

---

## Troubleshooting

### Common Issues

**Issue**: FFmpeg not found
**Solution**: Install FFmpeg and ensure it's in PATH

**Issue**: Video upload fails
**Solution**: Check file size, format, and Telegram bot token

**Issue**: Overlay not rendering
**Solution**: Check timing, position bounds, and layer index

**Issue**: Render job stuck
**Solution**: Check FFmpeg logs, verify video URL accessible

---

## Contributing Guidelines

1. Follow PEP 8 for Python code
2. Use ESLint/Prettier for JavaScript code
3. Write tests for new features
4. Update documentation
5. Use meaningful commit messages
6. Create pull requests for review

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Player](https://github.com/cookpete/react-player)

---

**Version**: 1.0  
**Last Updated**: January 2025
