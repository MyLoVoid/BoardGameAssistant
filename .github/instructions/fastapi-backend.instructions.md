---
description: 'FastAPI Backend Development: Python, REST API, Supabase, GenAI orchestration'
applyTo: 'backend/**/*.py'
---

# FastAPI Backend Expert Instructions

Use these guidelines when working on backend API implementation with Python and FastAPI.

## Scope

This applies to:
- REST endpoint development (`backend/app/api/routes/`)
- Service layer implementation (`backend/app/services/`)
- Authentication and authorization logic (`backend/app/core/`)
- Database operations with Supabase
- GenAI/RAG orchestration (OpenAI, Gemini, Claude)
- BoardGameGeek integration
- Feature flags evaluation
- Analytics and usage tracking

## Core Principles

### 1. FastAPI Architecture

**Router Organization**
```python
# backend/app/api/routes/games.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_user, require_role
from app.models.schemas import Game, GameListResponse
from app.services.games import get_games_list

router = APIRouter(prefix="/games", tags=["games"])

@router.get("", response_model=GameListResponse)
async def list_games(
    current_user: dict = Depends(get_current_user),
    status_filter: str = "active"
):
    """List games accessible to the current user."""
    games = await get_games_list(
        user_id=current_user["id"],
        user_role=current_user["role"],
        status_filter=status_filter
    )
    return GameListResponse(games=games)
```

**Dependency Injection**
- Use `Depends()` for auth, database clients, and service injection
- Keep route handlers thin, delegate to services
- Use dependency overrides for testing

### 2. Authentication & Authorization

**JWT Validation**
```python
# backend/app/core/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Validate Supabase JWT and return user info."""
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        # Fetch user profile from Supabase
        return await get_user_profile(payload["sub"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
```

**Role-Based Access**
```python
def require_role(*allowed_roles: str):
    """Dependency that enforces role requirements."""
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {', '.join(allowed_roles)}"
            )
        return user
    return role_checker

# Usage in routes
@router.post("/admin/games")
async def create_game(
    game_data: GameCreate,
    user: dict = Depends(require_role("admin", "developer"))
):
    """Admin-only endpoint to create games."""
    pass
```

### 3. Pydantic Models

**Request/Response Validation**
```python
# backend/app/models/schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

class GameCreate(BaseModel):
    """Schema for creating a new game."""
    bgg_id: int = Field(..., gt=0, description="BoardGameGeek ID")
    name_base: str = Field(..., min_length=1, max_length=200)
    status: str = Field("active", pattern="^(active|beta|hidden)$")
    
    @field_validator("name_base")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty or whitespace")
        return v.strip()

class Game(BaseModel):
    """Complete game model."""
    id: str
    bgg_id: int
    name_base: str
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    playing_time: Optional[int] = None
    rating: Optional[float] = None
    thumbnail_url: Optional[str] = None
    image_url: Optional[str] = None
    status: str
    last_synced_from_bgg_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}
```

### 4. Database Operations

**Supabase Client Usage**
```python
# backend/app/services/games.py
from app.services.supabase import get_supabase_admin_client
from typing import List, Optional

async def get_games_list(
    user_id: str,
    user_role: str,
    status_filter: str = "active"
) -> List[dict]:
    """
    Get list of games accessible to user.
    
    Args:
        user_id: Current user's ID
        user_role: Current user's role
        status_filter: Filter by status (active, beta, hidden)
    
    Returns:
        List of game dictionaries
    """
    supabase = get_supabase_admin_client()
    
    # Build query
    query = supabase.table("games").select("*")
    
    # Apply filters
    if user_role not in ["admin", "developer"]:
        query = query.eq("status", status_filter)
    
    # Execute
    response = query.execute()
    
    if not isinstance(response.data, list):
        return []
    
    return response.data
```

**Error Handling**
```python
from fastapi import HTTPException, status

try:
    response = supabase.table("games").select("*").eq("id", game_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game {game_id} not found"
        )
    
    return response.data[0]
    
except Exception as e:
    logger.error(f"Database error fetching game {game_id}: {e}")
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to fetch game data"
    )
```

### 5. GenAI & RAG Orchestration

