import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import clsx from 'clsx';
import { Plus, Search, UserRoundSearch } from 'lucide-react';
import { useSession } from '../../auth/AuthContext';
import { useAgents, useLeads } from '../../hooks/useCrm';
import { useDebounced } from '../../hooks/useDebounced';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Card, PageHeader } from '../../routes/DashboardLayout';
import { LeadDrawer } from '../../components/crm/LeadDrawer';
import { LeadForm } from '../../components/crm/LeadForm';
import { Modal } from '../../components/ui/Overlay';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { StageBadge } from '../../components/ui/Badge';
import { Avatar, EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import { LEAD_SOURCES, LEAD_STAGES, labelOf } from '../../lib/constants';
import { formatDate, timeAgo } from '../../lib/format';

const FOLLOW_UPS = [
  { value: 'overdue', label: 'Overdue follow-ups' },
  { value: 'today', label: 'Follow up today' },
  { value: 'upcoming', label: 'Upcoming follow-ups' },
];

export default function Leads() {
  usePageTitle('Leads');
  const { isAdmin } = useSession();
  const { data: agents = [] } = useAgents();
  const [params, setParams] = useSearchParams();
  const values = useMemo(() => Object.fromEntries(params.entries()), [params]);
  const [search, setSearch] = useState(values.q ?? '');
  const q = useDebounced(search);

  const set = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) if (v) next.set(k, v);
      else next.delete(k);
    if (!('page' in patch) && !('open' in patch) && !('new' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  const query = { q, status: values.status, source: values.source, assignedTo: values.agent, followUp: values.followUp, page: Number(values.page) || 1, limit: 20 };
  const { data, isPending, isFetching, isError, error, refetch } = useLeads(query);
  const listKey = ['leads', Object.fromEntries(Object.entries(query).filter(([, v]) => v !== '' && v !== undefined))];
  const now = Date.now();

  return (
    <>
      <PageHeader
        title="Leads"
        description={data ? `${data.total} ${data.total === 1 ? 'lead' : 'leads'}` : 'Loading…'}
        actions={
          <Button variant="dark" size="sm" icon={Plus} onClick={() => set({ new: '1' })}>
            Add lead
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or phone" className="pl-10" aria-label="Search leads" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select aria-label="Stage" value={values.status ?? ''} onChange={(e) => set({ status: e.target.value })} placeholder="All stages" options={LEAD_STAGES} className="sm:w-40" />
          <Select aria-label="Source" value={values.source ?? ''} onChange={(e) => set({ source: e.target.value })} placeholder="All sources" options={LEAD_SOURCES} className="sm:w-40" />
          <Select aria-label="Follow-up" value={values.followUp ?? ''} onChange={(e) => set({ followUp: e.target.value })} placeholder="Any follow-up" options={FOLLOW_UPS} className="sm:w-48" />
          {isAdmin && <Select aria-label="Agent" value={values.agent ?? ''} onChange={(e) => set({ agent: e.target.value })} placeholder="All agents" options={agents.map((a) => ({ value: a._id, label: a.name }))} className="sm:w-44" />}
        </div>
      </div>

      <Card className={clsx('overflow-hidden transition-opacity', isFetching && !isPending && 'opacity-70')}>
        {isError ? (
          <ErrorState error={error} onRetry={refetch} className="m-5" />
        ) : isPending ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={UserRoundSearch}
            title={q || values.status || values.source || values.followUp ? 'No leads match these filters' : 'No leads yet'}
            description="Leads from the website inquiry form appear here automatically. You can also add one by hand."
            action={<Button variant="dark" size="sm" onClick={() => set({ new: '1' })}>Add lead</Button>}
            className="m-5 border-0"
          />
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-left text-[15px] md:table">
              <thead className="border-b border-line bg-mist-100/60 text-[13px] text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Name</th>
                  <th scope="col" className="px-3 py-3 font-medium">Interested in</th>
                  <th scope="col" className="px-3 py-3 font-medium">Source</th>
                  <th scope="col" className="px-3 py-3 font-medium">Stage</th>
                  {isAdmin && <th scope="col" className="px-3 py-3 font-medium">Agent</th>}
                  <th scope="col" className="px-3 py-3 font-medium">Follow-up</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.data.map((l) => {
                  const overdue = l.followUpDate && new Date(l.followUpDate) < now && !['won', 'lost'].includes(l.status);
                  return (
                    <tr key={l._id} className="cursor-pointer transition-colors hover:bg-mist-100/70" onClick={() => set({ open: l._id })}>
                      <td className="px-5 py-3">
                        {/* The name is the real, keyboard-reachable control; the row click is a shortcut */}
                        <button type="button" onClick={(e) => { e.stopPropagation(); set({ open: l._id }); }} className="text-left font-medium hover:underline">
                          {l.name}
                        </button>
                        <p className="text-[13px] text-slate-500">{l.email}</p>
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-3 text-slate-500">{l.property?.title ?? 'General inquiry'}</td>
                      <td className="px-3 py-3 text-slate-500">{labelOf(LEAD_SOURCES, l.source)}</td>
                      <td className="px-3 py-3"><StageBadge stage={l.status} /></td>
                      {isAdmin && (
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-2 text-sm"><Avatar user={l.assignedTo} size={24} />{l.assignedTo?.name?.split(' ')[0]}</span>
                        </td>
                      )}
                      <td className={clsx('px-3 py-3 text-sm', overdue ? 'font-medium text-danger' : 'text-slate-500')}>
                        {l.followUpDate ? `${overdue ? 'Overdue · ' : ''}${formatDate(l.followUpDate, { day: 'numeric', month: 'short' })}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-slate-500">{timeAgo(l.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {data.data.map((l) => (
                <li key={l._id}>
                  <button type="button" onClick={() => set({ open: l._id })} className="flex w-full items-start gap-3 px-4 py-4 text-left">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{l.name}</p>
                      <p className="truncate text-sm text-slate-500">{l.property?.title ?? 'General inquiry'}</p>
                      <p className="mt-1 text-xs text-slate-400">{labelOf(LEAD_SOURCES, l.source)} · {timeAgo(l.createdAt)}</p>
                    </div>
                    <StageBadge stage={l.status} />
                  </button>
                </li>
              ))}
            </ul>

            {data.pages > 1 && (
              <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-slate-500">
                <span className="tabular">Page {data.page} of {data.pages}</span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={data.page <= 1} onClick={() => set({ page: String(data.page - 1) })}>Previous</Button>
                  <Button variant="secondary" size="sm" disabled={data.page >= data.pages} onClick={() => set({ page: String(data.page + 1) })}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <LeadDrawer leadId={values.open} onClose={() => set({ open: '' })} listKey={listKey} />
      <Modal open={values.new === '1'} onClose={() => set({ new: '' })} title="Add a lead" description="For calls, walk-ins and referrals." width="max-w-2xl">
        <LeadForm onDone={() => set({ new: '' })} />
      </Modal>
    </>
  );
}
