"""
Games API routes
Endpoints for game listing, details, and FAQs
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import get_current_user
from app.models.schemas import (
    AuthenticatedUser,
    ErrorResponse,
    GameDetailResponse,
    GameFAQsResponse,
    GamesListResponse,
)
from app.services.feature_flags import check_faq_access
from app.services.game_faqs import get_game_faqs
from app.services.games import get_game_by_id, get_game_feature_access, get_games_list

router = APIRouter()


@router.get(
    "/games",
    response_model=GamesListResponse,
    summary="Get list of games",
    description="Get list of games that the authenticated user has access to based on their role and feature flags",
    responses={
        200: {"description": "List of accessible games"},
        401: {"model": ErrorResponse, "description": "Unauthorized - invalid or missing token"},
    },
)
async def list_games(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    status_filter: Annotated[
        str | None,
        Query(
            description="Filter games by status (active, beta, hidden)",
            pattern="^(active|beta|hidden)$",
        ),
    ] = None,
) -> GamesListResponse:
    """
    Get list of games accessible to the current user

    Access is determined by:
    - User role (admin, developer, basic, premium, tester)
    - Feature flags (game_access) at global and game-specific scopes
    - Game status (active games for basic/premium, beta games for testers/admins)

    Returns:
        GamesListResponse with list of games and total count
    """
    games = get_games_list(
        user_id=current_user.user_id,
        user_role=current_user.role,
        status_filter=status_filter,
    )

    return GamesListResponse(games=games, total=len(games))


@router.get(
    "/games/{game_id}",
    response_model=GameDetailResponse,
    summary="Get game details",
    description="Get detailed information about a specific game, including feature access flags",
    responses={
        200: {"description": "Game details"},
        401: {"model": ErrorResponse, "description": "Unauthorized - invalid or missing token"},
        403: {
            "model": ErrorResponse,
            "description": "Forbidden - user does not have access to this game",
        },
        404: {"model": ErrorResponse, "description": "Game not found"},
    },
)
async def get_game(
    game_id: str,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> GameDetailResponse:
    """
    Get detailed information about a specific game

    Access is validated using feature flags. If the user does not have access
    to the game, a 403 Forbidden error is returned.

    Returns:
        GameDetailResponse with game details and feature access flags
    """
    game = get_game_by_id(
        game_id=game_id,
        user_id=current_user.user_id,
        user_role=current_user.role,
    )

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game {game_id} not found or you don't have access to it",
        )

    # Get feature access flags for this game
    feature_access = get_game_feature_access(
        game_id=game_id,
        user_id=current_user.user_id,
        user_role=current_user.role,
    )

    return GameDetailResponse(
        game=game,
        has_faq_access=feature_access["has_faq_access"],
        has_chat_access=feature_access["has_chat_access"],
    )


@router.get(
    "/games/{game_id}/faqs",
    response_model=GameFAQsResponse,
    summary="Get game FAQs",
    description="Get FAQs for a specific game with language filtering and fallback",
    responses={
        200: {"description": "Game FAQs"},
        401: {"model": ErrorResponse, "description": "Unauthorized - invalid or missing token"},
        403: {
            "model": ErrorResponse,
            "description": "Forbidden - user does not have access to FAQs for this game",
        },
        404: {"model": ErrorResponse, "description": "Game not found"},
    },
)
async def get_game_faqs_endpoint(
    game_id: str,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    lang: Annotated[
        str,
        Query(
            description="Language code (es, en)",
            pattern="^(es|en)$",
        ),
    ] = "es",
) -> GameFAQsResponse:
    """
    Get FAQs for a specific game

    Language fallback strategy:
    1. Try to get FAQs in requested language
    2. If not found, fall back to English (en)
    3. If still not found, return empty list

    Access is validated using feature flags. Users must have 'faq' access
    for the specific game.

    Returns:
        GameFAQsResponse with list of FAQs in the requested (or fallback) language
    """
    # Check if user has access to this game
    game = get_game_by_id(
        game_id=game_id,
        user_id=current_user.user_id,
        user_role=current_user.role,
    )

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game {game_id} not found or you don't have access to it",
        )

    # Check if user has FAQ access for this game
    faq_access = check_faq_access(
        user_id=current_user.user_id,
        user_role=current_user.role,
        game_id=game_id,
    )

    if not faq_access.has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have access to FAQs for this game. Reason: {faq_access.reason}",
        )

    # Get FAQs with language fallback
    faqs, actual_language = get_game_faqs(
        game_id=game_id,
        language=lang,
        fallback_to_en=True,
    )

    return GameFAQsResponse(
        faqs=faqs,
        game_id=game_id,
        language=actual_language,
        total=len(faqs),
    )
