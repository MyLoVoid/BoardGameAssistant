import { StyleSheet, Text } from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import EmptyState from '@/components/EmptyState';
import { colors } from '@/constants/theme';

const ForgotPasswordScreen = () => (
  <ScreenContainer>
    <Text style={styles.title}>Recupera tu acceso</Text>
    <EmptyState
      title="Pendiente de Supabase Auth"
      description="Habilitaremos el envío de magic links en cuanto configuremos supabase.auth.admin. Por ahora, solicita un reset manual al equipo."
    />
  </ScreenContainer>
);

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
});

export default ForgotPasswordScreen;
