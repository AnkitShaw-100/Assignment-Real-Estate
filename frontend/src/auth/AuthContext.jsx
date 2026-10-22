import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getToken, setToken, isTokenKey, SIGNED_OUT_EVENT } from '../lib/api';

/**
 * The app talks to this context for everything auth:
 *   { isLoaded, isSignedIn, me, role, isStaff, isAdmin, signIn, signUp, signOut, openSignIn }
 * `me` is our user record from GET /users/me; that's where the role lives,
 * and the API checks the same role on every request.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [token, setTokenState] = useState(getToken);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data.data),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });

  const startSession = useCallback(
    ({ token: next, user }) => {
      setToken(next);
      qc.clear(); // nothing cached as a previous visitor should survive
      qc.setQueryData(['me'], user);
      setTokenState(next);
    },
    [qc],
  );

  const signOut = useCallback(() => {
    setToken(null);
    setTokenState(null);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    // The API rejected the token (expired, or account deactivated)
    const onExpired = () => {
      setTokenState(null);
      qc.clear();
    };
    // Signing in or out in another tab applies here too
    const onStorage = (e) => {
      if (!isTokenKey(e.key)) return;
      qc.clear();
      setTokenState(e.newValue);
    };
    window.addEventListener(SIGNED_OUT_EVENT, onExpired);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SIGNED_OUT_EVENT, onExpired);
      window.removeEventListener('storage', onStorage);
    };
  }, [qc]);

  const value = useMemo(() => {
    const isSignedIn = Boolean(token);
    const me = isSignedIn ? (meQuery.data ?? null) : null;
    const role = me?.role ?? null;
    return {
      // Signed-in users count as loading until their role has arrived
      isLoaded: !isSignedIn || !meQuery.isPending,
      isSignedIn,
      me,
      role,
      isStaff: role === 'agent' || role === 'admin',
      isAdmin: role === 'admin',
      signIn: (credentials) => api.post('/auth/login', credentials).then((r) => startSession(r.data.data)),
      signUp: (details) => api.post('/auth/register', details).then((r) => startSession(r.data.data)),
      signOut,
      openSignIn: (redirect = window.location.pathname + window.location.search) =>
        window.location.assign(`/sign-in?redirect=${encodeURIComponent(redirect)}`),
    };
  }, [token, meQuery.data, meQuery.isPending, startSession, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useSession must be used inside <AuthProvider>');
  return ctx;
}
