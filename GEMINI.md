# GEMINI.md - Board Game Assistant Project

This document provides a comprehensive overview of the "Board Game Assistant Inteligent" (BGAI) project. It is intended as a guide for developers and AI assistants to understand the project's goals, architecture, and development conventions.

## Project Overview

This is a **Code Project** currently in the detailed planning and design phase. The goal is to build a modular, multi-platform mobile application that serves as an intelligent assistant for board game players.

The application will provide per-game assistance, including rule clarifications via a GenAI-powered chat, FAQs, and general game information. The entire system is designed to be highly modular, with features, games, and user access controlled by a feature flag system.

### Core Technologies:
*   **Mobile App:** React Native with Expo
*   **Primary Backend (BaaS):** Supabase (handling Authentication, Postgres Database)
*   **Vector Search:** `pgvector` extension within Supabase for Retrieval-Augmented Generation (RAG)
*   **Custom Backend:** A lightweight API REST server acting as a facade to encapsulate business logic and integrate with third-party services.
*   **GenAI Integration:** A "GenAI Adapter" within the custom backend to manage RAG pipelines and communicate with Large Language Models (e.g., Gemini, OpenAI, Claude).
*   **Data Source:** BoardGameGeek (BGG) for syncing and caching game metadata.

## Building and Running

As the project is in the design phase, there are no build or run commands yet. The `MVP.md` document contains a detailed checklist of the next steps required to begin implementation.

### TODO:
*   **[TODO]** Define and document the command to run the React Native app (e.g., `npx expo start`).
*   **[TODO]** Define and document the command to start the custom backend API server.
*   **[TODO]** Document the process for setting up the Supabase local development environment.

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

*   **`MVP.md`**: The core technical specification document. It contains the executive summary, functional scope, technical architecture, data model, and development checklist for the Minimum Viable Product. This is the most important file in the directory.
*   **`AGENTS.md` / `CLAUDE.md`**: These likely contain supplementary notes or explorations related to specific AI models or agentic concepts being considered for the GenAI Adapter.
*   **`README.md`**: Currently empty, but will likely hold the public-facing project description.
