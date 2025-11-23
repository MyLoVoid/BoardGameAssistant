import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenContainer from '@/components/ScreenContainer';
import EmptyState from '@/components/EmptyState';
import { useGameDetail } from '@/hooks/useGameDetail';
import type { GamesStackParamList } from '@/types/navigation';
import type { Language } from '@/types/games';
import { colors, spacing } from '@/constants/theme';

type Props = NativeStackScreenProps<GamesStackParamList, 'GameDetail'>;

const GameDetailScreen = ({ route }: Props) => {
  const { gameId } = route.params;
  const [language] = useState<Language>('es'); // TODO: Get from app settings/i18n
  const { game, faqs, hasFaqAccess, hasChatAccess, isLoading, error, refetch } = useGameDetail(
    gameId,
    language,
  );

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando detalles...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !game) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Error al cargar el juego"
          description={error || 'Juego no encontrado'}
          actionText="Reintentar"
          onAction={refetch}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{game.name_base}</Text>
        {game.bgg_id !== null && <Text style={styles.subtitle}>BGG #{game.bgg_id}</Text>}
      </View>

        {/* Game Info Card */}
        <View style={styles.card}>
          {game.min_players !== null && game.max_players !== null && (
            <>
              <Text style={styles.label}>Jugadores</Text>
              <Text style={styles.value}>
                {game.min_players} - {game.max_players}
              </Text>
            </>
          )}

          {game.playing_time !== null && (
            <>
              <Text style={styles.label}>Duración</Text>
              <Text style={styles.value}>{game.playing_time} minutos</Text>
            </>
          )}

          {game.rating !== null && (
            <>
              <Text style={styles.label}>Rating</Text>
              <Text style={styles.value}>{game.rating.toFixed(2)}</Text>
            </>
          )}

          <Text style={styles.label}>Estado</Text>
          <Text style={styles.value}>
            {game.status === 'active' ? 'Activo' : game.status === 'beta' ? 'Beta' : 'Oculto'}
          </Text>
        </View>

        {/* FAQs Section */}
        {hasFaqAccess ? (
          <>
            <Text style={styles.sectionTitle}>
              Preguntas Frecuentes ({language.toUpperCase()})
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
                title="No hay FAQs disponibles"
                description={`No se encontraron preguntas frecuentes en ${language.toUpperCase()}.`}
              />
            )}
          </>
        ) : (
          <EmptyState
            title="FAQs no disponibles"
            description="Tu rol actual no tiene acceso a las preguntas frecuentes de este juego."
          />
        )}

        {/* Chat Access Info */}
        {hasChatAccess && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              ✅ Tienes acceso al chat de IA para este juego (próximamente)
            </Text>
          </View>
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
    marginTop: spacing.xs,
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
  infoCard: {
    backgroundColor: colors.successMuted,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  infoText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GameDetailScreen;
