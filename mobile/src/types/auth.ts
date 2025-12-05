export type UserRole = 'admin' | 'developer' | 'basic' | 'premium' | 'tester';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
}

export interface AuthState {
  status: 'loading' | 'signedOut' | 'signedIn';
  user?: AuthUser;
  accessToken?: string;
}
