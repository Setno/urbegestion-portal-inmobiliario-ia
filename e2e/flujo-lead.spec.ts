import { expect, test, type Page } from '@playwright/test';

// H-023: el flujo de negocio central. Un visitante pide una visita en el sitio de la corredora y el agente
// ve ese lead en el CRM. Corre contra la base de desarrollo (cuenta B), con la corredora de prueba BontesDev.
// Al final borra el lead que creó, para no dejar datos de prueba acumulados.

const SITIO = 'http://localhost:3101';
const CONSOLA = 'http://localhost:3100';

test.beforeAll(() => {
  const faltan = ['E2E_EMAIL', 'E2E_PASSWORD', 'E2E_TENANT_ID'].filter((n) => !process.env[n]);
  if (faltan.length > 0) {
    throw new Error(`Faltan datos de la prueba (${faltan.join(', ')}). Completa e2e/credenciales.local; la plantilla es e2e/credenciales.ejemplo.`);
  }
});

async function entrarAlPanel(page: Page): Promise<void> {
  await page.goto(CONSOLA);
  await page.getByRole('button', { name: 'Abrir CRM Auto-Gestionable' }).click();
  await page.getByLabel(/correo|email/i).first().fill(process.env.E2E_EMAIL ?? '');
  await page.getByLabel(/contraseña|password|clave/i).first().fill(process.env.E2E_PASSWORD ?? '');
  await page.locator('form button[type=submit]').click();
  await expect(page.getByRole('button', { name: /Leads CRM/ })).toBeVisible();
}

test('un visitante pide una visita en el sitio y el agente ve el lead en el CRM', async ({ page }) => {
  const marca = Date.now().toString();
  const nombre = `Prueba E2E ${marca}`;
  // Un teléfono distinto en cada corrida: la base limita a 3 envíos por hora por número.
  const telefono = `+56 9 ${marca.slice(-8)}`;

  // 1. El visitante abre una ficha del sitio y pide una visita.
  await page.goto(SITIO);
  await page.locator('a[href^="/propiedades/"]').first().click();
  await expect(page.getByRole('heading', { name: '¿Quieres visitar esta propiedad?' })).toBeVisible();
  await page.locator('#visita-nombre').fill(nombre);
  await page.locator('#visita-telefono').fill(telefono);
  await page.locator('#visita-correo').fill(`e2e-${marca}@ejemplo.test`);
  await page.getByRole('button', { name: 'Solicitar visita' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Recibimos tu solicitud' })).toBeVisible();

  // 2. El agente inicia sesión y encuentra el lead, con los datos que dejó el visitante.
  await entrarAlPanel(page);
  const tarjeta = page.getByRole('button', { name: new RegExp(nombre) }).first();
  await expect(tarjeta).toBeVisible();
  await tarjeta.click();
  await expect(page.getByText(telefono).first()).toBeVisible();

  // 3. Limpieza: el agente elimina el lead de prueba y no vuelve a aparecer tras recargar.
  await page.getByRole('button', { name: 'Eliminar Lead' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Abrir CRM Auto-Gestionable' }).click();
  await expect(page.getByRole('button', { name: /Leads CRM/ })).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(nombre) })).toHaveCount(0);
});
