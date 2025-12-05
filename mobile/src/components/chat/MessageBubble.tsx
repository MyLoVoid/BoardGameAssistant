/**
 * MessageBubble component
 * Displays a single chat message with role-based styling
 */

import { Platform, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

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
        {isUser ? (
          <Text style={[styles.text, styles.userText]}>
            {message.content}
          </Text>
        ) : (
          <Markdown
            style={isUser ? markdownUserStyles : markdownAssistantStyles}
          >
            {message.content}
          </Markdown>
        )}

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

// Markdown styles for assistant messages (dark theme)
const markdownAssistantStyles = StyleSheet.create({
  body: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  heading1: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  heading2: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  heading3: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  paragraph: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  strong: {
    color: colors.text,
    fontWeight: 'bold',
  },
  em: {
    color: colors.text,
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: colors.surface,
    color: colors.primaryMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  code_block: {
    backgroundColor: colors.surface,
    color: colors.primaryMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginVertical: spacing.xs,
  },
  fence: {
    backgroundColor: colors.surface,
    color: colors.primaryMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginVertical: spacing.xs,
  },
  bullet_list: {
    marginBottom: spacing.xs,
  },
  ordered_list: {
    marginBottom: spacing.xs,
  },
  list_item: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  blockquote: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
    marginVertical: spacing.xs,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  hr: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.sm,
  },
});

// Markdown styles for user messages (light text on primary background)
const markdownUserStyles = StyleSheet.create({
  body: {
    color: colors.surface,
    fontSize: 15,
    lineHeight: 20,
  },
  paragraph: {
    color: colors.surface,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  strong: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  em: {
    color: colors.surface,
    fontStyle: 'italic',
  },
});

export default MessageBubble;
