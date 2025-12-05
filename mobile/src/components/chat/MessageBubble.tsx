/**
 * MessageBubble component
 * Displays a single chat message with role-based styling
 */

import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, radii } from '@/constants/theme';
import type { ChatMessage } from '@/types/chat';

interface Props {
  message: ChatMessage;
}

const MessageBubble = ({ message }: Props) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>

        {/* Citations if available */}
        {message.citations && message.citations.length > 0 && (
          <View style={styles.citationsContainer}>
            <Text style={styles.citationsTitle}>Sources:</Text>
            {message.citations.map((citation, index) => (
              <Text key={index} style={styles.citation}>
                {citation.document_name}
                {citation.page ? ` (p. ${citation.page})` : ''}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Timestamp */}
      {!isSystem && (
        <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-start',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: spacing.xs,
  },
  assistantBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: spacing.xs,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: colors.surface,
  },
  assistantText: {
    color: colors.text,
  },
  citationsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  citationsTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  citation: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  userTimestamp: {
    marginLeft: 0,
    marginRight: spacing.xs,
  },
});

export default MessageBubble;
