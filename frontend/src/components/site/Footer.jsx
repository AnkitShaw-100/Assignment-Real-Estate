import { Link } from 'react-router';
import { Logo, SocialIcon } from './Brand';

const COLUMNS = [
  {
    title: 'Quick links',
    links: [
      { to: '/', label: 'Home' },
      { to: '/properties', label: 'Properties' },
      { to: '/about', label: 'About' },
      { to: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Properties',
    links: [
      { to: '/properties?type=villa', label: 'Villas' },
      { to: '/properties?type=penthouse', label: 'Penthouses' },
      { to: '/properties?type=apartment', label: 'Apartments' },
      { to: '/properties?purpose=rent', label: 'Homes to rent' },
      { to: '/properties?category=commercial', label: 'Commercial spaces' },
    ],
  },
];

const SOCIAL = [
  { name: 'facebook', label: 'Facebook', href: 'https://facebook.com' },
  { name: 'instagram', label: 'Instagram', href: 'https://instagram.com' },
  { name: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com' },
];

export function Footer() {
  return (
    <footer className="bg-navy-900 text-white">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-20">
        <div className="max-w-xs">
          <Logo tone="light" />
          <p className="mt-5 text-[15px] leading-relaxed text-white/65">
            Discover extraordinary homes around the world. Luxury, comfort and timeless design, with agents who know every one of them.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="font-display text-xl">{col.title}</h2>
            <ul className="mt-5 space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-[15px] text-white/65 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h2 className="font-display text-xl">Social media</h2>
          <ul className="mt-5 space-y-3">
            {SOCIAL.map((s) => (
              <li key={s.name}>
                <a href={s.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 text-[15px] text-white/65 transition-colors hover:text-white">
                  <SocialIcon name={s.name} />
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Niwas. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/about" className="hover:text-white">
              Privacy policy
            </Link>
            <Link to="/about" className="hover:text-white">
              Terms and conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
