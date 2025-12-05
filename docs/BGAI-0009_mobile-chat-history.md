# BGAI-0009:: Mobile Chat History Planning

## Overview

**Task**: BGAI-0009 — Redefine the “Chat” tab as a session history (“Historial”) in preparation for the future GenAI conversational feature.  
**Goal**: Provide clarity in the mobile UX, rename the tab in all locales, and document the path forward before wiring the real `POST /genai/query` endpoint.

## Summary

- Renamed the bottom-tab entry from “Chat” to “Historial/History” through the translation catalog.
- Replaced the placeholder chat bubbles by a sessions list view that explains upcoming functionality.
- Updated README + MVP so contributors know the tab is now a history screen preceding GenAI work.
- Captured the decision in this document to guide future agents before the conversational feature lands.

## Modified Files

- `mobile/src/localization/translations.ts` — Added `history.*` keys and renamed `tabs.chat`.
- `mobile/src/screens/chat/ChatScreen.tsx` — New session-history placeholder UI with mock entries and localized copy.
- `README.md`, `mobile/README.md` — Describe the new “Historial” tab and mention BGAI-0009 in the docs list.
- `MVP.md` — Records the completion of the chat history milestone ahead of the GenAI adapter.
- `docs/BGAI-0009_mobile-chat-history.md` — This note.

## Detailed Changes

### Mobile UI
- The former chat bubbles were replaced by a summary view (`FlatList`) showing mock conversations per game plus timestamps. This primes navigation to per-game chat once the backend API is ready.
- `ChatScreen` now acts as a read-only overview with localized title/subtitle/CTA strings defined under `history.*`.
- Empty states reuse the `EmptyState` component to communicate the upcoming feature when no sessions exist.

### Localization
- Added `history.title`, `history.subtitle`, `history.empty*`, `history.placeholder`, and `history.open` for EN/ES.
- `tabs.chat` now resolves to “History / Historial” so navigation stays consistent and we avoid mixed terminology.

### Documentation & Roadmap
- Root README and mobile README mention that the “Historial” tab is a staging area before the conversational AI ships.
- MVP progress table now lists BGAI-0009 as completed, clarifying that the next milestone is wiring the RAG/GenAI adapter.

## Testing

```
cd mobile
npm run lint
```

Manual: launch Expo (`npx expo start`) and verify that the tab label reads “Historial/History” according to the selected language and that the screen displays the new history placeholder.

## Next Steps

1. Implement `POST /genai/query` in the backend (pipeline RAG + GenAI Adapter).
2. Replace the mock sessions with real data from `chat_sessions` once the endpoint is available.
3. Use the history tab as an entry point to resume per-game chats, while the in-game screen hosts the contextual conversation UI.
