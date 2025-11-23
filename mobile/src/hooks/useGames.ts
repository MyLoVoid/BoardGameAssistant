/**
 * useGames hook
 * Fetches list of games from backend API
 */

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import * as gamesApi from '@/services/gamesApi';
import type { GameListItem, GameStatus } from '@/types/games';
import { useLanguage } from '@/context/LanguageContext';

interface UseGamesState {
  games: GameListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch list of games from backend
 *
 * @param statusFilter - Optional status filter (active, beta, hidden)
 * @returns Games list, loading state, error, and refetch function
 */
export function useGames(statusFilter?: GameStatus): UseGamesState {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [games, setGames] = useState<GameListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    // Only fetch if user is signed in and has token
    if (!token) {
      setGames([]);
      setIsLoading(false);
      setError(t('errors.noToken'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await gamesApi.getGames(token, statusFilter);
      setGames(response.games);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('errors.loadGames');
      setError(errorMessage || t('errors.loadGames'));
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, t, token]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return {
    games,
    isLoading,
    error,
    refetch: fetchGames,
  };
}
