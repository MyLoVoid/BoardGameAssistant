# GEMINI.md - Board Game Assistant Project

This document provides a technical overview of the "Board Game Assistant Inteligent" (BGAI) project. It is intended as a concise guide for developers and AI assistants. For the most detailed specifications and live progress, refer to `MVP.md`. For setup and quick start, see `README.md`.

## Project Overview

This is a **Code Project** in active development. The goal is to build a modular, multi-platform mobile application that serves as an intelligent assistant for board game players, complemented by a web-based administration portal for content management.

- **Mobile App (React Native/Expo):** Provides per-game assistance, including rule clarifications via a GenAI-powered chat, FAQs, and general game information. Supports ES/EN localization.
- **Admin Portal (Next.js):** A full-featured internal web app for admins to manage all content, including importing games from BoardGameGeek (BGG), editing metadata, managing FAQs, and uploading documents for the AI's knowledge base.
- **System Architecture:** The system is designed to be highly modular. Features, games, and user access are controlled by a feature flag system. The mobile and admin clients are "thin," with all complex business logic, authorization, and AI processing handled by the FastAPI backend.

## Core Architecture & Technologies:
*   **Mobile App:** React Native with Expo (SDK 51), TypeScript.
*   **Admin Portal:** Next.js 16 with React 19, TypeScript, Tailwind CSS.
*   **Primary Backend (BaaS):** Supabase (Postgres, Auth, Storage).
*   **Custom Backend (Facade):** Python 3.13 with FastAPI and Poetry. Acts as a single gateway for all clients.
*   **GenAI Integration:** A "GenAI Adapter" within the custom backend to manage RAG pipelines.
*   **RAG Strategy:** **File Search Delegated to Providers**. The system uploads documents to the native file search/vector services of AI providers (e.g., OpenAI File API, Gemini File API) instead of managing embeddings. The backend orchestrates this process.
*   **Data Source:** BoardGameGeek (BGG) for syncing and caching game metadata (requires an official license for production use).

## Building and Running

This project is divided into four main components: a React Native mobile app, a Next.js admin portal, a Python backend, and a Supabase instance. For a fresh start, resetting the database is recommended to apply the consolidated baseline migration and seed test data.

### 1. Supabase
The local development environment is managed by the Supabase CLI. Requires Docker Desktop.
- **Start:** `supabase start`
- **Reset Database (Recommended First Time):** `supabase db reset`

### 2. Backend (FastAPI)
The backend is a FastAPI server managed with Poetry.
1.  Navigate to the backend directory: `cd backend`
2.  Install dependencies: `poetry install`
3.  Run the development server: `poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

### 3. Admin Portal (Next.js)
The admin portal is a Next.js web application.
1.  Navigate to the portal directory: `cd admin-portal`
2.  Install dependencies: `npm install`
3.  Start the development server: `npm run dev`

### 4. Mobile App (React Native + Expo)
The mobile app is built with React Native and Expo.
1.  Navigate to the mobile directory: `cd mobile`
2.  Install dependencies: `npm install`
3.  Start the development server: `npx expo start --clear`

## Data Model Summary
The conceptual data model is defined in `MVP.md` and implemented via the consolidated Supabase baseline (`supabase/migrations/20251205000000_baseline.sql`). Core tables include:
*   `profiles`, `app_sections`
*   `games`, `game_faqs`
*   `feature_flags`
*   `chat_sessions`, `chat_messages`
*   `game_documents`: Stores references to documents for the RAG process (e.g., `provider_file_id`). `file_path` is auto-generated, and the AI provider is selected during knowledge processing, not on creation. Processing metadata is stored directly in this table.
*   `usage_events`: For basic analytics.

## Key Files
*   **`MVP.md`**: The core technical specification and living backlog. It contains the executive summary, functional scope, technical architecture, data model, and a detailed development checklist. **This is the primary source of truth for project scope.**
*   **`README.md`**: The main entry point for developers. Contains up-to-date setup instructions, run commands, project status, and a high-level overview.
*   **`admin-portal/README.md`**: The sole source of documentation for the Admin Portal.
*   **`/docs`**: Contains historical, point-in-time design documents for major features (`BGAI-XXXX_*.md`).
*   **`supabase/seed.sql`**: Contains all the initial data (test users, games, flags) required to run the application.

This document is based on the project state as of late November 2025, reflecting the completion of BGAI-0001 through BGAI-0013.
