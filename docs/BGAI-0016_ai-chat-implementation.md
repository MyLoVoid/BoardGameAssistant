# BGAI-0016 :: AI Chat Implementation with RAG

## Overview

**Title**: Complete AI Chat Implementation with Gemini File Search RAG
**Author**: Camilo Ramirez
**Goal**: Deliver a fully functional AI-powered chat system allowing users to ask questions about board games and receive answers grounded in game-specific knowledge bases using Retrieval Augmented Generation (RAG) with Gemini File Search.

## Summary

- **Scope**: End-to-end implementation of GenAI chat feature across backend (FastAPI), mobile (React Native), and integration with Supabase and Gemini File Search.
- **Expected Outcome**: Users can open a chat interface from game detail screens, ask questions about rules and mechanics, and receive AI-generated answers with document citations and usage limits enforcement.
- **Risk/Impact**: **Medium** — New endpoint and services for chat query processing, token-based feature access, rate limiting by daily quotas, and dependency on external Gemini API; regressions would break AI-assisted user experience or expose rate limit bypasses.
- **Components**: Backend chat router + Gemini provider integration, mobile chat UI (screen + components + hook), session management, usage tracking, feature flag-based access control, and comprehensive analytics logging.
- **API Endpoint**: `POST /genai/query` — Core AI chat query interface with role-based access, daily limits, session persistence, and multi-language support (ES/EN with fallback).
- **Data Storage**: Sessions and messages persisted in Supabase (`chat_sessions`, `chat_messages` tables) with analytics logged to `usage_events`.

## Key Files

### Backend (New)

- **`backend/app/api/routes/genai.py`** — Main chat endpoint with full request validation, feature flag checks, daily limit enforcement, session management, Gemini query orchestration, and analytics logging.
- **`backend/app/services/chat_sessions.py`** — Session lifecycle management: create new sessions, retrieve existing ones, add messages, fetch conversation history with pagination.
- **`backend/app/services/usage_tracking.py`** — Event logging for analytics and daily limit enforcement: `check_daily_limit()`, `log_usage_event()`, daily quota validation per game.
- **`backend/app/services/feature_flags.py`** (extended) — Chat feature access validation via `check_chat_access()` with role-based metadata and daily_limit extraction.

### Mobile (New)

- **`mobile/src/types/chat.ts`** — TypeScript interfaces for all chat types: `ChatMessage`, `ChatSession`, `ChatQueryRequest`, `ChatQueryResponse`, `Citation`, `ModelInfo`, `UsageLimits`.
- **`mobile/src/services/chatApi.ts`** — HTTP client service for `POST /genai/query` with authentication token injection and error handling.
- **`mobile/src/hooks/useChatSession.ts`** — React hook managing chat session state, message history, loading state, error handling, and send/clear operations.
- **`mobile/src/components/chat/MessageBubble.tsx`** — Displays individual chat messages with role-based styling, timestamps, and citations rendering (document name + page reference).
- **`mobile/src/components/chat/ChatInput.tsx`** — Text input with send button (disabled during API calls), multiline support, 1000-char limit, and visual feedback.
- **`mobile/src/components/chat/TypingIndicator.tsx`** — Animated loading indicator displayed while waiting for AI response.
- **`mobile/src/screens/GameChatScreen.tsx`** — Full chat screen component orchestrating message list, input, typing indicator, error display, and session persistence.
- **`mobile/src/navigation/linking.ts`** (extended) — Deep link to game chat screen via game detail navigation.

### Database (Existing Tables)

- **`chat_sessions`** — Tracks user chat sessions per game (created in BGAI-0009, reused here with new fields):
  - `id`, `user_id`, `game_id`, `language`, `model_provider`, `model_name`, `status`, `total_messages`, `total_token_estimate`, `started_at`, `last_activity_at`, `closed_at`, `created_at`, `updated_at`.
