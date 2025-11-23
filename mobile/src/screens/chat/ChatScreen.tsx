import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import EmptyState from '@/components/EmptyState';
import { colors, spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

interface SessionPreview {
  id: string;
  game: string;
  updatedAt: string;
}

const baseSessions: SessionPreview[] = [
  {
    id: 'session-1',
    game: 'Gloomhaven',
    updatedAt: '2025-11-23T15:30:00.000Z',
  },
  {
    id: 'session-2',
    game: 'Terraforming Mars',
    updatedAt: '2025-11-22T19:45:00.000Z',
  },
];

const formatTimestamp = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const ChatScreen = () => {
  const { t } = useLanguage();
  const sessions = baseSessions.map((session) => ({
    ...session,
    preview: t('history.placeholder'),
  }));

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('history.title')}</Text>
        <Text style={styles.subtitle}>{t('history.subtitle')}</Text>
      </View>

      {sessions.length === 0 ? (
        <EmptyState
          title={t('history.emptyTitle')}
          description={t('history.emptyDescription')}
        />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <Pressable style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.game}>{item.game}</Text>
                <Text style={styles.timestamp}>{formatTimestamp(item.updatedAt)}</Text>
              </View>
              <Text style={styles.preview}>{item.preview}</Text>
              <Text style={styles.cta}>{t('history.open')}</Text>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
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
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  game: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: 12,
  },
  preview: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  cta: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ChatScreen;
