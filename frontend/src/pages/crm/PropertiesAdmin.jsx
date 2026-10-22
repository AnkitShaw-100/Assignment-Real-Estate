import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import clsx from 'clsx';
import { Building2, Eye, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { useSession } from '../../auth/AuthContext';
import { useDeleteProperty, useManagedProperties } from '../../hooks/useCrm';
import { useDebounced } from '../../hooks/useDebounced';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Card, PageHeader } from '../../routes/DashboardLayout';
import { Segmented } from '../../components/site/Filters';
import { Modal } from '../../components/ui/Overlay';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { PropertyStatusBadge } from '../../components/ui/Badge';
import { Avatar, EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import { PROPERTY_STATUSES } from '../../lib/constants';
import { coverOf, formatNumber, formatPrice, imageUrl } from '../../lib/format';

export default function PropertiesAdmin() {
  usePageTitle('Properties');
  const { isAdmin } = useSession();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const status = params.get('status') ?? '';
  const page = Number(params.get('page')) || 1;
  const { data, isPending, isFetching, isError, error, refetch } = useManagedProperties({ q, status, page, limit: 20 });
  const remove = useDeleteProperty();
  const [confirming, setConfirming] = useState(null);

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
        title="Properties"
        description={isAdmin ? 'Every listing across the company' : 'Listings you manage'}
        actions={<Button to="/dashboard/properties/new" variant="dark" size="sm" icon={Plus}>Add property</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or city" className="pl-10" aria-label="Search properties" />
        </div>
        <div className="scrollbar-none overflow-x-auto">
          <Segmented label="Status" value={status} onChange={(v) => setParam('status', v)} options={[{ value: '', label: 'All' }, ...PROPERTY_STATUSES]} className="min-w-[560px]" />
        </div>
      </div>

      <Card className={clsx('overflow-hidden transition-opacity', isFetching && !isPending && 'opacity-70')}>
        {isError ? (
          <ErrorState error={error} onRetry={refetch} className="m-5" />
        ) : isPending ? (
          <div className="space-y-2 p-5">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={q || status ? 'No properties match' : 'No properties yet'}
            description="Add your first listing with photos, price and details. It goes live on the website straight away."
            action={<Button to="/dashboard/properties/new" variant="dark" size="sm">Add property</Button>}
            className="m-5 border-0"
          />
        ) : (
          <ul className="divide-y divide-line">
            {data.data.map((p) => (
              <li key={p._id} className="flex items-center gap-4 px-4 py-3 md:px-5">
                <img src={imageUrl(coverOf(p)?.url, 200)} alt="" className="h-14 w-20 shrink-0 rounded-[10px] bg-mist-100 object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <Link to={`/dashboard/properties/${p._id}/edit`} className="flex items-center gap-1.5 font-medium hover:underline">
                    <span className="truncate">{p.title}</span>
                    {p.featured && <Star className="size-3.5 shrink-0 fill-accent-400 text-accent-500" aria-label="Featured" />}
                  </Link>
                  <p className="truncate text-sm text-slate-500">{p.location.city}, {p.location.country} · {formatPrice(p.price, { purpose: p.purpose })}</p>
                </div>
                <div className="hidden w-32 items-center gap-2 text-sm text-slate-500 lg:flex">
                  {isAdmin && p.agent && <><Avatar user={p.agent} size={24} /> <span className="truncate">{p.agent.name.split(' ')[0]}</span></>}
                </div>
                <span className="hidden w-20 text-right text-sm text-slate-500 tabular md:block" title="Page views">
                  <Eye className="mr-1 inline size-3.5" />{formatNumber(p.views)}
                </span>
                <div className="hidden w-28 sm:block"><PropertyStatusBadge status={p.status} /></div>
                <div className="flex shrink-0 gap-1">
                  <Button to={`/dashboard/properties/${p._id}/edit`} variant="ghost" size="icon" aria-label={`Edit ${p.title}`}><Pencil className="size-4" /></Button>
                  <Button variant="danger-ghost" size="icon" aria-label={`Delete ${p.title}`} onClick={() => setConfirming(p)}><Trash2 className="size-4" /></Button>
                </div>
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

      <Modal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title="Delete this property?"
        description={confirming?.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(null)}>Cancel</Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(confirming._id, { onSuccess: () => setConfirming(null) })}>
              Delete property
            </Button>
          </>
        }
      >
        <p className="text-slate-500">It disappears from the website and its photos are removed. Leads that mention it keep their history.</p>
      </Modal>
    </>
  );
}
