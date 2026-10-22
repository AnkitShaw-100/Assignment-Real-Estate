import { lazy, Suspense } from 'react';
import { Navigate, createBrowserRouter, RouterProvider, useLocation } from 'react-router';
import { SiteLayout } from './routes/SiteLayout';
import { RequireAuth, RequireRole } from './routes/guards';
import Home from './pages/site/Home';
import NotFound from './pages/site/NotFound';

// Website pages other than Home, and the whole dashboard, load on demand so
// first-time visitors only download what the home page needs.
const Properties = lazy(() => import('./pages/site/Properties'));
const PropertyDetail = lazy(() => import('./pages/site/PropertyDetail'));
const About = lazy(() => import('./pages/site/About'));
const Contact = lazy(() => import('./pages/site/Contact'));
const Saved = lazy(() => import('./pages/site/Saved'));
const MyInquiries = lazy(() => import('./pages/site/MyInquiries'));
const AuthPage = lazy(() => import('./pages/site/AuthPage'));

const DashboardLayout = lazy(() => import('./routes/DashboardLayout'));
const Overview = lazy(() => import('./pages/crm/Overview'));
const Leads = lazy(() => import('./pages/crm/Leads'));
const Pipeline = lazy(() => import('./pages/crm/Pipeline'));
const Customers = lazy(() => import('./pages/crm/Customers'));
const CustomerDetail = lazy(() => import('./pages/crm/CustomerDetail'));
const Tasks = lazy(() => import('./pages/crm/Tasks'));
const PropertiesAdmin = lazy(() => import('./pages/crm/PropertiesAdmin'));
const Team = lazy(() => import('./pages/crm/Team'));
const AdminLogin = lazy(() => import('./pages/crm/AdminLogin'));

const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'properties', element: <Properties /> },
      { path: 'properties/:slug', element: <PropertyDetail /> },
      { path: 'about', element: <About /> },
      { path: 'contact', element: <Contact /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'saved', element: <Saved /> },
          { path: 'account/inquiries', element: <MyInquiries /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
  // Website sign in / sign up: full-screen pages outside the site layout
  { path: 'sign-in/*', element: <Suspense fallback={<div className="min-h-dvh bg-paper" />}><AuthPage mode="sign-in" /></Suspense> },
  { path: 'sign-up/*', element: <Suspense fallback={<div className="min-h-dvh bg-paper" />}><AuthPage mode="sign-up" /></Suspense> },
  // CRM sign-in for admins and agents (no sign-up)
  { path: 'admin/login', element: <Suspense fallback={<div className="min-h-dvh bg-navy-900" />}><AdminLogin /></Suspense> },
  // Old links: /dashboard/... → /admin/...
  { path: 'dashboard/*', element: <DashboardRedirect /> },
  {
    path: 'admin',
    element: <RequireRole roles={['agent', 'admin']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Overview /> },
          { path: 'leads', element: <Leads /> },
          { path: 'pipeline', element: <Pipeline /> },
          { path: 'customers', element: <Customers /> },
          { path: 'customers/:id', element: <CustomerDetail /> },
          { path: 'tasks', element: <Tasks /> },
          { path: 'properties', element: <PropertiesAdmin /> },
          {
            element: <RequireRole roles={['admin']} />,
            children: [{ path: 'team', element: <Team /> }],
          },
        ],
      },
    ],
  },
]);

function DashboardRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={pathname.replace(/^\/dashboard/, '/admin') + search} replace />;
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
