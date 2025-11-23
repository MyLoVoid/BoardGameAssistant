import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenContainer from '@/components/ScreenContainer';
import TextField from '@/components/TextField';
import PrimaryButton from '@/components/PrimaryButton';
import { useAuth } from '@/hooks/useAuth';
import type { AuthStackParamList } from '@/types/navigation';
import { colors, spacing } from '@/constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

const SignInScreen = ({ navigation }: Props) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async () => {
    try {
      setError(undefined);
      setLoading(true);
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <Text style={styles.title}>Board Game Assistant</Text>
      <Text style={styles.subtitle}>Inicia sesión con tu cuenta de Supabase</Text>

      <TextField
        label="Correo"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextField
        label="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        label={loading ? 'Ingresando...' : 'Ingresar'}
        onPress={handleSubmit}
        disabled={loading}
      />

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.linkSecondary}>Crear cuenta nueva</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  link: {
    marginTop: spacing.md,
    color: colors.primary,
    textAlign: 'center',
  },
  linkSecondary: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
  },
});

export default SignInScreen;