**Provider-Agnostic Adapter**
```python
# backend/app/services/genai_adapter.py
from typing import Protocol, Optional
from dataclasses import dataclass

@dataclass
class AIResponse:
    """Standard response from any AI provider."""
    answer: str
    provider: str
    model: str
    token_count: Optional[int] = None
    citations: Optional[list] = None

class GenAIProvider(Protocol):
    """Interface for GenAI providers."""
    
    async def generate_answer(
        self,
        question: str,
        game_id: str,
        language: str,
        session_history: list[dict]
    ) -> AIResponse:
        """Generate answer using provider's RAG capabilities."""
        ...

async def get_ai_response(
    question: str,
    game_id: str,
    language: str,
    provider_name: str = "openai"
) -> AIResponse:
    """
    Orchestrate GenAI response across providers.
    
    Strategy: Delegate vector search to provider's native File Search.
    - OpenAI: Assistants API + Vector Stores
    - Gemini: File API + Grounding
    - Claude: Context injection + Prompt Caching
    """
    # Get document references from game_documents
    docs = await get_game_documents(game_id, language, status="ready")
    
    if provider_name == "openai":
        return await generate_answer_openai(question, docs)
    elif provider_name == "gemini":
        return await generate_answer_gemini(question, docs)
    elif provider_name == "claude":
        return await generate_answer_claude(question, docs)
    else:
        raise ValueError(f"Unknown provider: {provider_name}")
```

**OpenAI Integration**
```python
from openai import AsyncOpenAI

async def generate_answer_openai(
    question: str,
    documents: list[dict]
) -> AIResponse:
    """Use OpenAI Assistants API with File Search."""
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    
    # Get vector_store_id from documents
    vector_store_id = documents[0]["vector_store_id"]
    
    # Create assistant with file search
    assistant = await client.beta.assistants.create(
        model="gpt-4-turbo-preview",
        tools=[{"type": "file_search"}],
        tool_resources={
            "file_search": {"vector_store_ids": [vector_store_id]}
        }
    )
    
    # Create thread and run
    thread = await client.beta.threads.create()
    await client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=question
    )
    
    run = await client.beta.threads.runs.create_and_poll(
        thread_id=thread.id,
        assistant_id=assistant.id
    )
    
    # Get response
    messages = await client.beta.threads.messages.list(thread_id=thread.id)
    answer = messages.data[0].content[0].text.value
    
    return AIResponse(
        answer=answer,
        provider="openai",
        model="gpt-4-turbo-preview",
        token_count=run.usage.total_tokens if run.usage else None
    )
```

### 6. Feature Flags

**Hierarchical Evaluation**
```python
# backend/app/services/feature_flags.py
from typing import Optional

async def check_feature_access(
    user_id: str,
    user_role: str,
    feature_key: str,
    game_id: Optional[str] = None,
    environment: str = "dev"
) -> dict:
    """
    Check if user has access to a feature.
    
    Evaluation order (most specific to least):
    1. User-specific flag
    2. Game-specific flag
    3. Section-specific flag
    4. Global flag
    
    Returns:
        Dict with 'enabled', 'metadata' keys
    """
    supabase = get_supabase_admin_client()
    
    # Admin always has access
    if user_role == "admin":
        return {"enabled": True, "metadata": {}}
    
    # Check user-specific flag
    user_flag = await _get_flag(
        scope_type="user",
        scope_id=user_id,
        feature_key=feature_key,
        role=user_role,
        environment=environment
    )
    if user_flag is not None:
        return user_flag
    
    # Check game-specific flag
    if game_id:
        game_flag = await _get_flag(
            scope_type="game",
            scope_id=game_id,
            feature_key=feature_key,
            role=user_role,
            environment=environment
        )
        if game_flag is not None:
            return game_flag
    
    # Check global flag
    global_flag = await _get_flag(
        scope_type="global",
        scope_id=None,
        feature_key=feature_key,
        role=user_role,
        environment=environment
    )
    
    return global_flag or {"enabled": False, "metadata": {}}
```

### 7. Rate Limiting

