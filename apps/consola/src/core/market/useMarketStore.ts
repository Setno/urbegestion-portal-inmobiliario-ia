import { useMemo } from 'react';
import { create } from 'zustand';
import { remoteContext } from '../data/dataSource';
import type { SimpleResult } from '../auth/authService';
import { getMarketPack, selectedAreas, zonesForAreas, localitiesForAreas, type LocationZone, type MarketPack } from '../../markets';
import { DEFAULT_SETTINGS, fetchPublicSettings, saveServiceAreas } from './marketService';

interface MarketStore {
  marketId: string;
  serviceAreas: string[];
  loaded: boolean;
  // Con Supabase lee el mercado y las zonas de la corredora del sitio; sin Supabase deja los valores por defecto.
  load: () => Promise<void>;
  // Solo el administrador (lo exige la base). Sin Supabase solo cambia en memoria.
  setServiceAreas: (areas: string[]) => Promise<SimpleResult>;
}

export const useMarketStore = create<MarketStore>((set) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    const ctx = remoteContext();
    const settings = ctx ? await fetchPublicSettings(ctx.tenantId) : null;
    set({ ...(settings ?? DEFAULT_SETTINGS), loaded: true });
  },

  setServiceAreas: async (areas) => {
    const unique = [...new Set(areas)];
    if (remoteContext()) {
      const result = await saveServiceAreas(unique);
      if (!result.ok) return result;
    }
    set({ serviceAreas: unique });
    return { ok: true };
  },
}));

export interface MarketView {
  pack: MarketPack;
  zones: LocationZone[]; // para armar listas con grupos
  localities: string[]; // todas las comunas (o equivalente) donde trabaja la corredora
  defaultLocality: string; // valor inicial razonable para un formulario
  scopeLabel: string; // "Chile", "Valparaíso", "Biobío y Valparaíso"…
  restricted: boolean; // la corredora acotó sus zonas: solo se ofrece (y se muestra) lo que está dentro de ellas
}

const joinNames = (names: string[]): string =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;

export function marketView(marketId: string, serviceAreas: string[]): MarketView {
  const pack = getMarketPack(marketId);
  const chosen = selectedAreas(pack, serviceAreas);
  const localities = localitiesForAreas(pack, serviceAreas);
  const allSelected = chosen.length === pack.areas.length;
  const names = chosen.map((a) => a.name).sort((a, b) => a.localeCompare(b, pack.locale));
  return {
    pack,
    zones: zonesForAreas(pack, serviceAreas),
    localities,
    defaultLocality: localities[0] ?? '',
    scopeLabel: allSelected ? pack.name : joinNames(names),
    restricted: !allSelected,
  };
}

// Lo que necesitan las pantallas: el paquete del país y dónde trabaja la corredora.
export function useMarket(): MarketView {
  const marketId = useMarketStore((s) => s.marketId);
  const serviceAreas = useMarketStore((s) => s.serviceAreas);
  return useMemo(() => marketView(marketId, serviceAreas), [marketId, serviceAreas]);
}
