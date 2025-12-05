import axios, { AxiosError, AxiosInstance } from 'axios';
import { supabase } from './supabase';
import type {
  Game,
  GameListItem,
  FAQ,
  GameDocument,
  AppSection,
  CreateGameRequest,
  UpdateGameRequest,
  ImportFromBGGRequest,
  CreateFAQRequest,
  UpdateFAQRequest,
  UploadDocumentRequest,
  ProcessKnowledgeRequest,
  ProcessKnowledgeResponse,
  APIError,
  GameStatus,
  Language,
  DocumentStatus,
  DocumentSourceType,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

type ApiGameListItem = {
  id: string;
  name?: string | null;
  name_base?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  bgg_id?: number | null;
  min_players?: number | null;
  max_players?: number | null;
  playing_time?: number | null;
  rating?: number | null;
  status: GameStatus;
  year_published?: number | null;
};

type ApiGame = {
  id: string;
  section_id: string;
  name_base: string;
  description?: string | null;
  bgg_id?: number | null;
  min_players?: number | null;
  max_players?: number | null;
  playing_time?: number | null;
  rating?: number | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  status: GameStatus;
  last_synced_from_bgg_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type GameDetailApiResponse = {
  game: ApiGame;
  has_faq_access: boolean;
  has_chat_access: boolean;
};

type ImportFromBGGApiResponse = {
  game: ApiGame;
  action: string;
  synced_at: string;
  source: string;
};

type ApiFAQ = {
  id: string;
  game_id: string;
  language: Language;
  question: string;
  answer: string;
  display_order: number;
  visible: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type ApiGameDocument = {
  id: string;
  game_id: string;
  title: string;
  language: Language;
  source_type: DocumentSourceType;
  file_name: string;
  file_path?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  provider_file_id?: string | null;
  vector_store_id?: string | null;
  status: DocumentStatus;
  metadata?: Record<string, any> | null;
  error_message?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  processed_at?: string | null;
  uploaded_at?: string | null;
};

type GameFAQsApiResponse = {
  faqs: ApiFAQ[];
  game_id: string;
  language: Language;
  total: number;
};

export type ApiClientError = Error & { status?: number };

class APIClient {
  private client: AxiosInstance;

  private mapGame(game: ApiGame): Game {
    return {
      id: game.id,
      section_id: game.section_id,
      bgg_id: game.bgg_id ?? undefined,
      name: game.name_base,
      description: game.description ?? undefined,
      thumbnail_url: game.thumbnail_url ?? undefined,
      image_url: game.image_url ?? undefined,
      min_players: game.min_players ?? undefined,
      max_players: game.max_players ?? undefined,
      min_playtime: game.playing_time ?? undefined,
      max_playtime: game.playing_time ?? undefined,
      year_published: undefined,
      bgg_rating: game.rating ?? undefined,
      bgg_weight: undefined,
      status: game.status,
      last_synced_from_bgg_at: game.last_synced_from_bgg_at ?? undefined,
      created_at: game.created_at ?? '',
      updated_at: game.updated_at ?? '',
    };
  }

  private normalizeGameListItem(game: ApiGameListItem): GameListItem {
    return {
      id: game.id,
      thumbnail_url: game.thumbnail_url ?? undefined,
      image_url: game.image_url ?? undefined,
      bgg_id: game.bgg_id ?? undefined,
      name: game.name ?? game.name_base ?? 'Untitled game',
      description: game.description ?? undefined,
      min_players: game.min_players ?? undefined,
      max_players: game.max_players ?? undefined,
      playing_time: game.playing_time ?? undefined,
      rating: game.rating ?? undefined,
      status: game.status,
      year_published: game.year_published ?? undefined,
    };
  }

  private mapGameDocument(doc: ApiGameDocument): GameDocument {
    return {
      id: doc.id,
      game_id: doc.game_id,
      title: doc.title,
      language: doc.language,
      source_type: doc.source_type,
      file_name: doc.file_name,
      file_path: doc.file_path ?? undefined,
      file_size: doc.file_size ?? undefined,
      file_type: doc.file_type ?? undefined,
      provider_file_id: doc.provider_file_id ?? undefined,
      vector_store_id: doc.vector_store_id ?? undefined,
      status: doc.status,
      metadata: doc.metadata ?? undefined,
      error_message: doc.error_message ?? undefined,
      created_at: doc.created_at ?? '',
      updated_at: doc.updated_at ?? '',
      processed_at: doc.processed_at ?? undefined,
      uploaded_at: doc.uploaded_at ?? undefined,
    };
  }

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          config.headers.Authorization = `Bearer ${data.session.access_token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<APIError>) => {
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: AxiosError<APIError>): ApiClientError {
    const statusCode = error.response?.status;
    // If server returned a structured API error, prefer that detail
    if (error.response?.data?.detail) {
      const err = new Error(error.response.data.detail) as ApiClientError;
      if (statusCode) err.status = statusCode;
      return err;
    }

    // Network errors (no response) are common during local dev - provide actionable hint
    if (!error.response) {
      const code = (error as any).code ?? 'UNKNOWN';
      const err = new Error(
        `Network Error: could not reach API at ${API_BASE_URL} (${code}).`
      ) as ApiClientError;
      if (statusCode) err.status = statusCode;
      return err;
    }

    const err = new Error(error.message || 'An unexpected error occurred') as ApiClientError;
    if (statusCode) err.status = statusCode;
    return err;
  }

  // ============================================
  // Games API
  // ============================================

  async getGames(): Promise<GameListItem[]> {
    type GamesListResponse = {
      games: ApiGameListItem[];
      total: number;
    };

    const response = await this.client.get<GamesListResponse>('/games');
    return response.data.games.map((game) => this.normalizeGameListItem(game));
  }

  async getGame(id: string): Promise<Game> {
    const response = await this.client.get<GameDetailApiResponse>(`/games/${id}`);
    return this.mapGame(response.data.game);
  }

  async createGame(data: CreateGameRequest): Promise<Game> {
    const payload: Record<string, unknown> = {
      section_id: data.section_id,
      name_base: data.name,
      status: data.status || 'active',
    };

    if (data.description !== undefined) {
      payload.description = data.description;
    }

    if (data.bgg_id !== undefined) {
      payload.bgg_id = data.bgg_id;
    }
    if (data.min_players !== undefined) {
      payload.min_players = data.min_players;
    }
    if (data.max_players !== undefined) {
      payload.max_players = data.max_players;
    }
    if (data.playing_time !== undefined) {
      payload.playing_time = data.playing_time;
    }
    if (data.rating !== undefined) {
      payload.rating = data.rating;
    }
    if (data.thumbnail_url !== undefined) {
      payload.thumbnail_url = data.thumbnail_url;
    }
    if (data.image_url !== undefined) {
      payload.image_url = data.image_url;
    }

    const response = await this.client.post<ApiGame>('/admin/games', payload);
    return this.mapGame(response.data);
  }

  async updateGame(id: string, data: UpdateGameRequest): Promise<Game> {
    const payload: Record<string, unknown> = {};

    if (data.name !== undefined) {
      payload.name_base = data.name;
    }
    if (data.description !== undefined) {
      payload.description = data.description;
    }
    if (data.status) {
      payload.status = data.status;
    }
    if (data.thumbnail_url !== undefined) {
      payload.thumbnail_url = data.thumbnail_url;
    }
    if (data.image_url !== undefined) {
      payload.image_url = data.image_url;
    }
    if (data.min_players !== undefined) {
      payload.min_players = data.min_players;
    }
    if (data.max_players !== undefined) {
      payload.max_players = data.max_players;
    }
    const playingTime = data.max_playtime ?? data.min_playtime;
    if (playingTime !== undefined) {
      payload.playing_time = playingTime;
    }

    if (Object.keys(payload).length === 0) {
      throw new Error('No fields provided to update');
    }

    const response = await this.client.patch<ApiGame>(`/admin/games/${id}`, payload);
    return this.mapGame(response.data);
  }

  async importFromBGG(data: ImportFromBGGRequest): Promise<Game> {
    const response = await this.client.post<ImportFromBGGApiResponse>(
      '/admin/games/import-bgg',
      data
    );
    return this.mapGame(response.data.game);
  }

  async syncGameFromBGG(id: string): Promise<Game> {
    const response = await this.client.post<ApiGame>(`/admin/games/${id}/sync-bgg`);
    return this.mapGame(response.data);
  }

  // ============================================
  // FAQs API
  // ============================================

  async getGameFAQs(gameId: string, language?: Language): Promise<FAQ[]> {
    const params = language ? { lang: language } : {};
    const response = await this.client.get<GameFAQsApiResponse>(`/games/${gameId}/faqs`, {
      params,
    });
    return response.data.faqs.map((faq) => ({
      id: faq.id,
      game_id: faq.game_id,
      language: faq.language,
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order,
      visible: faq.visible,
      created_at: faq.created_at ?? '',
      updated_at: faq.updated_at ?? '',
    }));
  }

  async createFAQ(gameId: string, data: CreateFAQRequest): Promise<FAQ> {
    const response = await this.client.post<FAQ>(`/admin/games/${gameId}/faqs`, data);
    return response.data;
  }

  async updateFAQ(gameId: string, faqId: string, data: UpdateFAQRequest): Promise<FAQ> {
    const response = await this.client.patch<FAQ>(
      `/admin/games/${gameId}/faqs/${faqId}`,
      data
    );
    return response.data;
  }

  async deleteFAQ(gameId: string, faqId: string): Promise<void> {
    await this.client.delete(`/admin/games/${gameId}/faqs/${faqId}`);
  }

  // ============================================
  // Documents API
  // ============================================

  async getGameDocuments(gameId: string, language?: string): Promise<GameDocument[]> {
    const params = language ? { lang: language } : {};
    const response = await this.client.get<ApiGameDocument[]>(
      `/admin/games/${gameId}/documents`,
      { params }
    );
    return response.data.map((doc) => this.mapGameDocument(doc));
  }

  async createDocument(gameId: string, data: UploadDocumentRequest): Promise<GameDocument> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('language', data.language);
    formData.append('source_type', data.source_type);
    formData.append('file', data.file);

    const response = await this.client.post<ApiGameDocument>(
      `/admin/games/${gameId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return this.mapGameDocument(response.data);
  }

  async deleteDocument(gameId: string, documentId: string): Promise<void> {
    await this.client.delete(`/admin/games/${gameId}/documents/${documentId}`);
  }

  async processKnowledge(
    gameId: string,
    data: ProcessKnowledgeRequest
  ): Promise<ProcessKnowledgeResponse> {
    const response = await this.client.post<ProcessKnowledgeResponse>(
      `/admin/games/${gameId}/process-knowledge`,
      data
    );
    return response.data;
  }

  // ============================================
  // Sections API (for game creation)
  // ============================================

  async getSections(): Promise<AppSection[]> {
    type SectionsResponse = { sections: ApiSection[]; total: number };
    type ApiSection = {
      id: string;
      key: string;
      name: string;
      description?: string | null;
      display_order: number;
      enabled: boolean;
    };

    const response = await this.client.get<SectionsResponse>('/sections');
    return response.data.sections.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      description: s.description ?? undefined,
      display_order: s.display_order,
      enabled: s.enabled,
      created_at: '',
      updated_at: '',
    } as AppSection));
  }
}

// Export singleton instance
export const apiClient = new APIClient();
