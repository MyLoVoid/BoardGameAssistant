"""
Configuration module for BGAI Backend API
Loads environment variables and provides application settings
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the root directory of the project (two levels up from this file)
ROOT_DIR = Path(__file__).parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow",
    )

    # Environment
    environment: str = "dev"
    debug: bool = True

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str = "super-secret-jwt-token-with-at-least-32-characters-long"

    # Database
    database_url: str

    # AI Providers
    openai_api_key: str = ""
    google_api_key: str = ""
    anthropic_api_key: str = ""

    # Default AI Configuration
    default_ai_provider: str = "openai"
    default_model: str = "gpt-4-turbo-preview"
    default_embedding_model: str = "text-embedding-ada-002"

    # RAG Configuration
    rag_top_k: int = 5
    rag_similarity_threshold: float = 0.7

    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_period: int = 60

    # CORS
    cors_origins: str
    cors_allow_credentials: bool = True

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.environment == "dev"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.environment == "prod"


# Global settings instance
settings = Settings()  # type: ignore[call-arg]
