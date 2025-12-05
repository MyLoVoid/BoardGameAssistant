import { StyleSheet, Text } from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import EmptyState from '@/components/EmptyState';
import { colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

const ForgotPasswordScreen = () => {
  const { t } = useLanguage();

  return (
    <ScreenContainer>
      <Text style={styles.title}>{t('auth.forgot.title')}</Text>
      <EmptyState
        title={t('auth.forgot.pendingTitle')}
        description={t('auth.forgot.pendingDescription')}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
});

export default ForgotPasswordScreen;
