import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies API + uploaded images to the Express server on :4000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
  build: {
    target: 'es2018',
  },
});
