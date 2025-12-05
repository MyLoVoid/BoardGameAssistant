/**
 * Chat API Service
 * HTTP client for backend GenAI endpoints
 */

import { config } from '@/config/env';
import type { ChatQueryRequest, ChatQueryResponse } from '@/types/chat';

/**
 * API client configuration
 */
const API_BASE_URL = config.backendUrl;

/**
 * Create headers with authorization token
 */
function createHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP Error ${response.status}`,
    }));
    throw new Error(error.detail || 'Request failed');
  }

  return response.json();
}

/**
 * Send a chat message and get AI response
 *
 * @param token - Authentication token from Supabase
 * @param request - Chat query request with game_id, question, language, and optional session_id
 * @returns AI response with session_id, answer, citations, model_info, and limits
 */
export async function sendChatMessage(
  token: string,
  request: ChatQueryRequest,
): Promise<ChatQueryResponse> {
  const url = `${API_BASE_URL}/genai/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: createHeaders(token),
    body: JSON.stringify(request),
  });

  return handleResponse<ChatQueryResponse>(response);
}
