import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignInScreen from '@/screens/auth/SignInScreen';
import SignUpScreen from '@/screens/auth/SignUpScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import type { AuthStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#050A18' },
      headerTintColor: '#E2E8F0',
    }}
  >
    <Stack.Screen
      name="SignIn"
      component={SignInScreen}
      options={{ title: 'Inicia sesión', headerShown: false }}
    />
    <Stack.Screen
      name="SignUp"
      component={SignUpScreen}
      options={{ title: 'Crea tu cuenta' }}
    />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{ title: 'Recuperar acceso' }}
    />
  </Stack.Navigator>
);

export default AuthNavigator;
