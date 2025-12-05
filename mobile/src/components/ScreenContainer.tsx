import { ReactNode } from 'react';
import { ScrollView, View, StyleSheet, ViewStyle } from 'react-native';

import { colors, spacing } from '@/constants/theme';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

const ScreenContainer = ({ children, scroll = false, contentStyle }: Props) => {
  if (scroll) {
    return (
      <ScrollView style={styles.base} contentContainerStyle={[styles.inner, contentStyle]}>
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.base, styles.inner, contentStyle]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    padding: spacing.lg,
  },
});

export default ScreenContainer;
