import { createClient, type AuthError } from '@supabase/supabase-js';
import { clearAuthCookies } from './auth-cookies';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const isAuthSessionMissingError = (error: unknown): error is AuthError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'AuthSessionMissingError'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Helper to get current session
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    if (isAuthSessionMissingError(error)) {
      return null;
    }
    throw error;
  }
  return data.session;
}

// Helper to get current user
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (isAuthSessionMissingError(error)) {
      return null;
    }
    throw error;
  }
  return data.user ?? null;
}

// Helper to get user with role from database
export async function getUserWithRole() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, created_at, updated_at')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return {
    ...data,
    email: user.email ?? '',
  };
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  clearAuthCookies();
}

// Check if user has admin or developer role
export async function isAdminOrDeveloper(): Promise<boolean> {
  try {
    const userWithRole = await getUserWithRole();
    if (!userWithRole) return false;
    return userWithRole.role === 'admin' || userWithRole.role === 'developer';
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}
