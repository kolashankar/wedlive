from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import socketio
import os
from dotenv import load_dotenv

load_dotenv()

from app.database import init_db, close_db
from app.routes import auth, weddings, streams, subscriptions, admin, chat, analytics, features, media, premium, phase10, theme_assets, templates, comments
from app.services.socket_service import sio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    print("✅ Database connected")
    yield
    # Shutdown
    await close_db()
    print("👋 Database disconnected")

app = FastAPI(
    title="WedLive API",
    description="Live Wedding Streaming Platform API",
    version="3.0.0",  # Phase 10 Complete - Premium Features
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(weddings.router, prefix="/api/weddings", tags=["Weddings"])
app.include_router(streams.router, prefix="/api/streams", tags=["Streams"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(media.router, prefix="/api/media", tags=["Media & Recordings"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat & Reactions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(features.router, prefix="/api/features", tags=["Advanced Features"])
app.include_router(premium.router, prefix="/api/premium", tags=["Premium Features"])
app.include_router(phase10.router, prefix="/api/phase10", tags=["Phase 10 - Premium Features"])
app.include_router(theme_assets.router, prefix="/api", tags=["Theme Assets"])
app.include_router(templates.router, prefix="/api", tags=["Templates"])
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])

@app.get("/")
async def root():
    return {"message": "WedLive API is running", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "WedLive API", "version": "2.0.0"}

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, app)
