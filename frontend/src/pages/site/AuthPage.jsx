import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Heart, Lock, Mail, MessageSquareText, Search, User } from '../../components/ui/icons';
import { useSession } from '../../auth/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageSkeleton } from '../../routes/guards';
import { FadeImage } from '../../components/ui/FadeImage';
import { IconField, PasswordToggle } from '../../components/ui/IconInput';
import { Button } from '../../components/ui/Button';

const IMG = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=70';

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
    aside: 'Pick up where you left off',
  },
  'sign-up': {
    title: 'Create account',
    heading: 'Create your account',
    sub: 'Free, and it takes less than a minute.',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchLink: 'Sign in',
    aside: 'Find a home worth coming back to',
  },
};

const PERKS = [
  { icon: Heart, text: 'Save the homes you love and compare them later' },
  { icon: MessageSquareText, text: 'Follow every inquiry until an agent replies' },
  { icon: Search, text: 'Browse villas, apartments and commercial spaces in 18 cities' },
];

/**
 * Website sign in / sign up for buyers and renters, as a full-screen split
 * (form left, photo right). Staff use /admin/login.
 */
export default function AuthPage({ mode }) {
  const { isLoaded, isSignedIn } = useSession();
  const [params] = useSearchParams();
  // Only allow same-site redirects (prevents open-redirect abuse via ?redirect=)
  const raw = params.get('redirect') ?? '/';
  const redirect = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
  const copy = COPY[mode];
  usePageTitle(copy.title);

  if (!isLoaded) return <PageSkeleton />;
  if (isSignedIn) return <Navigate to={redirect} replace />;

  const other = mode === 'sign-in' ? '/sign-up' : '/sign-in';
  const otherHref = redirect === '/' ? other : `${other}?redirect=${encodeURIComponent(redirect)}`;

  return (
    <main className="grid min-h-dvh bg-paper lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Form side */}
      <section className="flex flex-col px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <header className="flex items-center justify-between">
          <Link to="/" className="font-display text-[28px] leading-none tracking-[-0.03em]" aria-label="Niwas home">
            Niwas
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900">
            <ArrowLeft className="size-4" aria-hidden />
            Back to website
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px]">
            <h1 className="font-display text-h1 leading-[1.05]">{copy.heading}</h1>
            <p className="mt-3 text-[17px] text-slate-500">{copy.sub}</p>
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

        <p className="text-center text-[13px] text-slate-500 lg:text-left">
          Niwas staff?{' '}
          <Link to="/admin/login" className="font-medium text-navy-900 hover:text-accent-700">
            Sign in to the CRM
          </Link>
        </p>
      </section>

      {/* Photo side (desktop): what an account gives you */}
      <section className="relative hidden overflow-hidden bg-navy-900 lg:block" aria-hidden>
        <FadeImage className="absolute inset-0" src={`${IMG}&w=1400`} alt="" loading="eager" />
        <div className="absolute inset-0 bg-linear-to-t from-navy-900/95 via-navy-900/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white xl:p-16">
          <p className="max-w-md font-display text-h1 leading-[1.05]">{copy.aside}</p>
          <ul className="mt-8 grid max-w-lg gap-3">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 rounded-card bg-white/10 px-4 py-3 text-[15px] text-white/90 ring-1 ring-white/15 backdrop-blur-md">
                <Icon className="size-5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 flex flex-col gap-5">
      {mode === 'sign-up' && (
        <IconField id="auth-name" label="Full name" icon={User} autoComplete="name" placeholder="Your name" error={errors.name?.message} {...register('name')} />
      )}
      <IconField id="auth-email" label="Email" icon={Mail} type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
      <IconField
        id="auth-password"
        label="Password"
        icon={Lock}
        type={showPassword ? 'text' : 'password'}
        autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
        placeholder={mode === 'sign-in' ? 'Your password' : 'At least 8 characters'}
        error={errors.password?.message}
        trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
        {...register('password')}
      />
      {formError && (
        <p className="rounded-field border border-danger/20 bg-[#fdf3f2] px-3.5 py-2.5 text-sm text-danger" role="alert">
          {formError}
        </p>
      )}
      <Button type="submit" variant="dark" size="lg" loading={isSubmitting} className="mt-1 w-full">
        {COPY[mode].submit}
      </Button>
    </form>
  );
}
