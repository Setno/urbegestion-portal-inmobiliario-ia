import React, { useState } from 'react';
import { PropertyCard } from './PropertyCard';
import { usePropertyStore } from '../stores/usePropertyStore';
import { useOfferedProperties } from '../hooks/useOfferedProperties';
import { matchesFilters } from '../services/propertyFilters';
import { priceOf } from '../services/propertyPrice';
import { comparePrices, currentRates } from '../../../core/money/money';
import { Property } from '../types/property';
import { useMarket } from '../../../core/market/useMarketStore';
import { useT } from '../../../core/i18n/i18n';
import { ArrowUpDown, Sparkles, Building, RotateCcw } from 'lucide-react';

type SortBy = 'featured' | 'priceAsc' | 'priceDesc' | 'areaDesc';

interface PropertyGridProps {
  onOpenDetails: (property: Property) => void;
  onOpenBooking: (property: Property) => void;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({ 
  onOpenDetails, 
  onOpenBooking 
}) => {
  const { filters, resetFilters, loading, currency } = usePropertyStore();
  // El sitio solo muestra lo publicado y lo que está dentro de las zonas de trabajo de la corredora
  const properties = useOfferedProperties();
  const { restricted } = useMarket();
  const { pack, scopeLabel } = useMarket();
  const { t } = useT();
  const rates = currentRates();
  const [sortBy, setSortBy] = useState<SortBy>('featured');

  // Filter properties based on store state
  const filtered = properties.filter((p) => matchesFilters(p, filters, pack, currency, rates));

  // Sort properties
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'featured') {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    }
    if (sortBy === 'priceAsc') return comparePrices(priceOf(a), priceOf(b), pack, rates);
    if (sortBy === 'priceDesc') return comparePrices(priceOf(b), priceOf(a), pack, rates);
    if (sortBy === 'areaDesc') return (b.totalAreaM2 || b.builtAreaM2) - (a.totalAreaM2 || a.builtAreaM2);
    return 0;
  });

  return (
    <section id="propiedades" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Section Header with Sort Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-urbe-primary/10 text-urbe-primary text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-urbe-accent" />
            {t('grid.badge')}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('grid.title', { scope: scopeLabel })}
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Cartera selecta de departamentos de alto estándar, casas en condominios cerrados y parcelas agrícolas con títulos al día.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-start md:self-end">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">{t('grid.sort.label')}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-urbe-primary cursor-pointer shadow-sm"
          >
            <option value="featured">{t('grid.sort.featured')}</option>
            <option value="priceAsc">{t('grid.sort.priceAsc')}</option>
            <option value="priceDesc">{t('grid.sort.priceDesc')}</option>
            <option value="areaDesc">{t('grid.sort.areaDesc')}</option>
          </select>
        </div>
      </div>

      {/* Properties Grid */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sorted.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onOpenDetails={onOpenDetails}
              onOpenBooking={onOpenBooking}
            />
          ))}
        </div>
      ) : loading ? (
        <div role="status" className="text-center py-16 text-sm text-slate-500">
          {t('grid.loading')}
        </div>
      ) : restricted && properties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">{t('grid.empty.none', { scope: scopeLabel })}</h3>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {t('grid.empty.title')}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {t('grid.empty.text', { locality: t('market.locality') })}
          </p>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-xl bg-urbe-primary text-white text-xs font-bold inline-flex items-center gap-2 shadow hover:bg-urbe-primaryDark transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t('grid.empty.reset')}
          </button>
        </div>
      )}

    </section>
  );
};
