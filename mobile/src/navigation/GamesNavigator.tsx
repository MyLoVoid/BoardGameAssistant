import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GameListScreen from '@/screens/games/GameListScreen';
import GameDetailScreen from '@/screens/games/GameDetailScreen';
import type { GamesStackParamList } from '@/types/navigation';
import { colors } from '@/constants/theme';

const Stack = createNativeStackNavigator<GamesStackParamList>();

const GamesNavigator = () => (
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
      options={{ title: 'Juegos' }}
    />
    <Stack.Screen
      name="GameDetail"
      component={GameDetailScreen}
      options={({ route }) => ({ title: route.params.gameId })}
    />
  </Stack.Navigator>
);

export default GamesNavigator;
