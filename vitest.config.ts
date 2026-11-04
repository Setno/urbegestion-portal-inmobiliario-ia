import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Cobertura (H-019): npm run test:coverage. El mínimo se sube a medida que mejora la medición.
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      include: ['apps/consola/src/**', 'apps/consola/api/**', 'apps/sitio/src/**', 'packages/*/src/**'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', '**/main.tsx', 'apps/consola/tests/**'],
      // Medido el 2026-11-04: 88 % de líneas, 87 % de sentencias, 84 % de ramas y 82 % de funciones. El CI falla si baja de aquí.
      thresholds: { lines: 85, statements: 84, branches: 81, functions: 79 },
    },
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
