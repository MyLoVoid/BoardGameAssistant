/**
 * useGameDetail hook
 * Fetches detailed game information and FAQs from backend API
 */

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import * as gamesApi from '@/services/gamesApi';
import type { Game, GameFAQ } from '@/types/games';
import { useLanguage } from '@/context/LanguageContext';

interface UseGameDetailState {
  game: Game | null;
  faqs: GameFAQ[];
  hasFaqAccess: boolean;
  hasChatAccess: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch game details and FAQs from backend
 *
 * @param gameId - Game UUID
 * @returns Game details, FAQs, access flags, loading state, error, and refetch function
 */
export function useGameDetail(gameId: string): UseGameDetailState {
  const { token } = useAuth();
  const { language, t } = useLanguage();
  const [game, setGame] = useState<Game | null>(null);
  const [faqs, setFaqs] = useState<GameFAQ[]>([]);
  const [hasFaqAccess, setHasFaqAccess] = useState(false);
  const [hasChatAccess, setHasChatAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGameDetail = useCallback(async () => {
    // Only fetch if user is signed in and has token
    if (!token) {
      setGame(null);
      setFaqs([]);
      setIsLoading(false);
      setError(t('errors.noToken'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch game details
      const gameResponse = await gamesApi.getGameDetail(token, gameId);
      setGame(gameResponse.game);
      setHasFaqAccess(gameResponse.has_faq_access);
      setHasChatAccess(gameResponse.has_chat_access);

      // Fetch FAQs if user has access
      if (gameResponse.has_faq_access) {
        try {
          const faqsResponse = await gamesApi.getGameFAQs(token, gameId, language);
          setFaqs(faqsResponse.faqs);
        } catch (faqError) {
          console.warn('Failed to load FAQs:', faqError);
          setFaqs([]);
        }
      } else {
        setFaqs([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('errors.loadGameDetail');
      setError(errorMessage || t('errors.loadGameDetail'));
      setGame(null);
      setFaqs([]);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, language, t, token]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchGameDetail();
  }, [fetchGameDetail]);

  return {
    game,
    faqs,
    hasFaqAccess,
    hasChatAccess,
    isLoading,
    error,
    refetch: fetchGameDetail,
  };
}
