import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  plugins: [react()],
  // Marca de preview: solo con VERCEL_ENV=preview (Vercel) o en desarrollo local. Producción y compilaciones sueltas quedan en false.
  define: {
    __PORTAL_PREVIEW__: JSON.stringify((command === 'serve' && mode === 'development') || process.env.VERCEL_ENV === 'preview'),
  },
  // .env.local vive en la raíz del repositorio.
  envDir: fileURLToPath(new URL('../../', import.meta.url)),
  server: {
    port: 3000,
    open: false,
  },
  test: {
    name: 'consola',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
  },
}));
