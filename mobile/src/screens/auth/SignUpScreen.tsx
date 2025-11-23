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

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

const SignUpScreen = ({ navigation }: Props) => {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async () => {
    try {
      setError(undefined);
      setLoading(true);
      await signUp(email, password, fullName);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errorUnexpected'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <Text style={styles.title}>{t('auth.signUp.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.signUp.subtitle')}</Text>

      <TextField
        label={t('auth.fullName')}
        autoCapitalize="words"
        value={fullName}
        onChangeText={setFullName}
      />

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
        label={loading ? t('auth.signUp.submitting') : t('auth.signUp.submit')}
        onPress={handleSubmit}
        disabled={loading}
      />

      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.link}>{t('auth.signUp.haveAccount')}</Text>
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
  error: {
    color: colors.danger,
  },
});

export default SignUpScreen;
