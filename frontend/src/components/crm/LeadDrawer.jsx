import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CalendarClock, ExternalLink, Mail, Phone, Trash2, UserCheck } from 'lucide-react';
import { useSession } from '../../auth/AuthContext';
import { useAgents, useConvertLead, useDeleteLead, useLead, useMoveStage, useUpdateLead } from '../../hooks/useCrm';
import { Drawer } from '../ui/Overlay';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { StageBadge } from '../ui/Badge';
import { Avatar, ErrorState, Skeleton } from '../ui/States';
import { StageDialog } from './StageDialog';
import { LEAD_SOURCES, LEAD_STAGES, labelOf } from '../../lib/constants';
import { formatDateTime, formatPrice, humanize, timeAgo } from '../../lib/format';

// <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm"
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

function activityText(a, agentsById) {
  switch (a.type) {
    case 'created':
      return `Lead created from ${humanize(a.to ?? 'website').toLowerCase()}`;
    case 'stage':
      return `Moved from ${humanize(a.from)} to ${humanize(a.to)}`;
    case 'assigned':
      return `Reassigned to ${agentsById.get(a.to)?.name ?? 'another agent'}`;
    case 'follow_up':
      return a.to === 'cleared' ? 'Follow-up cleared' : `Follow-up set for ${formatDateTime(a.to)}`;
    case 'converted':
      return `Customer profile created for ${a.to}`;
    default:
      return humanize(a.type);
  }
}

