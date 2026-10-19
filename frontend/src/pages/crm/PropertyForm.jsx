import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { useSession } from '../../auth/AuthContext';
import { useAgents, useManagedProperty, useSaveProperty } from '../../hooks/useCrm';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Card, PageHeader } from '../../routes/DashboardLayout';
import { ImageManager } from '../../components/crm/ImageManager';
import { Segmented } from '../../components/site/Filters';
import { Button } from '../../components/ui/Button';
import { Field, Select, Textarea, TextField } from '../../components/ui/Field';
import { ErrorState, Skeleton } from '../../components/ui/States';
import { AMENITIES, PROPERTY_STATUSES, PROPERTY_TYPES } from '../../lib/constants';

const int = (label, max) => z.string().regex(/^\d*$/, `${label} must be a whole number`).refine((v) => v === '' || Number(v) <= max, `${label} looks too high`);

// Mirrors the API's property schema; numbers stay strings in the form and are converted on submit
const schema = z.object({
  title: z.string().trim().min(3, 'Title is too short').max(140),
  description: z.string().trim().min(20, 'Write at least 20 characters').max(5000),
  category: z.enum(['residential', 'commercial']),
  type: z.string().min(1, 'Choose a type'),
  purpose: z.enum(['sale', 'rent']),
  price: z.string().regex(/^\d+$/, 'Enter the price in whole dollars'),
  address: z.string().max(200),
  area: z.string().max(80),
  city: z.string().trim().min(2, 'Enter the city'),
  country: z.string().trim().min(2, 'Enter the country'),
  bedrooms: int('Bedrooms', 50),
  bathrooms: int('Bathrooms', 50),
  areaSqft: int('Area', 10_000_000),
  parking: int('Parking', 50),
  yearBuilt: z.string().regex(/^$|^(1[89]\d\d|20\d\d|2100)$/, 'Enter a year like 2015'),
  amenities: z.array(z.string()),
  images: z.array(z.object({ url: z.string(), publicId: z.string().optional(), alt: z.string().optional() })).min(1, 'Add at least one photo'),
  coverIndex: z.number(),
  status: z.string(),
  featured: z.boolean(),
  agent: z.string(),
});

const EMPTY = {
  title: '', description: '', category: 'residential', type: '', purpose: 'sale', price: '', address: '', area: '', city: '', country: '',
  bedrooms: '', bathrooms: '', areaSqft: '', parking: '', yearBuilt: '', amenities: [], images: [], coverIndex: 0, status: 'available', featured: false, agent: '',
};

const str = (v) => (v == null ? '' : String(v));
function toForm(p) {
  return {
    ...EMPTY,
    ...Object.fromEntries(['title', 'description', 'category', 'type', 'purpose', 'status'].map((k) => [k, p[k]])),
    price: str(p.price), bedrooms: str(p.bedrooms), bathrooms: str(p.bathrooms), areaSqft: str(p.areaSqft), parking: str(p.parking), yearBuilt: str(p.yearBuilt),
    address: p.location?.address ?? '', area: p.location?.area ?? '', city: p.location?.city ?? '', country: p.location?.country ?? '',
    amenities: p.amenities ?? [], images: (p.images ?? []).map(({ url, publicId, alt }) => ({ url, publicId, alt })), coverIndex: p.coverIndex ?? 0,
    featured: Boolean(p.featured), agent: p.agent?._id ?? '',
  };
}
const n = (v) => (v === '' ? undefined : Number(v));
function toBody(v, isAdmin) {
  return {
    title: v.title, description: v.description, category: v.category, type: v.type, purpose: v.purpose, price: Number(v.price),
    location: { address: v.address || undefined, area: v.area || undefined, city: v.city, country: v.country },
    bedrooms: n(v.bedrooms) ?? 0, bathrooms: n(v.bathrooms) ?? 0, areaSqft: n(v.areaSqft), parking: n(v.parking) ?? 0, yearBuilt: n(v.yearBuilt),
    amenities: v.amenities, images: v.images, coverIndex: v.coverIndex, status: v.status, featured: v.featured,
    ...(isAdmin && v.agent ? { agent: v.agent } : {}),
  };
}

function Section({ title, description, children }) {
  return (
    <Card className="grid gap-6 p-5 md:grid-cols-[220px_minmax(0,1fr)] md:p-7">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </Card>
  );
}

