import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import AuthNavigator from '@/navigation/AuthNavigator';
import MainTabs from '@/navigation/MainTabs';
import type { RootStackParamList } from '@/types/navigation';
import { colors } from '@/constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status !== 'signedIn' ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default AppNavigator;
