/**
 * GameChatScreen
 * AI-powered chat interface for game-specific questions
 */

import { useEffect, useRef } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import EmptyState from '@/components/EmptyState';
import { useChatSession } from '@/hooks/useChatSession';
import type { GamesStackParamList } from '@/types/navigation';
import { colors, spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

type Props = NativeStackScreenProps<GamesStackParamList, 'GameChat'>;

const GameChatScreen = ({ route, navigation }: Props) => {
  const { gameId, gameName, sessionId: existingSessionId } = route.params;
  const { t } = useLanguage();
  const { messages, isLoading, error, sendMessage } = useChatSession(gameId, existingSessionId);
  const flatListRef = useRef<FlatList>(null);

  // Set screen title to game name
  useEffect(() => {
    navigation.setOptions({
      title: gameName,
    });
  }, [gameName, navigation]);

  // Show error alert if message sending fails
  useEffect(() => {
    if (error) {
      Alert.alert(t('chat.errorTitle'), error, [{ text: t('common.retry') }]);
    }
  }, [error, t]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Scroll to bottom when keyboard appears
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleSendMessage = async (question: string) => {
    await sendMessage(question);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {messages.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title={t('chat.title')}
            description={t('chat.welcome')}
          />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListFooterComponent={isLoading ? <TypingIndicator /> : null}
        />
      )}

      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
        placeholder={t('chat.inputPlaceholder')}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  messageList: {
    paddingVertical: spacing.md,
  },
});

export default GameChatScreen;
