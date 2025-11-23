import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenContainer from '@/components/ScreenContainer';
import EmptyState from '@/components/EmptyState';
import { useGames } from '@/hooks/useGames';
import type { GamesStackParamList } from '@/types/navigation';
import { colors, spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

type Props = NativeStackScreenProps<GamesStackParamList, 'GameList'>;

const GameListScreen = ({ navigation }: Props) => {
  const { games, isLoading, error, refetch } = useGames();
  const { t } = useLanguage();

  if (isLoading && games.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('games.list.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState
          title={t('games.list.errorTitle')}
          description={error || t('errors.loadGames')}
          actionText={t('common.retry')}
          onAction={refetch}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('GameDetail', { gameId: item.id })}
          >
            <Text style={styles.name}>{item.name_base}</Text>
            {item.min_players !== null && item.max_players !== null && (
              <Text style={styles.meta}>
                {t('games.list.playersRange', {
                  min: item.min_players,
                  max: item.max_players,
                })}
                {item.playing_time !== null &&
                  t('games.list.duration', { minutes: item.playing_time })}
              </Text>
            )}
            {item.rating !== null && (
              <Text style={styles.rating}>BGG {item.rating.toFixed(1)}</Text>
            )}
            {item.status === 'beta' && <Text style={styles.beta}>{t('games.list.betaBadge')}</Text>}
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title={t('games.list.emptyTitle')}
            description={t('games.list.emptyDescription')}
          />
        }
      />
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
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  rating: {
    color: colors.primaryMuted,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  beta: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});

export default GameListScreen;
