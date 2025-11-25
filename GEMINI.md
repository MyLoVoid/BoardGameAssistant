# GEMINI.md - Board Game Assistant Project

This document provides a comprehensive overview of the "Board Game Assistant Inteligent" (BGAI) project. It is intended as a guide for developers and AI assistants to understand the project's goals, architecture, and development conventions.

## Project Overview

This is a **Code Project** in active development. The goal is to build a modular, multi-platform mobile application that serves as an intelligent assistant for board game players, complemented by a web-based administration portal for content management.

The application provides per-game assistance, including rule clarifications via a GenAI-powered chat, FAQs, and general game information. The entire system is designed to be highly modular, with features, games, and user access controlled by a feature flag system. The content for the games (FAQs, documents for RAG, etc.) is managed through the **Admin Portal**.

**Documentation**
Use `/docs` for technical documentation. The `MVP.md` file contains the detailed project specification and progress checklist.

### Core Technologies:
*   **Mobile App:** React Native with Expo
*   **Admin Portal:** Next.js
*   **Primary Backend (BaaS):** Supabase (handling Authentication, Postgres Database, Storage)
*   **Custom Backend:** A lightweight FastAPI server acting as a facade to encapsulate business logic, serve the mobile and admin APIs, and integrate with third-party services.
*   **GenAI Integration:** A "GenAI Adapter" within the custom backend to manage RAG pipelines.
*   **RAG Strategy:** **Provider-Delegated Vectorization**. The system uploads documents to the native file search/vector services of AI providers (e.g., OpenAI File Search API, Gemini File API) instead of managing embeddings in its own database.
*   **Data Source:** BoardGameGeek (BGG) for syncing and caching game metadata.

## Building and Running

This project is divided into four main components: a React Native mobile app, a Next.js admin portal, a Python backend, and a Supabase instance.

### 1. Supabase
The local development environment is managed by the Supabase CLI.
- **Start:** `supabase start`
- **Stop:** `supabase stop`
- **Reset Database:** `supabase db reset` (This will re-apply migrations and seed data)

*Note: You must have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and running.*

### 2. Backend (FastAPI)
The backend is a FastAPI server managed with Poetry.
1.  Navigate to the backend directory: `cd backend`
2.  Install dependencies: `poetry install`
3.  Run the development server: `poetry run python run.py`

The API will be available at `http://localhost:8000`.

### 3. Mobile App (React Native + Expo)
The mobile app is built with React Native and Expo.
1.  Navigate to the mobile directory: `cd mobile`
2.  Install dependencies: `npm install`
3.  Start the development server: `npx expo start`

### 4. Admin Portal (Next.js)
The admin portal is a Next.js web application.
1.  Navigate to the portal directory: `cd admin-portal` (Note: This directory may need to be created)
2.  Install dependencies: `npm install`
3.  Start the development server: `npm run dev`

## Development Conventions

The project's guiding principles are laid out in the `MVP.md` document.

### Key Architectural Principles:
*   **Modular Design:** Features, sections, and games are independent modules controlled by feature flags.
*   **Thin Client:** The mobile app and admin portal are "thin" presentation layers. Complex business logic, authorization, and AI processing are handled by the backend.
*   **Facade Backend:** The custom FastAPI backend acts as a single, controlled gateway for all clients, abstracting away Supabase, GenAI models, and other services. It exposes dedicated APIs for the mobile app and the admin portal.
*   **Content-Driven:** All game-specific content is managed via the Admin Portal, not hardcoded.
*   **Delegated RAG per Game:** The GenAI assistant uses a Retrieval-Augmented Generation (RAG) approach where each game's knowledge base is managed by a third-party AI provider, orchestrated by our backend.

### Data Model:
The conceptual data model is defined in `MVP.md` and includes tables for:
*   `users`, `roles`
*   `games`, `game_faqs`
*   `feature_flags`
*   `chat_sessions`, `chat_messages`
*   `game_documents` (replaces `game_docs_vectors`): Stores references to documents uploaded to AI providers (e.g., `provider_file_id`, `vector_store_id`) for the RAG process.
*   `usage_events` (for analytics)

## Key Files

*   **`MVP.md`**: The core technical specification document. It contains the executive summary, functional scope, technical architecture, data model, and a detailed development checklist for the Minimum Viable Product. This is the most important file in the directory.
*   **`AGENTS.md` / `CLAUDE.md`**: These files contain supplementary guidelines and up-to-date architectural context for AI agents working on the project, ensuring they align with the latest development patterns.
*   **`README.md`**: Currently empty, but will likely hold the public-facing project description.
*   **`admin-portal/`**: (To be created) The directory for the Next.js web application for managing game content.