import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenContainer from '@/components/ScreenContainer';
import EmptyState from '@/components/EmptyState';
import { useGameDetail } from '@/hooks/useGameDetail';
import type { GamesStackParamList } from '@/types/navigation';
import { colors, spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

type Props = NativeStackScreenProps<GamesStackParamList, 'GameDetail'>;

const GameDetailScreen = ({ route, navigation }: Props) => {
  const { gameId } = route.params;
  const { t, language } = useLanguage();
  const languageLabel =
    language === 'es' ? t('common.language.es') : t('common.language.en');
  const { game, faqs, hasFaqAccess, hasChatAccess, isLoading, error, refetch } =
    useGameDetail(gameId);

  useEffect(() => {
    navigation.setOptions({
      title: game?.name_base ?? t('tabs.games'),
    });
  }, [game?.name_base, navigation, t]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('games.detail.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !game) {
    return (
      <ScreenContainer>
        <EmptyState
          title={t('games.detail.errorTitle')}
          description={error || t('games.detail.errorDescription')}
          actionText={t('common.retry')}
          onAction={refetch}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
        {/* Game Info Card */}
        <View style={styles.card}>
          <Text style={styles.label}>{t('games.detail.generalInfo')}</Text>
          {game.min_players !== null && game.max_players !== null && (
            <>
              <Text style={styles.label}>{t('games.detail.players')}</Text>
              <Text style={styles.value}>
                {game.min_players} - {game.max_players}
              </Text>
            </>
          )}

          {game.playing_time !== null && (
            <>
              <Text style={styles.label}>{t('games.detail.duration')}</Text>
              <Text style={styles.value}>
                {game.playing_time} {t('games.detail.durationUnit')}
              </Text>
            </>
          )}

          {game.rating !== null && (
            <>
              <Text style={styles.label}>{t('games.detail.rating')}</Text>
              <Text style={styles.value}>{game.rating.toFixed(2)}</Text>
            </>
          )}

          {game.bgg_id !== null && (
            <>
              <Text style={styles.label}>{t('games.detail.bggId')}</Text>
              <Text style={styles.value}>#{game.bgg_id}</Text>
            </>
          )}

          <Text style={styles.label}>{t('games.detail.statusLabel')}</Text>
          <Text style={styles.value}>
            {t(
              `games.detail.status.${game.status}` as
                | 'games.detail.status.active'
                | 'games.detail.status.beta'
                | 'games.detail.status.hidden',
            )}
          </Text>
        </View>

        {/* FAQs Section */}
        {hasFaqAccess ? (
          <>
            <Text style={styles.sectionTitle}>
              {t('games.detail.faqTitle', { language: languageLabel })}
            </Text>
            {faqs.length > 0 ? (
              faqs.map((faq) => (
                <View key={faq.id} style={styles.faqCard}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </View>
              ))
            ) : (
              <EmptyState
                title={t('games.detail.faqEmptyTitle')}
                description={t('games.detail.faqEmptyDescription', { language: languageLabel })}
              />
            )}
          </>
        ) : (
          <EmptyState
            title={t('games.detail.faqRestrictedTitle')}
            description={t('games.detail.faqRestrictedDescription')}
          />
        )}

        {/* Chat Access Card */}
        {hasChatAccess && (
          <Pressable
            style={styles.chatCard}
            onPress={() =>
              navigation.navigate('GameChat', {
                gameId: game.id,
                gameName: game.name_base,
              })
            }
          >
            <Text style={styles.chatIcon}>💬</Text>
            <View style={styles.chatContent}>
              <Text style={styles.chatTitle}>{t('games.detail.openChat')}</Text>
              <Text style={styles.chatDescription}>{t('games.detail.chatDescription')}</Text>
            </View>
          </Pressable>
        )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  card: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  faqCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  faqQuestion: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  faqAnswer: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  chatCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  chatContent: {
    flex: 1,
  },
  chatTitle: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  chatDescription: {
    color: colors.surface,
    fontSize: 14,
    opacity: 0.9,
  },
});

export default GameDetailScreen;
