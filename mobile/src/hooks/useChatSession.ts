/**
 * useChatSession hook
 * Manages chat session state and message exchange with AI
 */

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import * as chatApi from '@/services/chatApi';
import type { ChatMessage, Citation } from '@/types/chat';
import { supabase } from '@/services/supabase';

const normalizeCitations = (citations: unknown[]): Citation[] =>
  citations
    .map((citation) => {
      if (!citation || typeof citation !== 'object') {
        return null;
      }

      const value = citation as Record<string, unknown>;
      const documentName = typeof value.document_name === 'string' ? value.document_name : undefined;
      const documentTitle = typeof value.document_title === 'string' ? value.document_title : undefined;
      const excerpt = typeof value.excerpt === 'string' ? value.excerpt : undefined;
      const page = typeof value.page === 'number' ? value.page : undefined;

      if (!documentName && !documentTitle && !excerpt) {
        return null;
      }

      return {
        ...(documentName ? { document_name: documentName } : {}),
        ...(documentTitle ? { document_title: documentTitle } : {}),
        ...(excerpt ? { excerpt } : {}),
        ...(page !== undefined ? { page } : {}),
      } satisfies Citation;
    })
    .filter((citation): citation is Citation => Boolean(citation));

interface UseChatSessionState {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (question: string) => Promise<void>;
  clearChat: () => void;
}

/**
 * Hook to manage chat session with AI assistant
 *
 * @param gameId - Game UUID for context
 * @param initialSessionId - Optional existing session to resume
 * @returns Chat state and functions to send messages and clear chat
 */
export function useChatSession(gameId: string, initialSessionId?: string): UseChatSessionState {
  const { token } = useAuth();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Hydrate existing session messages from Supabase
   */
  const loadHistory = useCallback(async () => {
    type SupabaseMessage = {
      id: string;
      sender: string;
      content: string;
      created_at: string;
      metadata?: { citations?: unknown[] } | null;
    };

    if (!initialSessionId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('chat_messages')
        .select('id, sender, content, metadata, created_at')
        .eq('session_id', initialSessionId)
        .order('created_at', { ascending: true });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const history: ChatMessage[] =
        (data as SupabaseMessage[] | null)?.map((msg) => ({
          id: msg.id,
          role: msg.sender as ChatMessage['role'],
          content: msg.content,
          timestamp: msg.created_at,
          ...(Array.isArray(msg.metadata?.citations)
            ? { citations: normalizeCitations(msg.metadata.citations) }
            : {}),
        })) ?? [];

      setMessages(history);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load history';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [initialSessionId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /**
   * Send a message to the AI assistant
   */
  const sendMessage = useCallback(
    async (question: string) => {
      if (!token) {
        setError('Authentication required');
        return;
      }

      if (!question.trim()) {
        return;
      }

      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: question.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        // Send request to backend
        const response = await chatApi.sendChatMessage(token, {
          game_id: gameId,
          question: question.trim(),
          language,
          session_id: sessionId || undefined,
        });

        // Update session ID if new
        if (response.session_id && response.session_id !== sessionId) {
          setSessionId(response.session_id);
        }

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          timestamp: new Date().toISOString(),
          ...(response.citations?.length ? { citations: response.citations } : {}),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);

        // Remove user message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
      } finally {
        setIsLoading(false);
      }
    },
    [gameId, language, sessionId, token],
  );

  /**
   * Clear all messages and reset session
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  return {
    messages,
    sessionId,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}
