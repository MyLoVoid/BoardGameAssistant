import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenContainer from '@/components/ScreenContainer';
import TextField from '@/components/TextField';
import PrimaryButton from '@/components/PrimaryButton';
import { useAuth } from '@/hooks/useAuth';
import type { AuthStackParamList } from '@/types/navigation';
import { colors, spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

const SignInScreen = ({ navigation }: Props) => {
  const { signIn } = useAuth();
  const { t } = useLanguage();
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
      setError(err instanceof Error ? err.message : t('common.errorUnexpected'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <Text style={styles.title}>{t('auth.appTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.signIn.subtitle')}</Text>

      <TextField
        label={t('auth.email')}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextField
        label={t('auth.password')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        label={loading ? t('auth.signingIn') : t('auth.signIn')}
        onPress={handleSubmit}
        disabled={loading}
      />

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>{t('auth.forgot')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.linkSecondary}>{t('auth.createAccount')}</Text>
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
