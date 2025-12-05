import Constants from 'expo-constants';

import type { AuthUser } from '@/types/auth';

const DEFAULT_API_URL = 'http://localhost:8000';

const API_BASE_URL =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ?? DEFAULT_API_URL;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockSignIn = async (email: string, password: string) => {
  await delay(500);
  if (!password) {
    throw new Error('La contraseña no puede estar vacía');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const role: AuthUser['role'] =
    normalizedEmail.includes('admin') || normalizedEmail.includes('dev')
      ? 'developer'
      : normalizedEmail.includes('premium')
        ? 'premium'
        : normalizedEmail.includes('tester')
          ? 'tester'
          : 'basic';

  const user: AuthUser = {
    id: `user-${role}`,
    email: normalizedEmail,
    displayName: normalizedEmail.split('@')[0],
    role,
  };

  return {
    token: `mock-token-${role}-${Date.now()}`,
    user,
  };
};

export const mockValidateToken = async (token: string) => {
  await delay(300);
  if (!token) {
    throw new Error('Token inválido');
  }
  // Fake payload based on token suffix
  const role = token.includes('premium')
    ? 'premium'
    : token.includes('tester')
      ? 'tester'
      : token.includes('developer')
        ? 'developer'
        : token.includes('admin')
          ? 'admin'
          : 'basic';

  const user: AuthUser = {
    id: `user-${role}`,
    email: `${role}@bgai.dev`,
    role,
    displayName: role === 'basic' ? 'Player' : role.toUpperCase(),
  };

  return {
    user,
  };
};

export const apiClient = {
  baseUrl: API_BASE_URL,
};
