import {
  dentroDeZonas,
  parsePublicProperties,
  parsePublicSettings,
  PUBLIC_PROPERTY_COLUMNS,
  type PublicCatalog,
} from '@portal/sitio-datos/propiedades';
import { DEFAULT_MARKET_ID } from '@portal/mercados';
import { REVALIDATE_SECONDS, siteEnv, type SiteEnv } from './getSite';

async function leer(url: string, env: SiteEnv, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    headers: { apikey: env.key, 'Content-Type': 'application/json' },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) throw new Error(`La base respondió ${response.status} al leer el catálogo`);
  return response.json();
}

// Lo que el sitio ofrece: lo publicado de esta corredora dentro de sus zonas de trabajo.
// Si falla la lectura lanza un error, para que Next conserve la última copia buena en vez de publicar un catálogo vacío.
export async function getCatalogo(env: SiteEnv | null = siteEnv()): Promise<PublicCatalog> {
  if (!env) return { propiedades: [], marketId: DEFAULT_MARKET_ID };
  const consulta = new URLSearchParams({
    select: PUBLIC_PROPERTY_COLUMNS,
    tenant_id: `eq.${env.tenantId}`,
    publication_status: 'eq.publicada',
    order: 'created_at.desc',
  });
  const [filas, ajustes] = await Promise.all([
    leer(`${env.url}/rest/v1/properties?${consulta}`, env),
    leer(`${env.url}/rest/v1/rpc/get_tenant_public_settings`, env, {
      method: 'POST',
      body: JSON.stringify({ p_tenant: env.tenantId }),
    }),
  ]);
  // Una respuesta correcta con otro contenido (un proxy, una pasarela) no debe reemplazar la copia buena.
  if (!Array.isArray(filas) || !ajustes || typeof ajustes !== 'object') throw new Error('Respuesta inesperada de la base al leer el catálogo');
  const propiedades = parsePublicProperties(filas);
  if (propiedades.length < filas.length) console.warn(`[sitio] Se descartaron ${filas.length - propiedades.length} propiedades con datos inválidos`);
  const settings = parsePublicSettings(ajustes);
  return { propiedades: dentroDeZonas(propiedades, settings), marketId: settings.marketId };
}
