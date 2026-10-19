import { Navigate, useSearchParams } from 'react-router';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useSession } from '../../auth/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageSpinner } from '../../routes/guards';

const IMG = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80';

/** Clerk's hosted sign-in/up components, framed in the site's own layout. */
export default function AuthPage({ mode }) {
  const { enabled, isLoaded, isSignedIn } = useSession();
  const [params] = useSearchParams();
  // Only allow same-site redirects (prevents open-redirect abuse via ?redirect=)
  const raw = params.get('redirect') ?? '/';
  const redirect = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
  usePageTitle(mode === 'sign-in' ? 'Sign in' : 'Create account');

  if (!isLoaded) return <PageSpinner />;
  if (isSignedIn) return <Navigate to={redirect} replace />;

  return (
    <section className="container-page grid min-h-[calc(100dvh-72px)] items-center gap-12 py-12 lg:grid-cols-2">
      <div className="relative hidden h-full max-h-[720px] overflow-hidden rounded-hero lg:block">
        <img src={IMG} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-navy-900/80 to-transparent" />
        <p className="absolute right-10 bottom-10 left-10 font-display text-h1 text-white">
          {mode === 'sign-in' ? 'Welcome back' : 'Save homes, follow up on inquiries, all in one place'}
        </p>
      </div>
      <div className="flex justify-center">
        {!enabled ? (
          <p className="max-w-sm text-center text-slate-500">
            Sign in isn’t configured on this copy of the site. Add <code className="rounded bg-mist-100 px-1">VITE_CLERK_PUBLISHABLE_KEY</code> to
            frontend/.env.local.
          </p>
        ) : mode === 'sign-in' ? (
          <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl={redirect} />
        ) : (
          <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl={redirect} />
        )}
      </div>
    </section>
  );
}
