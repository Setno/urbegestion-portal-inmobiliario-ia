import { parseSiteData, type SiteData } from '@portal/sitio-datos';

// La base y la corredora que atiende la visita (la decide la dirección, ver direccion.ts).
export interface SiteEnv {
  url: string;
  key: string;
  tenantId: string;
}

// Cuántos segundos puede servirse una copia antes de volver a pedir los datos a la base.
export const REVALIDATE_SECONDS = 60;

// Devuelve null si falta configuración o la corredora no existe: la página muestra un aviso, nunca datos ajenos.
// Si falla la lectura lanza un error, para que Next conserve la última copia buena en vez de publicar el aviso.
export async function getSite(env: SiteEnv | null): Promise<SiteData | null> {
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
