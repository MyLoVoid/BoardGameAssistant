"""
BGAI Backend API - Main application module
FastAPI application with endpoints for Board Game Assistant Intelligent
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, auth, games, health
from app.config import settings
from app.services.supabase import close_supabase_clients


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup/shutdown tasks for the API."""
    print("🚀 BGAI Backend API starting...")
    print(f"   Environment: {settings.environment}")
    print(f"   Debug mode: {settings.debug}")
    print(f"   Supabase URL: {settings.supabase_url}")
    print(f"   CORS origins: {settings.cors_origins_list}")
    yield
    await close_supabase_clients()
    print("👋 BGAI Backend API shutting down...")


# Create FastAPI application
app = FastAPI(
    title="BGAI Backend API",
    description="Board Game Assistant Intelligent - Custom Backend API",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(games.router, tags=["Games"])
app.include_router(admin.router, tags=["Admin"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "BGAI Backend API",
        "version": "0.1.0",
        "environment": settings.environment,
        "docs": "/docs" if settings.debug else "disabled in production",
    }
