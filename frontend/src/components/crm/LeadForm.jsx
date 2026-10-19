import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from '../../auth/AuthContext';
import { useAgents, useCreateLead } from '../../hooks/useCrm';
import { useProperties } from '../../hooks/usePublic';
import { Field, Select, Textarea, TextField } from '../ui/Field';
import { Button } from '../ui/Button';
import { LEAD_SOURCES } from '../../lib/constants';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter a name'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().regex(/^$|^[+\d][\d\s().-]{6,19}$/, 'Enter a valid phone number'),
  source: z.string(),
  intent: z.string(),
  property: z.string(),
  assignedTo: z.string(),
  followUpDate: z.string(),
  message: z.string().max(2000),
});

/** Manual lead entry for walk-ins, calls and referrals. */
export function LeadForm({ onDone }) {
  const { isAdmin } = useSession();
  const { data: agents = [] } = useAgents();
  const { data: properties } = useProperties({ limit: 48, sort: 'newest' });
  const create = useCreateLead({ onSuccess: onDone });

  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', source: 'phone', intent: 'buy', property: '', assignedTo: '', followUpDate: '', message: '' },
  });

  const submit = (v) => {
    // Send only filled fields; the API applies defaults for the rest
    const body = Object.fromEntries(Object.entries(v).filter(([, val]) => val !== ''));
    if (body.followUpDate) body.followUpDate = new Date(body.followUpDate).toISOString();
    create.mutate(body, {
      onError: (err) => Object.entries(err.details ?? {}).forEach(([f, m]) => setError(f, { message: m[0] })),
    });
  };

  return (
    <form id="lead-form" onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" required error={errors.name?.message} {...register('name')} data-autofocus />
        <TextField label="Email" type="email" required error={errors.email?.message} {...register('email')} />
        <TextField label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
        <Field label="Source">{(a) => <Select {...a} options={LEAD_SOURCES} {...register('source')} />}</Field>
        <Field label="Looking to">
          {(a) => (
            <Select
              {...a}
              options={[
                { value: 'buy', label: 'Buy' },
                { value: 'rent', label: 'Rent' },
                { value: 'visit', label: 'Visit a property' },
                { value: 'general', label: 'General' },
              ]}
              {...register('intent')}
            />
          )}
        </Field>
        <TextField label="Follow up on" type="datetime-local" {...register('followUpDate')} />
      </div>
      <Field label="Property of interest">
        {(a) => <Select {...a} placeholder="None yet" options={(properties?.data ?? []).map((p) => ({ value: p._id, label: `${p.title}, ${p.location.city}` }))} {...register('property')} />}
      </Field>
      {isAdmin && (
        <Field label="Assign to" hint="Leave empty to assign to yourself">
          {(a) => <Select {...a} placeholder="Me" options={agents.map((u) => ({ value: u._id, label: u.name }))} {...register('assignedTo')} />}
        </Field>
      )}
      <Field label="Notes from the conversation">{(a) => <Textarea {...a} rows={3} {...register('message')} />}</Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="dark" loading={create.isPending}>
          Add lead
        </Button>
      </div>
    </form>
  );
}
