/**
 * useChatSession hook
 * Manages chat session state and message exchange with AI
 */

import { useCallback, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import * as chatApi from '@/services/chatApi';
import type { ChatMessage } from '@/types/chat';

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
 * @returns Chat state and functions to send messages and clear chat
 */
export function useChatSession(gameId: string): UseChatSessionState {
  const { token } = useAuth();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          citations: response.citations,
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
