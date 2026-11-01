import { create } from 'zustand';
import { Property, PropertyFilterState } from '../types/property';
import { initialProperties } from '../data/initialProperties';
import { agencyConfig } from '../../../core/config/agencyConfig';
import { createLocalStore } from '../../../core/storage/localStore';
import { getPropertyRepository } from '../services/propertyRepository';

interface PropertyStore {
  properties: Property[];
  filters: PropertyFilterState;
  currency: 'UF' | 'CLP';
  selectedProperty: Property | null;
  loading: boolean;
  
  // Actions
  setFilters: (filters: Partial<PropertyFilterState>) => void;
  resetFilters: () => void;
  setCurrency: (currency: 'UF' | 'CLP') => void;
  setSelectedProperty: (property: Property | null) => void;
  
  // CRUD Actions
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>) => string;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  // Flujo de aprobación: el agente envía a revisión; el administrador aprueba o rechaza (con motivo).
  submitForReview: (id: string) => void;
  approveProperty: (id: string) => void;
  rejectProperty: (id: string, reason: string) => void;
  // Trae las propiedades de la base (solo con Supabase; con almacenamiento local no hace nada).
  load: () => Promise<void>;
  
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

// Un fallo al guardar no rompe la pantalla: el dato queda en memoria y se avisa por consola.
const warnOnFail = (promise: Promise<void>, action: string) => {
  promise.catch((err) => console.warn(`[usePropertyStore] No se pudo ${action}:`, err));
};

export const usePropertyStore = create<PropertyStore>((set, get) => {
  // Con Supabase la lista parte vacía y se llena con load(); sin Supabase parte de lo guardado en el navegador.
  const remote = getPropertyRepository().mode === 'remote';
  const initialData: Property[] = remote ? [] : propertiesStorage.load() ?? initialProperties;

  return {
    properties: initialData,
    loading: remote,
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
      const repo = getPropertyRepository();
      const newProp: Property = {
        ...propertyData,
        id: repo.newId(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = [newProp, ...get().properties];
      set({ properties: updated });
      warnOnFail(repo.create(newProp, updated), 'guardar la propiedad');
      return newProp.id;
    },

    updateProperty: (id, updates) => {
      const updated = get().properties.map((p) => (p.id === id ? { ...p, ...updates } : p));
      set({ properties: updated });
      warnOnFail(getPropertyRepository().update(id, updates, updated), 'actualizar la propiedad');
    },

    deleteProperty: (id) => {
      const updated = get().properties.filter((p) => p.id !== id);
      set({ properties: updated });
      warnOnFail(getPropertyRepository().remove(id, updated), 'borrar la propiedad');
    },

    submitForReview: (id) => {
      get().updateProperty(id, { publicationStatus: 'en_revision', rejectionReason: undefined });
    },

    approveProperty: (id) => {
      // La base fija quién aprobó y cuándo; aquí solo se refleja en pantalla.
      get().updateProperty(id, {
        publicationStatus: 'publicada',
        rejectionReason: undefined,
        approvedAt: new Date().toISOString(),
      });
    },

    rejectProperty: (id, reason) => {
      const motivo = reason.trim();
      if (!motivo) return;
      get().updateProperty(id, { publicationStatus: 'rechazada', rejectionReason: motivo });
    },

    load: async () => {
      const repo = getPropertyRepository();
      if (repo.mode !== 'remote') return;
      set({ loading: true });
      try {
        const properties = await repo.list();
        if (properties) set({ properties });
      } catch (err) {
        console.warn('[usePropertyStore] No se pudieron cargar las propiedades:', err);
      } finally {
        set({ loading: false });
      }
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
