import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import clsx from 'clsx';
import {
  Building2, CircleCheckBig, ExternalLink, LayoutDashboard, LogOut, Menu, SquareKanban, UserRoundSearch, Users, UsersRound, X,
} from 'lucide-react';
import { useSession } from '../auth/AuthContext';
import { Avatar } from '../components/ui/States';
import { PageSpinner } from './guards';
import { spring } from '../lib/motion';

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/leads', label: 'Leads', icon: UserRoundSearch },
  { to: '/dashboard/pipeline', label: 'Pipeline', icon: SquareKanban },
  { to: '/dashboard/customers', label: 'Customers', icon: UsersRound },
  { to: '/dashboard/tasks', label: 'Tasks', icon: CircleCheckBig },
  { to: '/dashboard/properties', label: 'Properties', icon: Building2 },
  { to: '/dashboard/team', label: 'Team', icon: Users, admin: true },
];

function SidebarContent({ onNavigate }) {
  const { me, isAdmin, signOut } = useSession();
  return (
    <div className="flex h-full flex-col">
      <Link to="/dashboard" onClick={onNavigate} className="flex items-baseline gap-2 px-3 pt-1 pb-8">
        <span className="font-display text-[26px] text-white italic" style={{ fontWeight: 400 }}>
          Niwas
        </span>
        <span className="text-xs text-white/50">CRM</span>
      </Link>

      <nav aria-label="Dashboard" className="flex-1">
        <ul className="space-y-1">
          {NAV.filter((n) => !n.admin || isAdmin).map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} onClick={onNavigate} className="group relative flex h-11 items-center gap-3 rounded-[12px] px-3 text-[15px]">
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="crm-nav-active" className="absolute inset-0 rounded-[12px] bg-white/10" transition={spring.ui} />}
                    <Icon className={clsx('relative size-[18px]', isActive ? 'text-accent-400' : 'text-white/55 group-hover:text-white')} strokeWidth={1.6} />
                    <span className={clsx('relative', isActive ? 'font-medium text-white' : 'text-white/70 group-hover:text-white')}>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-1 border-t border-white/10 pt-4">
        <Link to="/" className="flex h-10 items-center gap-3 rounded-[12px] px-3 text-sm text-white/60 hover:text-white">
          <ExternalLink className="size-4" strokeWidth={1.6} />
          View website
        </Link>
        <div className="flex items-center gap-3 rounded-[12px] px-3 py-2">
          <Avatar user={me} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{me?.name}</p>
            <p className="text-xs text-white/50 capitalize">{me?.role}</p>
          </div>
          <button type="button" onClick={signOut} className="grid size-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white" aria-label="Sign out">
            <LogOut className="size-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * CRM shell: navy sidebar on desktop, slide-in drawer on smaller screens.
 * The page content sits on the mist canvas (DESIGN.md §4).
 */
export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-dvh bg-mist-100 lg:pl-[260px]">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] bg-navy-900 px-4 py-6 lg:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full hover:bg-mist-100" aria-label="Open menu">
          <Menu className="size-5" strokeWidth={1.5} />
        </button>
        <span className="font-display text-[22px] italic" style={{ fontWeight: 400 }}>
          Niwas <span className="font-sans text-xs text-slate-500 not-italic">CRM</span>
        </span>
        <span className="size-10" />
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-navy-900/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-navy-900 px-4 py-6 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={spring.ui}
              aria-label="Menu"
            >
              <button type="button" onClick={() => setOpen(false)} className="absolute top-5 right-4 grid size-9 place-items-center rounded-full text-white/70 hover:bg-white/10" aria-label="Close menu">
                <X className="size-5" />
              </button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="px-4 py-6 md:px-8 md:py-8 xl:px-10">
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

/** Page title row used by every CRM screen: display title, optional subtitle and actions. */
export function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {children}
        <h1 className="font-display text-[32px] leading-tight md:text-[36px]">{title}</h1>
        {description && <p className="mt-1.5 text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** White card on the mist canvas: 1px line border, no shadow (DESIGN.md §4). */
export function Card({ className, children, ...props }) {
  return (
    <section className={clsx('min-w-0 rounded-panel border border-line bg-paper', className)} {...props}>
      {children}
    </section>
  );
}
