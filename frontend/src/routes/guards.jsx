import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { ShieldAlert } from '../components/ui/icons';
import { useSession } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';

/** Generic page placeholder while a route's code or the session loads. */
export function PageSkeleton() {
  return (
    <div className="container-page py-12" role="status" aria-label="Loading">
      <div className="skeleton h-10 w-2/5 max-w-sm rounded-lg" />
      <div className="skeleton mt-4 h-5 w-3/5 max-w-md rounded" />
      <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[4/3] rounded-card" />
            <div className="skeleton mt-4 h-5 w-3/4 rounded" />
            <div className="skeleton mt-2 h-4 w-1/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Signed-in users only; others are sent to sign in and brought back afterwards. */
export function RequireAuth() {
  const { isLoaded, isSignedIn } = useSession();
  const location = useLocation();
  if (!isLoaded) return <PageSkeleton />;
  if (!isSignedIn) return <Navigate to={`/sign-in?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Outlet />
    </Suspense>
  );
}

/**
 * Role gate for the CRM. This is a convenience for the UI only;
 * the API enforces the same rules on every request.
 */
export function RequireRole({ roles }) {
  const { isLoaded, isSignedIn, role } = useSession();
  const location = useLocation();

  if (!isLoaded) return <PageSkeleton />;
  if (!isSignedIn) return <Navigate to={`/sign-in?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!roles.includes(role)) {
    const adminOnly = roles.length === 1 && roles[0] === 'admin';
    return (
      <div className="grid min-h-dvh place-items-center bg-mist-100 px-6">
        <div className="max-w-sm text-center">
          <ShieldAlert className="mx-auto size-8 text-slate-400" strokeWidth={1.5} />
          {adminOnly ? (
            <>
              <h1 className="mt-4 font-display text-h2">Only admins can open this page</h1>
              <p className="mt-3 text-slate-500">Team and role settings are managed by admins. Ask one if something here needs changing.</p>
              <Button to="/dashboard" variant="dark" className="mt-6">
                Back to the dashboard
              </Button>
            </>
          ) : (
            <>
              <h1 className="mt-4 font-display text-h2">This area is for the Niwas team</h1>
              <p className="mt-3 text-slate-500">Your account doesn’t have agent access. If you work with us, ask an admin to update your role.</p>
              <Button to="/" variant="dark" className="mt-6">
                Back to the website
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Outlet />
    </Suspense>
  );
}
