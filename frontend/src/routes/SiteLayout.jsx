import { Suspense } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { Navbar } from '../components/site/Navbar';
import { Footer } from '../components/site/Footer';
import { PageSkeleton } from './guards';

export function SiteLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <>
      <a href="#main" className="sr-only z-50 rounded-full bg-navy-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Navbar overlay={isHome} />
      <main id="main" className={isHome ? '' : 'pt-[72px]'}>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      {/* On home the CTA band sits directly on the footer like the mockup */}
      <Footer />
      <ScrollRestoration getKey={(location) => location.pathname} />
    </>
  );
}
