# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Board Game Assistant Intelligent (BGAI) - A modular mobile assistant for board games with AI-powered help features.

**Architecture:**
- Mobile App: React Native + Expo (Android/iOS) - Primary user interface
- Admin Portal: Next.js 16 + React 19 + Tailwind CSS - Internal management tool with dark mode support
- Main Backend: Supabase (Auth, Postgres, Storage)
- Custom Backend: Python 3.13 + FastAPI + Poetry - API REST facade + GenAI Adapter (RAG per game via provider-specific File Search)
- External Data: BoardGameGeek (BGG) API for game information sync (⚠️ pending official license)
- AI Providers: OpenAI (Files API + Vector Stores), Gemini (File API + Grounding), Claude (Context Injection)

**Languages:** Spanish (ES) and English (EN) from MVP
**Environments:** Separate dev and prod environments

**Documentation Structure:**
- `MVP.md` - Living backlog, technical spec, development checklist (**primary source of truth**)
- `README.md` - Setup instructions, run commands, project status, high-level overview
- `admin-portal/README.md` - **Sole source of documentation for Admin Portal** (functional & technical)
- `/docs/BGAI-XXXX_*.md` - Historical point-in-time design documents for major features
- `AGENTS.md` - Quick reference for AI agents working on this codebase
- `CLAUDE.md` (this file) - Project guidance for Claude Code

**Current State:** MVP ~70% complete (Nov 2025)

## Key Architectural Concepts

### Modularity Philosophy
Everything is modular and configurable:
- Sections (e.g., Board Game Companion) can be activated/deactivated
- Games are configurable subsections
- Features (FAQ, AI chat, score helpers) controlled by feature flags, never hardcoded

### User Roles & Permissions
Roles: `admin`, `developer`, `basic`, `premium`, `tester`
- Authorization handled via `feature_flags` table with scope types: `global`, `section`, `game`, `user`
- Feature access determined by role + feature flags + environment, not hardcoded logic
- Usage limits (e.g., daily chat questions) stored in feature flag metadata

### RAG (Retrieval Augmented Generation) System
**Strategy: Delegated vectorization to AI providers** (Nov 2024 update)

Each game has its own knowledge base:
- **Document Upload Flow:**
  1. Admin creates document reference via Admin Portal (auto-generates `file_path` using document UUID)
  2. Document uploaded to Supabase Storage at path: `game_documents/{game_id}/{document_uuid}`
  3. Admin triggers "Process Knowledge" to upload to AI provider
  4. Backend updates `game_documents` with `provider_file_id`, `vector_store_id`, and processing metadata

- **Provider Integration:**
  - **OpenAI**: Files API + Vector Stores + Assistants API
  - **Gemini**: File API + Grounding with Google Search
  - **Claude**: Context injection + Prompt Caching (no native vector store)

- **Key Changes (Nov 2024):**
  - ❌ `knowledge_documents` table removed (migration 20241127)
  - ✅ Processing metadata now stored directly in `game_documents` table
  - ✅ `file_path` auto-generated using pattern: `game_documents/{game_id}/{document_uuid}`
  - ✅ `provider_name` removed from document creation - selected during processing only

- **Query Pipeline:**
  - User question → backend fetches refs from `game_documents` (filtered by `game_id` + `language` + `status='ready'`)
  - Backend delegates to provider's semantic search using stored file/vector store IDs
  - LLM response with citations returned to user

### Data Model Key Tables (Nov 2024)
**Core Tables:**
- `profiles` - User accounts with roles (`admin`, `developer`, `tester`, `premium`, `basic`)
- `app_sections` - Modular app sections (e.g., BGC = Board Game Companion)
- `games` - Game metadata synced from BGG (name, players, time, rating, images, BGG ID)
- `game_faqs` - Multi-language FAQs per game (ES/EN with fallback support)
- `feature_flags` - Granular feature access control (scope: global/section/game/user)
- `chat_sessions` - Chat session tracking (language, provider, token estimates)
- `chat_messages` - Conversation history (user/assistant/system messages)
- `game_documents` - **Document references WITH processing metadata** (Nov 2024 update):
  - Auto-generated `file_path`: `game_documents/{game_id}/{document_uuid}`
  - Provider metadata: `provider_file_id`, `vector_store_id`
  - Processing status: `uploaded`, `ready`, `error`
  - Language-specific: documents tagged with `language` field
  - Metadata JSON: processing info, notes, triggered_by, etc.
- `usage_events` - Analytics tracking (environment, event_type, feature_key)

