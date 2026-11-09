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
//
// Un nombre solo cuenta como "el mismo" si el más corto abre al más largo y lo que sigue es un sector entre
// paréntesis o una barra ("Melipilla" y "Melipilla (Agrícola / Parcelas)"). Contener el nombre en cualquier parte
// no basta: "Pinto" no es "María Pinto" (H-050). Una comuna vacía no coincide con nada.
const abre = (largo: string, corto: string): boolean =>
  largo === corto || (largo.startsWith(corto) && /^\s*[(/]/.test(largo.slice(corto.length)));

export const matchesCommune = (propertyCommune: string, selected: string, pack: MarketPack = getMarketPack()): boolean => {
  const sel = selected.trim().toLowerCase();
  const prop = propertyCommune.trim().toLowerCase();
  if (!sel || !prop) return false;
  return abre(prop, sel) || abre(sel, prop) || pack.sectorKeywords.some((s) => sel.includes(s) && prop.includes(s));
};

// Teléfono guiado (H-067): lleva lo que la persona escriba al formato del país ("+56 9 1234 5678") o devuelve null si no
// es un número. Con "+" y otro país se acepta tal cual, sin espacios (8 a 15 dígitos). Sirve para contactar al cliente
// o conectar después un asistente o WhatsApp sin adivinar el formato.
export const normalizePhone = (raw: string, pack: MarketPack = getMarketPack()): string | null => {
  const text = raw.trim();
  if (!text || text.length > 30 || !/^[+\d\s()-]+$/.test(text) || text.slice(1).includes('+')) return null;
  const digits = text.replace(/\D/g, '');
  const code = pack.phonePrefix.replace(/\D/g, '');
  const n = pack.phoneNationalDigits;
  let national: string | null = null;
  if (text.startsWith('+') && !digits.startsWith(code)) {
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }
  if (digits.startsWith(code) && digits.length === code.length + n) national = digits.slice(code.length);
  else if (digits.length === n) national = digits;
  if (!national) return null;
  return `${pack.phonePrefix} ${national.slice(0, 1)} ${national.slice(1, 5)} ${national.slice(5)}`;
};
