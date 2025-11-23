# GEMINI.md - Board Game Assistant Project

This document provides a comprehensive overview of the "Board Game Assistant Inteligent" (BGAI) project. It is intended as a guide for developers and AI assistants to understand the project's goals, architecture, and development conventions.

## Project Overview

This is a **Code Project** in active development. The goal is to build a modular, multi-platform mobile application that serves as an intelligent assistant for board game players.

The application will provide per-game assistance, including rule clarifications via a GenAI-powered chat, FAQs, and general game information. The entire system is designed to be highly modular, with features, games, and user access controlled by a feature flag system.

**Documentation**
Use `/docs` for technical documentation. The `MVP.md` file contains the detailed project specification and progress checklist.

### Core Technologies:
*   **Mobile App:** React Native with Expo
*   **Primary Backend (BaaS):** Supabase (handling Authentication, Postgres Database)
*   **Vector Search:** `pgvector` extension within Supabase for Retrieval-Augmented Generation (RAG)
*   **Custom Backend:** A lightweight API REST server acting as a facade to encapsulate business logic and integrate with third-party services.
*   **GenAI Integration:** A "GenAI Adapter" within the custom backend to manage RAG pipelines and communicate with Large Language Models (e.g., Gemini, OpenAI, Claude).
*   **Data Source:** BoardGameGeek (BGG) for syncing and caching game metadata.

## Building and Running

This project is divided into three main components: a React Native mobile app, a Python backend, and a Supabase instance for database and authentication.

### 1. Supabase
The local development environment is managed by the Supabase CLI.
- **Start:** `supabase start`
- **Stop:** `supabase stop`
- **Reset Database:** `supabase db reset` (This will re-apply migrations and seed data)

*Note: You must have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and running in your environment.*

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

This will open the Expo developer menu. To run the app, you can:
- **On a physical device:** Install the "Expo Go" app and scan the QR code from the terminal.
- **On an emulator:** Press `a` (for Android) or `i` (for iOS) if you have them configured.
- **In a web browser:** Press `w`.

## Development Conventions

The project's guiding principles are laid out in the `MVP.md` document.

### Key Architectural Principles:
*   **Modular Design:** Features, sections, and games should be treated as independent modules controlled by feature flags, not hardcoded logic.
*   **Thin Client:** The mobile app should remain a "thin" presentation layer, with complex business logic, authorization, and AI processing handled by the backend.
*   **Facade Backend:** A custom "fine backend" API acts as a single, controlled gateway for the mobile app, abstracting away the complexities of Supabase, GenAI models, and other third-party services.
*   **RAG per Game:** The GenAI assistant will use a Retrieval-Augmented Generation (RAG) approach. Each game will have its own dedicated, vectorized knowledge base (from rulebooks, FAQs, etc.) to ensure contextually accurate answers.

### Data Model:
The conceptual data model is defined in `MVP.md` and includes tables for:
*   `users`, `roles`
*   `games`, `game_faqs`
*   `feature_flags`
*   `chat_sessions`, `chat_messages`
*   `game_docs_vectors` (for RAG)
*   `usage_events` (for analytics)

## Key Files

*   **`MVP.md`**: The core technical specification document. It contains the executive summary, functional scope, technical architecture, data model, and a detailed development checklist for the Minimum Viable Product. This is the most important file in the directory.
*   **`AGENTS.md` / `CLAUDE.md`**: These likely contain supplementary notes or explorations related to specific AI models or agentic concepts being considered for the GenAI Adapter.
*   **`README.md`**: Currently empty, but will likely hold the public-facing project description.
