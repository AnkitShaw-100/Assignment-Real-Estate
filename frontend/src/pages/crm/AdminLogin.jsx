import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { ArrowLeft, ChartUp, Eye, EyeOff, Lock, Mail, ShieldCheck, SquareKanban, UsersRound } from '../../components/ui/icons';
import { useSession } from '../../auth/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageSkeleton } from '../../routes/guards';
import { FadeImage } from '../../components/ui/FadeImage';
import { Button } from '../../components/ui/Button';

const PHOTO = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=70';

const HIGHLIGHTS = [
  { icon: SquareKanban, text: 'Track every lead from first inquiry to closed deal' },
  { icon: UsersRound, text: 'Customer profiles, follow-ups and tasks in one place' },
  { icon: ChartUp, text: 'Live sales, pipeline and lead-source reports' },
];

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

/** Text input with a leading icon, matching the design-system field look. */
function IconInput({ icon: Icon, invalid, className, trailing, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        className={clsx(
          'h-12 w-full rounded-field border bg-paper pr-3.5 pl-11 text-[15px] text-navy-900 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200',
          'focus:border-accent-400 focus:ring-3 focus:ring-accent-400/25 focus:outline-none',
          invalid ? 'border-danger' : 'border-line',
          trailing && 'pr-12',
          className,
        )}
        aria-invalid={invalid || undefined}
        {...props}
      />
      {trailing}
    </div>
  );
}

/**
 * CRM sign-in for admins and agents. There is no sign-up here: the admin is
 * set in the server settings and agents are added by the admin. The request
 * carries `staff: true`, so the API refuses accounts without CRM access.
 */
export default function AdminLogin() {
  const { isLoaded, isStaff, signIn } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const raw = params.get('redirect') ?? '/admin';
  // Only allow redirects back into the CRM
  const redirect = raw.startsWith('/admin') ? raw : '/admin';
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  usePageTitle('CRM sign in');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  if (!isLoaded) return <PageSkeleton />;
  if (isStaff) return <Navigate to={redirect} replace />;

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      await signIn({ ...values, staff: true });
      navigate(redirect, { replace: true });
    } catch (err) {
      const fields = Object.entries(err.details ?? {});
      for (const [field, messages] of fields) setError(field, { message: messages[0] });
      if (!fields.length) setFormError(err.message);
    }
  };

  return (
    <main className="grid min-h-dvh bg-paper lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand panel: photo with navy overlay (desktop) */}
      <section className="relative hidden overflow-hidden bg-navy-900 lg:block" aria-hidden>
        <FadeImage className="absolute inset-0" src={`${PHOTO}&w=1400`} alt="" loading="eager" />
        <div className="absolute inset-0 bg-linear-to-br from-navy-900/95 via-navy-900/80 to-navy-900/40" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white xl:p-16">
          <p className="font-display text-[30px] leading-none tracking-[-0.03em]">
            Niwas <span className="align-middle font-sans text-xs font-medium tracking-[0.2em] text-white/60 uppercase">CRM</span>
          </p>
          <div className="max-w-md">
            <h2 className="font-display text-h1 leading-[1.05]">Your listings, leads and deals in one place.</h2>
            <ul className="mt-10 space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3.5 text-[15px] text-white/85">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
                    <Icon className="size-5" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-white/50">© {new Date().getFullYear()} Niwas Realty</p>
        </div>
      </section>

      {/* Sign-in panel */}
      <section className="flex flex-col">
        {/* Compact brand header on phones and tablets */}
        <div className="bg-navy-900 px-6 py-8 text-white lg:hidden">
          <p className="font-display text-[26px] leading-none tracking-[-0.03em]">
            Niwas <span className="align-middle font-sans text-[11px] font-medium tracking-[0.2em] text-white/60 uppercase">CRM</span>
          </p>
          <p className="mt-3 text-sm text-white/70">Your listings, leads and deals in one place.</p>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-[400px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mist-100 px-3 py-1 text-xs font-medium text-slate-500">
              <ShieldCheck className="size-3.5 text-accent-600" aria-hidden />
              Staff access only
            </span>
            <h1 className="mt-5 font-display text-h2">Welcome back</h1>
            <p className="mt-2 text-slate-500">Sign in to manage listings, leads and your team.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff-email" className="text-sm font-medium">
                  Work email
                </label>
                <IconInput
                  id="staff-email"
                  icon={Mail}
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="you@niwas.app"
                  invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'staff-email-error' : undefined}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="staff-email-error" className="text-[13px] text-danger">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff-password" className="text-sm font-medium">
                  Password
                </label>
                <IconInput
                  id="staff-password"
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'staff-password-error' : undefined}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-500 hover:bg-mist-100 hover:text-navy-900"
                    >
                      {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                    </button>
                  }
                  {...register('password')}
                />
                {errors.password && (
                  <p id="staff-password-error" className="text-[13px] text-danger">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {formError && (
                <p className="rounded-field border border-danger/20 bg-[#fdf3f2] px-3.5 py-2.5 text-sm text-danger" role="alert">
                  {formError}
                </p>
              )}

              <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
                Sign in to the CRM
              </Button>
            </form>

            <div className="mt-8 border-t border-line pt-6 text-sm text-slate-500">
              <p>New agent? Ask your admin to add you under Team.</p>
              <Link to="/" className="mt-3 inline-flex items-center gap-1.5 font-medium text-navy-900 hover:text-accent-700">
                <ArrowLeft className="size-4" aria-hidden />
                Back to the website
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
