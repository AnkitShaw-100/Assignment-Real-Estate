import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useSession } from '../../auth/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageSpinner } from '../../routes/guards';
import { Field, Input, TextField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';

const IMG = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80';

const email = z.string().trim().min(1, 'Enter your email').email('Enter a valid email address');
const schemas = {
  'sign-in': z.object({ email, password: z.string().min(1, 'Enter your password') }),
  'sign-up': z.object({
    name: z.string().trim().min(2, 'Enter your name'),
    email,
    password: z.string().min(8, 'Use at least 8 characters').max(72, 'Use 72 characters or fewer'),
  }),
};

const COPY = {
  'sign-in': {
    title: 'Sign in',
    heading: 'Welcome back',
    sub: 'Sign in to see your saved homes and inquiries.',
    submit: 'Sign in',
    switchText: 'New to Niwas?',
    switchLink: 'Create an account',
    aside: 'Welcome back',
  },
  'sign-up': {
    title: 'Create account',
    heading: 'Create your account',
    sub: 'Save homes and follow up on your inquiries in one place.',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchLink: 'Sign in',
    aside: 'Save homes, follow up on inquiries, all in one place',
  },
};

/** Email and password sign in / sign up, framed in the site's own layout. */
export default function AuthPage({ mode }) {
  const { isLoaded, isSignedIn } = useSession();
  const [params] = useSearchParams();
  // Only allow same-site redirects (prevents open-redirect abuse via ?redirect=)
  const raw = params.get('redirect') ?? '/';
  const redirect = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
  const copy = COPY[mode];
  usePageTitle(copy.title);

  if (!isLoaded) return <PageSpinner />;
  if (isSignedIn) return <Navigate to={redirect} replace />;

  const other = mode === 'sign-in' ? '/sign-up' : '/sign-in';
  const otherHref = redirect === '/' ? other : `${other}?redirect=${encodeURIComponent(redirect)}`;

  return (
    <section className="container-page grid min-h-[calc(100dvh-72px)] items-center gap-12 py-12 lg:grid-cols-2">
      <div className="relative hidden h-full max-h-[720px] overflow-hidden rounded-hero lg:block">
        <img src={IMG} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-navy-900/80 to-transparent" />
        <p className="absolute right-10 bottom-10 left-10 font-display text-h1 text-white">{copy.aside}</p>
      </div>
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-h2">{copy.heading}</h1>
          <p className="mt-2 text-slate-500">{copy.sub}</p>
          {/* key resets the form when switching between sign in and sign up */}
          <AuthForm key={mode} mode={mode} redirect={redirect} />
          <p className="mt-6 text-center text-sm text-slate-500">
            {copy.switchText}{' '}
            <Link to={otherHref} className="font-medium text-navy-900 underline underline-offset-4 hover:text-accent-700">
              {copy.switchLink}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function AuthForm({ mode, redirect }) {
  const { signIn, signUp } = useSession();
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schemas[mode]) });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      await (mode === 'sign-in' ? signIn(values) : signUp(values));
      navigate(redirect, { replace: true });
    } catch (err) {
      const fields = Object.entries(err.details ?? {});
      for (const [field, messages] of fields) setError(field, { message: messages[0] });
      if (!fields.length) setFormError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-4">
      {mode === 'sign-up' && <TextField label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />}
      <TextField label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
      <Field label="Password" error={errors.password?.message} hint={mode === 'sign-up' ? 'At least 8 characters.' : undefined}>
        {(a11y) => (
          <div className="relative">
            <Input
              {...a11y}
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              className="pr-11"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-500 hover:bg-mist-100 hover:text-navy-900"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        )}
      </Field>
      {formError && (
        <p className="rounded-field bg-[#fdf3f2] px-3.5 py-2.5 text-sm text-danger" role="alert">
          {formError}
        </p>
      )}
      <Button type="submit" variant="dark" size="lg" loading={isSubmitting} className="mt-2 w-full">
        {COPY[mode].submit}
      </Button>
    </form>
  );
}
