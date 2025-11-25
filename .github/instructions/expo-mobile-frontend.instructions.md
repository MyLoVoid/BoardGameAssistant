---
description: 'React Native + Expo Mobile Development: TypeScript, Navigation, Hooks, Localization'
applyTo: 'mobile/src/**/*.{ts,tsx}'
---

# Expo Mobile Frontend Expert Instructions

Use these guidelines when working on mobile app frontend with React Native and Expo.

## Scope

This applies to:
- React Native components (`mobile/src/components/`, `mobile/src/screens/`)
- Navigation setup (`mobile/src/navigation/`)
- Custom hooks (`mobile/src/hooks/`)
- API services (`mobile/src/services/`)
- Context providers (`mobile/src/context/`)
- Localization (`mobile/src/localization/`)

## Core Principles

### 1. Component Design

**Functional Components with TypeScript**
```tsx
// mobile/src/components/PrimaryButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.white} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // iOS touch target minimum
  },
  buttonSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
  },
});
```

**Screen Component Pattern**
```tsx
// mobile/src/screens/games/GameListScreen.tsx
import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { EmptyState } from '../../components/EmptyState';
import { useGames } from '../../hooks/useGames';
import { useLanguage } from '../../context/LanguageContext';
import { GameListItem } from './GameListItem';

export const GameListScreen: React.FC = () => {
  const { t } = useLanguage();
  const { games, loading, error, refetch } = useGames();

  const renderItem = ({ item }: { item: Game }) => (
    <GameListItem game={item} />
  );

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState
          title={t('games.error.title')}
          message={error}
          action={{ label: t('common.retry'), onPress: refetch }}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={games}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={t('games.empty.title')}
              message={t('games.empty.message')}
            />
          ) : null
        }
      />
    </ScreenContainer>
  );
};
```

### 2. Custom Hooks

**Data Fetching Hook**
```tsx
// mobile/src/hooks/useGames.ts
import { useState, useEffect, useCallback } from 'react';
import { gamesApi } from '../services/api';
import { useAuth } from './useAuth';
import type { Game } from '../types/game';

interface UseGamesReturn {
  games: Game[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useGames = (statusFilter?: string): UseGamesReturn => {
  const { token } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await gamesApi.getGames(token, statusFilter);
      setGames(data.games);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return {
    games,
    loading,
    error,
    refetch: fetchGames,
  };
};
```

**Form Hook**
```tsx
// mobile/src/hooks/useForm.ts
import { useState, useCallback } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void>;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async () => {
    // Validate
    const validationErrors = validate ? validate(values) : {};
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Submit
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
  };
};
```

### 3. Navigation

**Type-Safe Navigation**
```tsx
// mobile/src/types/navigation.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type GamesStackParamList = {
  GameList: undefined;
  GameDetail: { gameId: string };
};

export type GameDetailScreenProps = NativeStackScreenProps<
  GamesStackParamList,
  'GameDetail'
>;
```

**Navigation Setup**
```tsx
// mobile/src/navigation/GamesNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameListScreen } from '../screens/games/GameListScreen';
import { GameDetailScreen } from '../screens/games/GameDetailScreen';
import { useLanguage } from '../context/LanguageContext';
import type { GamesStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<GamesStackParamList>();

export const GamesNavigator: React.FC = () => {
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: t('common.back'),
      }}
    >
      <Stack.Screen
        name="GameList"
        component={GameListScreen}
        options={{ title: t('games.title') }}
      />
      <Stack.Screen
        name="GameDetail"
        component={GameDetailScreen}
        options={{ title: t('games.detail.title') }}
      />
    </Stack.Navigator>
  );
};
```

**Usage in Screen**
```tsx
// mobile/src/screens/games/GameDetailScreen.tsx
import { useNavigation, useRoute } from '@react-navigation/native';
import type { GameDetailScreenProps } from '../../types/navigation';

export const GameDetailScreen: React.FC = () => {
  const route = useRoute<GameDetailScreenProps['route']>();
  const navigation = useNavigation<GameDetailScreenProps['navigation']>();
  
  const { gameId } = route.params;
  
  // Use gameId...
};
```

### 4. Localization

**Translation Setup**
```tsx
// mobile/src/localization/translations.ts
export const translations = {
  es: {
    common: {
      back: 'Atrás',
      retry: 'Reintentar',
      loading: 'Cargando...',
      error: 'Error',
    },
    auth: {
      signIn: 'Iniciar sesión',
      signUp: 'Registrarse',
      email: 'Correo electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
    },
    games: {
      title: 'Juegos',
      empty: {
        title: 'No hay juegos disponibles',
        message: 'Pronto agregaremos más juegos',
      },
      error: {
        title: 'Error al cargar juegos',
      },
    },
  },
  en: {
    common: {
      back: 'Back',
      retry: 'Retry',
      loading: 'Loading...',
      error: 'Error',
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
    },
    games: {
      title: 'Games',
      empty: {
        title: 'No games available',
        message: 'We will add more games soon',
      },
      error: {
        title: 'Error loading games',
      },
    },
  },
};
```

