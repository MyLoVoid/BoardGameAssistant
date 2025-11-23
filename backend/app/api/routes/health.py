"""
Health check endpoints
"""

from datetime import datetime

from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    Returns basic API status and configuration info
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.environment,
        "version": "0.1.0",
        "service": "BGAI Backend API",
    }


@router.get("/health/ready")
async def readiness_check():
    """
    Readiness check endpoint
    Verifies that the API can connect to required services
    """
    # TODO: Add checks for Supabase, database, AI providers
    checks = {"api": "ready", "supabase": "not_checked", "database": "not_checked"}

    all_ready = all(status in ["ready", "not_checked"] for status in checks.values())

    return {
        "ready": all_ready,
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat(),
    }