**Removed Tables:**
- ~~`knowledge_documents`~~ - Removed in migration 20241127 (metadata merged into `game_documents`)

### Backend API Structure
Custom backend acts as facade between mobile app and:
- Supabase (data, auth)
- AI providers (OpenAI/Gemini/Claude)
- BoardGameGeek API (only backend calls BGG, never mobile app)

**Public Endpoints:**
- `POST /genai/query` - **Critical endpoint** for AI chat:
  - Input: `game_id`, `question`, `language`, `session_id` (optional)
  - Validates user token, checks feature flags, enforces usage limits
  - Executes RAG pipeline by delegating to configured AI provider
  - Fetches document references from `game_documents` and passes provider IDs to AI service
  - Logs analytics events
  - Output: `session_id`, `answer`, `citations`, `model_info`, `limits`
- `GET /games` - List games with filters
- `GET /games/{id}` - Game details
- `GET /games/{id}/faqs` - Game FAQs (language-aware)
- `GET /sections` - List app sections

**Admin Endpoints** (require `admin` or `developer` role):
- `POST /admin/games` - Create game manually
- `POST /admin/games/import-bgg` - Import from BoardGameGeek
- `PUT /admin/games/{id}` - Update game metadata
- `GET/POST/PUT/DELETE /admin/games/{id}/faqs` - CRUD FAQs
- `GET/POST/DELETE /admin/games/{id}/documents` - Manage document references
- `POST /admin/games/{id}/process-knowledge` - Trigger knowledge processing
  - Response: `{game_id, processed_document_ids, success_count, error_count}`

### Admin Portal (Next.js)
**Purpose:** Internal management tool for content curation and RAG pipeline management

**Key Features:**
- Authentication via Supabase Auth (roles: `admin`, `developer` only)
- **Dark Mode Support:** Light/dark/system with persistent toggle
- **Game Management:** Import from BGG, manual creation, edit metadata, sync from BGG
- **FAQ Management:** CRUD with multi-language support (ES/EN)
- **Document Management:**
  - Create document references (auto-generates storage path)
  - Upload files to Supabase Storage
  - Trigger "Process Knowledge" to upload to AI providers
  - Track processing status
- **UI Framework:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- **Documentation:** See `admin-portal/README.md` (sole source of truth for portal)

## Multi-Language Strategy
- Content in `game_faqs` and `game_documents` tagged with `language` field
- Documents uploaded separately per language to provider vector stores
- Fallback: ES preferred → EN if not available
- Session language stored in `chat_sessions`
- RAG searches only documents matching the session language (with fallback to EN)

## Analytics from Day 1
Track via `usage_events` and session tables:
- Most used games
- FAQ views vs chat usage
- Questions per day, per role
- Language preferences
- Feature adoption (especially for testers)

## BGG Integration

⚠️ **CRITICAL - BGG License Status (as of 2025-11-25):**
- **NO official license** from BoardGameGeek yet - application pending
- BGG import feature is **DEV/TEST ONLY** - DO NOT enable in production
- Code implemented in `backend/app/services/bgg.py` for local development only
- Requires formal approval from BoardGameGeek before production use

**Implementation Details:**
- Backend syncs game data (name, players, time, rating, images) from BGG XML API v2
- API endpoint: `https://www.boardgamegeek.com/xmlapi2/thing`
- Data cached in `games` table with `last_synced_from_bgg_at` timestamp
- Mobile app and Admin Portal **never call BGG directly** - only backend accesses BGG
- For MVP: manual/semi-automatic sync for 10-50 initial games
- Admin Portal: Import via BGG ID using `POST /admin/games/import-bgg` endpoint

## Development Guidelines

### Feature Flag Pattern
When implementing new features:
1. Check `feature_flags` table for access (by scope + role + environment)
2. Never hardcode "if role == premium" logic in app or backend
3. Use metadata JSON field for configuration (e.g., daily limits)

### Session Management
Chat sessions persist across conversations:
- Track `total_messages`, `total_token_estimate` for cost monitoring
- Store `model_provider` and `model_name` for analytics
- Update `last_activity_at` on each interaction

### Analytics Events
Log usage events for all key actions:
- `game_open` - User views game detail
- `faq_view` - User views FAQ section
- `chat_question` - Before AI call
- `chat_answer` - After AI response
Include `environment` field to separate dev/prod analytics

### Environment Configuration
- Dev environment: test data, fake users, relaxed limits
- Prod environment: real testers, official games, enforced limits
- Same database schema, different data and feature flag configurations
