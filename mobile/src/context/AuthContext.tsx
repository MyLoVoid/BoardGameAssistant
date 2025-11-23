import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import type { AuthState, AuthUser } from '@/types/auth';
import { mockSignIn, mockValidateToken } from '@/services/api';

const STORAGE_KEY = 'bgai-auth-session';

interface AuthContextValue {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const bootstrapAsync = useCallback(async () => {
    try {
      const cached = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!cached) {
        setState({ status: 'signedOut' });
        return;
      }

      const parsed = JSON.parse(cached) as { token: string; user: AuthUser };
      const profile = await mockValidateToken(parsed.token);
      setState({ status: 'signedIn', user: profile.user, accessToken: parsed.token });
    } catch (error) {
      console.warn('Failed to hydrate session', error);
      setState({ status: 'signedOut' });
    }
  }, []);

  useEffect(() => {
    bootstrapAsync();
  }, [bootstrapAsync]);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await mockSignIn(email, password);
    setState({ status: 'signedIn', user: session.user, accessToken: session.token });
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const signOut = useCallback(async () => {
    setState({ status: 'signedOut' });
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!state.accessToken) {
      await signOut();
      return;
    }

    const profile = await mockValidateToken(state.accessToken);
    setState((prev) => ({
      ...prev,
      status: 'signedIn',
      user: profile.user,
    }));
  }, [signOut, state.accessToken]);

  const value = useMemo(
    () => ({
      state,
      signIn,
      signOut,
      refreshProfile,
    }),
    [refreshProfile, signIn, signOut, state],
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
