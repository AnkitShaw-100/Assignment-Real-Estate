import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import clsx from 'clsx';
import { ChevronDown, CircleCheckBig, Plus } from 'lucide-react';
import { useSession } from '../../auth/AuthContext';
import { useAgents, useCreateTask, useTasks } from '../../hooks/useCrm';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Card, PageHeader } from '../../routes/DashboardLayout';
import { TaskRow } from '../../components/crm/TaskRow';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Skeleton } from '../../components/ui/States';
import { ease } from '../../lib/motion';

// Default due time for quick-add: tomorrow at 10:00, local time
function tomorrowAt10() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function QuickAdd({ agents, isAdmin }) {
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState(tomorrowAt10);
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [error, setError] = useState('');
  const create = useCreateTask({ onSuccess: () => setTitle('') });

  const submit = (e) => {
    e.preventDefault();
    if (title.trim().length < 2) return setError('Give the task a title');
    if (!dueAt) return setError('Pick a due date');
    setError('');
    create.mutate({ title: title.trim(), dueAt: new Date(dueAt).toISOString(), priority, ...(assignee ? { assignee } : {}) });
  };

  return (
    <Card className="mb-6 p-4">
      <form onSubmit={submit} className="flex flex-col gap-3 lg:flex-row lg:items-center" noValidate>
        <div className="flex-1">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task, for example “Send floor plans to Meera”" aria-label="Task title" aria-invalid={error ? true : undefined} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} aria-label="Due" className="sm:w-56" />
          <Select
            aria-label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[{ value: 'high', label: 'High priority' }, { value: 'medium', label: 'Medium priority' }, { value: 'low', label: 'Low priority' }]}
            className="sm:w-44"
          />
          {isAdmin && <Select aria-label="Assign to" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Me" options={agents.map((a) => ({ value: a._id, label: a.name }))} className="sm:w-44" />}
          <Button type="submit" variant="dark" icon={Plus} loading={create.isPending} className="col-span-2 sm:col-span-1">
            Add task
          </Button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}
    </Card>
  );
}

function Bucket({ title, due, assignee, tone, isAdmin }) {
  const { data = [], isPending } = useTasks({ due, assignee });
  return (
    <Card className="flex flex-col p-5">
      <h2 className="mb-1 flex items-center gap-2 font-semibold">
        <span className={clsx('size-2 rounded-full', tone)} aria-hidden />
        {title}
        <span className="font-normal text-slate-400 tabular">{isPending ? '' : data.length}</span>
      </h2>
      {isPending ? (
        <div className="mt-3 space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : data.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Nothing here</p>
      ) : (
        <motion.ul layout className="-mr-2 max-h-[620px] divide-y divide-line overflow-y-auto pr-2">
          <AnimatePresence initial={false}>
            {data.map((t) => (
              <motion.div key={t._id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: ease.out }}>
                <TaskRow task={t} showAssignee={isAdmin} allowDelete />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </Card>
  );
}

export default function Tasks() {
  usePageTitle('Tasks');
  const { isAdmin } = useSession();
  const { data: agents = [] } = useAgents();
  const [assignee, setAssignee] = useState('');
  const [showDone, setShowDone] = useState(false);

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Follow-ups from leads appear here automatically."
        actions={isAdmin && <Select aria-label="Show tasks for" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Everyone" options={agents.map((a) => ({ value: a._id, label: a.name }))} className="w-48" />}
      />
      <QuickAdd agents={agents} isAdmin={isAdmin} />

      <div className="grid gap-5 lg:grid-cols-3">
        <Bucket title="Overdue" due="overdue" assignee={assignee} tone="bg-danger" isAdmin={isAdmin} />
        <Bucket title="Today" due="today" assignee={assignee} tone="bg-brass-400" isAdmin={isAdmin} />
        <Bucket title="Upcoming" due="upcoming" assignee={assignee} tone="bg-navy-600" isAdmin={isAdmin} />
      </div>

      <div className="mt-6">
        <button type="button" onClick={() => setShowDone((s) => !s)} aria-expanded={showDone} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-navy-900">
          <CircleCheckBig className="size-4" strokeWidth={1.75} />
          {showDone ? 'Hide completed tasks' : 'Show completed tasks'}
          <ChevronDown className={clsx('size-4 transition-transform duration-300', showDone && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {showDone && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: ease.out }} className="overflow-hidden">
              <div className="pt-4">
                <Bucket title="Completed" due="done" assignee={assignee} tone="bg-success" isAdmin={isAdmin} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
