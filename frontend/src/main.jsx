import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth/AuthContext';
import { AppRouter } from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // Don't retry client errors (401/403/404); retry network blips once
      retry: (count, err) => (err?.status && err.status < 500 ? false : count < 1),
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* reducedMotion="user" makes every motion component honour the OS setting */}
        <MotionConfig reducedMotion="user">
          <AppRouter />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: '!rounded-[14px] !border-line !font-sans !text-navy-900 !shadow-[var(--shadow-float)]',
            }}
          />
        </MotionConfig>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
