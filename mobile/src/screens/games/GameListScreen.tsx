import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  const [query, setQuery] = useState('');

  const filteredGames = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return games;
    }
    return games.filter((game) => game.name_base.toLowerCase().includes(normalized));
  }, [games, query]);

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
        data={filteredGames}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('games.list.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('GameDetail', { gameId: item.id })}
          >
            <View style={styles.cardHeader}>
              {item.thumbnail_url ? (
                <Image
                  source={{ uri: item.thumbnail_url }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                  <Text style={styles.thumbnailInitial}>{item.name_base.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.cardContent}>
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
                {item.status === 'beta' && (
                  <Text style={styles.beta}>{t('games.list.betaBadge')}</Text>
                )}
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title={
              query
                ? t('games.list.searchEmptyTitle')
                : t('games.list.emptyTitle')
            }
            description={
              query
                ? t('games.list.searchEmptyDescription')
                : t('games.list.emptyDescription')
            }
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
  searchWrapper: {
    marginBottom: spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnailInitial: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 18,
  },
  cardContent: {
    flex: 1,
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
