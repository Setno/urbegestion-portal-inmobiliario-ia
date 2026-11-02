import { describe, it, expect } from 'vitest';
import { posix as path } from 'node:path';

// En Vercel las funciones corren como módulos de Node, que exige la extensión en las importaciones relativas.
// Vitest las resuelve igual sin ella, así que sin esta prueba el error solo aparece al llamar la función desplegada (H-046).
const archivos = import.meta.glob(['../../api/**/*.ts', '../../apps/consola/src/**/*.ts', '../../packages/*/src/**/*.ts', '!**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const IMPORT_LOCAL = /^\s*(?:import|export)\s+(?!type\b)[^'"]*?from\s+['"]((?:\.\.?\/|@portal\/)[^'"]+)['"]/gm;

const importsLocales = (texto: string): string[] => [...texto.matchAll(IMPORT_LOCAL)].map((m) => m[1]);

// "@portal/plataforma/contract" es packages/plataforma/src/contract.ts (ver "exports" en su package.json).
const archivoDePaquete = (ruta: string): string => {
  const [, paquete, modulo] = ruta.split('/');
  return `../../packages/${paquete}/src/${modulo}.ts`;
};

// Recorre lo que carga cada función, incluido lo que importan a su vez los archivos de src/.
function problemasDesde(inicio: string): string[] {
  const problemas: string[] = [];
  const vistos = new Set<string>();
  const pendientes = [inicio];
  while (pendientes.length > 0) {
    const actual = pendientes.pop() as string;
    if (vistos.has(actual)) continue;
    vistos.add(actual);
    for (const ruta of importsLocales(archivos[actual])) {
      if (ruta.startsWith('@portal/')) {
        const destino = archivoDePaquete(ruta);
        if (archivos[destino] === undefined) problemas.push(`${actual} importa '${ruta}', que no existe`);
        else pendientes.push(destino);
        continue;
      }
      if (!ruta.endsWith('.js')) {
        problemas.push(`${actual} importa '${ruta}' sin la extensión .js`);
        continue;
      }
      const destino = path.join(path.dirname(actual), ruta).replace(/\.js$/, '.ts');
      if (archivos[destino] === undefined) problemas.push(`${actual} importa '${ruta}', que no existe`);
      else pendientes.push(destino);
    }
  }
  return problemas;
}

describe('importaciones de las funciones del servidor', () => {
  const funciones = Object.keys(archivos).filter((ruta) => ruta.startsWith('../../api/'));

  it('encuentra las funciones que debe revisar', () => {
    expect(funciones).toContain('../../api/invite.ts');
    expect(funciones).toContain('../../api/platform/metrics.ts');
    expect(funciones).toContain('../../api/platform/tenant-sync.ts');
  });

  it('todo lo que carga una función usa rutas relativas con extensión, para que arranque en Vercel', () => {
    expect(funciones.flatMap(problemasDesde)).toEqual([]);
  });
});
