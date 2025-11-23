"""
Pydantic models for request/response schemas
Data validation and serialization
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

# ============================================
# Authentication Models
# ============================================


class UserProfile(BaseModel):
    """User profile information"""

    id: str = Field(..., description="User UUID")
    email: str | None = Field(None, description="User email")
    display_name: str | None = Field(None, description="Display name")
    role: str = Field(..., description="User role: admin, developer, basic, premium, tester")
    created_at: datetime | None = Field(None, description="Account creation timestamp")
    updated_at: datetime | None = Field(None, description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class AuthenticatedUser(BaseModel):
    """Authenticated user information with token details"""

    user_id: str = Field(..., description="User UUID")
    email: str | None = Field(None, description="User email")
    role: str = Field(..., description="User role")
    profile: UserProfile | None = Field(None, description="Full user profile")

    model_config = ConfigDict(from_attributes=True)


class TokenPayload(BaseModel):
    """JWT token payload structure"""

    sub: str = Field(..., description="Subject (user_id)")
    email: str | None = Field(None, description="User email")
    role: str | None = Field(None, description="User role")
    aud: str | None = Field(None, description="Audience")
    exp: int | None = Field(None, description="Expiration timestamp")
    iat: int | None = Field(None, description="Issued at timestamp")


# ============================================
# API Response Models
# ============================================


class ErrorResponse(BaseModel):
    """Standard error response"""

    detail: str = Field(..., description="Error message")
    error_code: str | None = Field(None, description="Error code for client handling")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"detail": "Invalid authentication token", "error_code": "INVALID_TOKEN"}
        }
    )


class SuccessResponse(BaseModel):
    """Standard success response"""

    message: str = Field(..., description="Success message")
    data: dict[str, Any] | None = Field(None, description="Response data")

    model_config = ConfigDict(
        json_schema_extra={"example": {"message": "Operation successful", "data": {}}}
    )


# ============================================
# Health Check Models
# ============================================


class HealthCheckResponse(BaseModel):
    """Health check response"""

    status: str = Field(..., description="Health status")
    timestamp: str = Field(..., description="Response timestamp")
    environment: str = Field(..., description="Environment (dev/prod)")
    version: str = Field(..., description="API version")
    service: str = Field(..., description="Service name")


class ReadinessCheckResponse(BaseModel):
    """Readiness check response"""

    ready: bool = Field(..., description="Overall readiness status")
    checks: dict[str, str] = Field(..., description="Individual component checks")
    timestamp: str = Field(..., description="Response timestamp")
