import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import clsx from 'clsx';
import { Heart, Menu, X, LayoutDashboard, MessageSquareText, LogOut } from '../ui/icons';
import { useSession } from '../../auth/AuthContext';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/States';
import { Logo } from './Brand';
import { ease, spring } from '../../lib/motion';

const LINKS = [
  { to: '/properties?purpose=sale', label: 'Buy' },
  { to: '/properties?purpose=rent', label: 'Rent' },
  { to: '/properties?category=commercial', label: 'Commercial' },
  { to: '/properties', label: 'All properties' },
  { to: '/about', label: 'About' },
];

/**
 * Over the home hero the bar is transparent with white text. Once scrolled it
 * becomes frosted glass, and it slides away while scrolling down so the homes
 * get the whole screen, returning as soon as you scroll up (DESIGN.md §5).
 */
export function Navbar({ overlay = false }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > 240 && y > prev + 4 && !menuOpen);
    if (y < prev - 4) setHidden(false);
  });

  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

  const light = overlay && !scrolled && !menuOpen;

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-40"
        animate={{ y: hidden ? '-110%' : 0 }}
        transition={{ duration: 0.35, ease: ease.out }}
      >
        <div
          className={clsx(
            'transition-[background-color,box-shadow,backdrop-filter] duration-300',
            scrolled || menuOpen ? 'glass shadow-[0_1px_0_rgb(12_26_59/0.06)]' : 'bg-transparent',
          )}
        >
          <nav className={clsx('container-page flex h-[72px] items-center justify-between gap-6', overlay && !scrolled && 'lg:h-[92px] lg:pt-4')} aria-label="Main">
            <Logo tone={light ? 'light' : 'dark'} />

            <ul className="hidden items-center gap-1 lg:flex">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <NavLink
                    to={l.to}
                    end
                    className={clsx(
                      'rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors duration-200',
                      light ? 'text-white/85 hover:bg-white/10 hover:text-white' : 'text-navy-900/75 hover:bg-navy-900/5 hover:text-navy-900',
                    )}
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <AccountArea light={light} />
              <Button to="/contact" size="sm" className="hidden sm:inline-flex">
                Get in touch
              </Button>
              <button
                type="button"
                className={clsx('grid size-10 place-items-center rounded-full lg:hidden', light ? 'text-white hover:bg-white/10' : 'hover:bg-navy-900/5')}
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      <MobileMenu open={menuOpen} />
    </>
  );
}

function AccountArea({ light }) {
  const { isLoaded, isSignedIn, me, isStaff, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!isLoaded) return <span className="size-9" aria-hidden />;

  if (!isSignedIn) {
    return (
      <Link
        to="/sign-in"
        className={clsx('hidden rounded-full px-3.5 py-2 text-[14px] font-medium sm:block', light ? 'text-white hover:bg-white/10' : 'hover:bg-navy-900/5')}
      >
        Sign in
      </Link>
    );
  }

  const items = [
    ...(isStaff ? [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { to: '/saved', label: 'Saved homes', icon: Heart },
    { to: '/account/inquiries', label: 'My inquiries', icon: MessageSquareText },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx('flex items-center rounded-full p-0.5 ring-2 transition', light ? 'ring-white/40 hover:ring-white' : 'ring-transparent hover:ring-line')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar user={me} size={34} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className="absolute right-0 mt-2 w-60 origin-top-right rounded-card border border-line bg-paper p-1.5 text-navy-900 shadow-float"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={spring.ui}
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold">{me?.name}</p>
              <p className="truncate text-xs text-slate-500">{me?.email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            {items.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-mist-100">
                <Icon className="size-4 text-slate-500" strokeWidth={1.5} />
                {label}
              </Link>
            ))}
            <div className="my-1 h-px bg-line" />
            <button type="button" role="menuitem" onClick={signOut} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-mist-100">
              <LogOut className="size-4 text-slate-500" strokeWidth={1.5} />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileMenu({ open }) {
  const { isSignedIn } = useSession();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          className="glass fixed inset-0 z-30 overflow-y-auto pt-[88px] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <nav className="container-page flex flex-col" aria-label="Mobile">
            {[...LINKS, { to: '/contact', label: 'Contact' }, ...(isSignedIn ? [] : [{ to: '/sign-in', label: 'Sign in' }])].map((l, i) => (
              <motion.div
                key={l.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.4, ease: ease.out }}
              >
                <Link to={l.to} className="block border-b border-line py-4 font-display text-[30px]">
                  {l.label}
                </Link>
              </motion.div>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
