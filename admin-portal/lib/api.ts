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
  CreateDocumentRequest,
  ProcessKnowledgeRequest,
  ProcessKnowledgeResponse,
  APIError,
  GameStatus,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

type ApiGameListItem = {
  id: string;
  name?: string | null;
  name_base?: string | null;
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

class APIClient {
  private client: AxiosInstance;

  private normalizeGameListItem(game: ApiGameListItem): GameListItem {
    return {
      id: game.id,
      thumbnail_url: game.thumbnail_url ?? undefined,
      image_url: game.image_url ?? undefined,
      bgg_id: game.bgg_id ?? undefined,
      name: game.name ?? game.name_base ?? 'Untitled game',
      min_players: game.min_players ?? undefined,
      max_players: game.max_players ?? undefined,
      playing_time: game.playing_time ?? undefined,
      rating: game.rating ?? undefined,
      status: game.status,
      year_published: game.year_published ?? undefined,
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

  private formatError(error: AxiosError<APIError>): Error {
    if (error.response?.data?.detail) {
      return new Error(error.response.data.detail);
    }
    return new Error(error.message || 'An unexpected error occurred');
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
    const response = await this.client.get<Game>(`/games/${id}`);
    return response.data;
  }

  async createGame(data: CreateGameRequest): Promise<Game> {
    const response = await this.client.post<Game>('/admin/games', data);
    return response.data;
  }

  async updateGame(id: string, data: UpdateGameRequest): Promise<Game> {
    const response = await this.client.patch<Game>(`/admin/games/${id}`, data);
    return response.data;
  }

  async importFromBGG(data: ImportFromBGGRequest): Promise<Game> {
    const response = await this.client.post<Game>('/admin/games/import-bgg', data);
    return response.data;
  }

  async syncGameFromBGG(id: string): Promise<Game> {
    const response = await this.client.post<Game>(`/admin/games/${id}/sync-bgg`);
    return response.data;
  }

  // ============================================
  // FAQs API
  // ============================================

  async getGameFAQs(gameId: string, language?: string): Promise<FAQ[]> {
    const params = language ? { lang: language } : {};
    const response = await this.client.get<FAQ[]>(`/games/${gameId}/faqs`, { params });
    return response.data;
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
    const response = await this.client.get<GameDocument[]>(
      `/admin/games/${gameId}/documents`,
      { params }
    );
    return response.data;
  }

  async createDocument(gameId: string, data: CreateDocumentRequest): Promise<GameDocument> {
    const response = await this.client.post<GameDocument>(
      `/admin/games/${gameId}/documents`,
      data
    );
    return response.data;
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
    const response = await this.client.get<AppSection[]>('/sections');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new APIClient();
