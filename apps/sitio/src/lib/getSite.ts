import { parseSiteData, type SiteData } from '@portal/sitio-datos';

export interface SiteEnv {
  url: string;
  key: string;
  tenantId: string;
}

// Por ahora el sitio atiende a una corredora fija por variable de entorno; la resolución por dominio llega con H-030.
// En Vercel se usan los nombres propios del sitio; en local se reutilizan los de la consola (mismo .env.local).
export function siteEnv(env: Record<string, string | undefined> = process.env): SiteEnv | null {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const tenantId = env.SITIO_TENANT_ID || env.VITE_TENANT_ID;
  return url && key && tenantId ? { url, key, tenantId } : null;
}

// Cuántos segundos puede servirse una copia antes de volver a pedir los datos a la base.
export const REVALIDATE_SECONDS = 60;

// Devuelve null si falta configuración o la corredora no existe: la página muestra un aviso, nunca datos ajenos.
// Si falla la lectura lanza un error, para que Next conserve la última copia buena en vez de publicar el aviso.
export async function getSite(env: SiteEnv | null = siteEnv()): Promise<SiteData | null> {
  if (!env) return null;
  const response = await fetch(`${env.url}/rest/v1/rpc/get_tenant_public_site`, {
    method: 'POST',
    headers: { apikey: env.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_tenant: env.tenantId }),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) throw new Error(`La base respondió ${response.status} al leer la corredora`);
  const data: unknown = await response.json();
  const site = parseSiteData(data);
  // La base responde null si la corredora no existe; otro contenido no debe reemplazar la copia buena.
  if (!site && data !== null) throw new Error('Respuesta inesperada de la base al leer la corredora');
  return site;
}
