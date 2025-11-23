/**
 * useGames hook
 * Fetches list of games from backend API
 */

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import * as gamesApi from '@/services/gamesApi';
import type { GameListItem, GameStatus } from '@/types/games';

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
  const [games, setGames] = useState<GameListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    // Only fetch if user is signed in and has token
    if (!token) {
      setGames([]);
      setIsLoading(false);
      setError('No authentication token');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('useGames fetching with token?', Boolean(token));
      const response = await gamesApi.getGames(token, statusFilter);
      console.log('useGames received', response.games.length, 'games');
      setGames(response.games);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load games';
      setError(errorMessage);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, statusFilter]);

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
