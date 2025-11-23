import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import type { Locale } from '@/localization/translations';

const OPTIONS: Locale[] = ['es', 'en'];

const LanguageSelector = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const active = option === language;
        return (
          <Pressable
            key={option}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => {
              void setLanguage(option);
            }}
          >
            <Text style={[styles.optionText, active && styles.optionTextActive]}>
              {t(option === 'es' ? 'common.language.es' : 'common.language.en')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.background,
  },
});

export default LanguageSelector;