- **`chat_messages`** — Message history per session (created in BGAI-0009, reused):
  - `id`, `session_id`, `sender` (user/assistant/system), `content`, `metadata` (JSON: citations, model_info), `created_at`.
- **`usage_events`** — Analytics table for tracking all user interactions (created in BGAI-0006, reused):
  - `id`, `user_id`, `event_type` (chat_question/chat_answer), `game_id`, `feature_key`, `environment`, `extra_info` (JSON), `timestamp`.
- **`feature_flags`** — Role-based access control (created in BGAI-0003, extended with `daily_limit` metadata):
  - Scope `game` entries for `chat` feature with metadata: `{"daily_limit": 20}` for basic, `{"daily_limit": 200}` for premium, etc.

### Database (Existing from RAG Setup)

- **`game_documents`** — Document references with vector store metadata (created in BGAI-0014, extended in BGAI-0015):
  - `vector_store_id` — Gemini File Search store ID used for semantic search (retrieved during chat query).

## Detailed Changes

### Backend: Chat Query Endpoint (`POST /genai/query`)

**File**: `backend/app/api/routes/genai.py`

The endpoint implements a 12-step pipeline:

1. **Game Access Validation** (line 136-146): Ensures user has access to the requested game via `get_game_by_id()` with role-based filtering.
2. **Chat Feature Access Check** (line 148-159): Calls `check_chat_access()` to verify feature flag permits chat for this game.
3. **Daily Limit Extraction** (line 161-187): Retrieves `daily_limit` from feature flag metadata (e.g., 20 for basic, 200 for premium), validates current usage, and builds `ChatUsageLimits` response.
4. **Session Management** (line 189-205): Calls `get_or_create_session()` with provided `session_id` (or creates new), stores `model_provider='gemini'` and `model_name='gemini-2.5-flash'`.
5. **Vector Store Retrieval** (line 207-215): Calls `_get_vector_store_id()` to fetch the Gemini File Search store ID from `game_documents` for the requested language (with EN fallback).
6. **Session History Fetching** (line 217-224): Retrieves last 10 messages from `chat_messages`, converts role format for Gemini (assistant → model).
7. **Gemini Query Execution** (line 226-239): Calls `query_gemini()` with game context, question, language, vector store, and conversation history.
8. **Message Storage** (line 241-265): Non-blocking inserts of user question and assistant answer into `chat_messages` with metadata (citations, model_info).
9. **Session Stats Update** (line 267-277): Increments `total_messages` and `total_token_estimate` in `chat_sessions`.
10. **Analytics Logging** (line 279-307): Logs two events—`chat_question` and `chat_answer`—with language, token counts, and citation counts.
11. **Response Building** (line 309-318): Constructs `ChatQueryResponse` with citations, model info, and usage limits.
12. **Error Handling**: Raises HTTP 401 (auth), 403 (access/limits), 404 (game/knowledge), 500 (AI provider errors) with descriptive messages.

**Key Function**: `_get_vector_store_id(game_id, language)` (line 35-89)
- Queries `game_documents` for `status='ready'` entries matching game and language.
- Returns first found `vector_store_id` (all documents for a game share one store).
- Falls back to English if requested language has no ready documents.
- Returns None if no vector store found (error 404 to user).

**Request Schema** (`ChatQueryRequest`):
```json
{
  "game_id": "uuid",
  "question": "What are the rules for...?",
  "language": "es|en",
  "session_id": "uuid (optional)"
}
```

**Response Schema** (`ChatQueryResponse`):
```json
{
  "session_id": "uuid",
  "answer": "Based on the rules document...",
  "citations": [
    {
      "document_id": "uuid",
      "document_title": "Official Rulebook",
      "excerpt": "...",
      "page_number": 5,
      "relevance_score": 0.95
    }
  ],
  "model_info": {
    "provider": "gemini",
    "model_name": "gemini-2.5-flash",
    "total_tokens": 350,
    "prompt_tokens": 200,
    "completion_tokens": 150
  },
  "limits": {
    "daily_limit": 20,
    "daily_used": 5,
    "remaining": 15,
    "reset_at": "2025-12-05T00:00:00Z"
  }
}
```

