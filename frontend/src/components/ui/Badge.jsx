import clsx from 'clsx';
import { LEAD_STAGES, PROPERTY_STATUSES, labelOf } from '../../lib/constants';

// Explicit class map: Tailwind needs complete class names in source to generate them
const STAGE_CLASSES = {
  new: 'bg-stage-new-bg text-stage-new',
  contacted: 'bg-stage-contacted-bg text-stage-contacted',
  qualified: 'bg-stage-qualified-bg text-stage-qualified',
  site_visit: 'bg-stage-site_visit-bg text-stage-site_visit',
  negotiation: 'bg-stage-negotiation-bg text-stage-negotiation',
  won: 'bg-stage-won-bg text-stage-won',
  lost: 'bg-stage-lost-bg text-stage-lost',
};

export const STAGE_DOT = {
  new: 'bg-stage-new',
  contacted: 'bg-stage-contacted',
  qualified: 'bg-stage-qualified',
  site_visit: 'bg-stage-site_visit',
  negotiation: 'bg-stage-negotiation',
  won: 'bg-stage-won',
  lost: 'bg-stage-lost',
};

const PROPERTY_CLASSES = {
  draft: 'bg-mist-100 text-slate-500',
  available: 'bg-stage-won-bg text-stage-won',
  under_offer: 'bg-stage-site_visit-bg text-stage-site_visit',
  sold: 'bg-navy-900 text-white',
  rented: 'bg-navy-700 text-white',
};

const PRIORITY_CLASSES = {
  high: 'bg-[#fdefe7] text-[#c2410c]',
  medium: 'bg-stage-site_visit-bg text-stage-site_visit',
  low: 'bg-mist-100 text-slate-500',
};

export function Badge({ className, children }) {
  return (
    <span className={clsx('inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap', className)}>
      {children}
    </span>
  );
}

export function StageBadge({ stage }) {
  return <Badge className={STAGE_CLASSES[stage]}>{labelOf(LEAD_STAGES, stage)}</Badge>;
}

export function PropertyStatusBadge({ status, className }) {
  return <Badge className={clsx(PROPERTY_CLASSES[status], className)}>{labelOf(PROPERTY_STATUSES, status)}</Badge>;
}

export function PriorityBadge({ priority }) {
  return <Badge className={PRIORITY_CLASSES[priority]}>{priority.charAt(0).toUpperCase() + priority.slice(1)} priority</Badge>;
}
