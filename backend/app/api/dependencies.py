"""
FastAPI dependencies
Common dependencies used across endpoints
"""

from fastapi import Header, HTTPException, status


async def get_token_header(authorization: str | None = Header(None)) -> str:
    """
    Extract and validate authorization token from header

    Args:
        authorization: Authorization header value

    Returns:
        JWT token string

    Raises:
        HTTPException: If token is missing or invalid format
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.replace("Bearer ", "")
    return token
