import type { Property, PropertyFilterState } from '../types/property';
import { getMarketPack, type MarketPack } from '../../../markets';

// Una comuna elegida en el buscador puede ser más larga o más corta que la guardada en la propiedad
// (por ejemplo "Lo Barnechea (La Dehesa / Los Trapenses)" frente a "Lo Barnechea"); los sectores con varios
// nombres los define el paquete de mercado.
export const matchesCommune = (propertyCommune: string, selected: string, pack: MarketPack = getMarketPack()): boolean => {
  const sel = selected.toLowerCase();
  const prop = propertyCommune.toLowerCase();
  return prop.includes(sel) || sel.includes(prop) || pack.sectorKeywords.some((s) => sel.includes(s) && prop.includes(s));
};

// Las mismas reglas para el contador del buscador y para la grilla, así nunca se contradicen.
export const matchesFilters = (p: Property, filters: PropertyFilterState, pack: MarketPack = getMarketPack()): boolean => {
  if (filters.operation !== 'todas' && p.operation !== filters.operation) return false;
  if (filters.propertyType !== 'todos' && p.propertyType !== filters.propertyType) return false;
  if (filters.commune !== 'Todas las comunas' && !matchesCommune(p.commune, filters.commune, pack)) return false;
  if (filters.minPriceUf !== '' && p.priceUf < Number(filters.minPriceUf)) return false;
  if (filters.maxPriceUf !== '' && p.priceUf > Number(filters.maxPriceUf)) return false;
  if (filters.minBedrooms !== '' && p.bedrooms < Number(filters.minBedrooms)) return false;
  if (filters.minBathrooms !== '' && p.bathrooms < Number(filters.minBathrooms)) return false;
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    const match =
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.commune.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.features.some((f) => f.toLowerCase().includes(q));
    if (!match) return false;
  }
  return true;
};
