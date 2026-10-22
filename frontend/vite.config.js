import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In dev, /api goes to the local Express server so cookies and CORS behave like prod
    // Override with VITE_API_PROXY to point dev at another API port
    proxy: { '/api': process.env.VITE_API_PROXY || 'http://localhost:5000' },
  },
  // Pre-bundle the icon packs at startup. They're imported through one module,
  // so Vite can miss them on the first scan and re-optimise mid-session, which
  // shows up in the browser as "504 Outdated Optimize Dep".
  optimizeDeps: {
    include: ['react-icons/pi', 'react-icons/fa6'],
  },
  build: {
    rollupOptions: {
      output: {
        // Keep heavy dashboard-only libraries out of the website bundle
        manualChunks(id) {
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('@dnd-kit')) return 'dnd';
        },
      },
    },
  },
});
