import type { LocationArea, LocationZone, MarketPack } from './types';
import { CHILE } from './cl';

export type { LocationArea, LocationZone, MarketPack } from './types';

export const DEFAULT_MARKET_ID = 'cl';

// Un mercado nuevo es un paquete nuevo en esta lista, sin cambios en Captación, CRM ni Catálogo.
const PACKS: Record<string, MarketPack> = { [CHILE.id]: CHILE };

// Un id desconocido (dato viejo o mal escrito) cae en el mercado por defecto en vez de romper la pantalla.
export const getMarketPack = (id?: string | null): MarketPack => PACKS[id ?? ''] ?? PACKS[DEFAULT_MARKET_ID];

// Las áreas donde trabaja la corredora. Sin selección (o con ids que no existen) cuenta todo el mercado.
export const selectedAreas = (pack: MarketPack, areaIds: string[]): LocationArea[] => {
  const chosen = pack.areas.filter((a) => areaIds.includes(a.id));
  return chosen.length > 0 ? chosen : pack.areas;
};

// Zonas para armar listas con grupos (una región de una sola pieza se nombra por la región).
export const zonesForAreas = (pack: MarketPack, areaIds: string[]): LocationZone[] =>
  selectedAreas(pack, areaIds).flatMap((a) => a.zones);

export const localitiesForAreas = (pack: MarketPack, areaIds: string[]): string[] =>
  zonesForAreas(pack, areaIds).flatMap((z) => z.localities);
