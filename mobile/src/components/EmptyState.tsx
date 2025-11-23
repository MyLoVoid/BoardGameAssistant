import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

interface Props {
  title: string;
  description?: string;
}

const EmptyState = ({ title, description }: Props) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
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
});

export default EmptyState;
