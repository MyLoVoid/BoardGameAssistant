import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import ScreenContainer from '@/components/ScreenContainer';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, spacing } from '@/constants/theme';
import type { MainTabParamList } from '@/types/navigation';
import { useLanguage } from '@/context/LanguageContext';

const HomeScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { t } = useLanguage();
  const sections = [
    {
      key: 'score',
      title: t('home.score.title'),
      description: t('home.score.description'),
      status: t('home.score.status'),
    },
  ];

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.title')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      </View>

      <View style={[styles.card, styles.ctaCard]}>
        <Text style={styles.cardTitle}>{t('home.cta.title')}</Text>
        <Text style={styles.cardDescription}>{t('home.cta.description')}</Text>
        <Text style={styles.tag}>{t('home.cta.status')}</Text>
        <PrimaryButton
          label={t('home.cta.button')}
          onPress={() => navigation.navigate('Games')}
          style={styles.ctaButton}
        />
      </View>

      <Text style={styles.sectionTitle}>{t('home.sectionTitle')}</Text>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <Text style={styles.tag}>{item.status}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        scrollEnabled={false}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    color: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    fontWeight: '600',
  },
  ctaCard: {
    marginBottom: spacing.lg,
  },
  ctaButton: {
    marginTop: spacing.md,
  },
});

export default HomeScreen;
