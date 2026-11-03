import { parsePublicSettings, type PublicSettings } from '@portal/sitio-datos/propiedades';
import { REVALIDATE_SECONDS, type SiteEnv } from './getSite';

// Lectura pública de la base. Si falla lanza un error, para que Next conserve la última copia buena.
// `fresca` se salta la caché: lo que se va a guardar no se decide con datos de hace rato.
export async function leerPublico(url: string, env: SiteEnv, init: RequestInit = {}, fresca = false): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    headers: { apikey: env.key, 'Content-Type': 'application/json' },
    ...(fresca ? { cache: 'no-store' as const } : { next: { revalidate: REVALIDATE_SECONDS } }),
  });
  if (!response.ok) throw new Error(`La base respondió ${response.status} al leer el catálogo`);
  return response.json();
}

// Una respuesta correcta con otro contenido (un proxy, una pasarela) no debe reemplazar la copia buena.
export function exigirLista(filas: unknown): unknown[] {
  if (!Array.isArray(filas)) throw new Error('Respuesta inesperada de la base al leer el catálogo');
  return filas;
}

export async function leerAjustes(env: SiteEnv, fresca = false): Promise<PublicSettings> {
  const ajustes = await leerPublico(
    `${env.url}/rest/v1/rpc/get_tenant_public_settings`,
    env,
    { method: 'POST', body: JSON.stringify({ p_tenant: env.tenantId }) },
    fresca,
  );
  if (!ajustes || typeof ajustes !== 'object') throw new Error('Respuesta inesperada de la base al leer el catálogo');
  return parsePublicSettings(ajustes);
}
