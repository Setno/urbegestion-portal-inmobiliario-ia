import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// En Vercel el sitio se construye desde apps/sitio y las herramientas de prueba (vitest) no están instaladas:
// si la revisión de tipos de `next build` incluyera los archivos de prueba, el despliegue se caería (primer preview de H-051).
const raiz = path.resolve(__dirname, '..');

describe('construcción del sitio en Vercel', () => {
  it('la revisión de tipos de next build deja fuera los archivos de prueba', () => {
    const build = JSON.parse(readFileSync(path.join(raiz, 'tsconfig.build.json'), 'utf-8'));
    expect(build.extends).toBe('./tsconfig.json');
    expect(build.exclude).toEqual(expect.arrayContaining(['**/*.test.ts', '**/*.test.tsx']));
  });

  it('next.config.ts usa esa configuración para construir', () => {
    const config = readFileSync(path.join(raiz, 'next.config.ts'), 'utf-8');
    expect(config).toMatch(/tsconfigPath:\s*'tsconfig\.build\.json'/);
  });
});
