import { StyleSheet, Text, View } from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import PrimaryButton from '@/components/PrimaryButton';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing } from '@/constants/theme';

const ProfileScreen = () => {
  const { user, signOut, refreshProfile } = useAuth();

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>{user?.displayName ?? 'Invitado'}</Text>
        <Text style={styles.label}>Correo</Text>
        <Text style={styles.value}>{user?.email}</Text>

        <Text style={styles.label}>Rol</Text>
        <Text style={styles.value}>{user?.role}</Text>
      </View>

      <PrimaryButton label="Actualizar perfil" onPress={refreshProfile} />
      <PrimaryButton label="Cerrar sesión" onPress={signOut} style={styles.signOut} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  signOut: {
    marginTop: spacing.sm,
  },
});

export default ProfileScreen;
