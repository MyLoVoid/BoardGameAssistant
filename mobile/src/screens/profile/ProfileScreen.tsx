import { StyleSheet, Text, View } from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import PrimaryButton from '@/components/PrimaryButton';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

const ProfileScreen = () => {
  const { user, signOut, refreshProfile } = useAuth();
  const { t } = useLanguage();

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>{user?.displayName ?? t('profile.guest')}</Text>
        <Text style={styles.label}>{t('profile.email')}</Text>
        <Text style={styles.value}>{user?.email}</Text>

        <Text style={styles.label}>{t('profile.role')}</Text>
        <Text style={styles.value}>{user?.role}</Text>
      </View>

      <PrimaryButton label={t('profile.refresh')} onPress={refreshProfile} />
      <PrimaryButton label={t('profile.signOut')} onPress={signOut} style={styles.signOut} />

      <View style={styles.languageSection}>
        <Text style={styles.sectionTitle}>{t('profile.languageTitle')}</Text>
        <LanguageSelector />
      </View>
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
  languageSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