**Language Context**
```tsx
// mobile/src/context/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../localization/translations';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    // Load saved language
    AsyncStorage.getItem('app_language').then((saved) => {
      if (saved === 'es' || saved === 'en') {
        setLanguageState(saved);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('app_language', lang);
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return typeof value === 'string' ? value : key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
```

### 5. API Integration

**API Client**
```tsx
// mobile/src/services/api.ts
import { API_URL } from '../config/env';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<any> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      error.detail || `HTTP ${response.status}`
    );
  }

  return response.json();
}

export const gamesApi = {
  async getGames(token: string, statusFilter?: string) {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    
    return fetchWithAuth(`/games?${params}`, token);
  },

  async getGameDetail(token: string, gameId: string) {
    return fetchWithAuth(`/games/${gameId}`, token);
  },

  async getGameFAQs(token: string, gameId: string, language: string) {
    return fetchWithAuth(`/games/${gameId}/faqs?lang=${language}`, token);
  },
};

export const genaiApi = {
  async query(
    token: string,
    params: {
      game_id: string;
      question: string;
      language: string;
      session_id?: string;
    }
  ) {
    return fetchWithAuth('/genai/query', token, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};
```

### 6. Styling

**Theme Constants**
```tsx
// mobile/src/constants/theme.ts
export const theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FF9500',
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      100: '#F2F2F7',
      200: '#E5E5EA',
      300: '#D1D1D6',
      400: '#C7C7CC',
      500: '#AEAEB2',
      600: '#8E8E93',
      700: '#636366',
      800: '#48484A',
      900: '#3A3A3C',
    },
    text: {
      primary: '#000000',
      secondary: '#3A3A3C',
      tertiary: '#8E8E93',
      inverse: '#FFFFFF',
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F2F2F7',
      tertiary: '#E5E5EA',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};
```

**StyleSheet Pattern**
```tsx
import { StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.md,
  },
});
```

### 7. Authentication Context

**Auth Provider**
```tsx
// mobile/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/auth';

interface User {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on app launch
    const restoreSession = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('auth_token');
        if (savedToken) {
          const userData = await authService.validateSession(savedToken);
          setUser(userData);
          setToken(savedToken);
        }
      } catch (error) {
        // Session invalid, clear token
        await SecureStore.deleteItemAsync('auth_token');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user: userData, token: authToken } = await authService.signIn(email, password);
    
    setUser(userData);
    setToken(authToken);
    await SecureStore.setItemAsync('auth_token', authToken);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { user: userData, token: authToken } = await authService.signUp(
      email,
      password,
      fullName
    );
    
    setUser(userData);
    setToken(authToken);
    await SecureStore.setItemAsync('auth_token', authToken);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## Best Practices

1. **Touch Targets**: Minimum 44px height for all touchable elements
2. **Use Memo**: React.memo for expensive components, useMemo/useCallback for heavy computations
3. **FlatList Optimization**: Use keyExtractor, implement getItemLayout when possible
4. **Keyboard Handling**: Use KeyboardAvoidingView, dismiss keyboard on scroll
5. **Safe Areas**: Wrap screens in SafeAreaView or use useSafeAreaInsets
6. **Loading States**: Show ActivityIndicator during async operations
7. **Error Handling**: Display user-friendly error messages with retry options
8. **Empty States**: Provide helpful messages and actions when lists are empty
9. **Accessibility**: Add accessibilityLabel, accessibilityRole, accessibilityHint
10. **Platform Differences**: Use Platform.OS for platform-specific code

## Common Patterns

### Loading State
```tsx
if (loading) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}
```

### Error State with Retry
```tsx
if (error) {
  return (
    <EmptyState
      icon="alert-circle"
      title={t('common.error')}
      message={error}
      action={{
        label: t('common.retry'),
        onPress: refetch,
      }}
    />
  );
}
```

### Pull to Refresh
```tsx
<FlatList
  data={items}
  renderItem={renderItem}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.colors.primary}
    />
  }
/>
```

## References

- Expo docs: https://docs.expo.dev/
- React Native: https://reactnative.dev/docs/getting-started
- React Navigation: https://reactnavigation.org/docs/getting-started
