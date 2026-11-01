import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Home, 
  RotateCcw, 
  SlidersHorizontal, 
  ChevronDown 
} from 'lucide-react';
import { usePropertyStore } from '../stores/usePropertyStore';
import { isPublished } from '../services/publicationWorkflow';
import { matchesFilters } from '../services/propertyFilters';
import { useMarket } from '../../../core/market/useMarketStore';
import { PropertyType } from '../types/property';
import { useT, capitalize } from '../../../core/i18n/i18n';

export const SearchFilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, currency, properties: allProperties } = usePropertyStore();
  const properties = allProperties.filter(isPublished);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { pack, zones, scopeLabel } = useMarket();
  const { t, tn } = useT();

  const count = properties.filter((p) => matchesFilters(p, filters, pack, currency)).length;

  const isFiltered = 
    filters.operation !== 'todas' || 
    filters.propertyType !== 'todos' || 
    filters.commune !== 'Todas las comunas' || 
    filters.minPrice !== '' || 
    filters.maxPrice !== '' || 
    filters.minBedrooms !== '' ||
    filters.searchQuery !== '';

  return (
    <div id="buscador" className="relative z-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 mb-8 sm:mb-12">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-4 sm:p-7 backdrop-blur-lg">
        
        {/* Operation Tabs (Todas / Venta / Arriendo) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4 sm:pb-5 sm:mb-5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
            {(['todas', 'venta', 'arriendo'] as const).map((op) => (
              <button
                key={op}
                onClick={() => setFilters({ operation: op })}
                className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                  filters.operation === op
                    ? 'bg-urbe-primary text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {op === 'todas' ? t('search.op.all') : op === 'venta' ? t('search.op.sale') : t('search.op.rent')}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <span className="text-[11px] sm:text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              {tn('search.count', count)}
            </span>

            {isFiltered && (
              <button
                onClick={resetFilters}
                className="text-[11px] sm:text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                {t('search.clear')}
              </button>
            )}
          </div>
        </div>

        {/* Primary Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
          
          {/* Keyword Search */}
          <div className="md:col-span-4 relative">
            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              {t('search.keyword.label')}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('search.keyword.placeholder')}
                value={filters.searchQuery}
                onChange={(e) => setFilters({ searchQuery: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-urbe-primary focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Commune Filter with Complete Región Metropolitana Zones */}
          <div className="md:col-span-4">
            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              {t('search.locality.label', { Locality: capitalize(t('market.locality')) })}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filters.commune}
                onChange={(e) => setFilters({ commune: e.target.value })}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-urbe-primary focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="Todas las comunas">{t('search.locality.all', { localities: t('market.localities'), scope: scopeLabel })}</option>
                {zones.map((zone) => (
                  <optgroup key={zone.groupName} label={`--- ${zone.groupName} ---`} className="font-bold text-slate-900 bg-slate-100">
                    {zone.localities.map((comm) => (
                      <option key={comm} value={comm} className="font-normal text-slate-800 bg-white">
                        {comm}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Property Type */}
          <div className="md:col-span-2">
            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              {t('search.type.label')}
            </label>
            <div className="relative">
              <Home className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({ propertyType: e.target.value as PropertyType | 'todos' })}
                className="w-full pl-8 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-urbe-primary focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="todos">{t('search.type.all')}</option>
                <option value="departamento">{t('search.type.apartment')}</option>
                <option value="casa">{t('search.type.house')}</option>
                <option value="parcela_agricola">{t('search.type.farm')}</option>
                <option value="oficina_comercial">{t('search.type.office')}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Advanced Toggle */}
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                showAdvanced || filters.minPrice !== '' || filters.maxPrice !== '' || filters.minBedrooms !== ''
                  ? 'bg-urbe-primary/10 border-urbe-primary text-urbe-primary'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? t('search.filters.hide') : t('search.filters.show')}</span>
            </button>
          </div>

        </div>

        {/* Advanced Filter Collapsible Panel */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
            
            {/* Min Price */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                {t('search.price.min', { currency })}
              </label>
              <input
                type="number"
                placeholder={t('search.price.example', { example: currency === pack.baseCurrency ? '150000000' : '5000' })}
                value={filters.minPrice}
                onChange={(e) => setFilters({ minPrice: e.target.value ? Number(e.target.value) : '' })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-urbe-primary focus:bg-white"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                {t('search.price.max', { currency })}
              </label>
              <input
                type="number"
                placeholder={t('search.price.example', { example: currency === pack.baseCurrency ? '900000000' : '25000' })}
                value={filters.maxPrice}
                onChange={(e) => setFilters({ maxPrice: e.target.value ? Number(e.target.value) : '' })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-urbe-primary focus:bg-white"
              />
            </div>

            {/* Min Bedrooms */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                {t('search.bedrooms.label')}
              </label>
              <select
                value={filters.minBedrooms}
                onChange={(e) => setFilters({ minBedrooms: e.target.value ? Number(e.target.value) : '' })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-urbe-primary focus:bg-white"
              >
                <option value="">{t('search.bedrooms.any')}</option>
                <option value="1">{t('search.bedrooms.n', { count: 1 })}</option>
                <option value="2">{t('search.bedrooms.n', { count: 2 })}</option>
                <option value="3">{t('search.bedrooms.n', { count: 3 })}</option>
                <option value="4">{t('search.bedrooms.n', { count: 4 })}</option>
                <option value="5">{t('search.bedrooms.n', { count: 5 })}</option>
              </select>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
