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
              // Colour by outcome: green for success, red for errors, amber for warnings
              classNames: {
                toast: '!rounded-[14px] !font-sans !shadow-[var(--shadow-float)] !border',
                default: '!border-line !bg-paper !text-navy-900',
                success: '!border-success/25 !bg-[#eef8f2] !text-success',
                error: '!border-danger/25 !bg-[#fdf2f1] !text-danger',
                warning: '!border-[#9a6200]/25 !bg-[#fff7e8] !text-[#9a6200]',
                info: '!border-accent-500/25 !bg-[#eef2f8] !text-accent-700',
                description: '!text-current !opacity-80',
              },
            }}
          />
        </MotionConfig>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
