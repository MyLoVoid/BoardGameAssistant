import { useMemo } from 'react';

import { useAuthContext } from '@/context/AuthContext';

export const useAuth = () => {
  const { state, signIn, signOut, refreshProfile } = useAuthContext();

  const derived = useMemo(
    () => ({
      status: state.status,
      isAuthenticated: state.status === 'signedIn' && Boolean(state.user),
      user: state.user,
      token: state.accessToken,
    }),
    [state],
  );

  return {
    ...derived,
    signIn,
    signOut,
    refreshProfile,
  } as const;
};
