import { createContext, useContext, useEffect, useMemo } from 'react';
import { ClerkProvider, useAuth, useClerk } from '@clerk/clerk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setTokenGetter, DEV_USER } from '../lib/api';

/**
 * The app talks to this context, never to Clerk directly:
 *   { enabled, isLoaded, isSignedIn, me, role, isStaff, isAdmin, signOut, openSignIn }
 * `me` is our own user record from GET /users/me — that's where the role lives.
 * Without a Clerk key the site still runs, signed out (handy for local previews).
 */
const AuthContext = createContext(null);
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function useMeQuery(isSignedIn) {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data.data),
    enabled: Boolean(isSignedIn),
    staleTime: 5 * 60_000,
  });
}

function buildValue({ enabled, isLoaded, isSignedIn, meQuery, signOut, openSignIn }) {
  const me = isSignedIn ? meQuery.data : null;
  const role = me?.role ?? null;
  return {
    enabled,
    // Still loading while Clerk boots, or while we fetch the role of a signed-in user
    isLoaded: isLoaded && (!isSignedIn || !meQuery.isPending),
    isSignedIn: Boolean(isSignedIn),
    me,
    role,
    isStaff: role === 'agent' || role === 'admin',
    isAdmin: role === 'admin',
    signOut,
    openSignIn,
  };
}

function ClerkBridge({ children }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const clerk = useClerk();
  const qc = useQueryClient();

  // Register synchronously so the very first /users/me request carries the token
  setTokenGetter(() => (isSignedIn ? getToken() : Promise.resolve(null)));

  const meQuery = useMeQuery(isLoaded && isSignedIn);

  useEffect(() => {
    if (isLoaded && !isSignedIn) qc.removeQueries({ queryKey: ['me'] });
  }, [isLoaded, isSignedIn, qc]);

  const value = useMemo(
    () =>
      buildValue({
        enabled: true,
        isLoaded,
        isSignedIn,
        meQuery,
        signOut: async () => {
          await clerk.signOut();
          qc.clear();
        },
        openSignIn: (redirectUrl) => clerk.openSignIn({ forceRedirectUrl: redirectUrl ?? window.location.href }),
      }),
    [isLoaded, isSignedIn, meQuery, clerk, qc],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function NoAuth({ children }) {
  // With VITE_DEV_USER (dev builds only) the app behaves as that seeded user
  const meQuery = useMeQuery(Boolean(DEV_USER));
  const value = buildValue({
    enabled: false,
    isLoaded: true,
    isSignedIn: Boolean(DEV_USER),
    meQuery,
    signOut: async () => {},
    openSignIn: () => window.alert('Sign in is not configured. Add VITE_CLERK_PUBLISHABLE_KEY to frontend/.env.'),
  });
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const clerkAppearance = {
  variables: {
    colorPrimary: '#0c1a3b',
    colorText: '#0c1a3b',
    colorTextSecondary: '#5d6678',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, "Segoe UI", Roboto, sans-serif',
    borderRadius: '12px',
  },
  elements: {
    card: { boxShadow: '0 1px 2px rgb(12 26 59 / 0.06), 0 12px 32px -8px rgb(12 26 59 / 0.18)' },
    formButtonPrimary: { backgroundColor: '#0c1a3b', textTransform: 'none' },
  },
};

export function AuthProvider({ children }) {
  if (!CLERK_KEY) return <NoAuth>{children}</NoAuth>;
  return (
    <ClerkProvider publishableKey={CLERK_KEY} appearance={clerkAppearance} signInUrl="/sign-in" signUpUrl="/sign-up" afterSignOutUrl="/">
      <ClerkBridge>{children}</ClerkBridge>
    </ClerkProvider>
  );
}

export function useSession() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useSession must be used inside <AuthProvider>');
  return ctx;
}
