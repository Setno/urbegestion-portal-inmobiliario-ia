import type { SiteEnv } from './getSite';

const ESPERA_MS = 8000;

// Crea el lead llamando a la función `create_site_lead` de la base. Desde H-063 esa función ya no acepta la clave
// pública (la ve cualquiera): solo la clave de servicio, que vive en el servidor del sitio (SUPABASE_SERVICE_ROLE_KEY)
// y nunca llega al navegador. La función valida la corredora, los campos y los topes de envío (H-052).
// Devuelve true si el lead quedó guardado. Los registros no llevan datos personales.
export async function crearLeadEnBase(env: SiteEnv, fila: Record<string, unknown>): Promise<boolean> {
  const claveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!claveServicio) {
    console.warn('[sitio] Falta SUPABASE_SERVICE_ROLE_KEY: no se pueden guardar solicitudes');
    return false;
  }
  const response = await fetch(`${env.url}/rest/v1/rpc/create_site_lead`, {
    method: 'POST',
    headers: { apikey: claveServicio, Authorization: `Bearer ${claveServicio}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(ESPERA_MS),
    body: JSON.stringify({ p_tenant: env.tenantId, p_lead: fila }),
  });
  if (!response.ok) console.warn(`[sitio] La base rechazó una solicitud (${response.status})`);
  return response.ok;
}
