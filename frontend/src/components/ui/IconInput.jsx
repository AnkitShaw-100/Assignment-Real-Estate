import { forwardRef } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff } from './icons';

/**
 * Text input with a leading icon (and an optional trailing control such as a
 * show-password button), matching the design-system field look.
 */
export const IconInput = forwardRef(function IconInput({ icon: Icon, invalid, className, trailing, ...props }, ref) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        ref={ref}
        className={clsx(
          'h-12 w-full rounded-field border bg-paper pr-3.5 pl-11 text-[15px] text-navy-900 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200',
          'focus:border-accent-400 focus:ring-3 focus:ring-accent-400/25 focus:outline-none',
          invalid ? 'border-danger' : 'border-line',
          trailing && 'pr-12',
          className,
        )}
        aria-invalid={invalid || undefined}
        {...props}
      />
      {trailing}
    </div>
  );
});

/** Label + IconInput + error message, wired for screen readers. */
export const IconField = forwardRef(function IconField({ id, label, error, hint, ...props }, ref) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <IconInput ref={ref} id={id} invalid={Boolean(error)} aria-describedby={describedBy} {...props} />
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

/** Eye toggle placed inside an IconInput's trailing slot. */
export function PasswordToggle({ shown, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      aria-pressed={shown}
      className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-500 hover:bg-mist-100 hover:text-navy-900"
    >
      {shown ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
    </button>
  );
}
