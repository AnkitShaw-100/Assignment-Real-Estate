import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from '../../auth/AuthContext';
import { useAgents, useCreateCustomer, useUpdateCustomer } from '../../hooks/useCrm';
import { Field, Select, TextField } from '../ui/Field';
import { Button } from '../ui/Button';
import { CUSTOMER_TYPES, PROPERTY_TYPES } from '../../lib/constants';

const optionalNumber = z.string().regex(/^\d*$/, 'Numbers only');

const schema = z
  .object({
    name: z.string().trim().min(2, 'Enter a name'),
    email: z.string().trim().email('Enter a valid email'),
    phone: z.string().trim().regex(/^$|^[+\d][\d\s().-]{6,19}$/, 'Enter a valid phone number'),
    type: z.string(),
    assignedAgent: z.string(),
    budgetMin: optionalNumber,
    budgetMax: optionalNumber,
    locations: z.string(),
    types: z.array(z.string()),
    bedrooms: optionalNumber,
  })
  .refine((v) => !v.budgetMin || !v.budgetMax || Number(v.budgetMin) <= Number(v.budgetMax), {
    path: ['budgetMax'],
    message: 'Maximum must be at least the minimum',
  });

const num = (v) => (v === '' ? undefined : Number(v));

/** Create or edit a customer, including what they're looking for. */
export function CustomerForm({ customer, onDone }) {
  const { isAdmin } = useSession();
  const { data: agents = [] } = useAgents();
  const create = useCreateCustomer({ onSuccess: onDone });
  const update = useUpdateCustomer({ onSuccess: onDone });
  const r = customer?.requirements ?? {};

  const { register, handleSubmit, control, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      type: customer?.type ?? 'buyer',
      assignedAgent: customer?.assignedAgent?._id ?? '',
      budgetMin: r.budgetMin ? String(r.budgetMin) : '',
      budgetMax: r.budgetMax ? String(r.budgetMax) : '',
      locations: (r.locations ?? []).join(', '),
      types: r.types ?? [],
      bedrooms: r.bedrooms ? String(r.bedrooms) : '',
    },
  });

  const submit = (v) => {
    const body = {
      name: v.name,
      email: v.email,
      phone: v.phone || undefined,
      type: v.type,
      requirements: {
        budgetMin: num(v.budgetMin),
        budgetMax: num(v.budgetMax),
        locations: v.locations.split(',').map((s) => s.trim()).filter(Boolean),
        types: v.types,
        bedrooms: num(v.bedrooms),
      },
      ...(isAdmin && v.assignedAgent ? { assignedAgent: v.assignedAgent } : {}),
    };
    const onError = (err) => Object.entries(err.details ?? {}).forEach(([f, m]) => setError(f, { message: m[0] }));
    if (customer) update.mutate({ id: customer._id, ...body }, { onError });
    else create.mutate(body, { onError });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" required error={errors.name?.message} {...register('name')} data-autofocus />
        <TextField label="Email" type="email" required error={errors.email?.message} {...register('email')} />
        <TextField label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
        <Field label="Customer type">{(a) => <Select {...a} options={CUSTOMER_TYPES} {...register('type')} />}</Field>
        {isAdmin && (
          <Field label="Agent" className="sm:col-span-2">
            {(a) => <Select {...a} placeholder={customer ? 'Unassigned' : 'Me'} options={agents.map((u) => ({ value: u._id, label: u.name }))} {...register('assignedAgent')} />}
          </Field>
        )}
      </div>

      <fieldset className="rounded-card border border-line p-4">
        <legend className="px-1 text-sm font-semibold">Looking for</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Budget from" inputMode="numeric" placeholder="USD" error={errors.budgetMin?.message} {...register('budgetMin')} />
          <TextField label="Budget up to" inputMode="numeric" placeholder="USD" error={errors.budgetMax?.message} {...register('budgetMax')} />
          <TextField label="Bedrooms, at least" inputMode="numeric" error={errors.bedrooms?.message} {...register('bedrooms')} />
          <TextField label="Preferred cities" hint="Separate with commas" className="sm:col-span-3" {...register('locations')} />
        </div>
        <Controller
          control={control}
          name="types"
          render={({ field }) => (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Property types</p>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((t) => {
                  const on = field.value.includes(t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => field.onChange(on ? field.value.filter((x) => x !== t.value) : [...field.value, t.value])}
                      className={`h-9 rounded-full border px-3.5 text-sm transition-colors ${on ? 'border-navy-900 bg-navy-900 text-white' : 'border-line hover:border-navy-600'}`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        />
      </fieldset>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="dark" loading={create.isPending || update.isPending}>
          {customer ? 'Save changes' : 'Add customer'}
        </Button>
      </div>
    </form>
  );
}
