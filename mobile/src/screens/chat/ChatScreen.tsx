import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
}

const ChatScreen = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      content: t('chat.initialMessage'),
    },
  ]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === 'assistant') {
        return [{ ...prev[0], content: t('chat.initialMessage') }];
      }
      return prev;
    });
  }, [t]);

  const handleSend = () => {
    if (!draft.trim()) {
      return;
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: draft.trim(),
    };
    const assistantMessage: Message = {
      id: `${Date.now()}-assistant`,
      sender: 'assistant',
      content: t('chat.pendingResponse'),
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setDraft('');
  };

  return (
    <ScreenContainer>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.sender === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={styles.bubbleText}>{item.content}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
        />
        <View style={styles.sendButton}>
          <PrimaryButton label={t('chat.send')} onPress={handleSend} />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  bubble: {
    padding: spacing.md,
    borderRadius: 16,
    maxWidth: '80%',
    marginBottom: spacing.sm,
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
  },
  bubbleText: {
    color: colors.text,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  sendButton: {
    marginLeft: spacing.sm,
  },
});

export default ChatScreen;
