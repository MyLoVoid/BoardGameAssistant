import { Pressable, StyleSheet, Text, ViewStyle, View } from 'react-native';
import { ReactNode } from 'react';

import { colors, radii, spacing } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  leadingIcon?: ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
}

const PrimaryButton = ({ label, onPress, leadingIcon, style, disabled }: Props) => (
  <Pressable
    style={({ pressed }) => [
      styles.base,
      style,
      pressed && styles.pressed,
      disabled && styles.disabled,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    {leadingIcon ? <View style={styles.icon}>{leadingIcon}</View> : null}
    <Text style={styles.text}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    backgroundColor: colors.primaryMuted,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: spacing.sm,
  },
});

export default PrimaryButton;
