import { Link } from 'react-router';
import { MessageSquareText } from 'lucide-react';
import { useMyInquiries } from '../../hooks/usePublic';
import { usePageTitle } from '../../hooks/usePageTitle';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import { Button } from '../../components/ui/Button';
import { coverOf, formatDate, imageUrl } from '../../lib/format';

// Visitors see a simplified status, not our internal pipeline stage names
const PUBLIC_STATUS = {
  new: { label: 'Received', tone: 'bg-stage-new-bg text-stage-new' },
  contacted: { label: 'Agent in touch', tone: 'bg-stage-contacted-bg text-stage-contacted' },
  qualified: { label: 'In progress', tone: 'bg-stage-qualified-bg text-stage-qualified' },
  site_visit: { label: 'Visit arranged', tone: 'bg-stage-site_visit-bg text-stage-site_visit' },
  negotiation: { label: 'In negotiation', tone: 'bg-stage-negotiation-bg text-stage-negotiation' },
  won: { label: 'Completed', tone: 'bg-stage-won-bg text-stage-won' },
  lost: { label: 'Closed', tone: 'bg-stage-lost-bg text-stage-lost' },
};

export default function MyInquiries() {
  usePageTitle('My inquiries');
  const { data, isPending, isError, error, refetch } = useMyInquiries();

  return (
    <section className="container-page max-w-4xl pt-14 pb-24">
      <h1 className="font-display text-h1">My inquiries</h1>
      <p className="mt-3 text-slate-500">Messages you’ve sent us and where each one stands.</p>
      <div className="mt-10">
        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="You haven’t sent any inquiries"
            description="Find a home you like and ask the agent about it. Your messages will show up here."
            action={<Button to="/properties" variant="dark">Browse properties</Button>}
          />
        ) : (
          <ul className="divide-y divide-line rounded-panel border border-line">
            {data.map((lead) => {
              const status = PUBLIC_STATUS[lead.status];
              const cover = coverOf(lead.property);
              return (
                <li key={lead._id} className="flex items-center gap-4 p-4 sm:p-5">
                  {cover ? (
                    <img src={imageUrl(cover.url, 200)} alt="" className="size-16 shrink-0 rounded-[10px] object-cover" loading="lazy" />
                  ) : (
                    <span className="grid size-16 shrink-0 place-items-center rounded-[10px] bg-mist-100">
                      <MessageSquareText className="size-5 text-slate-400" strokeWidth={1.5} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    {lead.property ? (
                      <Link to={`/properties/${lead.property.slug}`} className="font-medium hover:underline">
                        {lead.property.title}
                      </Link>
                    ) : (
                      <p className="font-medium">General inquiry</p>
                    )}
                    <p className="mt-0.5 truncate text-sm text-slate-500">{lead.message ?? 'No message'}</p>
                    <p className="mt-1 text-xs text-slate-400">Sent {formatDate(lead.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.tone}`}>{status.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
