import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors,
} from '@dnd-kit/core';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { CalendarClock } from '../../components/ui/icons';
import { useLeads, useMoveStage } from '../../hooks/useCrm';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageHeader } from '../../routes/DashboardLayout';
import { StageDialog } from '../../components/crm/StageDialog';
import { STAGE_DOT } from '../../components/ui/Badge';
import { Avatar, ErrorState, Skeleton } from '../../components/ui/States';
import { LEAD_STAGES } from '../../lib/constants';
import { formatDate, formatPrice } from '../../lib/format';
import { spring } from '../../lib/motion';

const QUERY = { limit: 200, sort: 'newest' };
const LIST_KEY = ['leads', QUERY];

function LeadCard({ lead, overlay = false, onOpen }) {
  const overdue = lead.followUpDate && new Date(lead.followUpDate) < new Date() && !['won', 'lost'].includes(lead.status);
  return (
    <div
      className={clsx(
        'rounded-card border border-line bg-paper p-3.5 text-left',
        overlay ? 'rotate-2 scale-[1.02] cursor-grabbing shadow-lift' : 'cursor-grab hover:border-navy-600/30',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          onPointerDown={(e) => e.stopPropagation()} // clicking the name opens, it doesn't start a drag
          className="text-left text-[15px] font-medium hover:underline"
        >
          {lead.name}
        </button>
        <Avatar user={lead.assignedTo} size={24} />
      </div>
      <p className="mt-1 truncate text-[13px] text-slate-500">{lead.property?.title ?? 'General inquiry'}</p>
      <div className="mt-3 flex items-center justify-between text-[13px]">
        <span className="font-semibold tabular">{lead.dealValue ? formatPrice(lead.dealValue, { compact: true }) : null}</span>
        {lead.followUpDate && !['won', 'lost'].includes(lead.status) && (
          <span className={clsx('flex items-center gap-1', overdue ? 'font-medium text-danger' : 'text-slate-500')}>
            <CalendarClock className="size-3.5" strokeWidth={1.75} />
            {formatDate(lead.followUpDate, { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ lead, onOpen }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead._id, data: { lead } });
  return (
    <motion.li
      layout="position"
      layoutId={`card-${lead._id}`}
      transition={spring.soft}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="Draggable lead"
      aria-describedby="pipeline-help"
      className={clsx('touch-none rounded-card outline-none focus-visible:ring-2 focus-visible:ring-accent-400', isDragging && 'opacity-30')}
    >
      <LeadCard lead={lead} onOpen={onOpen} />
    </motion.li>
  );
}

function Column({ stage, leads, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.value });
  const total = leads.reduce((s, l) => s + (l.dealValue ?? 0), 0);
  return (
    <section
      ref={setNodeRef}
      aria-label={`${stage.label}, ${leads.length} leads`}
      className={clsx('flex w-[284px] shrink-0 flex-col rounded-panel transition-colors duration-200', isOver ? 'bg-mist-200' : 'bg-mist-100/0')}
    >
      <header className="flex items-center justify-between px-2 pt-1 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className={clsx('size-2 rounded-full', STAGE_DOT[stage.value])} aria-hidden />
          {stage.label}
          <span className="font-normal text-slate-400 tabular">{leads.length}</span>
        </h2>
        {total > 0 && <span className="text-xs text-slate-500 tabular">{formatPrice(total, { compact: true })}</span>}
      </header>
      <ul className="flex min-h-[120px] flex-1 flex-col gap-2.5 px-1 pb-3">
        {leads.map((l) => (
          <DraggableCard key={l._id} lead={l} onOpen={() => onOpen(l._id)} />
        ))}
        {leads.length === 0 && <li className="grid flex-1 place-items-center rounded-card border border-dashed border-line text-sm text-slate-400">Drop a lead here</li>}
      </ul>
    </section>
  );
}

export default function Pipeline() {
  usePageTitle('Pipeline');
  const navigate = useNavigate();
  const { data, isPending, isError, error, refetch } = useLeads(QUERY);
  const move = useMoveStage(LIST_KEY);
  const [active, setActive] = useState(null);
  const [closing, setClosing] = useState(null); // { lead, stage } awaiting won/lost details

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), // small threshold so clicks still work
    useSensor(KeyboardSensor),
  );

  const byStage = useMemo(() => {
    const groups = Object.fromEntries(LEAD_STAGES.map((s) => [s.value, []]));
    for (const l of data?.data ?? []) groups[l.status]?.push(l);
    return groups;
  }, [data]);

  const onDragEnd = ({ active: a, over }) => {
    setActive(null);
    const lead = a.data.current.lead;
    const stage = over?.id;
    if (!stage || stage === lead.status) return;
    if (stage === 'won' || stage === 'lost') return setClosing({ lead, stage });
    move.mutate({ id: lead._id, stage });
  };

  const openLead = (id) => navigate(`/dashboard/leads?open=${id}`);
  const label = (id) => LEAD_STAGES.find((s) => s.value === id)?.label ?? id;

  return (
    <>
      <PageHeader title="Pipeline" description="Drag a lead to move it to the next stage. Open a lead for details." />
      <p id="pipeline-help" className="sr-only">
        Press space to pick up a lead, use the arrow keys to move it over another stage, and press space again to drop it.
      </p>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isPending ? (
        <div className="flex gap-4 overflow-hidden">
          {LEAD_STAGES.slice(0, 5).map((s) => (
            <Skeleton key={s.value} className="h-[480px] w-[284px] shrink-0 rounded-panel" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active: a }) => setActive(a.data.current.lead)}
          onDragCancel={() => setActive(null)}
          onDragEnd={onDragEnd}
          accessibility={{
            announcements: {
              onDragStart: ({ active: a }) => `Picked up ${a.data.current.lead.name}.`,
              onDragOver: ({ active: a, over }) => (over ? `${a.data.current.lead.name} is over ${label(over.id)}.` : undefined),
              onDragEnd: ({ active: a, over }) => (over ? `${a.data.current.lead.name} moved to ${label(over.id)}.` : 'Dropped. Stage unchanged.'),
              onDragCancel: ({ active: a }) => `Cancelled. ${a.data.current.lead.name} stays where it was.`,
            },
          }}
        >
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-6 md:-mx-8 md:px-8 xl:-mx-10 xl:px-10">
            {LEAD_STAGES.map((s) => (
              <Column key={s.value} stage={s} leads={byStage[s.value]} onOpen={openLead} />
            ))}
          </div>
          {/* The lifted card: tilts and gains depth; settles back on a spring when dropped */}
          <DragOverlay dropAnimation={{ duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
            {active ? <LeadCard lead={active} overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <StageDialog
        lead={closing?.lead}
        stage={closing?.stage}
        pending={move.isPending}
        onCancel={() => setClosing(null)}
        onConfirm={(body) => move.mutate({ id: closing.lead._id, ...body }, { onSuccess: () => setClosing(null) })}
      />
    </>
  );
}
