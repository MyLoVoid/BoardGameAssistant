// Core domain types matching backend models

export type UserRole = 'admin' | 'developer' | 'basic' | 'premium' | 'tester';
export type GameStatus = 'active' | 'beta' | 'hidden';
export type Language = 'es' | 'en';
export type DocumentStatus = 'pending' | 'uploading' | 'processing' | 'ready' | 'error';
export type DocumentSourceType = 'rulebook' | 'faq' | 'expansion' | 'quickstart' | 'reference' | 'other';
export type AIProvider = 'openai' | 'gemini' | 'claude';

// User
export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// App Section
export interface AppSection {
  id: string;
  key: string;
  name: string;
  description?: string;
  display_order: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Game
export interface Game {
  id: string;
  section_id: string;
  bgg_id?: number;
  name: string;
  description?: string;
  thumbnail_url?: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
  min_playtime?: number;
  max_playtime?: number;
  year_published?: number;
  bgg_rating?: number;
  bgg_weight?: number;
  status: GameStatus;
  last_synced_from_bgg_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GameListItem {
  id: string;
  name: string;
  thumbnail_url?: string;
  image_url?: string;
  bgg_id?: number;
  min_players?: number;
  max_players?: number;
  playing_time?: number;
  rating?: number;
  status: GameStatus;
  year_published?: number;
}

// FAQ
export interface FAQ {
  id: string;
  game_id: string;
  language: Language;
  question: string;
  answer: string;
  display_order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

// Game Document
export interface GameDocument {
  id: string;
  game_id: string;
  language: Language;
  source_type: DocumentSourceType;
  file_name: string;
  file_path?: string;
  file_size_bytes?: number;
  provider_name: AIProvider;
  provider_file_id?: string;
  vector_store_id?: string;
  status: DocumentStatus;
  error_message?: string;
  metadata?: Record<string, any>;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

// API Request/Response types

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
  };
}

export interface CreateGameRequest {
  section_id: string;
  name: string;
  status?: GameStatus;
  bgg_id?: number;
  min_players?: number;
  max_players?: number;
  playing_time?: number;
  rating?: number;
  thumbnail_url?: string;
  image_url?: string;
}

export interface UpdateGameRequest {
  name?: string;
  description?: string;
  status?: GameStatus;
  thumbnail_url?: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
  min_playtime?: number;
  max_playtime?: number;
}

export interface ImportFromBGGRequest {
  bgg_id: number;
  section_id: string;
  status?: GameStatus;
}

export interface CreateFAQRequest {
  language: Language;
  question: string;
  answer: string;
  display_order?: number;
  visible?: boolean;
}

export interface UpdateFAQRequest {
  question?: string;
  answer?: string;
  display_order?: number;
  visible?: boolean;
}

export interface CreateDocumentRequest {
  language: Language;
  source_type: DocumentSourceType;
  file_name: string;
  file_path?: string;
  provider_name: AIProvider;
  metadata?: Record<string, any>;
}

export interface ProcessKnowledgeRequest {
  document_ids: string[];
  force_reprocess?: boolean;
}

export interface ProcessKnowledgeResponse {
  processed: number;
  failed: number;
  results: Array<{
    document_id: string;
    status: 'success' | 'error';
    message?: string;
  }>;
}

// API Error
export interface APIError {
  detail: string;
  status?: number;
}

// List response with pagination (if needed in future)
export interface ListResponse<T> {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
}
