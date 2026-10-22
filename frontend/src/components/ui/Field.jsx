import { forwardRef, useId } from 'react';
import clsx from 'clsx';

export { Select } from './Select';

const control =
  'w-full rounded-field border bg-paper px-3.5 text-[15px] text-navy-900 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 ' +
  'focus:outline-none focus:border-accent-400 focus:ring-3 focus:ring-accent-400/25 disabled:bg-mist-100 disabled:text-slate-500';

/**
 * Label + control + hint/error, wired for screen readers.
 * Children receive { id, 'aria-describedby', 'aria-invalid' } via render prop.
 */
export function Field({ label, error, hint, required, className, children }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-navy-900">
          {label}
          {required && <span className="text-slate-400"> (required)</span>}
        </label>
      )}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={clsx(control, 'h-11', props['aria-invalid'] ? 'border-danger' : 'border-line', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={clsx(control, 'resize-none py-2.5 leading-relaxed', props['aria-invalid'] ? 'border-danger' : 'border-line', className)}
      {...props}
    />
  );
});

/** Field + Input in one, for the common case. */
export const TextField = forwardRef(function TextField({ label, error, hint, required, className, ...props }, ref) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(a11y) => <Input ref={ref} {...a11y} {...props} />}
    </Field>
  );
});
