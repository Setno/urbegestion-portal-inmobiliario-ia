import { dentroDeZonas, ESTADOS_VISIBLES, parsePublicProperties, PUBLIC_PROPERTY_COLUMNS, type PublicProperty } from '@portal/sitio-datos/propiedades';
import type { SiteEnv } from './getSite';
import { exigirLista, leerAjustes, leerPublico } from './lecturas';
import { esUuid } from './uuid';

export interface FichaPublica {
  propiedad: PublicProperty;
  marketId: string;
}

// Una propiedad de esta corredora, publicada y dentro de sus zonas de trabajo. Null si no cumple: nunca una de otra corredora.
export async function getPropiedad(id: string, env: SiteEnv | null, fresca = false): Promise<FichaPublica | null> {
  if (!env || !esUuid(id)) return null;
  const consulta = new URLSearchParams({
    select: PUBLIC_PROPERTY_COLUMNS,
    id: `eq.${id}`,
    tenant_id: `eq.${env.tenantId}`,
    publication_status: 'eq.publicada',
    status: ESTADOS_VISIBLES,
  });
  const [respuesta, settings] = await Promise.all([
    leerPublico(`${env.url}/rest/v1/properties?${consulta}`, env, {}, fresca),
    leerAjustes(env, fresca),
  ]);
  const [propiedad] = dentroDeZonas(parsePublicProperties(exigirLista(respuesta)), settings);
  return propiedad ? { propiedad, marketId: settings.marketId } : null;
}
