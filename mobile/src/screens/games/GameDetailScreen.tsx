import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenContainer from '@/components/ScreenContainer';
import EmptyState from '@/components/EmptyState';
import type { GamesStackParamList } from '@/types/navigation';
import { mockGames } from '@/data/mockGames';
import { colors, spacing } from '@/constants/theme';

type Props = NativeStackScreenProps<GamesStackParamList, 'GameDetail'>;

const GameDetailScreen = ({ route }: Props) => {
  const { gameId } = route.params;

  const game = useMemo(() => mockGames.find((item) => item.id === gameId), [gameId]);

  if (!game) {
    return (
      <ScreenContainer>
        <EmptyState title="Juego no encontrado" description="Selecciona otro juego desde la lista." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <Text style={styles.title}>{game.name}</Text>
        <Text style={styles.subtitle}>BGG #{game.bggId}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Jugadores</Text>
        <Text style={styles.value}>
          {game.minPlayers} - {game.maxPlayers}
        </Text>

        <Text style={styles.label}>Duración</Text>
        <Text style={styles.value}>{game.playTime} minutos</Text>

        <Text style={styles.label}>Rating</Text>
        <Text style={styles.value}>{game.rating}</Text>

        <Text style={styles.label}>Idiomas</Text>
        <Text style={styles.value}>{game.languages.join(', ').toUpperCase()}</Text>
      </View>

      <EmptyState
        title="FAQs y Chat"
        description="Aquí se mostrarán FAQs filtradas por idioma y acceso al chat RAG cuando los endpoints estén listos (ABG-0005)."
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
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
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
});

export default GameDetailScreen;
