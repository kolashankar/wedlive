from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
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

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import WedLive routes
from app.database import init_db, close_db
from app.routes import auth, weddings, streams, subscriptions, admin, media, chat, analytics, features, premium, phase10
from app.services.socket_service import sio

# Lifespan event handler for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    print("✅ Database connected")
    yield
    # Shutdown
    await close_db()
    print("👋 Database disconnected")

# Create the main FastAPI app
app = FastAPI(
    title="WedLive API",
    description="Live Wedding Streaming Platform API - Phase 10 Complete - Premium Features",
    version="3.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include WedLive routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(weddings.router, prefix="/api/weddings", tags=["Weddings"])
app.include_router(streams.router, prefix="/api/streams", tags=["Streams"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(media.router, prefix="/api/media", tags=["Media"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat & Reactions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(features.router, prefix="/api/features", tags=["Advanced Features"])
app.include_router(premium.router, prefix="/api/premium", tags=["Premium Features"])
app.include_router(phase10.router, prefix="/api/phase10", tags=["Phase 10 - Premium Features"])

# Health check endpoints
@app.get("/")
async def root():
    return {"message": "WedLive API is running - Phase 10 Complete", "version": "3.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "WedLive API", "version": "3.0.0"}

# Mount Socket.IO for real-time communication
socket_app = socketio.ASGIApp(sio, app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)