export default function PropertyForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { isAdmin } = useSession();
  const { data: agents = [] } = useAgents();
  const { data: property, isPending, isError, error } = useManagedProperty(id);
  const save = useSaveProperty({ onSuccess: () => navigate('/dashboard/properties') });
  usePageTitle(editing ? 'Edit property' : 'Add property');

  const { register, handleSubmit, control, reset, watch, setValue, setError, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });
  useEffect(() => {
    if (property) reset(toForm(property));
  }, [property, reset]);

  const category = watch('category');
  const purpose = watch('purpose');
  const types = PROPERTY_TYPES.filter((t) => t.category === category || t.value === 'land');

  const submit = (v) =>
    save.mutate(
      { id, ...toBody(v, isAdmin) },
      {
        onError: (err) => {
          // API field paths like "location.city" map onto our flat form fields
          for (const [path, msgs] of Object.entries(err.details ?? {})) setError(path.replace('location.', ''), { message: msgs[0] });
        },
      },
    );

  if (editing && isError) return <ErrorState error={error} />;
  if (editing && isPending) return <Skeleton className="h-[600px] rounded-panel" />;

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <PageHeader
        title={editing ? property.title : 'Add a property'}
        actions={
          <>
            {editing && (
              <Button to={`/properties/${property.slug}`} target="_blank" variant="secondary" size="sm" icon={ExternalLink}>
                View on website
              </Button>
            )}
            <Button type="submit" variant="dark" size="sm" loading={save.isPending} disabled={editing && !isDirty}>
              {editing ? 'Save changes' : 'Add property'}
            </Button>
          </>
        }
      >
        <Link to="/dashboard/properties" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-navy-900">
          <ChevronLeft className="size-4" /> Properties
        </Link>
      </PageHeader>

      <div className="space-y-5">
        <Section title="Basics" description="What buyers see first on the listing.">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Title" required className="sm:col-span-2" error={errors.title?.message} placeholder="Seaside villa with private pool" {...register('title')} />
            <Field label="Description" required className="sm:col-span-2" error={errors.description?.message}>
              {(a) => <Textarea {...a} rows={6} placeholder="Light, layout, neighbourhood, what makes it special…" {...register('description')} />}
            </Field>
            <Controller control={control} name="category" render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Use</span>
                <Segmented label="Use" value={field.value} onChange={(v) => { field.onChange(v); setValue('type', '', { shouldDirty: true }); }} options={[{ value: 'residential', label: 'Residential' }, { value: 'commercial', label: 'Commercial' }]} />
              </div>
            )} />
            <Controller control={control} name="purpose" render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Listing for</span>
                <Segmented label="Listing for" value={field.value} onChange={field.onChange} options={[{ value: 'sale', label: 'Sale' }, { value: 'rent', label: 'Rent' }]} />
              </div>
            )} />
            <Field label="Type" required error={errors.type?.message}>{(a) => <Select {...a} placeholder="Choose a type" options={types} {...register('type')} />}</Field>
            <TextField label={purpose === 'rent' ? 'Rent per month (USD)' : 'Price (USD)'} required inputMode="numeric" error={errors.price?.message} {...register('price')} />
          </div>
        </Section>

        <Section title="Location">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Street address" className="sm:col-span-2" error={errors.address?.message} {...register('address')} />
            <TextField label="Neighbourhood" error={errors.area?.message} {...register('area')} />
            <TextField label="City" required error={errors.city?.message} {...register('city')} />
            <TextField label="Country" required error={errors.country?.message} {...register('country')} />
          </div>
        </Section>

        <Section title="Details">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <TextField label="Bedrooms" inputMode="numeric" error={errors.bedrooms?.message} {...register('bedrooms')} />
            <TextField label="Bathrooms" inputMode="numeric" error={errors.bathrooms?.message} {...register('bathrooms')} />
            <TextField label="Area (sq ft)" inputMode="numeric" error={errors.areaSqft?.message} {...register('areaSqft')} />
            <TextField label="Parking" inputMode="numeric" error={errors.parking?.message} {...register('parking')} />
            <TextField label="Year built" inputMode="numeric" error={errors.yearBuilt?.message} {...register('yearBuilt')} />
          </div>
          <Controller control={control} name="amenities" render={({ field }) => (
            <fieldset className="mt-6">
              <legend className="mb-2 text-sm font-medium">Amenities</legend>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => {
                  const on = field.value.includes(a);
                  return (
                    <button key={a} type="button" aria-pressed={on} onClick={() => field.onChange(on ? field.value.filter((x) => x !== a) : [...field.value, a])}
                      className={`h-9 rounded-full border px-3.5 text-sm transition-colors ${on ? 'border-navy-900 bg-navy-900 text-white' : 'border-line hover:border-navy-600'}`}>
                      {a}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )} />
        </Section>

        <Section title="Photos" description="The cover photo appears on cards and at the top of the listing. Landscape photos work best.">
          <Controller control={control} name="images" render={({ field }) => (
            <ImageManager value={field.value} onChange={field.onChange} cover={watch('coverIndex')} onCoverChange={(i) => setValue('coverIndex', i, { shouldDirty: true })} error={errors.images?.message} />
          )} />
        </Section>

        <Section title="Visibility">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" hint="Drafts are hidden from the website.">{(a) => <Select {...a} options={PROPERTY_STATUSES} {...register('status')} />}</Field>
            {isAdmin && <Field label="Listing agent">{(a) => <Select {...a} placeholder="Me" options={agents.map((u) => ({ value: u._id, label: u.name }))} {...register('agent')} />}</Field>}
            <label className="flex items-center gap-3 sm:col-span-2">
              <input type="checkbox" className="size-5 rounded accent-navy-900" {...register('featured')} />
              <span>
                <span className="font-medium">Feature on the home page</span>
                <span className="block text-sm text-slate-500">Shown in the “Featured homes” carousel.</span>
              </span>
            </label>
          </div>
        </Section>

        <div className="flex justify-end gap-2 pb-6">
          <Button to="/dashboard/properties" variant="ghost">Cancel</Button>
          <Button type="submit" variant="dark" loading={save.isPending}>{editing ? 'Save changes' : 'Add property'}</Button>
        </div>
      </div>
    </form>
  );
}
