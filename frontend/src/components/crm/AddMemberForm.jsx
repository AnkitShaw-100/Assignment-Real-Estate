import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAddMember } from '../../hooks/useCrm';
import { Field, Select, TextField } from '../ui/Field';
import { Button } from '../ui/Button';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter a name'),
  email: z.string().trim().min(1, 'Enter an email').email('Enter a valid email address'),
  role: z.enum(['agent', 'admin']),
  title: z.string().trim().max(60).optional(),
  password: z.string().min(8, 'Use at least 8 characters').max(72, 'Use 72 characters or fewer'),
});

/** Admin adds an agent or admin. They sign in at /admin/login with this password. */
export function AddMemberForm({ onDone }) {
  const add = useAddMember({ onSuccess: onDone });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { role: 'agent', title: '' } });

  const submit = (values) =>
    add.mutate(values, {
      onError: (err) => {
        for (const [field, messages] of Object.entries(err.details ?? {})) setError(field, { message: messages[0] });
      },
    });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Full name" required error={errors.name?.message} {...register('name')} />
        <TextField label="Email" type="email" required error={errors.email?.message} {...register('email')} />
        <Field label="Role">
          {(a) => (
            <Select
              {...a}
              options={[
                { value: 'agent', label: 'Agent (own leads and listings)' },
                { value: 'admin', label: 'Admin (everything)' },
              ]}
              {...register('role')}
            />
          )}
        </Field>
        <TextField label="Job title" placeholder="Senior agent" error={errors.title?.message} {...register('title')} />
      </div>
      <TextField
        label="Starting password"
        required
        autoComplete="new-password"
        hint="Share it with them; they sign in at /admin/login."
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="form-actions">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="dark" loading={add.isPending}>
          Add team member
        </Button>
      </div>
    </form>
  );
}