### Backend: Chat Sessions Service

**File**: `backend/app/services/chat_sessions.py`

**`get_or_create_session()`** (line 12-88):
- Accepts optional `session_id` to reuse active sessions.
- Creates new session with `status='active'`, timestamps, model provider/name, and zero message/token counts.
- Updates `last_activity_at` if reusing existing session.
- Raises exception if creation fails (caught by endpoint).

**`add_message()`** (line 91+):
- Inserts message into `chat_messages` with sender (user/assistant/system), content, optional metadata (JSON: citations).
- Returns stored message record.

**`get_session_history(session_id, limit)`**:
- Fetches last N messages from `chat_messages` ordered by creation (oldest first for Gemini context).
- Used to build multi-turn conversation context for AI provider.

**`update_session_stats(session_id, message_count_increment, token_estimate_increment)`**:
- Increments `total_messages` and `total_token_estimate` atomically.
- Non-blocking: errors are printed but don't fail the chat request.

### Backend: Usage Tracking Service

**File**: `backend/app/services/usage_tracking.py`

**`check_daily_limit(user_id, event_type, daily_limit, game_id)`** (line ?):
- Queries `usage_events` for count of `chat_question` events for the user today.
- Calculates remaining quota and reset time (midnight UTC).
- Returns dict: `{"has_quota": bool, "daily_used": int, "remaining": int, "reset_at": str}`.

**`log_usage_event(user_id, event_type, game_id, feature_key, extra_info)`** (line 17-55):
- Non-blocking insertion into `usage_events`.
- Logs environment (dev/prod), timestamp, and optional extra data (question length, answer length, citations count, etc.).

### Backend: Gemini Provider Integration

**File**: `backend/app/services/gemini_provider.py` (extended from BGAI-0015)

**New helper: `get_game_info_from_store_identifier(store_identifier)`**
- Accepts either a Gemini resource name (`fileSearchStores/...`), the normalized form stored in Supabase (`file_search_stores/...`), or a CLI-friendly display name (`game-<uuid>`).
- Looks up the matching `game_documents` entry (trying both camelCase and snake_case IDs) to recover the `game_id`, then fetches `name_base`, `description`, and `bgg_id` from the `games` table.
- Powers richer system prompts for Gemini responses and prevents CLI debugging from failing when only the store ID is known.

**CLI tooling updates**
- `_resolve_store_name_from_input()` lets devs type either the raw resource identifier or the human-readable display name when running `_debug_cli`.
- `_debug_chat_flow()` now runs in a loop so testers can ask multiple questions per store without restarting the script; typing `q/quit` exits gracefully.
- Improved error surfacing ensures Supabase lookup failures or invalid store names are printed immediately, matching the behavior seen during the latest debugging session.

**`query_gemini(game_id, question, language, vector_store_id, session_history)`**:
- Initializes Gemini client and builds chat context.
- Calls File Search with `vector_store_id` to ground response in game documents.
- Extracts citations from Gemini's grounding data.
- Returns dict: `{"answer": str, "citations": list, "model_info": dict}`.

**Error Handling**: Raises `GeminiProviderError` for API failures, caught by endpoint and converted to HTTP 500.

### Backend: Feature Flags Service

**File**: `backend/app/services/feature_flags.py` (extended)

**`check_chat_access(user_id, user_role, game_id)`** (new):
- Queries `feature_flags` with scope `game`, feature_key `chat`, matches game_id.
- Falls back to scope `global` if no game-specific flag.
- Returns `AccessCheckResult` with `has_access`, `reason`, and `metadata` (containing `daily_limit`).
- Logic: feature enabled + user role matches + environment matches = access granted.

### Mobile: Chat Types

**File**: `mobile/src/types/chat.ts`

