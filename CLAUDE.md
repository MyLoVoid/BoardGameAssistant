# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Board Game Assistant Intelligent (BGAI) - A modular mobile assistant for board games with AI-powered help features.

**Architecture:**
- Mobile App: React Native + Expo (Android/iOS)
- Main Backend: Supabase (Auth, Postgres, Storage)
- Custom Backend: API REST facade + GenAI Adapter (RAG per game via provider-specific File Search, AI integrations)
- External Data: BoardGameGeek (BGG) API for game information sync
- AI Providers: OpenAI (Files API + Vector Stores), Gemini (File API + Grounding), Claude (Context Injection)

**Languages:** Spanish (ES) and English (EN) from MVP
**Environments:** Separate dev and prod environments

**Documentation**
Use `/docs` for technical documentation

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
**Updated Strategy: Delegated vectorization to AI providers**

Each game has its own knowledge base:
- Game documents (PDFs, manuals, expansions) uploaded to Supabase Storage
- Documents are then uploaded to provider-specific vector stores:
  - **OpenAI**: Files API + Vector Stores + Assistants API
  - **Gemini**: File API + Grounding with Google Search
  - **Claude**: Context injection + Prompt Caching (no native vector store)
- References stored in `game_documents` table with `provider_file_id` and `vector_store_id`
- Filtered by `game_id` + `language` + `status = 'ready'` + optionally `source_type`
- Pipeline: user question → backend fetches document refs → delegates to provider's semantic search → LLM response with citations
- Supported providers: OpenAI, Gemini, Claude (configurable per session)

### Data Model Key Tables
- `users` - User accounts with roles
- `app_sections` - Modular app sections (e.g., BGC)
- `games` - Game metadata synced from BGG
- `game_faqs` - Multi-language FAQs per game
- `feature_flags` - Granular feature access control
- `chat_sessions` + `chat_messages` - Conversation history
- `game_documents` - Document references with provider file IDs (uploaded to OpenAI/Gemini/Claude vector stores)
- `usage_events` - Analytics tracking

### Backend API Structure
Custom backend acts as facade between mobile app and:
- Supabase (data, auth)
- AI providers (OpenAI/Gemini/Claude)
- BoardGameGeek API (only backend calls BGG, never mobile app)

**Critical endpoint:** `POST /genai/query`
- Input: `game_id`, `question`, `language`, `session_id` (optional)
- Validates user token, checks feature flags, enforces usage limits
- Executes RAG pipeline by delegating to configured AI provider (OpenAI/Gemini/Claude)
- Backend fetches document references from `game_documents` and passes provider IDs to the AI service
- Logs analytics events
- Output: `session_id`, `answer`, `citations` (with source document references), `model_info`, `limits`

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
- Backend syncs game data (name, players, time, rating, images) from BGG XML API
- Data cached in `games` table with `last_synced_from_bgg_at` timestamp
- Mobile app never calls BGG directly
- For MVP: manual/semi-automatic sync for 10-50 initial games

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
