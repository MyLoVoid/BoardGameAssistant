import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '@/screens/home/HomeScreen';
import GamesNavigator from '@/navigation/GamesNavigator';
import ChatScreen from '@/screens/chat/ChatScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import type { MainTabParamList } from '@/types/navigation';
import { colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Home: 'home',
            Games: 'game-controller',
            Chat: 'chatbubble-ellipses',
            Profile: 'person-circle',
          };
          const iconName = iconMap[route.name as keyof MainTabParamList];
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('tabs.home'), tabBarLabel: t('tabs.home') }}
      />
      <Tab.Screen
        name="Games"
        component={GamesNavigator}
        options={{
          title: t('tabs.games'),
          tabBarLabel: t('tabs.games'),
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Games', { screen: 'GameList' });
          },
        })}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: t('tabs.chat'), tabBarLabel: t('tabs.chat') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('tabs.profile'), tabBarLabel: t('tabs.profile') }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