Defines all TypeScript interfaces matching backend schemas:
- `MessageRole`: 'user' | 'assistant' | 'system'
- `Citation`: document_name, page (optional)
- `ChatMessage`: id, role, content, timestamp, citations (optional)
- `ChatSession`: id, game_id, language, messages, created_at, updated_at
- `ChatQueryRequest`: game_id, question, language, session_id (optional)
- `ModelInfo`: provider, model_name
- `UsageLimits`: daily_limit, daily_used, remaining
- `ChatQueryResponse`: session_id, answer, citations, model_info, limits
- `ChatAPIError`: detail, error_code

### Mobile: Chat API Service

**File**: `mobile/src/services/chatApi.ts`

**`sendChatMessage(token, request)`**:
- HTTP POST to `{API_BASE_URL}/genai/query`.
- Injects `Authorization: Bearer {token}` header.
- Sends `ChatQueryRequest` as JSON body.
- Handles non-200 responses with error extraction and rethrows as Error.
- Returns typed `ChatQueryResponse`.

### Mobile: Chat Session Hook

**File**: `mobile/src/hooks/useChatSession.ts`

**`useChatSession(gameId)`** — Custom React hook managing chat state:

State:
- `messages: ChatMessage[]` — Array of conversation messages.
- `sessionId: string | null` — Current/reused session identifier.
- `isLoading: boolean` — True during API call.
- `error: string | null` — Error message from API or validation.

Functions:
- **`sendMessage(question: string)`**:
  1. Validates authentication token presence.
  2. Trims and validates question is not empty.
  3. Creates local user message with timestamp and adds to state (optimistic).
  4. Calls `chatApi.sendChatMessage()` with game_id, question, language, session_id.
  5. Updates session ID if response contains new ID (first message).
  6. Creates assistant message from response answer + citations.
  7. On error: removes user message, sets error state.
  8. Uses debounced cleanup of isLoading flag.

- **`clearChat()`**:
  - Resets messages, sessionId, and error state for new conversation.

### Mobile: Chat Components

**`MessageBubble.tsx`** (line 1-117):
- Displays single message with role-based styling:
  - User bubbles: right-aligned, primary color background.
  - Assistant bubbles: left-aligned, card background with border.
- Renders citations below message if present:
  - Title: "Sources:" (or localized equivalent).
  - Each citation: document_name + page reference (if available).
- Shows timestamp in muted color.

**`ChatInput.tsx`** (line 1-92):
- Flexbox row layout with TextInput + send button.
- Input: multiline, 1000-char limit, editable while not loading.
- Send button: Ionicons "send" icon, primary color, disabled if text empty or isLoading.
- Callback: `onSend(text)` fired on button press or return key, clears input on send.

**`TypingIndicator.tsx`**:
- Animated three-dot loader shown during API response wait.
- Visual cue to user that assistant is "thinking."

**`GameChatScreen.tsx`** (new):
- Main screen component orchestrating chat UI:
  1. Uses `useChatSession(gameId)` hook to manage state.
  2. Renders FlatList of messages using `MessageBubble`.
  3. Inserts `TypingIndicator` when `isLoading=true`.
  4. Shows error banner if `error` is set.
  5. Displays usage limits info (e.g., "5 of 20 questions used today").
  6. Renders `ChatInput` at bottom with `onSend={() => sendMessage()}`.
  7. Includes "Clear Chat" button to reset conversation.
  8. Handles language context (uses `useLanguage()` hook).
  9. Header shows game name and back navigation.

### Mobile: Navigation Integration

**`mobile/src/screens/GameDetailScreen.tsx`** (extended):
- Adds "Open AI Chat" button visible only if chat feature is enabled for user.
- Button navigates to `GameChatScreen` with game_id parameter.

**`mobile/src/navigation/linking.ts`** (extended):
- Deep link pattern: `bgai://game/:gameId/chat` → `GameChatScreen`.

### Mobile: Localization