export function LeadDrawer({ leadId, onClose, listKey }) {
  const { isAdmin } = useSession();
  const { data: lead, isPending, isError, error } = useLead(leadId);
  const { data: agents = [] } = useAgents();
  const update = useUpdateLead();
  const move = useMoveStage(listKey);
  const convert = useConvertLead();
  const remove = useDeleteLead({ onSuccess: onClose });

  const [note, setNote] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [closing, setClosing] = useState(null); // 'won' | 'lost' while the dialog is open

  useEffect(() => {
    setFollowUp(toLocalInput(lead?.followUpDate));
    setNote('');
  }, [lead?._id, lead?.followUpDate]);

  const agentsById = new Map(agents.map((a) => [a._id, a]));

  const changeStage = (stage) => {
    if (stage === lead.status) return;
    if (stage === 'won' || stage === 'lost') return setClosing(stage);
    move.mutate({ id: lead._id, stage });
  };

  return (
    <Drawer open={Boolean(leadId)} onClose={onClose} title={lead?.name ?? 'Lead'} description={lead ? `Added ${timeAgo(lead.createdAt)} · ${labelOf(LEAD_SOURCES, lead.source)}` : undefined}>
      {isError ? (
        <ErrorState error={error} />
      ) : isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-2.5 text-[15px]" aria-label="Contact">
            <a href={`mailto:${lead.email}`} className="flex items-center gap-3 hover:underline">
              <Mail className="size-4 text-slate-500" strokeWidth={1.5} /> {lead.email}
            </a>
            {lead.phone && (
              <a href={`tel:${lead.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 hover:underline">
                <Phone className="size-4 text-slate-500" strokeWidth={1.5} /> {lead.phone}
              </a>
            )}
            {lead.property && (
              <Link to={`/properties/${lead.property.slug}`} target="_blank" className="flex items-center gap-3 hover:underline">
                <ExternalLink className="size-4 text-slate-500" strokeWidth={1.5} />
                {lead.property.title} · {formatPrice(lead.property.price, { purpose: lead.property.purpose })}
              </Link>
            )}
            {lead.message && <p className="rounded-card bg-mist-100 p-4 text-sm leading-relaxed text-slate-500">“{lead.message}”</p>}
          </section>

          <section className="grid gap-4 sm:grid-cols-2" aria-label="Status">
            <Field label="Stage">
              {(a) => <Select {...a} value={lead.status} onChange={(e) => changeStage(e.target.value)} options={LEAD_STAGES} disabled={move.isPending} />}
            </Field>
            <Field label="Assigned to">
              {(a) =>
                isAdmin ? (
                  <Select {...a} value={lead.assignedTo?._id ?? ''} onChange={(e) => update.mutate({ id: lead._id, assignedTo: e.target.value })} options={agents.map((u) => ({ value: u._id, label: u.name }))} />
                ) : (
                  <div className="flex h-11 items-center gap-2">
                    <Avatar user={lead.assignedTo} size={26} /> {lead.assignedTo?.name}
                  </div>
                )
              }
            </Field>
            <Field label="Follow up on">
              {(a) => (
                <div className="flex gap-2">
                  <Input {...a} type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    aria-label="Save follow-up date"
                    disabled={followUp === toLocalInput(lead.followUpDate)}
                    onClick={() => update.mutate({ id: lead._id, followUpDate: followUp ? new Date(followUp).toISOString() : null })}
                  >
                    <CalendarClock className="size-4" />
                  </Button>
                </div>
              )}
            </Field>
            <Field label="Deal value">
              {(a) => (
                <Input
                  {...a}
                  type="number"
                  min="0"
                  defaultValue={lead.dealValue ?? ''}
                  key={lead.dealValue}
                  placeholder="Not set"
                  onBlur={(e) => {
                    const v = e.target.value === '' ? null : Number(e.target.value);
                    if (v !== (lead.dealValue ?? null)) update.mutate({ id: lead._id, dealValue: v });
                  }}
                />
              )}
            </Field>
          </section>
          {lead.lostReason && <p className="-mt-4 text-sm text-slate-500">Lost because: {lead.lostReason}</p>}

          <section aria-labelledby="notes-title">
            <h3 id="notes-title" className="mb-3 font-semibold">
              Notes
            </h3>
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim()) update.mutate({ id: lead._id, note: note.trim() }, { onSuccess: () => setNote('') });
              }}
            >
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened on the last call?" aria-label="New note" />
              <Button type="submit" variant="secondary" size="sm" className="self-end" disabled={!note.trim()} loading={update.isPending && Boolean(note)}>
                Add note
              </Button>
            </form>
            <ul className="mt-4 space-y-4">
              {[...lead.notes].reverse().map((n) => (
                <li key={n._id} className="flex gap-3">
                  <Avatar user={n.author} size={28} />
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{n.author?.name ?? 'Someone'}</span> <span className="text-slate-400">· {timeAgo(n.createdAt)}</span>
                    </p>
                    <p className="mt-0.5 text-[15px] leading-relaxed">{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="activity-title">
            <h3 id="activity-title" className="mb-3 font-semibold">
              Activity
            </h3>
            <ol className="relative space-y-3 border-l border-line pl-5">
              {[...lead.activity].reverse().map((a, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute top-1.5 -left-[24.5px] size-2 rounded-full bg-navy-600 ring-4 ring-paper" aria-hidden />
                  <p>{activityText(a, agentsById)}</p>
                  <p className="text-xs text-slate-400">
                    {a.by?.name ? `${a.by.name} · ` : ''}
                    {formatDateTime(a.at)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            {lead.customer ? (
              <Button to={`/dashboard/customers/${lead.customer._id}`} variant="secondary" size="sm" icon={UserCheck}>
                Open customer profile
              </Button>
            ) : (
              <Button variant="secondary" size="sm" icon={UserCheck} loading={convert.isPending} onClick={() => convert.mutate(lead._id)}>
                Convert to customer
              </Button>
            )}
            <div className="flex items-center gap-3">
              <StageBadge stage={lead.status} />
              {isAdmin && (
                <Button
                  variant="danger-ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => window.confirm(`Delete the lead for ${lead.name}? This can’t be undone.`) && remove.mutate(lead._id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </section>
        </div>
      )}

      <StageDialog
        lead={lead}
        stage={closing}
        pending={move.isPending}
        onCancel={() => setClosing(null)}
        onConfirm={(body) => move.mutate({ id: lead._id, ...body }, { onSuccess: () => setClosing(null) })}
      />
    </Drawer>
  );
}
