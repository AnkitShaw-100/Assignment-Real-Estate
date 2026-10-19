import { Link } from 'react-router';
import clsx from 'clsx';

/** Wordmark: italic Fraunces, like the mockup's logotype. */
export function Logo({ className, tone = 'dark' }) {
  return (
    <Link
      to="/"
      className={clsx('font-display text-[28px] leading-none tracking-[-0.02em] italic', tone === 'light' ? 'text-white' : 'text-navy-900', className)}
      style={{ fontWeight: 400 }}
      aria-label="Niwas home"
    >
      Niwas
    </Link>
  );
}

// lucide-react 1.x dropped brand icons, so these are small inline SVGs.
const paths = {
  facebook: 'M14 8.5V6.8c0-.8.5-1 1-1h1.7V3h-2.4C11.6 3 11 5 11 6.4v2.1H9V11h2v10h3V11h2.3l.4-2.5H14Z',
  instagram:
    'M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm4.9-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 4.6c2.4 0 2.7 0 3.6.1 2.4.1 3.6 1.3 3.7 3.7.1 1 .1 1.2.1 3.6s0 2.7-.1 3.6c-.1 2.4-1.3 3.6-3.7 3.7-1 .1-1.2.1-3.6.1s-2.7 0-3.6-.1c-2.4-.1-3.6-1.3-3.7-3.7-.1-1-.1-1.2-.1-3.6s0-2.7.1-3.6C4.8 6 6 4.8 8.4 4.7c.9-.1 1.2-.1 3.6-.1ZM12 3c-2.4 0-2.7 0-3.7.1C5.1 3.2 3.2 5 3.1 8.3 3 9.3 3 9.6 3 12s0 2.7.1 3.7c.1 3.2 2 5.1 5.2 5.2 1 .1 1.3.1 3.7.1s2.7 0 3.7-.1c3.2-.1 5.1-2 5.2-5.2.1-1 .1-1.3.1-3.7s0-2.7-.1-3.7c-.1-3.2-2-5.1-5.2-5.2C14.7 3 14.4 3 12 3Z',
  linkedin:
    'M6.9 8.8H3.8V20h3.1V8.8ZM5.3 3.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6ZM20 13.6c0-3-1.6-5-4.3-5-1.4 0-2.4.8-2.8 1.5V8.8H10V20h3.1v-5.9c0-1.5.7-2.6 2-2.6s1.8 1 1.8 2.6V20H20v-6.4Z',
};

export function SocialIcon({ name, className = 'size-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}
