import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

const TextField = forwardRef<TextInput, Props>(({ label, error, style, ...rest }, ref) => (
  <View style={styles.container}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <TextInput
      ref={ref}
      placeholderTextColor={colors.textMuted}
      style={[styles.input, style]}
      {...rest}
    />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
));

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  error: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: 12,
  },
});

export default TextField;
