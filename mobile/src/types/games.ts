/**
 * Type definitions for Games API
 * Matches backend models from app/models/schemas.py
 */

/**
 * Game status
 */
export type GameStatus = 'active' | 'beta' | 'hidden';

/**
 * Language code
 */
export type Language = 'es' | 'en';

/**
 * Simplified game information for list views
 */
export interface GameListItem {
  id: string;
  name_base: string;
  thumbnail_url: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  rating: number | null;
  status: GameStatus;
}

/**
 * Complete game information
 */
export interface Game {
  id: string;
  section_id: string;
  name_base: string;
  bgg_id: number | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  rating: number | null;
  thumbnail_url: string | null;
  image_url: string | null;
  status: GameStatus;
  last_synced_from_bgg_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * FAQ for a specific game
 */
export interface GameFAQ {
  id: string;
  game_id: string;
  language: Language;
  question: string;
  answer: string;
  display_order: number;
  visible: boolean;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Response for GET /games
 */
export interface GamesListResponse {
  games: GameListItem[];
  total: number;
}

/**
 * Response for GET /games/{id}
 */
export interface GameDetailResponse {
  game: Game;
  has_faq_access: boolean;
  has_chat_access: boolean;
}

/**
 * Response for GET /games/{id}/faqs
 */
export interface GameFAQsResponse {
  faqs: GameFAQ[];
  game_id: string;
  language: Language;
  total: number;
}

/**
 * Error response from API
 */
export interface APIError {
  detail: string;
  error_code?: string;
}
