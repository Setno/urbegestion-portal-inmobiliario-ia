import type { LocationArea, LocationZone, MarketPack } from './types';
import { CHILE } from './cl';

export type { LocationArea, LocationZone, MarketPack, RateFeed, RateReading } from './types';

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

// Una comuna elegida en el buscador puede ser más larga o más corta que la guardada en la propiedad
// (por ejemplo "Lo Barnechea (La Dehesa / Los Trapenses)" frente a "Lo Barnechea"); los sectores con varios
// nombres los define el paquete de mercado.
export const matchesCommune = (propertyCommune: string, selected: string, pack: MarketPack = getMarketPack()): boolean => {
  const sel = selected.toLowerCase();
  const prop = propertyCommune.toLowerCase();
  return prop.includes(sel) || sel.includes(prop) || pack.sectorKeywords.some((s) => sel.includes(s) && prop.includes(s));
};
