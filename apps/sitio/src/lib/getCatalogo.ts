import { dentroDeZonas, parsePublicProperties, PUBLIC_PROPERTY_COLUMNS, type PublicCatalog } from '@portal/sitio-datos/propiedades';
import { DEFAULT_MARKET_ID } from '@portal/mercados';
import { siteEnv, type SiteEnv } from './getSite';
import { exigirLista, leerAjustes, leerPublico } from './lecturas';

// Lo que el sitio ofrece: lo publicado de esta corredora dentro de sus zonas de trabajo.
export async function getCatalogo(env: SiteEnv | null = siteEnv()): Promise<PublicCatalog> {
  if (!env) return { propiedades: [], marketId: DEFAULT_MARKET_ID };
  const consulta = new URLSearchParams({
    select: PUBLIC_PROPERTY_COLUMNS,
    tenant_id: `eq.${env.tenantId}`,
    publication_status: 'eq.publicada',
    order: 'created_at.desc',
  });
  const [respuesta, settings] = await Promise.all([leerPublico(`${env.url}/rest/v1/properties?${consulta}`, env), leerAjustes(env)]);
  const filas = exigirLista(respuesta);
  const propiedades = parsePublicProperties(filas);
  if (propiedades.length < filas.length) console.warn(`[sitio] Se descartaron ${filas.length - propiedades.length} propiedades con datos inválidos`);
  return { propiedades: dentroDeZonas(propiedades, settings), marketId: settings.marketId };
}
