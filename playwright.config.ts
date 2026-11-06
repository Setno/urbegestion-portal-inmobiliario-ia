import { readFileSync, existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// Prueba de punta a punta (H-023): un visitante deja sus datos en el sitio y el agente ve el lead en el CRM.
// Corre SOLO contra la base de DESARROLLO (cuenta B). Las claves viven en e2e/credenciales.local, que queda fuera de Git
// (plantilla: e2e/credenciales.ejemplo). Esta configuración no usa ni pisa tu .env.local.

function leerCredenciales(): Record<string, string> {
  const ruta = new URL('./e2e/credenciales.local', import.meta.url);
  if (!existsSync(ruta)) return {};
  const valores: Record<string, string> = {};
  for (const linea of readFileSync(ruta, 'utf-8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(linea);
    if (m && !linea.trim().startsWith('#')) valores[m[1]] = m[2];
  }
  return valores;
}

const c = leerCredenciales();
// Que el usuario y la clave de la prueba lleguen a los tests por el entorno del proceso.
Object.assign(process.env, { E2E_EMAIL: c.E2E_EMAIL ?? '', E2E_PASSWORD: c.E2E_PASSWORD ?? '', E2E_TENANT_ID: c.E2E_TENANT_ID ?? '' });

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    // Usa el Chrome instalado en el computador: no hace falta descargar otro navegador.
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  outputDir: './e2e/resultados',
  webServer: [
    {
      // Consola (panel del agente): http://localhost:3100 (puerto propio para no chocar con tu servidor de desarrollo)
      command: 'npm run dev -- --port 3100 --strictPort',
      url: 'http://localhost:3100',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        VITE_SUPABASE_URL: c.E2E_SUPABASE_URL ?? '',
        VITE_SUPABASE_PUBLISHABLE_KEY: c.E2E_SUPABASE_PUBLISHABLE_KEY ?? '',
        VITE_TENANT_ID: c.E2E_TENANT_ID ?? '',
      },
    },
    {
      // Sitio público de la corredora de prueba: http://localhost:3101 (la corredora sale de SITIO_TENANT_ID en localhost)
      command: 'node --use-system-ca ../../node_modules/next/dist/bin/next dev -p 3101',
      cwd: 'apps/sitio',
      url: 'http://localhost:3101',
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        SUPABASE_URL: c.E2E_SUPABASE_URL ?? '',
        SUPABASE_PUBLISHABLE_KEY: c.E2E_SUPABASE_PUBLISHABLE_KEY ?? '',
        SITIO_TENANT_ID: c.E2E_TENANT_ID ?? '',
        SUPABASE_SERVICE_ROLE_KEY: c.E2E_SUPABASE_SERVICE_ROLE_KEY ?? '',
        SITIO_DOMINIO_BASE: 'localhost',
      },
    },
  ],
});
