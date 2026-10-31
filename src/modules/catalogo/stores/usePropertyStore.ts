import { create } from 'zustand';
import { Property, PropertyFilterState } from '../types/property';
import { initialProperties } from '../data/initialProperties';
import { agencyConfig } from '../../../core/config/agencyConfig';
import { createLocalStore } from '../../../core/storage/localStore';
import { newId } from '../../../core/utils/newId';

interface PropertyStore {
  properties: Property[];
  filters: PropertyFilterState;
  currency: 'UF' | 'CLP';
  selectedProperty: Property | null;
  
  // Actions
  setFilters: (filters: Partial<PropertyFilterState>) => void;
  resetFilters: () => void;
  setCurrency: (currency: 'UF' | 'CLP') => void;
  setSelectedProperty: (property: Property | null) => void;
  
  // CRUD Actions
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  
  // Helper
  formatPrice: (priceUf: number) => { display: string; full: string };
}

const defaultFilters: PropertyFilterState = {
  operation: 'todas',
  propertyType: 'todos',
  commune: 'Todas las comunas',
  minPriceUf: '',
  maxPriceUf: '',
  minBedrooms: '',
  minBathrooms: '',
  searchQuery: '',
};

const propertiesStorage = createLocalStore<Property[]>('urbe_properties');

export const usePropertyStore = create<PropertyStore>((set, get) => {
  const initialData: Property[] = propertiesStorage.load() ?? initialProperties;

  const saveToStorage = (props: Property[]) => propertiesStorage.save(props);

  return {
    properties: initialData,
    filters: defaultFilters,
    currency: agencyConfig.market.defaultCurrency,
    selectedProperty: null,

    setFilters: (newFilters) => {
      set((state) => ({
        filters: { ...state.filters, ...newFilters },
      }));
    },

    resetFilters: () => {
      set({ filters: defaultFilters });
    },

    setCurrency: (currency) => {
      set({ currency });
    },

    setSelectedProperty: (property) => {
      set({ selectedProperty: property });
    },

    addProperty: (propertyData) => {
      const newProp: Property = {
        ...propertyData,
        id: newId('prop'),
        createdAt: new Date().toISOString().split('T')[0],
      };
      set((state) => {
        const updated = [newProp, ...state.properties];
        saveToStorage(updated);
        return { properties: updated };
      });
    },

    updateProperty: (id, updates) => {
      set((state) => {
        const updated = state.properties.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        );
        saveToStorage(updated);
        return { properties: updated };
      });
    },

    deleteProperty: (id) => {
      set((state) => {
        const updated = state.properties.filter((p) => p.id !== id);
        saveToStorage(updated);
        return { properties: updated };
      });
    },

    formatPrice: (priceUf: number) => {
      const { currency } = get();
      const ufRate = agencyConfig.market.ufValueClp;
      
      if (currency === 'UF') {
        const isRental = priceUf < 100;
        return {
          display: `${priceUf.toLocaleString('es-CL')} UF`,
          full: `${priceUf.toLocaleString('es-CL')} UF ≈ $${Math.round(priceUf * ufRate).toLocaleString('es-CL')} CLP`,
        };
      } else {
        const clpVal = Math.round(priceUf * ufRate);
        return {
          display: `$${clpVal.toLocaleString('es-CL')} CLP`,
          full: `$${clpVal.toLocaleString('es-CL')} CLP (${priceUf.toLocaleString('es-CL')} UF)`,
        };
      }
    },
  };
});
