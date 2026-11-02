import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // .env.local vive en la raíz del repositorio.
  envDir: fileURLToPath(new URL('../../', import.meta.url)),
  server: {
    port: 3000,
    open: false,
  },
  test: {
    name: 'consola',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
