import { create } from 'zustand';
import {
  DEFAULT_ENTITLEMENTS,
  accessMode,
  can,
  hasRoom,
  limitOf,
  parseEntitlements,
  type AccessMode,
  type FeatureKey,
  type LimitKey,
  type TenantEntitlements,
} from '@portal/plataforma/contract';
import { fetchEntitlements, fetchPublicEntitlements } from './entitlementsService';
import { tenantGuard } from '../data/dataSource';

interface EntitlementsStore {
  entitlements: TenantEntitlements;
  // Aplica lo que llegó de ventas. Un mensaje más antiguo que el que ya se aplicó se ignora (ADR-009: idempotente y en orden).
  apply: (raw: unknown) => void;
  // Lee los derechos de la base y los aplica; sin datos deja lo que haya.
  load: () => Promise<void>;
  // Para el sitio público (sin sesión): solo funciones y estado.
  loadPublic: () => Promise<void>;
  reset: () => void;
}

export const useEntitlementsStore = create<EntitlementsStore>((set, get) => ({
  entitlements: { ...DEFAULT_ENTITLEMENTS },

  apply: (raw) => {
    const incoming = parseEntitlements(raw);
    const current = get().entitlements;
    if (incoming.updatedAt && current.updatedAt && Date.parse(incoming.updatedAt) < Date.parse(current.updatedAt)) return;
    set({ entitlements: incoming });
  },

  load: async () => {
    const stale = tenantGuard();
    const raw = await fetchEntitlements();
    // Si la corredora cambió mientras se leía, son los derechos de la anterior
    if (raw && !stale()) get().apply(raw);
  },

  loadPublic: async () => {
    const stale = tenantGuard();
    const raw = await fetchPublicEntitlements();
    if (raw && !stale()) get().apply(raw);
  },

  reset: () => set({ entitlements: { ...DEFAULT_ENTITLEMENTS } }),
}));

// Para componentes: se vuelven a pintar si cambian los derechos de la corredora.
export const useCan = (key: FeatureKey): boolean => useEntitlementsStore((s) => can(s.entitlements, key));
export const useLimit = (key: LimitKey): number | null => useEntitlementsStore((s) => limitOf(s.entitlements, key));
export const useHasRoom = (key: LimitKey, used: number): boolean =>
  useEntitlementsStore((s) => hasRoom(s.entitlements, key, used));
export const useAccessMode = (): AccessMode => {
  const entitlements = useEntitlementsStore((s) => s.entitlements);
  return accessMode(entitlements);
};

// Para código que no es un componente.
export const canNow = (key: FeatureKey): boolean => can(useEntitlementsStore.getState().entitlements, key);
export const hasRoomNow = (key: LimitKey, used: number): boolean =>
  hasRoom(useEntitlementsStore.getState().entitlements, key, used);
