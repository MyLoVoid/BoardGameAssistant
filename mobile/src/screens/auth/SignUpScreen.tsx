import { StyleSheet, Text } from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import EmptyState from '@/components/EmptyState';
import { colors } from '@/constants/theme';

const SignUpScreen = () => (
  <ScreenContainer>
    <Text style={styles.title}>Registrarse</Text>
    <EmptyState
      title="Flujo pendiente"
      description="La creación de cuentas se completará cuando integremos Supabase Auth. Utiliza las cuentas seed descritas en docs/BGA-0001."
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

export default SignUpScreen;
