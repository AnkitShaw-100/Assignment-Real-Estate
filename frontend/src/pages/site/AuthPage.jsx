import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Lock, Mail, MessageSquareText, Search, User } from '../../components/ui/icons';
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

/** Website sign in / sign up for buyers and renters. Staff use /admin/login. */
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
    <section className="container-page grid min-h-[calc(100dvh-72px)] items-start gap-12 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:py-10">
      {/* Photo panel with what an account gives you (desktop) */}
      <div className="relative hidden h-full max-h-[700px] min-h-[560px] overflow-hidden rounded-hero bg-navy-900 lg:block">
        <FadeImage className="absolute inset-0" src={`${IMG}&w=1200`} alt="" loading="eager" />
        <div className="absolute inset-0 bg-linear-to-t from-navy-900/95 via-navy-900/45 to-navy-900/10" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="font-display text-h2 leading-tight">{copy.aside}</p>
          <ul className="mt-7 space-y-3.5">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] text-white/85">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/12 ring-1 ring-white/20 backdrop-blur">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-[420px] rounded-panel border border-line bg-paper p-7 shadow-float sm:p-9">
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
          <p className="mt-6 border-t border-line pt-5 text-center text-[13px] text-slate-500">
            Niwas staff?{' '}
            <Link to="/admin/login" className="font-medium text-navy-900 hover:text-accent-700">
              Sign in to the CRM
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
