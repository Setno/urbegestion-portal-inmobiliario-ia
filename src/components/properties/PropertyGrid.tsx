import React, { useState } from 'react';
import { PropertyCard } from './PropertyCard';
import { usePropertyStore } from '../../stores/usePropertyStore';
import { Property } from '../../types/property';
import { ArrowUpDown, Sparkles, Building, RotateCcw } from 'lucide-react';

interface PropertyGridProps {
  onOpenDetails: (property: Property) => void;
  onOpenBooking: (property: Property) => void;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({ 
  onOpenDetails, 
  onOpenBooking 
}) => {
  const { properties, filters, resetFilters } = usePropertyStore();
  const [sortBy, setSortBy] = useState<'featured' | 'priceAsc' | 'priceDesc' | 'areaDesc'>('featured');

  // Filter properties based on store state
  const filtered = properties.filter((p) => {
    if (filters.operation !== 'todas' && p.operation !== filters.operation) return false;
    if (filters.propertyType !== 'todos' && p.propertyType !== filters.propertyType) return false;
    if (filters.commune !== 'Todas las comunas' && p.commune !== filters.commune) return false;
    if (filters.minPriceUf !== '' && p.priceUf < Number(filters.minPriceUf)) return false;
    if (filters.maxPriceUf !== '' && p.priceUf > Number(filters.maxPriceUf)) return false;
    if (filters.minBedrooms !== '' && p.bedrooms < Number(filters.minBedrooms)) return false;
    if (filters.minBathrooms !== '' && p.bathrooms < Number(filters.minBathrooms)) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match = p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.commune.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.features.some(f => f.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Sort properties
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'featured') {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    }
    if (sortBy === 'priceAsc') return a.priceUf - b.priceUf;
    if (sortBy === 'priceDesc') return b.priceUf - a.priceUf;
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
            Catálogo Exclusivo
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Propiedades en Santiago y Alrededores
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Cartera selecta de departamentos de alto estándar, casas en condominios cerrados y parcelas agrícolas con títulos al día.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-start md:self-end">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-urbe-primary cursor-pointer shadow-sm"
          >
            <option value="featured">Destacadas primero</option>
            <option value="priceAsc">Menor a mayor precio</option>
            <option value="priceDesc">Mayor a menor precio</option>
            <option value="areaDesc">Mayor superficie (m²)</option>
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
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            No se encontraron propiedades con estos filtros
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Intenta ampliar el rango de precio, cambiar de comuna o restablecer todos los filtros para ver la cartera completa.
          </p>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-xl bg-urbe-primary text-white text-xs font-bold inline-flex items-center gap-2 shadow hover:bg-urbe-primaryDark transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer todos los filtros
          </button>
        </div>
      )}

    </section>
  );
};
