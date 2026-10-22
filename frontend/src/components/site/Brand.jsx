import { Link } from 'react-router';
import clsx from 'clsx';
import { FacebookLogo, InstagramLogo, LinkedinLogo, XLogo } from '../ui/icons';

/** Wordmark: semibold display face, Apple-style. */
export function Logo({ className, tone = 'dark' }) {
  return (
    <Link
      to="/"
      className={clsx('font-display text-[28px] leading-none tracking-[-0.03em]', tone === 'light' ? 'text-white' : 'text-navy-900', className)}
      aria-label="Niwas home"
    >
      Niwas
    </Link>
  );
}

const SOCIAL_ICONS = { facebook: FacebookLogo, instagram: InstagramLogo, linkedin: LinkedinLogo, x: XLogo };

export function SocialIcon({ name, className = 'size-4' }) {
  const Icon = SOCIAL_ICONS[name];
  return <Icon className={className} aria-hidden />;
}
