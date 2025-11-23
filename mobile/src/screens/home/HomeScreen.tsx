import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import ScreenContainer from '@/components/ScreenContainer';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, spacing } from '@/constants/theme';
import type { MainTabParamList } from '@/types/navigation';

const sections = [
  {
    key: 'bgc',
    title: 'Board Game Companion',
    description: 'FAQs, helper GenAI y reglas rápidas para cada juego.',
    status: 'En curso',
  },
  {
    key: 'score',
    title: 'Score Helpers',
    description: 'Planificado para fases siguientes con trackers por juego.',
    status: 'Planificado',
  },
];

const HomeScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenido a BGAI</Text>
        <Text style={styles.subtitle}>
          Consulta juegos disponibles, FAQs y prepara la integración con el backend ya operativo.
        </Text>
      </View>

      <PrimaryButton label="Explorar juegos" onPress={() => navigation.navigate('Games')} />

      <Text style={styles.sectionTitle}>Secciones</Text>
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
});

export default HomeScreen;
