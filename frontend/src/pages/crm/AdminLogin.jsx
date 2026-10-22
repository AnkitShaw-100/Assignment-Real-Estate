import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from '../../components/ui/icons';
import { useSession } from '../../auth/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageSkeleton } from '../../routes/guards';
import { Field, Input, TextField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

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
    <main className="grid min-h-dvh place-items-center bg-navy-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center font-display text-[28px] leading-none tracking-[-0.03em] text-white">
          Niwas <span className="align-middle text-xs font-sans font-medium tracking-[0.18em] text-white/50 uppercase">CRM</span>
        </p>
        <div className="rounded-panel bg-paper p-7 shadow-lift">
          <h1 className="font-display text-h3">Staff sign in</h1>
          <p className="mt-1 text-sm text-slate-500">For Niwas admins and agents.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
            <TextField label="Email" type="email" autoComplete="username" inputMode="email" error={errors.email?.message} {...register('email')} />
            <Field label="Password" error={errors.password?.message}>
              {(a11y) => (
                <div className="relative">
                  <Input {...a11y} type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="pr-11" {...register('password')} />
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
            <Button type="submit" variant="dark" size="lg" loading={isSubmitting} className="mt-1 w-full">
              Sign in to the CRM
            </Button>
          </form>
          <p className="mt-5 text-center text-[13px] text-slate-500">Agent accounts are created by your admin.</p>
        </div>
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-white/60 hover:text-white">
            ← Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
