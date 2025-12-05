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


# ============================================
# App Section Models
# ============================================


class AppSection(BaseModel):
    """App section information"""

    id: str = Field(..., description="Section UUID")
    key: str = Field(..., description="Section key (unique identifier)")
    name: str = Field(..., description="Section display name")
    description: str | None = Field(None, description="Section description")
    display_order: int = Field(..., description="Display order (lower first)")
    enabled: bool = Field(..., description="Whether section is enabled")
    created_at: datetime | None = Field(None, description="Creation timestamp")
    updated_at: datetime | None = Field(None, description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class SectionsListResponse(BaseModel):
    """Response for GET /sections"""

    sections: list[AppSection] = Field(..., description="List of sections")
    total: int = Field(..., description="Total number of sections")


# ============================================
# Game Models
# ============================================


class Game(BaseModel):
    """Game information from database"""

    id: str = Field(..., description="Game UUID")
    section_id: str = Field(..., description="Section UUID (BGC)")
    name_base: str = Field(..., description="Base name of the game")
    description: str | None = Field(None, description="Game description or summary")
    bgg_id: int | None = Field(None, description="BoardGameGeek ID")
    min_players: int | None = Field(None, description="Minimum number of players")
    max_players: int | None = Field(None, description="Maximum number of players")
    playing_time: int | None = Field(None, description="Playing time in minutes")
    rating: float | None = Field(None, description="BGG rating")
    thumbnail_url: str | None = Field(None, description="Thumbnail image URL")
    image_url: str | None = Field(None, description="Full image URL")
    status: str = Field("active", description="Game status: active, beta, hidden")
    last_synced_from_bgg_at: datetime | None = Field(None, description="Last BGG sync timestamp")
    created_at: datetime | None = Field(None, description="Creation timestamp")
    updated_at: datetime | None = Field(None, description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class GameListItem(BaseModel):
    """Simplified game information for list views"""

    id: str = Field(..., description="Game UUID")
    name_base: str = Field(..., description="Base name of the game")
    description: str | None = Field(None, description="Game description or summary")
    bgg_id: int | None = Field(None, description="BoardGameGeek ID")
    thumbnail_url: str | None = Field(None, description="Thumbnail image URL")
    image_url: str | None = Field(None, description="Full image URL")
    min_players: int | None = Field(None, description="Minimum number of players")
    max_players: int | None = Field(None, description="Maximum number of players")
    playing_time: int | None = Field(None, description="Playing time in minutes")
    rating: float | None = Field(None, description="BGG rating")
    status: str = Field("active", description="Game status")

    model_config = ConfigDict(from_attributes=True)


class GameFAQ(BaseModel):
    """FAQ for a specific game"""

    id: str = Field(..., description="FAQ UUID")
    game_id: str = Field(..., description="Game UUID")
    language: str = Field(..., description="Language code: es, en")
    question: str = Field(..., description="FAQ question")
    answer: str = Field(..., description="FAQ answer")
    display_order: int = Field(0, description="Display order")
    visible: bool = Field(True, description="Visibility flag")
    created_at: datetime | None = Field(None, description="Creation timestamp")
    updated_at: datetime | None = Field(None, description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Feature Flag Models
# ============================================


class FeatureFlag(BaseModel):
    """Feature flag configuration"""

    id: str = Field(..., description="Feature flag UUID")
    scope_type: str = Field(..., description="Scope type: global, section, game, user")
    scope_id: str | None = Field(None, description="Scope ID (section/game/user UUID)")
    feature_key: str = Field(..., description="Feature key: faq, chat, score_helper, etc.")
    role: str | None = Field(None, description="Role: basic, premium, tester, admin, developer")
    environment: str = Field("dev", description="Environment: dev, prod")
    enabled: bool = Field(True, description="Feature enabled flag")
    metadata: dict[str, Any] | None = Field(
        None, description="Additional configuration (limits, etc.)"
    )
    created_at: datetime | None = Field(None, description="Creation timestamp")
    updated_at: datetime | None = Field(None, description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class FeatureAccess(BaseModel):
    """Feature access validation result"""

    has_access: bool = Field(..., description="Whether user has access to the feature")
    feature_key: str = Field(..., description="Feature key checked")
    reason: str | None = Field(None, description="Reason for access denial")
    metadata: dict[str, Any] | None = Field(None, description="Feature metadata (limits, etc.)")


# ============================================
# API Response Models for Games
# ============================================


class GamesListResponse(BaseModel):
    """Response for GET /games"""

    games: list[GameListItem] = Field(..., description="List of games")
    total: int = Field(..., description="Total number of games")


class GameDetailResponse(BaseModel):
    """Response for GET /games/{id}"""

    game: Game = Field(..., description="Game details")
    has_faq_access: bool = Field(False, description="Whether user can access FAQs")
    has_chat_access: bool = Field(False, description="Whether user can access chat")


class GameFAQsResponse(BaseModel):
    """Response for GET /games/{id}/faqs"""

    faqs: list[GameFAQ] = Field(..., description="List of FAQs")
    game_id: str = Field(..., description="Game UUID")
    language: str = Field(..., description="Language of FAQs")
    total: int = Field(..., description="Total number of FAQs")


# ============================================
# Admin Portal Request/Response Models
# ============================================


class GameCreateRequest(BaseModel):
    """Payload for creating a new game from the admin portal"""

    section_id: str = Field(..., description="Section UUID this game belongs to")
    name_base: str = Field(..., description="Base name for the game")
    description: str | None = Field(None, description="Game description or summary")
    bgg_id: int | None = Field(None, description="BoardGameGeek ID")
    status: str = Field("active", description="Initial status")
    min_players: int | None = Field(None, description="Minimum players")
    max_players: int | None = Field(None, description="Maximum players")
    playing_time: int | None = Field(None, description="Playing time in minutes")
    rating: float | None = Field(None, description="BGG community rating")
    thumbnail_url: str | None = Field(None, description="Thumbnail URL")
    image_url: str | None = Field(None, description="Full image URL")

    model_config = ConfigDict(extra="forbid")


class GameUpdateRequest(BaseModel):
    """Payload for updating an existing game"""

    section_id: str | None = Field(None, description="New section UUID")
    name_base: str | None = Field(None, description="Game display name")
    description: str | None = Field(None, description="Game description or summary")
    bgg_id: int | None = Field(None, description="BoardGameGeek ID")
    status: str | None = Field(None, description="Updated status")
    min_players: int | None = Field(None, description="Minimum players")
    max_players: int | None = Field(None, description="Maximum players")
    playing_time: int | None = Field(None, description="Playing time in minutes")
    rating: float | None = Field(None, description="BGG rating")
    thumbnail_url: str | None = Field(None, description="Thumbnail URL")
    image_url: str | None = Field(None, description="Full image URL")

    model_config = ConfigDict(extra="forbid")


class BGGImportRequest(BaseModel):
    """Request body for importing a game from BGG"""

    bgg_id: int = Field(..., description="BoardGameGeek game ID")
    section_id: str = Field(..., description="Section where the imported game will live")
    status: str | None = Field(None, description="Optional status override")
    overwrite_existing: bool = Field(
        True,
        description="When true, existing games with the same BGG ID are updated with new metadata",
    )


class BGGImportResponse(BaseModel):
    """Response for BGG import operations"""

    game: Game = Field(..., description="Game that was created/updated")
    action: str = Field(..., description="created | updated")
    synced_at: datetime = Field(..., description="Timestamp of the sync operation")
    source: str = Field("bgg", description="Data source identifier")


class FAQCreateRequest(BaseModel):
    """Payload for creating FAQs"""

    language: str = Field(..., description="Language code (es/en)")
    question: str = Field(..., description="FAQ question")
    answer: str = Field(..., description="FAQ answer")
    display_order: int = Field(0, description="Display order")
    visible: bool = Field(True, description="Visibility flag")

    model_config = ConfigDict(extra="forbid")


class FAQUpdateRequest(BaseModel):
    """Payload for updating FAQs"""

    language: str | None = Field(None, description="Language code (es/en)")
    question: str | None = Field(None, description="FAQ question")
    answer: str | None = Field(None, description="FAQ answer")
    display_order: int | None = Field(None, description="Display order")
    visible: bool | None = Field(None, description="Visibility flag")

    model_config = ConfigDict(extra="forbid")


class GameDocument(BaseModel):
    """Game document metadata record"""

    id: str = Field(..., description="Document UUID")
    game_id: str = Field(..., description="Game UUID")
    title: str = Field(..., description="Document title")
    language: str = Field(..., description="Document language")
    source_type: str = Field(..., description="Source type (rulebook, faq, etc.)")
    file_name: str = Field(..., description="Original file name")
    file_path: str = Field(..., description="Supabase storage path")
    file_size: int = Field(..., description="File size in bytes")
    file_type: str = Field(..., description="MIME type")
    provider_file_id: str | None = Field(None, description="Provider file identifier")
    vector_store_id: str | None = Field(None, description="Provider vector store identifier")
    status: str = Field(..., description="Processing status")
    metadata: dict[str, Any] | None = Field(None, description="Metadata JSON payload")
    error_message: str | None = Field(None, description="Last processing error (if any)")
    created_at: datetime | None = Field(None, description="Creation timestamp")
    updated_at: datetime | None = Field(None, description="Update timestamp")
    processed_at: datetime | None = Field(None, description="Processing completion timestamp")
    uploaded_at: datetime | None = Field(None, description="Upload timestamp")

    model_config = ConfigDict(from_attributes=True)


# KnowledgeDocument model removed - knowledge tracking now handled directly in game_documents table


class KnowledgeProcessRequest(BaseModel):
    """Request body for /admin/games/{id}/process-knowledge"""

    document_ids: list[str] | None = Field(
        None,
        description="Specific document IDs to process. Defaults to pending documents for the game.",
    )
    language: str | None = Field(None, description="Optional language filter")
    provider_name: str | None = Field(None, description="Provider to use for processing")
    provider_file_id: str | None = Field(None, description="Provider file ID override")
    vector_store_id: str | None = Field(None, description="Provider vector store ID override")
    notes: str | None = Field(None, description="Optional notes to store in metadata")
    mark_as_ready: bool = Field(
        False,
        description="If true, mark documents and knowledge records as ready immediately",
    )

    model_config = ConfigDict(extra="forbid")


class KnowledgeProcessResponse(BaseModel):
    """Response for knowledge processing trigger"""

    game_id: str = Field(..., description="Game UUID")
    processed_document_ids: list[str] = Field(..., description="Document IDs affected")
    success_count: int = Field(..., description="Number of successfully processed documents")
    error_count: int = Field(default=0, description="Number of documents that failed processing")


# ============================================
# GenAI Chat Models
# ============================================


class ChatCitation(BaseModel):
    """Citation from a document referenced in the AI response"""

    document_id: str | None = Field(None, description="Document UUID from game_documents")
    document_title: str | None = Field(None, description="Document title")
    excerpt: str | None = Field(None, description="Relevant excerpt from the document")
    page_number: int | None = Field(None, description="Page number reference")
    relevance_score: float | None = Field(None, description="Relevance score (0-1)")

    model_config = ConfigDict(from_attributes=True)


class ChatModelInfo(BaseModel):
    """Information about the AI model used"""

    provider: str = Field(..., description="AI provider (openai, gemini, claude)")
    model_name: str = Field(..., description="Model name/version")
    total_tokens: int | None = Field(None, description="Total tokens used (if available)")
    prompt_tokens: int | None = Field(None, description="Prompt tokens used")
    completion_tokens: int | None = Field(None, description="Completion tokens used")

    model_config = ConfigDict(from_attributes=True)


class ChatUsageLimits(BaseModel):
    """Usage limits for the current user"""

    daily_limit: int | None = Field(None, description="Daily question limit (if any)")
    daily_used: int = Field(0, description="Questions used today")
    remaining: int | None = Field(None, description="Remaining questions today")
    reset_at: datetime | None = Field(None, description="When limits reset")

    model_config = ConfigDict(from_attributes=True)


class ChatQueryRequest(BaseModel):
    """Request body for POST /genai/query"""

    game_id: str = Field(..., description="Game UUID")
    question: str = Field(..., min_length=1, max_length=2000, description="User question")
    language: str = Field("es", description="Language code (es, en)", pattern="^(es|en)$")
    session_id: str | None = Field(
        None, description="Existing session ID (creates new if not provided)"
    )

    model_config = ConfigDict(extra="forbid")


class ChatQueryResponse(BaseModel):
    """Response for POST /genai/query"""

    session_id: str = Field(..., description="Chat session UUID")
    answer: str = Field(..., description="AI-generated answer")
    citations: list[ChatCitation] = Field(default_factory=list, description="Document citations")
    model_info: ChatModelInfo = Field(..., description="Model information")
    limits: ChatUsageLimits | None = Field(None, description="Usage limits for the user")

    model_config = ConfigDict(from_attributes=True)


class ChatSession(BaseModel):
    """Chat session record"""

    id: str = Field(..., description="Session UUID")
    user_id: str = Field(..., description="User UUID")
    game_id: str = Field(..., description="Game UUID")
    language: str = Field(..., description="Language code")
    model_provider: str = Field(..., description="AI provider")
    model_name: str = Field(..., description="Model name")
    status: str = Field(..., description="Session status (active, closed, archived)")
    total_messages: int = Field(0, description="Total messages in session")
    total_token_estimate: int = Field(0, description="Estimated total tokens used")
    started_at: datetime = Field(..., description="Session start timestamp")
    last_activity_at: datetime = Field(..., description="Last activity timestamp")
    closed_at: datetime | None = Field(None, description="Session close timestamp")
    created_at: datetime | None = Field(None, description="Creation timestamp")
    updated_at: datetime | None = Field(None, description="Update timestamp")

    model_config = ConfigDict(from_attributes=True)


class ChatMessage(BaseModel):
    """Chat message record"""

    id: str = Field(..., description="Message UUID")
    session_id: str = Field(..., description="Session UUID")
    sender: str = Field(..., description="Message sender (user, assistant, system)")
    content: str = Field(..., description="Message content")
    metadata: dict[str, Any] | None = Field(None, description="Message metadata (citations, etc.)")
    created_at: datetime = Field(..., description="Creation timestamp")

    model_config = ConfigDict(from_attributes=True)
