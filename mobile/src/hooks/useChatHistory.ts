/**
 * useChatHistory hook
 * Retrieves chat sessions from Supabase and exposes a simplified list for the History tab
 */

import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';

export interface ChatHistoryItem {
  id: string;
  gameId: string;
  gameName: string;
  lastActivityAt: string;
  preview: string;
  totalMessages: number;
}

interface SupabaseChatSession {
  id: string;
  game_id: string;
  language: string;
  last_activity_at: string;
  total_messages: number;
  games?: {
    name_base?: string | null;
  } | {
    name_base?: string | null;
  }[] | null;
  chat_messages?: {
    content: string;
    sender: string;
    created_at: string;
  }[];
}

interface UseChatHistoryState {
  sessions: ChatHistoryItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch chat sessions for the signed-in user.
 *
 * Uses Supabase RLS to scope results to the current user and limits messages to the latest
 * entry per session so we can show a preview in the History tab.
 */
export function useChatHistory(): UseChatHistoryState {
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const [sessions, setSessions] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    // Only attempt to load history when the user is signed in
    if (!isAuthenticated) {
      setSessions([]);
      setIsLoading(false);
      setError(t('errors.noToken'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('chat_sessions')
        .select(
          'id, game_id, language, last_activity_at, total_messages, games(name_base), chat_messages(content,sender, created_at)',
        )
        // Show all non-deleted sessions regardless of language
        .in('status', ['active', 'closed', 'archived'])
        .order('last_activity_at', { ascending: false })
        .order('created_at', { foreignTable: 'chat_messages', ascending: false })
        .limit(1, { foreignTable: 'chat_messages' });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const normalized = (data ?? ([] as SupabaseChatSession[])).map((session) => {
        const lastMessage = session.chat_messages?.[0];
        const gameRecord = Array.isArray(session.games)
          ? session.games[0]
          : session.games;

        return {
          id: session.id,
          gameId: session.game_id,
          gameName: gameRecord?.name_base ?? t('history.unknownGame'),
          lastActivityAt: session.last_activity_at,
          preview: lastMessage?.content ?? t('history.placeholder'),
          totalMessages: session.total_messages ?? 0,
        };
      });

      setSessions(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errors.loadHistory');
      setError(message || t('errors.loadHistory'));
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, language, t]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    sessions,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}
