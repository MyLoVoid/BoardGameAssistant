import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignInScreen from '@/screens/auth/SignInScreen';
import SignUpScreen from '@/screens/auth/SignUpScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import type { AuthStackParamList } from '@/types/navigation';
import { useLanguage } from '@/context/LanguageContext';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#050A18' },
        headerTintColor: '#E2E8F0',
      }}
    >
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{ title: t('auth.signIn.navTitle'), headerShown: false }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ title: t('auth.signUp.navTitle') }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: t('auth.forgot.navTitle') }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
