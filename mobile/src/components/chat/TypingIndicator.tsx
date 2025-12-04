/**
 * TypingIndicator component
 * Animated indicator shown while AI is processing response
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors, spacing, radii } from '@/constants/theme';

const TypingIndicator = () => {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createAnimation = (value: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const animations = Animated.parallel([
      createAnimation(dot1Opacity, 0),
      createAnimation(dot2Opacity, 200),
      createAnimation(dot3Opacity, 400),
    ]);

    animations.start();

    return () => {
      animations.stop();
    };
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xs,
  },
});

export default TypingIndicator;
