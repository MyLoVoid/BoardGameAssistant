import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, spacing } from '@/constants/theme';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    sender: 'assistant',
    content: 'Hola 👋 ¿Sobre qué juego necesitas ayuda?',
  },
];

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState('');

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
      content: 'Responderemos desde el backend RAG una vez habilitado.',
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
          placeholder="Escribe tu pregunta..."
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
        />
        <View style={styles.sendButton}>
          <PrimaryButton label="Enviar" onPress={handleSend} />
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
