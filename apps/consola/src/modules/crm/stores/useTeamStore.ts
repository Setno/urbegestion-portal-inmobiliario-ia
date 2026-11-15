import { create } from 'zustand';
import { getTeamRepository, type TeamMember } from '../services/teamRepository';
import { tenantGuard } from '../../../core/data/dataSource';

// El equipo de la corredora (H-069.1): a quién se le puede asignar un lead. Vacío = sin asignación en pantalla.
interface TeamStore {
  members: TeamMember[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  load: () => Promise<void>;
  // Al cambiar de corredora (H-064)
  reset: () => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
  members: [],
  status: 'idle',

  load: async () => {
    const stale = tenantGuard();
    set({ status: 'loading' });
    try {
      const members = await getTeamRepository().list();
      if (stale()) return;
      set({ members, status: 'ready' });
    } catch (err) {
      if (stale()) return;
      console.warn('[useTeamStore] No se pudo cargar el equipo:', err);
      set({ members: [], status: 'error' });
    }
  },

  reset: () => set({ members: [], status: 'idle' }),
}));
