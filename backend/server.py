from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import socketio
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
import zipfile
import io
from fastapi.responses import StreamingResponse

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import WedLive routes
from app.database import init_db, close_db, get_db
from app.routes import auth, weddings, streams, subscriptions, admin, media, chat, analytics, features, premium, phase10, plan_management, storage_management, viewer_access, plan_info, recording, folders, quality, profile, security, settings, comments, theme_assets, templates, rtmp_webhooks, themes, live_controls, media_proxy, borders, sections, studios, precious_moments, youtube, layout_photos, layout_backgrounds, admin_cleanup, video_templates, admin_music, creator_music, wedding_music
from app.routes import albums
from app.services.socket_service import sio
from fastapi import HTTPException, status, Request
from fastapi.responses import JSONResponse

# Lifespan event handler for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    print(\"✅ Database connected\")
    yield
    # Shutdown
    await close_db()
    print(\"👋 Database disconnected\")

# Create the main FastAPI app
fastapi_app = FastAPI(
    title=\"WedLive API\",
    description=\"Live Wedding Streaming Platform API - Phase 10 Complete - Premium Features\",
    version=\"3.0.0\",
    lifespan=lifespan
)

# Get CORS origins from environment or use defaults
cors_origins_env = os.getenv(\"CORS_ORIGINS\", \"*\")
if cors_origins_env == \"*\":
    allowed_origins = [\"*\"]
else:
    # Split by comma if multiple origins provided
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(\",\")]

# Always add these origins for backward compatibility
default_origins = [
    \"https://wedlive.vercel.app\",
    \"https://wedlive.onrender.com\",
    \"http://localhost:3000\",
]

# Combine default origins with env origins (if not using wildcard)
if allowed_origins != [\"*\"]:
    allowed_origins = list(set(allowed_origins + default_origins))

print(f\"🌐 CORS Origins configured: {allowed_origins}\")

# CORS middleware - configured before routes to ensure it runs first
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
    expose_headers=[\"*\", \"Set-Cookie\"],
    max_age=3600,
)

# Global exception handler to ensure CORS headers on errors
@fastapi_app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    \"\"\"Catch all exceptions and return with proper CORS headers\"\"\"
    print(f\"❌ Global Exception: {exc}\")
    import traceback
    traceback.print_exc()
    
    return JSONResponse(
        status_code=500,
        content={\"detail\": \"Internal server error\", \"error\": str(exc)},
        headers={
            \"Access-Control-Allow-Origin\": \"*\",
            \"Access-Control-Allow-Methods\": \"*\",
            \"Access-Control-Allow-Headers\": \"*\",
            \"Access-Control-Allow-Credentials\": \"true\",
        }
    )

# Include WedLive routers
fastapi_app.include_router(auth.router, prefix=\"/api/auth\", tags=[\"Authentication\"])
fastapi_app.include_router(weddings.router, prefix=\"/api/weddings\", tags=[\"Weddings\"])
fastapi_app.include_router(streams.router, prefix=\"/api/streams\", tags=[\"Streams\"])
fastapi_app.include_router(subscriptions.router, prefix=\"/api/subscriptions\", tags=[\"Subscriptions\"])
fastapi_app.include_router(admin.router, prefix=\"/api/admin\", tags=[\"Admin\"])
fastapi_app.include_router(admin_cleanup.router, prefix=\"/api\", tags=[\"Admin Cleanup\"])
fastapi_app.include_router(media.router, prefix=\"/api/media\", tags=[\"Media\"])
fastapi_app.include_router(media_proxy.router, prefix=\"/api/media\", tags=[\"Media Proxy\"])
fastapi_app.include_router(chat.router, prefix=\"/api/chat\", tags=[\"Chat & Reactions\"])
fastapi_app.include_router(comments.router, prefix=\"/api/comments\", tags=[\"Comments\"])
fastapi_app.include_router(analytics.router, prefix=\"/api/analytics\", tags=[\"Analytics\"])
fastapi_app.include_router(features.router, prefix=\"/api/features\", tags=[\"Advanced Features\"])
fastapi_app.include_router(premium.router, prefix=\"/api/premium\", tags=[\"Premium Features\"])
fastapi_app.include_router(phase10.router, prefix=\"/api/phase10\", tags=[\"Phase 10 - Premium Features\"])
fastapi_app.include_router(plan_management.router, prefix=\"/api/plan\", tags=[\"Plan Management & Storage\"])
fastapi_app.include_router(storage_management.router, prefix=\"/api/storage\", tags=[\"Storage Management\"])
fastapi_app.include_router(viewer_access.router, prefix=\"/api/viewer\", tags=[\"Public Viewer Access\"])
fastapi_app.include_router(plan_info.router, prefix=\"/api/plans\", tags=[\"Plan Information\"])
fastapi_app.include_router(plan_info.router, prefix=\"/api/plan\", tags=[\"Plan Information (Alias)\"], include_in_schema=False)
fastapi_app.include_router(recording.router, tags=[\"Recording\"])
fastapi_app.include_router(folders.router, tags=[\"Folders\"])
fastapi_app.include_router(quality.router, tags=[\"Quality Control\"])
fastapi_app.include_router(profile.router, tags=[\"Profile\"])
fastapi_app.include_router(security.router, tags=[\"Security\"])
fastapi_app.include_router(settings.router, tags=[\"Settings\"])
fastapi_app.include_router(theme_assets.router, prefix=\"/api\", tags=[\"Theme Assets\"])
fastapi_app.include_router(themes.router, prefix=\"/api\", tags=[\"Themes\"])
fastapi_app.include_router(templates.router, prefix=\"/api\", tags=[\"Templates\"])
fastapi_app.include_router(rtmp_webhooks.router, prefix=\"/api/webhooks\", tags=[\"RTMP Webhooks\"])
fastapi_app.include_router(live_controls.router, prefix=\"/api\", tags=[\"Live Controls\"])

# New Section-Based System Routes
fastapi_app.include_router(borders.router, prefix=\"/api\", tags=[\"Borders & Masks\"])
fastapi_app.include_router(sections.router, prefix=\"/api\", tags=[\"Section Configuration\"])
fastapi_app.include_router(studios.router, prefix=\"/api\", tags=[\"Studios\"])
fastapi_app.include_router(precious_moments.router, prefix=\"/api\", tags=[\"Precious Moments\"])

# Layout-Aware Photo System Routes
fastapi_app.include_router(layout_photos.router, prefix=\"/api\", tags=[\"Layout Photos\"])
fastapi_app.include_router(layout_backgrounds.router, prefix=\"/api\", tags=[\"Layout Backgrounds\"])

# YouTube Live Streaming Routes
fastapi_app.include_router(youtube.router, prefix=\"/api/youtube\", tags=[\"YouTube Live Streaming\"])
fastapi_app.include_router(albums.router, prefix=\"/api/albums\", tags=[\"Albums & Slideshows\"])

# Video Templates System Routes
fastapi_app.include_router(video_templates.router, prefix=\"/api\", tags=[\"Video Templates\"])

# Admin Music Management Routes
fastapi_app.include_router(admin_music.router, tags=[\"Admin Music Management\"])

# Creator Music Management Routes
fastapi_app.include_router(creator_music.router, tags=[\"Creator Music Management\"])

# Wedding Music Assignment Routes
fastapi_app.include_router(wedding_music.router, tags=[\"Wedding Music & Audio Session\"])

# Add route aliases for backward compatibility and cleaner API paths
# These allow frontend to call /api/branding instead of /api/phase10/branding
fastapi_app.include_router(phase10.router, prefix=\"/api\", tags=[\"Branding & Recording (Alias)\"], include_in_schema=False)

# Health check endpoints
@fastapi_app.get(\"/\")
async def root():
    return {\"message\": \"WedLive API is running - Phase 10 Complete\", \"version\": \"3.0.0\"}

@fastapi_app.get(\"/api/health\")
async def health_check():
    return {\"status\": \"healthy\", \"service\": \"WedLive API\", \"version\": \"3.0.0\"}

# NEW ENDPOINT: Main Camera RTMP Credentials
@fastapi_app.get(\"/api/weddings/{wedding_id}/main-camera/rtmp\")
async def get_main_camera_rtmp(wedding_id: str):
    \"\"\"Get RTMP credentials for main camera\"\"\"
    db = get_db()
    
    wedding = await db.weddings.find_one({\"id\": wedding_id})
    if not wedding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=\"Wedding not found\"
        )
    
    return {
        \"server\": wedding.get(\"rtmp_url\", \"rtmp://live.wedlive.app/live\"),
        \"streamKey\": wedding.get(\"stream_key\", \"\"),
        \"playbackUrl\": wedding.get(\"playback_url\", \"\")
    }


# ============================================================================
# PROJECT DOWNLOAD ENDPOINT - Self-hosted code download
# ============================================================================

# Configure logging (moved before download endpoint to ensure logger is available)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Files and folders to exclude from ZIP
DOWNLOAD_EXCLUDE_PATTERNS = {
    'node_modules', '__pycache__', '.git', 'build', 'dist', 
    'venv', '.pytest_cache', 'test_reports', 'memory',
    'hls_output', 'hls'  # Exclude HLS output directories for WedLive
}
DOWNLOAD_EXCLUDE_EXTENSIONS = {'.pyc', '.log', '.tmp', '.DS_Store'}

def should_exclude_from_zip(path, root_path):
    \"\"\"Check if a path should be excluded from the ZIP\"\"\"
    rel_path = os.path.relpath(path, root_path)
    parts = Path(rel_path).parts
    
    # Check if any part matches exclude patterns
    for part in parts:
        if part in DOWNLOAD_EXCLUDE_PATTERNS:
            return True
        if part.startswith('.env'):
            return True
    
    # Check file extension
    if any(path.endswith(ext) for ext in DOWNLOAD_EXCLUDE_EXTENSIONS):
        return True
    
    return False

def create_project_zip_buffer():
    \"\"\"Create ZIP file of entire project in memory\"\"\"
    project_root = '/app/'
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        file_count = 0
        
        for root, dirs, files in os.walk(project_root):
            # Filter directories (modify in-place to prevent walking into them)
            dirs[:] = [d for d in dirs if not should_exclude_from_zip(os.path.join(root, d), project_root)]
            
            for file in files:
                file_path = os.path.join(root, file)
                
                if should_exclude_from_zip(file_path, project_root):
                    continue
                
                try:
                    arcname = os.path.relpath(file_path, project_root)
                    zip_file.write(file_path, arcname)
                    file_count += 1
                except Exception as e:
                    logger.warning(f\"Could not add {file_path}: {e}\")
        
        logger.info(f\"Created ZIP with {file_count} files\")
    
    zip_buffer.seek(0)
    return zip_buffer

@fastapi_app.get(\"/api/download-code\", tags=[\"Project Download\"])
async def download_project_code():
    \"\"\"
    Download entire project as ZIP file
    Endpoint: GET /api/download-code
    
    This is a helper endpoint to download your project code.
    Excludes: node_modules, __pycache__, .git, .env, build artifacts, HLS output
    \"\"\"
    try:
        logger.info(\"Starting project ZIP creation...\")
        zip_buffer = create_project_zip_buffer()
        
        zip_size_mb = len(zip_buffer.getvalue()) / (1024 * 1024)
        logger.info(f\"ZIP ready: {zip_size_mb:.2f} MB\")
        
        date_str = datetime.now().strftime('%Y-%m-%d')
        
        return StreamingResponse(
            iter([zip_buffer.getvalue()]),
            media_type=\"application/zip\",
            headers={
                \"Content-Disposition\": f\"attachment; filename=wedlive-project-{date_str}.zip\"
            }
        )
    except Exception as e:
        logger.error(f\"Error creating ZIP: {e}\")
        return {\"error\": str(e)}, 500

# ============================================================================
# END DOWNLOAD ENDPOINT
# ============================================================================


# Mount HLS Output directory for multi-camera composition
# Ensure directory exists
os.makedirs(\"/tmp/hls_output\", exist_ok=True)
fastapi_app.mount(\"/hls_output\", StaticFiles(directory=\"/tmp/hls_output\"), name=\"hls_output\")

# Mount HLS directory for raw camera streams (if needed for debugging or direct view)
# os.makedirs(\"/tmp/hls\", exist_ok=True)
# fastapi_app.mount(\"/hls\", StaticFiles(directory=\"/tmp/hls\"), name=\"hls\")

# Mount Socket.IO for real-time communication
# This wraps the FastAPI app with Socket.IO support for WebSocket connections
socket_app = socketio.ASGIApp(sio, fastapi_app)

# Export socket_app as 'app' for uvicorn compatibility
# This allows uvicorn server:app to load the Socket.IO enabled application
# The supervisor config runs: uvicorn server:app
app = socket_app
