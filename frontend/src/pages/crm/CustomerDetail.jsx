import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, ChevronLeft, Mail, MapPin, MessageSquare, Pencil, Phone, StickyNote, Users } from 'lucide-react';
import { useAddInteraction, useCustomer, useCustomerMatches } from '../../hooks/useCrm';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Card, PageHeader } from '../../routes/DashboardLayout';
import { CustomerForm } from '../../components/crm/CustomerForm';
import { budgetText } from './Customers';
import { Modal } from '../../components/ui/Overlay';
import { Button } from '../../components/ui/Button';
import { Select, Textarea } from '../../components/ui/Field';
import { StageBadge } from '../../components/ui/Badge';
import { Avatar, ErrorState, Skeleton } from '../../components/ui/States';
import { CUSTOMER_TYPES, INTERACTION_KINDS, LEAD_SOURCES, PROPERTY_TYPES, labelOf } from '../../lib/constants';
import { coverOf, formatDate, formatDateTime, formatPrice, imageUrl, timeAgo } from '../../lib/format';
import { ease } from '../../lib/motion';

const KIND_ICON = { call: Phone, email: Mail, meeting: Users, site_visit: MapPin, note: StickyNote };

function InteractionComposer({ customerId }) {
  const [kind, setKind] = useState('call');
  const [summary, setSummary] = useState('');
  const add = useAddInteraction({ onSuccess: () => setSummary('') });
  return (
    <form
      className="rounded-card border border-line p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (summary.trim().length >= 2) add.mutate({ id: customerId, kind, summary: summary.trim() });
      }}
    >
      <Textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What did you talk about?" aria-label="Interaction summary" className="border-0 px-1 focus:ring-0" />
      <div className="mt-2 flex items-center justify-between gap-2">
        <Select aria-label="Interaction type" value={kind} onChange={(e) => setKind(e.target.value)} options={INTERACTION_KINDS} className="w-40" />
        <Button type="submit" variant="dark" size="sm" disabled={summary.trim().length < 2} loading={add.isPending}>
          Log interaction
        </Button>
      </div>
    </form>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const { data: c, isPending, isError, error, refetch } = useCustomer(id);
  const { data: matches = [] } = useCustomerMatches(id);
  const [editing, setEditing] = useState(false);
  usePageTitle(c?.name ?? 'Customer');

  if (isError) return <ErrorState error={error} onRetry={error.status === 404 ? undefined : refetch} />;
  if (isPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-1/3" />
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]"><Skeleton className="h-96 rounded-panel" /><Skeleton className="h-96 rounded-panel" /></div>
      </div>
    );
  }

  const r = c.requirements ?? {};
  const totalDeals = c.deals.reduce((s, d) => s + d.value, 0);

  return (
    <>
      <PageHeader
        title={c.name}
        description={`${labelOf(CUSTOMER_TYPES, c.type)} · customer since ${formatDate(c.createdAt, { month: 'long', year: 'numeric' })}`}
        actions={<Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(true)}>Edit customer</Button>}
      >
        <Link to="/dashboard/customers" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-navy-900">
          <ChevronLeft className="size-4" /> Customers
        </Link>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card className="p-5 md:p-6">
            <h2 className="mb-4 text-[17px] font-semibold">Looking for</h2>
            <dl className="grid gap-5 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <dt className="text-sm text-slate-500">Budget</dt>
                <dd className="mt-1 text-lg font-semibold tabular">{budgetText(r)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Bedrooms</dt>
                <dd className="mt-1 text-lg font-semibold">{r.bedrooms ? `${r.bedrooms}+` : 'Any'}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Types</dt>
                <dd className="mt-1">{r.types?.length ? r.types.map((t) => labelOf(PROPERTY_TYPES, t)).join(', ') : 'Any'}</dd>
              </div>
              <div className="sm:col-span-4">
                <dt className="text-sm text-slate-500">Preferred cities</dt>
                <dd className="mt-1.5 flex flex-wrap gap-2">
                  {r.locations?.length ? r.locations.map((l) => <span key={l} className="rounded-full bg-mist-100 px-3 py-1 text-sm">{l}</span>) : 'Anywhere'}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5 md:p-6">
            <h2 className="mb-4 text-[17px] font-semibold">Interaction history</h2>
            <InteractionComposer customerId={c._id} />
            {c.interactions.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">No interactions yet. Log the first call or meeting above.</p>
            ) : (
              <ol className="relative mt-6 space-y-5 border-l border-line pl-7">
                <AnimatePresence initial={false}>
                  {c.interactions.map((i) => {
                    const Icon = KIND_ICON[i.kind] ?? MessageSquare;
                    return (
                      <motion.li key={i._id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: ease.out }} className="relative">
                        <span className="absolute top-0 -left-[42px] grid size-7 place-items-center rounded-full bg-paper ring-1 ring-line" aria-hidden>
                          <Icon className="size-3.5 text-navy-700" strokeWidth={1.75} />
                        </span>
                        <p className="text-sm text-slate-500">
                          <span className="font-medium text-navy-900">{labelOf(INTERACTION_KINDS, i.kind)}</span> · {i.by?.name ?? 'Team'} · <time dateTime={i.at} title={formatDateTime(i.at)}>{timeAgo(i.at)}</time>
                        </p>
                        <p className="mt-1 text-[15px] leading-relaxed">{i.summary}</p>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-3 p-5 md:p-6 text-[15px]">
            <h2 className="text-[17px] font-semibold">Contact</h2>
            <a href={`mailto:${c.email}`} className="flex items-center gap-3 hover:underline"><Mail className="size-4 text-slate-500" strokeWidth={1.5} /> {c.email}</a>
            {c.phone && <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 hover:underline"><Phone className="size-4 text-slate-500" strokeWidth={1.5} /> {c.phone}</a>}
            {c.assignedAgent && (
              <div className="flex items-center gap-3 border-t border-line pt-3">
                <Avatar user={c.assignedAgent} size={32} />
                <div><p className="text-sm text-slate-500">Agent</p><p className="font-medium">{c.assignedAgent.name}</p></div>
              </div>
            )}
          </Card>

          <Card className="p-5 md:p-6">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[17px] font-semibold">Deals</h2>
              {totalDeals > 0 && <span className="text-sm font-semibold tabular">{formatPrice(totalDeals)}</span>}
            </div>
            {c.deals.length === 0 ? (
              <p className="text-sm text-slate-500">No closed deals yet.</p>
            ) : (
              <ul className="space-y-3">
                {c.deals.map((d, i) => (
                  <li key={i} className="flex items-center gap-3">
                    {coverOf(d.property) && <img src={imageUrl(coverOf(d.property).url, 160)} alt="" className="size-12 rounded-[10px] object-cover" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{d.property?.title ?? 'Deal without a listing'}</p>
                      <p className="text-sm text-slate-500"><CalendarDays className="mr-1 inline size-3.5" />{formatDate(d.closedAt)}</p>
                    </div>
                    <span className="font-semibold tabular">{formatPrice(d.value, { compact: true })}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5 md:p-6">
            <h2 className="mb-3 text-[17px] font-semibold">Leads</h2>
            <ul className="space-y-2">
              {c.leads.map((l) => (
                <li key={l._id}>
                  <Link to={`/dashboard/leads?open=${l._id}`} className="-mx-2 flex items-center justify-between rounded-[10px] px-2 py-2 text-sm hover:bg-mist-100">
                    <span>{formatDate(l.createdAt)} · {labelOf(LEAD_SOURCES, l.source)}</span>
                    <StageBadge stage={l.status} />
                  </Link>
                </li>
              ))}
              {c.leads.length === 0 && <li className="text-sm text-slate-500">No linked leads.</li>}
            </ul>
          </Card>

          <Card className="p-5 md:p-6">
            <h2 className="mb-1 text-[17px] font-semibold">Matching properties</h2>
            <p className="mb-4 text-sm text-slate-500">Available listings that fit what they’re looking for.</p>
            {matches.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing matches right now. Try widening the budget or locations.</p>
            ) : (
              <ul className="space-y-3">
                {matches.map((p) => (
                  <li key={p._id}>
                    <Link to={`/properties/${p.slug}`} target="_blank" className="flex items-center gap-3 rounded-[10px] hover:bg-mist-100">
                      <img src={imageUrl(coverOf(p)?.url, 160)} alt="" className="size-14 shrink-0 rounded-[10px] object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.title}</p>
                        <p className="text-sm text-slate-500 tabular">{formatPrice(p.price, { purpose: p.purpose })} · {p.location.city}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit customer" width="max-w-2xl">
        <CustomerForm customer={c} onDone={() => setEditing(false)} />
      </Modal>
    </>
  );
}
