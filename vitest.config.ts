import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'apps/consola',
      {
        test: {
          name: 'paquetes',
          environment: 'jsdom',
          include: ['packages/*/src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'servidor',
          environment: 'jsdom',
          include: ['tests/**/*.test.ts', 'api/**/*.test.ts'],
        },
      },
    ],
  },
});
