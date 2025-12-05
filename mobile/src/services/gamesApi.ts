/**
 * Games API Service
 * HTTP client for backend games endpoints
 */

import { config } from '@/config/env';
import type {
  GameDetailResponse,
  GameFAQsResponse,
  GamesListResponse,
  GameStatus,
  Language,
} from '@/types/games';

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
 * Get list of games accessible to the user
 *
 * @param token - Authentication token from Supabase
 * @param statusFilter - Optional status filter (active, beta, hidden)
 * @returns List of games and total count
 */
export async function getGames(
  token: string,
  statusFilter?: GameStatus,
): Promise<GamesListResponse> {
  const url = new URL(`${API_BASE_URL}/games`);
  if (statusFilter) {
    url.searchParams.append('status_filter', statusFilter);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: createHeaders(token),
  });

  return handleResponse<GamesListResponse>(response);
}

/**
 * Get detailed information about a specific game
 *
 * @param token - Authentication token from Supabase
 * @param gameId - Game UUID
 * @returns Game details with feature access flags
 */
export async function getGameDetail(
  token: string,
  gameId: string,
): Promise<GameDetailResponse> {
  const url = `${API_BASE_URL}/games/${gameId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: createHeaders(token),
  });

  return handleResponse<GameDetailResponse>(response);
}

/**
 * Get FAQs for a specific game
 *
 * @param token - Authentication token from Supabase
 * @param gameId - Game UUID
 * @param language - Language code (es, en) - defaults to 'es'
 * @returns FAQs in requested (or fallback) language
 */
export async function getGameFAQs(
  token: string,
  gameId: string,
  language: Language = 'es',
): Promise<GameFAQsResponse> {
  const url = new URL(`${API_BASE_URL}/games/${gameId}/faqs`);
  url.searchParams.append('lang', language);

  const response = await fetch(url, {
    method: 'GET',
    headers: createHeaders(token),
  });

  return handleResponse<GameFAQsResponse>(response);
}
