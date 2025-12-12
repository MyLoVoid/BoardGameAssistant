import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';

import ScreenContainer from '@/components/ScreenContainer';
import EmptyState from '@/components/EmptyState';
import { colors, spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useChatHistory, type ChatHistoryItem } from '@/hooks/useChatHistory';
import type { GamesStackParamList, MainTabParamList } from '@/types/navigation';

const formatTimestamp = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

type NavigationProps = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Chat'>,
  NativeStackNavigationProp<GamesStackParamList>
>;

const ChatScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { t } = useLanguage();
  const { sessions, isLoading, error, refetch } = useChatHistory();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleOpenSession = useCallback(
    (session: ChatHistoryItem) => {
      navigation.navigate('Games', {
        screen: 'GameChat',
        params: { gameId: session.gameId, gameName: session.gameName, sessionId: session.id },
      });
    },
    [navigation],
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('history.title')}</Text>
        <Text style={styles.subtitle}>{t('history.subtitle')}</Text>
      </View>

      {isLoading && sessions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('history.loading')}</Text>
        </View>
      ) : error ? (
        <EmptyState
          title={t('history.errorTitle')}
          description={error || t('errors.loadHistory')}
          actionText={t('common.retry')}
          onAction={refetch}
        />
      ) : sessions.length === 0 ? (
        <EmptyState
          title={t('history.emptyTitle')}
          description={t('history.emptyDescription')}
        />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => handleOpenSession(item)}>
              <View style={styles.cardHeader}>
                <Text style={styles.game}>{item.gameName}</Text>
                <Text style={styles.timestamp}>{formatTimestamp(item.lastActivityAt)}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={2}>
                {item.preview}
              </Text>
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
    lineHeight: 20,
  },
  cta: {
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
});

export default ChatScreen;
