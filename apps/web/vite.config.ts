import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Read the API's PORT from the repo-root .env so the dev proxy follows it ('' = all keys).
  const apiPort = loadEnv(mode, '../..', '').PORT || '3000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Dev only: the browser calls same-origin /api and Vite forwards it. nginx does this in Docker.
      proxy: { '/api': `http://localhost:${apiPort}` },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      include: ['test/**/*.test.tsx'],
    },
  };
});
