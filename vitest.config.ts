import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'apps/consola',
      {
        esbuild: { jsx: 'automatic' },
        test: {
          name: 'sitio',
          environment: 'node',
          include: ['apps/sitio/src/**/*.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'paquetes',
          environment: 'jsdom',
          include: ['packages/*/src/**/*.test.ts', 'supabase/functions/**/*.test.ts'],
        },
      },
    ],
  },
});
