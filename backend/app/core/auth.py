"""
Authentication and JWT validation
Handles Supabase JWT token validation and user authentication
"""

import jwt
from fastapi import Depends, HTTPException, status
from jwt import PyJWTError

from app.api.dependencies import get_token_header
from app.config import settings
from app.models.schemas import AuthenticatedUser, TokenPayload
from app.services.supabase import get_user_profile


def decode_jwt_token(token: str) -> TokenPayload:
    """
    Decode and validate JWT token from Supabase

    Args:
        token: JWT token string

    Returns:
        TokenPayload with user information

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Decode JWT without verification first to check structure
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )

        # Extract user_id from 'sub' claim
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Extract email and role
        email = payload.get("email")
        role = payload.get("role") or payload.get("user_metadata", {}).get("role")

        return TokenPayload(
            sub=user_id,
            email=email,
            role=role,
            aud=payload.get("aud"),
            exp=payload.get("exp"),
            iat=payload.get("iat"),
        )

    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.InvalidAudienceError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_current_user(token: str = Depends(get_token_header)) -> AuthenticatedUser:
    """
    Get current authenticated user from JWT token

    Args:
        token: JWT token from Authorization header

    Returns:
        AuthenticatedUser with user information and profile

    Raises:
        HTTPException: If token is invalid or user not found
    """
    # Decode and validate token
    token_payload = decode_jwt_token(token)

    # Fetch user profile from database
    profile = await get_user_profile(token_payload.sub)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Create authenticated user object
    from app.models.schemas import UserProfile

    user_profile = UserProfile(**profile)

    return AuthenticatedUser(
        user_id=token_payload.sub,
        email=token_payload.email or user_profile.email,
        role=user_profile.role,  # Use role from profile (source of truth)
        profile=user_profile,
    )


async def get_current_active_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """
    Get current active user (additional validation can be added here)

    Args:
        current_user: Authenticated user from get_current_user

    Returns:
        AuthenticatedUser if user is active

    Raises:
        HTTPException: If user is inactive or banned
    """
    # Future: Add checks for user status (active/inactive/banned)
    # For now, just return the user
    return current_user


def require_role(*allowed_roles: str):
    """
    Dependency factory to require specific roles

    Args:
        allowed_roles: Roles that are allowed to access the endpoint

    Returns:
        Dependency function that checks user role

    Example:
        @app.get("/admin", dependencies=[Depends(require_role("admin"))])
        async def admin_endpoint():
            return {"message": "Admin access"}
    """

    async def role_checker(current_user: AuthenticatedUser = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. Required roles: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker
