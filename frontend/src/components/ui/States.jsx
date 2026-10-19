import clsx from 'clsx';
import { initials } from '../../lib/format';
import { Button } from './Button';

export function Skeleton({ className }) {
  return <div className={clsx('skeleton rounded-card', className)} aria-hidden />;
}

/** One line saying what's missing, plus one action (DESIGN.md §6). */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center rounded-panel border border-dashed border-line px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-mist-100 text-navy-700">
          <Icon className="size-5" strokeWidth={1.5} />
        </div>
      )}
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }) {
  return (
    <div className={clsx('rounded-panel border border-[#f3c9c5] bg-[#fdf3f2] px-6 py-8 text-center', className)} role="alert">
      <p className="font-medium text-danger">{error?.message ?? 'Something went wrong.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Avatar({ user, size = 32, className }) {
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.38) };
  if (user?.avatar) {
    return <img src={user.avatar} alt="" style={style} className={clsx('shrink-0 rounded-full object-cover', className)} loading="lazy" />;
  }
  return (
    <span style={style} className={clsx('grid shrink-0 place-items-center rounded-full bg-navy-700 font-semibold text-white', className)} aria-hidden>
      {initials(user?.name ?? '?')}
    </span>
  );
}
