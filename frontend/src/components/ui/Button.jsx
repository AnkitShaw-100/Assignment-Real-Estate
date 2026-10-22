import { forwardRef } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { LoaderCircle } from 'lucide-react';
import { spring } from '../../lib/motion';

const MotionLink = motion.create(Link);

const VARIANTS = {
  // The accent colour is reserved for the main action on a screen (DESIGN.md §2)
  primary: 'bg-accent-500 text-white hover:bg-accent-600',
  dark: 'bg-navy-900 text-white hover:bg-navy-700',
  secondary: 'border border-line bg-paper text-navy-900 hover:bg-mist-100',
  ghost: 'text-navy-900 hover:bg-mist-100',
  light: 'border border-white/25 text-white hover:bg-white/10',
  danger: 'bg-danger text-white hover:bg-[#912018]',
  'danger-ghost': 'text-danger hover:bg-[#fdf3f2]',
};

const SIZES = {
  sm: 'h-9 px-4 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-[15px] gap-2',
  icon: 'h-10 w-10 justify-center',
};

/**
 * Pill button with spring press feedback. Renders a router Link when `to` is set.
 * `loading` disables it and swaps the icon for a spinner, keeping the width stable.
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', to, loading = false, disabled, className, children, icon: Icon, type = 'button', ...props },
  ref,
) {
  const classes = clsx(
    'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold whitespace-nowrap',
    'transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
  const content = (
    <>
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : Icon && <Icon className="size-4" aria-hidden strokeWidth={1.75} />}
      {children}
    </>
  );
  const motionProps = { whileTap: { scale: 0.97 }, transition: spring.ui };

  if (to) {
    return (
      <MotionLink ref={ref} to={to} className={classes} {...motionProps} {...props}>
        {content}
      </MotionLink>
    );
  }
  return (
    <motion.button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...motionProps} {...props}>
      {content}
    </motion.button>
  );
});

/** Round arrow button used by carousels (DESIGN.md §6) */
export function ArrowButton({ direction = 'right', active = true, className, ...props }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      transition={spring.ui}
      className={clsx(
        'grid size-10 place-items-center rounded-full border transition-colors duration-200 disabled:cursor-not-allowed',
        active ? 'border-accent-500 bg-accent-500 text-white hover:bg-accent-600' : 'border-line bg-paper text-navy-900 hover:bg-mist-100',
        'disabled:border-line disabled:bg-paper disabled:text-navy-900/40',
        className,
      )}
      {...props}
    >
      <svg viewBox="0 0 24 24" className={clsx('size-4', direction === 'left' && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m9 6 6 6-6 6" />
      </svg>
    </motion.button>
  );
}
