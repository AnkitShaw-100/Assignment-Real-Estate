import { useState } from 'react';
import clsx from 'clsx';
import { useSession } from '../../auth/AuthContext';
import { useChangeRole, useSetActive, useTeam } from '../../hooks/useCrm';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Card, PageHeader } from '../../routes/DashboardLayout';
import { Segmented } from '../../components/site/Filters';
import { Select } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Avatar, ErrorState, Skeleton } from '../../components/ui/States';
import { formatDate, formatPrice } from '../../lib/format';

const ROLES = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'agent', label: 'Agent' },
  { value: 'admin', label: 'Admin' },
];

export default function Team() {
  usePageTitle('Team');
  const { me } = useSession();
  const { data = [], isPending, isError, error, refetch } = useTeam();
  const changeRole = useChangeRole();
  const setActive = useSetActive();
  const [show, setShow] = useState('staff');

  const rows = data.filter((u) => (show === 'staff' ? u.role !== 'buyer' : u.role === 'buyer'));

  return (
    <>
      <PageHeader
        title="Team"
        description="New sign-ups start as buyers. Promote someone to agent to give them CRM access."
        actions={
          <Segmented label="Show" value={show} onChange={setShow} options={[{ value: 'staff', label: 'Staff' }, { value: 'buyers', label: 'Buyers' }]} className="w-56" />
        }
      />
      <Card className="overflow-hidden">
        {isError ? (
          <ErrorState error={error} onRetry={refetch} className="m-5" />
        ) : isPending ? (
          <div className="space-y-2 p-5">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : rows.length === 0 ? (
          <p className="p-10 text-center text-slate-500">{show === 'buyers' ? 'No buyer accounts yet.' : 'No staff yet.'}</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((u) => {
              const self = u._id === me?._id;
              return (
                <li key={u._id} className={clsx('flex flex-wrap items-center gap-4 px-5 py-4', !u.active && 'opacity-60')}>
                  <Avatar user={u} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {u.name} {self && <span className="text-sm font-normal text-slate-500">(you)</span>}
                      {!u.active && <span className="ml-2 rounded-full bg-mist-100 px-2 py-0.5 text-xs text-slate-500">Deactivated</span>}
                    </p>
                    <p className="truncate text-sm text-slate-500">{u.email} · joined {formatDate(u.createdAt, { month: 'short', year: 'numeric' })}</p>
                  </div>
                  {u.role !== 'buyer' && (
                    <dl className="hidden gap-8 text-sm md:flex">
                      <div><dt className="text-slate-500">Open leads</dt><dd className="font-semibold tabular">{u.openLeads}</dd></div>
                      <div><dt className="text-slate-500">Deals won</dt><dd className="font-semibold tabular">{u.won}</dd></div>
                      <div className="w-24"><dt className="text-slate-500">Revenue</dt><dd className="font-semibold tabular">{formatPrice(u.revenue, { compact: true })}</dd></div>
                    </dl>
                  )}
                  <Select
                    aria-label={`Role for ${u.name}`}
                    value={u.role}
                    options={ROLES}
                    disabled={self || changeRole.isPending}
                    onChange={(e) => changeRole.mutate({ id: u._id, role: e.target.value })}
                    className="w-32"
                  />
                  {/* Fixed-width slot keeps columns aligned on your own row, which has no button */}
                  <div className="flex w-28 justify-end">
                    {!self && (
                      <Button variant={u.active ? 'danger-ghost' : 'secondary'} size="sm" onClick={() => setActive.mutate({ id: u._id, active: !u.active })}>
                        {u.active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
