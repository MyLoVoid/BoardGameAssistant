import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GameListScreen from '@/screens/games/GameListScreen';
import GameDetailScreen from '@/screens/games/GameDetailScreen';
import type { GamesStackParamList } from '@/types/navigation';
import { colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

const Stack = createNativeStackNavigator<GamesStackParamList>();

const GamesNavigator = () => {
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="GameList"
        component={GameListScreen}
        options={{ title: t('tabs.games') }}
      />
      <Stack.Screen
        name="GameDetail"
        component={GameDetailScreen}
        options={{ title: t('tabs.games') }}
      />
    </Stack.Navigator>
  );
};

export default GamesNavigator;
