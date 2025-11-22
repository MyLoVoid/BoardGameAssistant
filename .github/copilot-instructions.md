# GitHub Copilot Instructions

## Product Context
- Build "Board Game Assistant Inteligent" (BGAI), a modular companion app for board games.
- Ship a cross-platform mobile client with React Native + Expo, backed by Supabase and a thin FastAPI layer that wraps GenAI providers.
- Support Android and iOS, Spanish and English, and run separate dev/prod environments.

## Core Functional Scope
- Implement authentication with Supabase email/password and expose role-based access (`admin`, `developer`, `basic`, `premium`, `tester`).
- Deliver the Board Game Companion (BGC) section: list games, surface game detail, FAQs, external BGG link, and a GenAI-powered chat per game.
- Model monetization as feature-access differences (no real payments in MVP) driven by roles, feature flags, and usage limits.
- Defer offline mode, but keep data access patterns and schemas ready for future caching.

## Architecture Expectations
- Frontend: keep client logic declarative; consume backend endpoints for data, flags, and analytics. Structure screens and hooks under `app/src` by feature (Auth, Navigation, BGC, Game detail).
- Supabase: own authentication, relational data (users, sections, games, FAQs, feature_flags, chat history, usage_events), and pgvector embeddings in `game_docs_vectors`.
- Backend façade (FastAPI): enforce authZ, feature-flag checks, usage limits, BGG sync, analytics events, and the GenAI adapter RAG pipeline.
- Never call BoardGameGeek directly from the mobile client; run all BGG sync and RAG ingestion server-side.

## Data Model Highlights
- Tables to reflect: `users`, `app_sections`, `games`, `game_faqs`, `feature_flags`, `chat_sessions`, `chat_messages`, `game_docs_vectors`, `usage_events`.
- Include language columns (`language`) where content is localized; default to Spanish with English fallback logic on the backend.
- Feature flags must capture `scope_type`, `scope_id`, `feature_key`, optional `role`, `environment`, and an `enabled` flag plus optional metadata JSON.

## GenAI & RAG Guidance
- The `/genai/query` endpoint validates auth, checks feature flags, manages chat sessions, logs usage, retrieves game-specific chunks from `game_docs_vectors`, calls the configured model, stores messages, and responds with answer plus optional citations/model info.
- Only retrieve RAG context filtered by `game_id`, `language`, and optionally `source_type`. Chunk size, top-N retrieval, and metadata should be configurable.
- Track provider/model name, session language, message counts, and token estimates for analytics.

## Analytics & Telemetry
- Record usage via `usage_events` for key interactions (`game_open`, `faq_view`, `chat_question`, `chat_answer`).
- Ensure chat tables allow reporting on per-user, per-game, per-role trends.

## Development Priorities
- Document the finalized schema (fields, types, FKs, indexes) before implementation.
- Define REST endpoints (`/app/games`, `/app/games/{id}`, `/app/chat/session`, `/genai/query`) with explicit request/response contracts and error handling.
- Seed feature flags per environment to reflect role gating (e.g., `chat` enabled for basic/premium/tester, `score_helper` limited to tester in dev).
- Stand up Supabase dev/prod projects with consistent schema and credential management.

## Coding Conventions
- Follow TypeScript standards (2-space indent, PascalCase components) on the mobile app; adhere to Black + isort + mypy-ready Python on the backend.
- Keep features toggleable and data-driven; avoid hardcoding role logic or language-specific content into the client.
- Centralize analytics triggers in backend endpoints or explicit client calls so usage stays consistent across platforms.
