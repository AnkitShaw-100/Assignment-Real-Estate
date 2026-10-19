import { useId } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { spring } from '../../lib/motion';

/**
 * The brand's signature detail (DESIGN.md §5): a slowly rotating text ring
 * around a brass button. Rotation pauses on hover and the chevrons nudge
 * toward the destination. Reduced-motion users get a still badge (index.css).
 */
export function ExploreBadge({ to = '/properties', label = 'Explore properties', size = 132, className, tone = 'light' }) {
  const ring = `${label} · ${label} · `;
  const pathId = useId(); // two badges can share a page; ids must be unique
  return (
    <Link
      to={to}
      aria-label={label}
      className={clsx('group relative block shrink-0 overflow-hidden rounded-full', tone === 'light' ? 'bg-paper text-navy-900' : 'bg-white/95 text-navy-900', className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-spin-slow group-hover:[animation-play-state:paused]" aria-hidden>
        <defs>
          <path id={pathId} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current text-[8.4px] tracking-[0.18em]" style={{ fontFamily: 'var(--font-sans)' }}>
          <textPath href={`#${pathId}`}>{ring}</textPath>
        </text>
      </svg>
      <motion.span
        className="absolute inset-[27%] grid place-items-center rounded-full bg-brass-400 text-navy-900"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={spring.ui}
      >
        <svg viewBox="0 0 24 24" className="size-[42%] transition-transform duration-500 ease-out-soft group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m7 6 6 6-6 6M13 6l6 6-6 6" />
        </svg>
      </motion.span>
    </Link>
  );
}
