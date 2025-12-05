/**
 * Type definitions for Chat API
 * Matches backend /genai/query endpoint
 */

import type { Language } from './games';

/**
 * Message role in conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Citation reference from RAG response
 */
export interface Citation {
  document_name: string;
  page?: number;
}

/**
 * Individual chat message
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  citations?: Citation[];
}

/**
 * Chat session with message history
 */
export interface ChatSession {
  id: string;
  game_id: string;
  language: Language;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

/**
 * Request body for POST /genai/query
 */
export interface ChatQueryRequest {
  game_id: string;
  question: string;
  language: Language;
  session_id?: string;
}

/**
 * Model information from AI response
 */
export interface ModelInfo {
  provider: string;
  model_name: string;
}

/**
 * Usage limits information
 */
export interface UsageLimits {
  daily_limit?: number;
  daily_used?: number;
  remaining?: number;
}

/**
 * Response from POST /genai/query
 */
export interface ChatQueryResponse {
  session_id: string;
  answer: string;
  citations?: Citation[];
  model_info?: ModelInfo;
  limits?: UsageLimits;
}

/**
 * Error response from chat API
 */
export interface ChatAPIError {
  detail: string;
  error_code?: string;
}