**Translations** (ES/EN):
- "Chat with AI" / "Conversa con IA"
- "Ask about the rules..." / "Pregunta sobre las reglas..."
- "Clear Chat" / "Limpiar Chat"
- "Sources:" / "Fuentes:"
- "No knowledge base found" / "No se encontró base de conocimiento"
- "Daily limit reached" / "Límite diario alcanzado"
- Usage counter: "5 of 20 questions" / "5 de 20 preguntas"

## API / Config Notes

### Endpoint

**POST /genai/query**
- **Authentication**: Required (JWT Bearer token)
- **Rate Limit**: Enforced via `daily_limit` in feature flags (not HTTP-level rate limiting)
- **Response Time**: Typically 2-5 seconds (depends on Gemini API latency)
- **Status Codes**:
  - `200 OK` — Answer generated successfully
  - `401 Unauthorized` — Invalid/missing token
  - `403 Forbidden` — No chat access or daily limit exceeded
  - `404 Not Found` — Game or knowledge base unavailable
  - `500 Internal Server Error` — Gemini API error or session creation failure

### Environment Variables

No new env vars required (uses existing `GOOGLE_API_KEY` and Supabase config from BGAI-0015).

### Feature Flags

Chat access is controlled via `feature_flags` table with:
- **Scope**: `game` (per-game) or `global` (all games)
- **Feature Key**: `chat`
- **Metadata**: `{"daily_limit": 20}` (basic), `{"daily_limit": 200}` (premium)
- **Roles**: `basic`, `premium`, `tester`, `developer`, `admin`

Example seed entry:
```sql
INSERT INTO feature_flags (scope, target_id, feature_key, roles, metadata, environment, enabled)
VALUES
  ('global', NULL, 'chat', ARRAY['basic','premium','tester','developer','admin'],
   '{"daily_limit": 20}', 'dev', true),
  ('global', NULL, 'chat', ARRAY['premium','tester','developer','admin'],
   '{"daily_limit": 200}', 'dev', true);
```

### Session Persistence

Sessions are reused within the same app instance:
- Mobile stores `sessionId` in component state (not persistent across app restarts).
- Backend updates `last_activity_at` on each message.
- Sessions never auto-close; can be manually archived via admin endpoint (future).

### Multi-Language Support

- **Request**: `language` parameter (es/en) in `ChatQueryRequest`.
- **Vector Store Lookup**: Searches game_documents for matching language + fallback to EN.
- **Response**: Answer is in the language of the requested documents.
- **UI**: All prompts/labels are in user's selected app language via `LanguageContext`.

## Testing Notes

### Prerequisites

1. **Backend**: Supabase running with populated `game_documents` table with `status='ready'` for at least one game in both ES and EN.
2. **Mobile**: App configured with valid `BACKEND_URL` and Supabase credentials.
3. **Gemini API**: `GOOGLE_API_KEY` set in backend environment.
4. **Test User**: Premium or basic user with active session and daily quota remaining.

### Test Scenarios

**Backend Tests** (`backend/tests/test_genai_api.py`):

✅ **Happy Path: Basic Chat Query**
- POST `/genai/query` with valid token, existing game, non-empty question, language=es
- Expect: 200 OK with session_id, answer text, at least one citation, model_info, limits

✅ **Session Reuse**
- First query: creates session, returns session_id
- Second query: same game, same language, provide returned session_id
- Expect: same session_id, message count incremented

✅ **Language Fallback**
- Game has documents only in EN, request language=es
- Expect: system finds EN documents and returns answer in English

✅ **Daily Limit Enforcement**
- User with daily_limit=2, already used 2
- POST `/genai/query` with third question
- Expect: 403 Forbidden, detail mentions daily limit

✅ **No Knowledge Base**
- Game exists but no documents with status=ready
- POST `/genai/query` for that game
- Expect: 404 Not Found, detail suggests contacting admin

✅ **Unauthorized Access**
- No token provided
- Expect: 401 Unauthorized

✅ **Feature Flag Disabled**
- Chat feature disabled for user's role
- POST `/genai/query`
- Expect: 403 Forbidden, reason="chat not enabled for your role"

