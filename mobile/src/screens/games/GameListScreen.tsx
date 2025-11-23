import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenContainer from '@/components/ScreenContainer';
import { useAuth } from '@/hooks/useAuth';
import type { GamesStackParamList } from '@/types/navigation';
import { mockGames } from '@/data/mockGames';
import { colors, spacing } from '@/constants/theme';

type Props = NativeStackScreenProps<GamesStackParamList, 'GameList'>;

const GameListScreen = ({ navigation }: Props) => {
  const { user } = useAuth();

  const availableGames = useMemo(() => {
    if (!user) {
      return [];
    }
    if (user.role === 'tester' || user.role === 'admin' || user.role === 'developer') {
      return mockGames;
    }
    return mockGames.filter((game) => game.status === 'active');
  }, [user]);

  return (
    <ScreenContainer>
      <FlatList
        data={availableGames}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('GameDetail', { gameId: item.id })}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.minPlayers}-{item.maxPlayers} jugadores · {item.playTime} min
            </Text>
            <Text style={styles.rating}>BGG {item.rating}</Text>
            <Text style={styles.languages}>Idiomas: {item.languages.join(', ').toUpperCase()}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No tienes juegos disponibles con tu rol actual.</Text>
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
  languages: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

export default GameListScreen;
