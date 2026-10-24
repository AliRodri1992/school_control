import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxy = {
  target: process.env.API_TARGET || 'http://backend:3000',
  // Preserve the browser host for Rails host authorization and CSRF checks.
  changeOrigin: false,
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    watch: { usePolling: true, interval: 500 },
    proxy: { '/api': apiProxy, '/rails': apiProxy, '/up': apiProxy },
  },
});
