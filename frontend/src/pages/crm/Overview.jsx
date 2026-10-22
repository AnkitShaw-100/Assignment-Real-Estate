import { Link } from 'react-router';
import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight, CircleCheckBig } from '../../components/ui/icons';
import { useOverview } from '../../hooks/useCrm';
import { useSession } from '../../auth/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Card, PageHeader } from '../../routes/DashboardLayout';
import { HorizontalBars, SalesChart, sourceRows, stageRows } from '../../components/crm/Charts';
import { TaskRow } from '../../components/crm/TaskRow';
import { StageBadge } from '../../components/ui/Badge';
import { Avatar, EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import { Button } from '../../components/ui/Button';
import { formatNumber, formatPrice, timeAgo } from '../../lib/format';

function Delta({ value, suffix = 'vs last period' }) {
  if (value == null) return <p className="mt-2 text-[13px] text-slate-400">No earlier data to compare</p>;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="mt-2 flex items-center gap-1 text-[13px] text-slate-500">
      {/* Icon + sign + words: direction is never conveyed by colour alone */}
      <span className={clsx('inline-flex items-center gap-0.5 font-semibold', up ? 'text-success' : 'text-danger')}>
        <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
        {up ? '+' : ''}
        {value}%
      </span>
      {suffix}
    </p>
  );
}

function Kpi({ label, value, children }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-[32px] leading-none font-semibold tracking-[-0.02em] tabular">{value}</p>
      {children}
    </Card>
  );
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export default function Overview() {
  usePageTitle('Overview');
  const { me } = useSession();
  const { data, isPending, isError, error, refetch } = useOverview();

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const scopeNote = data?.scope === 'mine' ? 'Your leads, clients and sales' : 'Everything across the company';

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${me?.name?.split(' ')[0] ?? 'there'}`}
        description={scopeNote}
        actions={
          <>
            <Button to="/dashboard/leads?new=1" variant="dark" size="sm">
              Add lead
            </Button>
            <Button to="/dashboard/properties/new" variant="secondary" size="sm">
              Add property
            </Button>
          </>
        }
      />

      {isPending ? (
        <OverviewSkeleton />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Available properties" value={formatNumber(data.kpis.availableProperties)}>
              <p className="mt-2 text-[13px] text-slate-500">Live on the website now</p>
            </Kpi>
            <Kpi label="New leads, last 30 days" value={formatNumber(data.kpis.newLeads.value)}>
              <Delta value={data.kpis.newLeads.delta} suffix="vs previous 30 days" />
            </Kpi>
            <Kpi label="Active clients" value={formatNumber(data.kpis.activeClients)}>
              <p className="mt-2 text-[13px] text-slate-500">With a deal in progress or recent contact</p>
            </Kpi>
            <Kpi label="Sales this month" value={formatPrice(data.kpis.sales.value, { compact: true })}>
              <Delta value={data.kpis.sales.delta} suffix={`${data.kpis.sales.count} ${data.kpis.sales.count === 1 ? 'deal' : 'deals'} · vs last month`} />
            </Kpi>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <Card className="p-5 md:p-6">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[17px] font-semibold">Sales, last 12 months</h2>
                {data.kpis.conversionRate != null && (
                  <p className="text-sm text-slate-500">
                    <span className="font-semibold text-navy-900 tabular">{data.kpis.conversionRate}%</span> of closed leads won
                  </p>
                )}
              </div>
              <SalesChart data={data.salesByMonth} />
            </Card>

            <Card className="flex flex-col p-5 md:p-6">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-[17px] font-semibold">Today</h2>
                <Link to="/dashboard/tasks" className="text-sm font-medium text-slate-500 hover:text-navy-900">
                  All tasks
                </Link>
              </div>
              {data.tasks.overdue.length + data.tasks.today.length === 0 ? (
                <EmptyState icon={CircleCheckBig} title="You’re all caught up" description="No tasks due today or overdue." className="flex-1 border-0" />
              ) : (
                <ul className="-my-1 max-h-[300px] divide-y divide-line overflow-y-auto pr-1">
                  {[...data.tasks.overdue, ...data.tasks.today].map((t) => (
                    <TaskRow key={t._id} task={t} />
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1.15fr]">
            <Card className="p-5 md:p-6">
              <h2 className="mb-4 text-[17px] font-semibold">Pipeline</h2>
              <HorizontalBars data={stageRows(data.pipeline)} caption="Leads per pipeline stage" valueLabel="Leads" />
            </Card>
            <Card className="p-5 md:p-6">
              <h2 className="mb-4 text-[17px] font-semibold">Lead sources, last 12 months</h2>
              <HorizontalBars data={sourceRows(data.leadsBySource)} caption="Leads by source" valueLabel="Leads" />
            </Card>
            <Card className="p-5 md:p-6 lg:col-span-2 xl:col-span-1">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-[17px] font-semibold">Recent leads</h2>
                <Link to="/dashboard/leads" className="text-sm font-medium text-slate-500 hover:text-navy-900">
                  All leads
                </Link>
              </div>
              <ul className="divide-y divide-line">
                {data.recentLeads.map((l) => (
                  <li key={l._id}>
                    <Link to={`/dashboard/leads?open=${l._id}`} className="-mx-2 flex items-center gap-3 rounded-[10px] px-2 py-3 hover:bg-mist-100">
                      <Avatar user={{ name: l.name }} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{l.name}</p>
                        <p className="truncate text-[13px] text-slate-500">
                          {l.property?.title ?? 'General inquiry'} · {timeAgo(l.createdAt)}
                        </p>
                      </div>
                      <StageBadge stage={l.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-panel" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Skeleton className="h-[340px] rounded-panel" />
        <Skeleton className="h-[340px] rounded-panel" />
      </div>
    </div>
  );
}
