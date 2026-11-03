import type { Property, PropertyFilterState } from '../types/property';
import { getMarketPack, matchesCommune, type MarketPack } from '@portal/mercados';
import { convertMoney, type CurrencyRates } from '@portal/dinero';
import { currentRates } from '../../../core/money/currentRates';
import { priceOf } from './propertyPrice';

export { matchesCommune };

// Las mismas reglas para el contador del buscador y para la grilla, así nunca se contradicen.
// Los montos mínimo y máximo vienen en la moneda con que se está mirando el catálogo: el precio de la propiedad
// se convierte a esa moneda antes de comparar.
export const matchesFilters = (
  p: Property,
  filters: PropertyFilterState,
  pack: MarketPack = getMarketPack(),
  currency: string = pack.defaultCurrency,
  rates: CurrencyRates = currentRates(),
): boolean => {
  if (filters.operation !== 'todas' && p.operation !== filters.operation) return false;
  if (filters.propertyType !== 'todos' && p.propertyType !== filters.propertyType) return false;
  if (filters.commune !== 'Todas las comunas' && !matchesCommune(p.commune, filters.commune, pack)) return false;
  if (filters.minPrice !== '' || filters.maxPrice !== '') {
    const price = convertMoney(priceOf(p), currency, pack, rates).amount;
    if (filters.minPrice !== '' && price < Number(filters.minPrice)) return false;
    if (filters.maxPrice !== '' && price > Number(filters.maxPrice)) return false;
  }
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

// Una corredora que acotó sus zonas solo muestra en el sitio las propiedades que están dentro de ellas.
export const isInServiceAreas = (
  p: Pick<Property, 'commune'>,
  view: { restricted: boolean; localities: string[] },
  pack: MarketPack,
): boolean => !view.restricted || view.localities.some((l) => matchesCommune(p.commune, l, pack));
