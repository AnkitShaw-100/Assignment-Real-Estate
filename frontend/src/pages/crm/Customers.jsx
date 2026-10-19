import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import clsx from 'clsx';
import { Plus, Search, UsersRound } from 'lucide-react';
import { useCustomers } from '../../hooks/useCrm';
import { useDebounced } from '../../hooks/useDebounced';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Card, PageHeader } from '../../routes/DashboardLayout';
import { CustomerForm } from '../../components/crm/CustomerForm';
import { Modal } from '../../components/ui/Overlay';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Segmented } from '../../components/site/Filters';
import { Avatar, EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import { CUSTOMER_TYPES, labelOf } from '../../lib/constants';
import { budgetText, timeAgo } from '../../lib/format';


export default function Customers() {
  usePageTitle('Customers');
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const type = params.get('type') ?? '';
  const page = Number(params.get('page')) || 1;
  const { data, isPending, isFetching, isError, error, refetch } = useCustomers({ q, type, page, limit: 20 });
  const [adding, setAdding] = useState(false);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
      else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Customers"
        description={data ? `${data.total} ${data.total === 1 ? 'customer' : 'customers'}` : 'Loading…'}
        actions={<Button variant="dark" size="sm" icon={Plus} onClick={() => setAdding(true)}>Add customer</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or phone" className="pl-10" aria-label="Search customers" />
        </div>
        <Segmented label="Customer type" value={type} onChange={(v) => setParam('type', v)} options={[{ value: '', label: 'All' }, ...CUSTOMER_TYPES]} className="md:w-[440px]" />
      </div>

      <Card className={clsx('overflow-hidden transition-opacity', isFetching && !isPending && 'opacity-70')}>
        {isError ? (
          <ErrorState error={error} onRetry={refetch} className="m-5" />
        ) : isPending ? (
          <div className="space-y-2 p-5">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title={q || type ? 'No customers match' : 'No customers yet'}
            description="Customers are created when you convert or win a lead, or you can add one here."
            action={<Button variant="dark" size="sm" onClick={() => setAdding(true)}>Add customer</Button>}
            className="m-5 border-0"
          />
        ) : (
          <ul className="divide-y divide-line">
            {data.data.map((c) => (
              <li key={c._id}>
                <Link to={`/dashboard/customers/${c._id}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-mist-100/70 md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <Avatar user={{ name: c.name }} size={40} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-sm text-slate-500">{c.email}</p>
                  </div>
                  <div className="hidden min-w-0 md:block">
                    <p className="text-sm">{budgetText(c.requirements)}</p>
                    <p className="truncate text-sm text-slate-500">{c.requirements?.locations?.join(', ') || 'Any location'}</p>
                  </div>
                  <div className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
                    {c.assignedAgent && <><Avatar user={c.assignedAgent} size={24} /> {c.assignedAgent.name}</>}
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-mist-100 px-2.5 py-1 text-xs font-medium">{labelOf(CUSTOMER_TYPES, c.type)}</span>
                    <p className="mt-1.5 text-xs text-slate-400">{c.deals?.length ? `${c.deals.length} ${c.deals.length === 1 ? 'deal' : 'deals'} · ` : ''}{timeAgo(c.updatedAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {data?.pages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-slate-500">
            <span className="tabular">Page {data.page} of {data.pages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page >= data.pages} onClick={() => setParam('page', String(page + 1))}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a customer" width="max-w-2xl">
        <CustomerForm onDone={() => setAdding(false)} />
      </Modal>
    </>
  );
}
