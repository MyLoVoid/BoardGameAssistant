"""
Authentication endpoints
Handle user authentication and profile retrieval
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_active_user, get_current_user, require_role
from app.models.schemas import AuthenticatedUser, ErrorResponse, UserProfile

router = APIRouter()


@router.get(
    "/me",
    response_model=UserProfile,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized - Invalid or missing token"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
    summary="Get current user profile",
    description="Returns the profile of the currently authenticated user based on JWT token",
)
async def get_current_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_active_user),
) -> UserProfile:
    """
    Get current authenticated user's profile

    Requires valid JWT token in Authorization header:
    `Authorization: Bearer <token>`

    Returns:
        UserProfile: Complete user profile information
    """
    if not current_user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )

    return current_user.profile


@router.get(
    "/me/role",
    response_model=dict,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized - Invalid or missing token"},
    },
    summary="Get current user role",
    description="Returns only the role of the currently authenticated user",
)
async def get_current_user_role(
    current_user: AuthenticatedUser = Depends(get_current_active_user),
) -> dict:
    """
    Get current user's role

    Useful for quick role checks without fetching full profile

    Returns:
        dict: {"user_id": "...", "role": "admin|developer|basic|premium|tester"}
    """
    return {"user_id": current_user.user_id, "role": current_user.role}


@router.get(
    "/validate",
    response_model=dict,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized - Invalid or missing token"},
    },
    summary="Validate JWT token",
    description="Validates the JWT token and returns basic validation info",
)
async def validate_token(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """
    Validate JWT token

    Useful for clients to check if their token is still valid

    Returns:
        dict: {"valid": true, "user_id": "...", "role": "..."}
    """
    return {
        "valid": True,
        "user_id": current_user.user_id,
        "email": current_user.email,
        "role": current_user.role,
    }


# Example of protected endpoint with role requirement
@router.get(
    "/admin-only",
    dependencies=[Depends(require_role("admin", "developer"))],
    summary="Admin only endpoint (example)",
    description="Example endpoint that requires admin or developer role",
)
async def admin_only_endpoint(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """
    Example admin-only endpoint

    Only accessible by users with 'admin' or 'developer' role

    Returns:
        dict: Success message with user info
    """
    return {
        "message": "Welcome to admin area!",
        "user": current_user.user_id,
        "role": current_user.role,
    }
