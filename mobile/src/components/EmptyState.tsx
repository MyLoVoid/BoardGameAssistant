import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

interface Props {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState = ({ title, description, actionText, onAction }: Props) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
    {actionText && onAction ? (
      <Pressable style={styles.button} onPress={onAction}>
        <Text style={styles.buttonText}>{actionText}</Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  description: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default EmptyState;