**Usage-Based Limits**
```python
async def check_daily_limit(
    user_id: str,
    game_id: str,
    feature_key: str = "chat"
) -> tuple[bool, dict]:
    """
    Check if user has exceeded daily limit.
    
    Returns:
        (within_limit, limit_info)
    """
    # Get limit from feature flag metadata
    access = await check_feature_access(
        user_id=user_id,
        user_role=role,
        feature_key=feature_key,
        game_id=game_id
    )
    
    daily_limit = access.get("metadata", {}).get("daily_limit")
    
    # No limit means unlimited
    if daily_limit is None:
        return True, {"daily_limit": None, "used": 0, "remaining": None}
    
    # Count today's usage
    today_count = await get_user_daily_chat_count(user_id, game_id)
    
    within_limit = today_count < daily_limit
    
    return within_limit, {
        "daily_limit": daily_limit,
        "used": today_count,
        "remaining": max(0, daily_limit - today_count)
    }

# Usage in endpoint
@router.post("/genai/query")
async def query_genai(
    request: GenAIQuery,
    user: dict = Depends(get_current_user)
):
    # Check rate limit
    within_limit, limit_info = await check_daily_limit(
        user_id=user["id"],
        game_id=request.game_id
    )
    
    if not within_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Daily question limit exceeded",
                "limit_info": limit_info
            }
        )
    
    # Process request...
```

### 8. Testing

**Pytest Fixtures**
```python
# backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)

@pytest.fixture
def admin_token():
    """JWT token for admin user."""
    return _make_token(
        user_id="admin-id",
        email="admin@bgai.test",
        role="admin"
    )

@pytest.fixture
def basic_user_token():
    """JWT token for basic user."""
    return _make_token(
        user_id="basic-id",
        email="basic@bgai.test",
        role="basic"
    )

def _make_token(user_id: str, email: str, role: str) -> str:
    """Generate test JWT token."""
    import jwt
    from datetime import datetime, timedelta
    
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "aud": "authenticated",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, SUPABASE_JWT_SECRET, algorithm="HS256")
```

**Integration Tests**
```python
# backend/tests/test_games_endpoints.py
def test_list_games_requires_auth(client):
    """Test that /games requires authentication."""
    response = client.get("/games")
    assert response.status_code == 401

def test_list_games_basic_user(client, basic_user_token):
    """Test basic user can list games."""
    response = client.get(
        "/games",
        headers={"Authorization": f"Bearer {basic_user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "games" in data
    assert isinstance(data["games"], list)

def test_admin_endpoint_requires_admin_role(client, basic_user_token):
    """Test admin endpoints reject non-admin users."""
    response = client.post(
        "/admin/games",
        json={"bgg_id": 12345, "name_base": "Test Game"},
        headers={"Authorization": f"Bearer {basic_user_token}"}
    )
    assert response.status_code == 403
```

## Best Practices

1. **Always use type hints**: Functions, parameters, return values
2. **Use async/await**: For I/O operations (database, HTTP, file system)
3. **Validate inputs**: Use Pydantic models for all request bodies
4. **Return proper status codes**: 200, 201, 400, 401, 403, 404, 422, 429, 500
5. **Log with context**: Include user_id, game_id, request_id in logs
6. **Handle errors gracefully**: Catch exceptions, return user-friendly messages
7. **Separate concerns**: Routes → Services → Database
8. **Write tests**: Integration tests for endpoints, unit tests for services
9. **Document with docstrings**: Google style, include Args/Returns/Raises
10. **Security first**: Validate tokens, check permissions, sanitize inputs

## Common Patterns

### Error Response Format
```python
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    context: Optional[dict] = None

# Usage
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail=ErrorResponse(
        detail="Game not found",
        error_code="GAME_NOT_FOUND",
        context={"game_id": game_id}
    ).model_dump()
)
```

### Logging Pattern
```python
import logging

logger = logging.getLogger(__name__)

@router.post("/genai/query")
async def query_genai(request: GenAIQuery, user: dict = Depends(get_current_user)):
    logger.info(
        "GenAI query received",
        extra={
            "user_id": user["id"],
            "game_id": request.game_id,
            "language": request.language,
            "question_length": len(request.question)
        }
    )
    # Process...
```

### Configuration Management
```python
# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings from environment variables."""
    
    supabase_url: str
    supabase_service_key: str
    supabase_jwt_secret: str
    
    openai_api_key: str | None = None
    google_api_key: str | None = None
    anthropic_api_key: str | None = None
    
    default_ai_provider: str = "openai"
    environment: str = "dev"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

## References

- FastAPI docs: https://fastapi.tiangolo.com/
- Pydantic v2: https://docs.pydantic.dev/latest/
- Supabase Python: https://supabase.com/docs/reference/python/introduction
- OpenAI Python: https://platform.openai.com/docs/api-reference
