import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins: [react()], server: {proxy: {'/api': (process.env.API_TARGET || 'http://backend:3000'), '/rails': (process.env.API_TARGET || 'http://backend:3000'), '/up': (process.env.API_TARGET || 'http://backend:3000')}}});
