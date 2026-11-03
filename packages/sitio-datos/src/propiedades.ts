// Catálogo público del sitio (H-028.2): solo lo que un visitante puede ver de una propiedad publicada.
import { DEFAULT_MARKET_ID, getMarketPack, matchesCommune, selectedAreas, localitiesForAreas } from '@portal/mercados';
import { safeUrl } from './siteData';

export interface PublicProperty {
  id: string;
  title: string;
  operation: 'venta' | 'arriendo';
  propertyType: string;
  priceAmount: number;
  priceCurrency: string;
  commune: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  builtAreaM2: number;
  totalAreaM2: number;
  parkingSpots: number;
  storageUnits: number;
  expensesMonthlyClp: number;
  mapQuery: string;
  featured: boolean;
  images: string[];
  description: string;
  features: string[];
}

export interface PublicSettings {
  marketId: string;
  serviceAreas: string[];
}

export interface PublicCatalog {
  propiedades: PublicProperty[];
  marketId: string;
}

// Las columnas que se piden a la base: nada interno (quién aprobó, motivos de rechazo, notas).
export const PUBLIC_PROPERTY_COLUMNS = [
  'id',
  'title',
  'operation',
  'property_type',
  'price_amount',
  'price_currency',
  'commune',
  'address',
  'bedrooms',
  'bathrooms',
  'built_area_m2',
  'total_area_m2',
  'parking_spots',
  'storage_units',
  'expenses_monthly_clp',
  'map_query',
  'featured',
  'images',
  'description',
  'features',
].join(',');

const textOf = (value: unknown): string => (typeof value === 'string' ? value : '');
const countOf = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const textsOf = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '') : [];

function parseProperty(raw: unknown): PublicProperty | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const price = typeof r.price_amount === 'number' ? r.price_amount : Number.parseFloat(textOf(r.price_amount));
  const operation = r.operation;
  if (!textOf(r.id) || !textOf(r.title) || !Number.isFinite(price)) return null;
  if (operation !== 'venta' && operation !== 'arriendo') return null;
  return {
    id: textOf(r.id),
    title: textOf(r.title),
    operation,
    propertyType: textOf(r.property_type),
    priceAmount: price,
    priceCurrency: textOf(r.price_currency) || 'UF',
    commune: textOf(r.commune),
    address: textOf(r.address),
    bedrooms: countOf(r.bedrooms),
    bathrooms: countOf(r.bathrooms),
    builtAreaM2: countOf(r.built_area_m2),
    totalAreaM2: countOf(r.total_area_m2),
    parkingSpots: countOf(r.parking_spots),
    storageUnits: countOf(r.storage_units),
    expensesMonthlyClp: countOf(r.expenses_monthly_clp),
    mapQuery: textOf(r.map_query),
    featured: r.featured === true,
    images: textsOf(r.images).map(safeUrl).filter(Boolean),
    description: textOf(r.description),
    features: textsOf(r.features),
  };
}

// Una fila rara se descarta: nunca debe romper la página de toda la corredora.
export function parsePublicProperties(raw: unknown): PublicProperty[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => parseProperty(row) ?? []);
}

export function parsePublicSettings(raw: unknown): PublicSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as { market?: unknown; service_areas?: unknown };
  return {
    marketId: textOf(r.market) || DEFAULT_MARKET_ID,
    serviceAreas: textsOf(r.service_areas),
  };
}

// Una corredora que acotó sus zonas solo muestra lo que está dentro de ellas.
export function dentroDeZonas(propiedades: PublicProperty[], settings: PublicSettings): PublicProperty[] {
  const pack = getMarketPack(settings.marketId);
  if (selectedAreas(pack, settings.serviceAreas).length === pack.areas.length) return propiedades;
  const localidades = localitiesForAreas(pack, settings.serviceAreas);
  return propiedades.filter((p) => localidades.some((l) => matchesCommune(p.commune, l, pack)));
}

export interface FiltrosCatalogo {
  operation: 'todas' | 'venta' | 'arriendo';
  propertyType: string; // vacío: todos
  commune: string; // vacío: todas
  minBedrooms: number;
  query: string;
}

export const SIN_FILTROS: FiltrosCatalogo = { operation: 'todas', propertyType: '', commune: '', minBedrooms: 0, query: '' };

// Sin mayúsculas ni tildes: quien busca "vina" también encuentra Viña del Mar.
const plano = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export function filtrarPropiedades(propiedades: PublicProperty[], filtros: FiltrosCatalogo): PublicProperty[] {
  const query = plano(filtros.query.trim());
  return propiedades.filter((p) => {
    if (filtros.operation !== 'todas' && p.operation !== filtros.operation) return false;
    if (filtros.propertyType && p.propertyType !== filtros.propertyType) return false;
    if (filtros.commune && p.commune !== filtros.commune) return false;
    if (p.bedrooms < filtros.minBedrooms) return false;
    if (!query) return true;
    return [p.title, p.description, p.commune, p.address, ...p.features].some((texto) => plano(texto).includes(query));
  });
}

export const ordenarDestacadas = (propiedades: PublicProperty[]): PublicProperty[] =>
  [...propiedades].sort((a, b) => Number(b.featured) - Number(a.featured));
