import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import type { AuthState } from '@/types/auth';
import * as authService from '@/services/auth';

const STORAGE_KEY = 'bgai-auth-session';

interface AuthContextValue {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const bootstrapAsync = useCallback(async () => {
    try {
      // Validate session with Supabase (auto-refreshes if needed)
      const session = await authService.validateSession();

      if (!session) {
        setState({ status: 'signedOut' });
        return;
      }

      setState({ status: 'signedIn', user: session.user, accessToken: session.token });
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to hydrate session', error);
      setState({ status: 'signedOut' });
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    bootstrapAsync();
  }, [bootstrapAsync]);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await authService.signIn(email, password);
    setState({ status: 'signedIn', user: session.user, accessToken: session.token });
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const session = await authService.signUp(email, password, fullName);
    setState({ status: 'signedIn', user: session.user, accessToken: session.token });
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setState({ status: 'signedOut' });
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!state.accessToken) {
      await signOut();
      return;
    }

    try {
      const session = await authService.validateSession();
      if (!session) {
        await signOut();
        return;
      }

      setState((prev) => ({
        ...prev,
        status: 'signedIn',
        user: session.user,
        accessToken: session.token,
      }));
    } catch (error) {
      console.warn('Failed to refresh profile', error);
      await signOut();
    }
  }, [signOut, state.accessToken]);

  const value = useMemo(
    () => ({
      state,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [refreshProfile, signIn, signUp, signOut, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
};