✅ **Multi-Turn Conversation**
- Send 3 questions in same session
- Verify each response includes prior messages in Gemini context
- Expect: answers consider previous exchanges (coherent conversation)

**Mobile Tests** (`mobile/src/__tests__/useChatSession.test.ts`):

✅ **Send Message Success**
- Hook renders, call `sendMessage("Question")`
- Mock API returns ChatQueryResponse
- Expect: messages include both user and assistant messages, sessionId set

✅ **Session ID Persistence**
- First message creates session, get sessionId
- Second message uses same sessionId
- Expect: hook passes sessionId to API

✅ **Error Handling**
- Mock API throws error
- Expect: error state set, user message removed from list

✅ **Clear Chat**
- Messages and sessionId populated
- Call `clearChat()`
- Expect: messages=[], sessionId=null, error=null

✅ **Loading State**
- Call `sendMessage()`, check `isLoading=true` during call
- Expect: loading flag set to false after response

**Integration Tests**:

✅ **Full Flow: E2E Chat**
1. Mobile user logs in
2. Opens GameDetail for a game with documents
3. Taps "Open Chat"
4. Asks a question about rules
5. Receives AI-generated answer with citations
6. Asks follow-up question
7. Verify conversation continuity

✅ **Rate Limiting**
1. User with 5-question daily limit
2. Ask 5 questions successfully
3. 6th question returns 403 with reset time
4. Verify reset_at is tomorrow at midnight

✅ **Language Switching**
1. App language: ES
2. Chat a question in ES
3. Switch app language to EN
4. Chat same question in EN (different session)
5. Verify both conversations are stored and language-appropriate

## Integration Flow

```
[Mobile User]
      |
      v
[GameChatScreen]
      |
      | calls useChatSession(gameId)
      v
[useChatSession Hook]
      |
      | sendMessage(question)
      |
      v
[chatApi.sendChatMessage(token, request)]
      |
      | POST /genai/query
      |
      v
[Backend: genai router]
      |
      +---> validate auth token
      |
      +---> check game access (get_game_by_id)
      |
      +---> check chat feature flag (check_chat_access)
      |
      +---> enforce daily limits (check_daily_limit)
      |
      +---> get/create session (get_or_create_session)
      |
      +---> fetch vector store ID (_get_vector_store_id from game_documents)
      |
      +---> fetch conversation history (get_session_history)
      |
      +---> call Gemini with File Search (query_gemini)
      |
      +---> store user question (add_message sender=user)
      |
      +---> store assistant answer (add_message sender=assistant)
      |
      +---> update session stats (update_session_stats)
      |
      +---> log analytics (log_usage_event x2)
      |
      v
[ChatQueryResponse]
      |
      | contains: session_id, answer, citations, model_info, limits
      |
      v
[Mobile receives response]
      |
      | updates messages list
      | updates sessionId if new
      | renders answer + citations
      | displays usage limits
      |
      v
[User sees AI answer in chat]
```

## Related Documentation

- **BGAI-0015** (`docs/BGAI-0015_gemini-file-search.md`) — Gemini File Search backend setup and document processing pipeline
- **BGAI-0014** (`docs/BGAI-0014_upload-documents.md`) — Admin portal document upload and management
- **BGAI-0009** (`docs/BGAI-0009_mobile-chat-history.md`) — Chat session and message persistence database schema
- **BGAI-0008** (`docs/BGAI-0008_mobile-localization.md`) — Multi-language support infrastructure used for chat UI
- **BGAI-0006** (`docs/BGAI-0006_games-endpoints.md`) — Game endpoints and role-based access patterns
- **BGAI-0003** (`docs/BGAI-0003_authentication.md`) — JWT token validation and feature flag foundations
- **Gemini API Docs**: [File Search Documentation](https://ai.google.dev/docs/file-search)
- **Supabase Docs**: [Realtime and Postgres](https://supabase.com/docs)
