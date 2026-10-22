import { Link } from 'react-router';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { Check, Trash2 } from '../ui/icons';
import { useDeleteTask, useToggleTask } from '../../hooks/useCrm';
import { PriorityBadge } from '../ui/Badge';
import { Avatar } from '../ui/States';
import { formatDateTime } from '../../lib/format';
import { spring } from '../../lib/motion';

/** A task with an animated checkbox. Used on the overview and the tasks board. */
export function TaskRow({ task, showAssignee = false, allowDelete = false }) {
  const toggle = useToggleTask();
  const remove = useDeleteTask();
  const done = task.status === 'done';
  const overdue = !done && new Date(task.dueAt) < new Date(new Date().setHours(0, 0, 0, 0));
  const related = task.lead ? { to: `/dashboard/leads?open=${task.lead._id}`, name: task.lead.name } : task.customer ? { to: `/dashboard/customers/${task.customer._id}`, name: task.customer.name } : null;

  return (
    <li className="group flex items-start gap-3 py-3">
      <motion.button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Reopen “${task.title}”` : `Complete “${task.title}”`}
        onClick={() => toggle.mutate({ id: task._id, status: done ? 'open' : 'done' })}
        whileTap={{ scale: 0.85 }}
        transition={spring.ui}
        className={clsx(
          'mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors',
          done ? 'border-success bg-success text-white' : 'border-slate-400 hover:border-navy-900',
        )}
      >
        {done && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring.ui}>
            <Check className="size-3.5" strokeWidth={3} />
          </motion.span>
        )}
      </motion.button>
      <div className="min-w-0 flex-1">
        <p className={clsx('text-[15px] leading-snug', done && 'text-slate-400 line-through')}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
          <span className={clsx(overdue && 'font-medium text-danger')}>{overdue ? 'Overdue · ' : ''}{formatDateTime(task.dueAt)}</span>
          {related && (
            <Link to={related.to} className="hover:text-navy-900 hover:underline">
              {related.name}
            </Link>
          )}
          {!done && task.priority === 'high' && <PriorityBadge priority="high" />}
        </div>
      </div>
      {showAssignee && task.assignee && <Avatar user={task.assignee} size={26} className="mt-0.5" />}
      {allowDelete && (
        <button
          type="button"
          onClick={() => remove.mutate(task._id)}
          className="grid size-8 place-items-center rounded-full text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-mist-100 hover:text-danger focus-visible:opacity-100"
          aria-label={`Delete “${task.title}”`}
        >
          <Trash2 className="size-4" strokeWidth={1.5} />
        </button>
      )}
    </li>
  );
}
