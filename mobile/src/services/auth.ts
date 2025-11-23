/**
 * Authentication service
 * Handles sign in, sign up, and user profile retrieval
 */

import type { AuthUser } from '@/types/auth';
import { config } from '../config/env';
import { supabase } from './supabase';

interface SignInResponse {
  token: string;
  user: AuthUser;
}

interface UserProfileResponse {
  id: string;
  email: string;
  full_name?: string;
  role: AuthUser['role'];
}

/**
 * Sign in with email and password
 * Uses Supabase auth and fetches user role from backend
 */
export const signIn = async (email: string, password: string): Promise<SignInResponse> => {
  // Sign in with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error('No se pudo crear la sesión');
  }

  // Get user profile with role from backend
  const profile = await getUserProfile(data.session.access_token);

  return {
    token: data.session.access_token,
    user: {
      id: profile.id,
      email: profile.email,
      displayName: profile.full_name || profile.email.split('@')[0],
      role: profile.role,
    },
  };
};

/**
 * Sign up with email and password
 * Creates account in Supabase
 */
export const signUp = async (
  email: string,
  password: string,
  fullName?: string,
): Promise<SignInResponse> => {
  // Sign up with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    // Email confirmation might be required
    throw new Error('Por favor confirma tu correo para continuar');
  }

  // Get user profile with role from backend
  const profile = await getUserProfile(data.session.access_token);

  return {
    token: data.session.access_token,
    user: {
      id: profile.id,
      email: profile.email,
      displayName: profile.full_name || fullName || profile.email.split('@')[0],
      role: profile.role,
    },
  };
};

/**
 * Sign out
 * Clears Supabase session
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Get user profile from backend
 * Fetches complete user profile including role
 */
export const getUserProfile = async (accessToken: string): Promise<UserProfileResponse> => {
  const response = await fetch(`${config.backendUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Sesión expirada');
    }
    throw new Error('Error al obtener el perfil del usuario');
  }

  return response.json();
};

/**
 * Validate current session
 * Checks if user has an active Supabase session and refreshes profile
 */
export const validateSession = async (): Promise<SignInResponse | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Get fresh user profile from backend
  const profile = await getUserProfile(session.access_token);

  return {
    token: session.access_token,
    user: {
      id: profile.id,
      email: profile.email,
      displayName: profile.full_name || profile.email.split('@')[0],
      role: profile.role,
    },
  };
};
