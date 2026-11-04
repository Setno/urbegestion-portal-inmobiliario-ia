import { create } from 'zustand';
import type { LeadEvent, LeadEventKind } from '../types/leadEvent';
import { MANUAL_KINDS, sortEvents } from '../services/leadTimeline';
import { eventStorage, getLeadEventRepository } from '../services/leadEventRepository';
import { useAuthStore } from '../../../core/auth/useAuthStore';

interface TimelineStore {
  // Historial por lead, del más reciente al más antiguo.
  events: Record<string, LeadEvent[]>;
  // Aviso para la pantalla si el último contacto no se pudo guardar.
  saveError: string | null;
  // Con Supabase trae los eventos del lead; con almacenamiento local no hace falta.
  load: (leadId: string) => Promise<void>;
  // Registra un contacto. `system` permite el tipo "estado" (solo lo usa el sistema). Devuelve false si no es válido.
  add: (leadId: string, kind: LeadEventKind, text: string, system?: boolean) => boolean;
  // Borra el historial de un lead que se eliminó (en la base lo hace la cascada).
  removeForLead: (leadId: string) => void;
}

const group = (list: LeadEvent[]): Record<string, LeadEvent[]> => {
  const out: Record<string, LeadEvent[]> = {};
  for (const e of sortEvents(list)) (out[e.leadId] ??= []).push(e);
  return out;
};

// Contactos ya mostrados pero que la base aún no confirma: un load() que llegue en medio no los borra.
const pending = new Set<string>();

export const useTimelineStore = create<TimelineStore>((set, get) => {
  const initial = getLeadEventRepository().mode === 'remote' ? [] : eventStorage.load() ?? [];

  return {
    events: group(initial),
    saveError: null,

    load: async (leadId) => {
      const repo = getLeadEventRepository();
      if (repo.mode !== 'remote') return;
      try {
        const list = await repo.listForLead(leadId);
        if (!list) return;
        const ids = new Set(list.map((e) => e.id));
        const unconfirmed = (get().events[leadId] ?? []).filter((e) => pending.has(e.id) && !ids.has(e.id));
        set({ events: { ...get().events, [leadId]: sortEvents([...unconfirmed, ...list]) } });
      } catch (err) {
        console.warn('[useTimelineStore] No se pudo cargar el historial:', err);
      }
    },

    add: (leadId, kind, text, system = false) => {
      const clean = text.trim();
      if (!clean) return false;
      if (kind === 'estado' ? !system : !MANUAL_KINDS.includes(kind)) return false;
      const repo = getLeadEventRepository();
      const event: LeadEvent = {
        id: repo.newId(),
        leadId,
        kind,
        text: clean.slice(0, 2000),
        occurredAt: new Date().toISOString(),
        author: useAuthStore.getState().email ?? 'Tú',
      };
      const events = { ...get().events, [leadId]: [event, ...(get().events[leadId] ?? [])] };
      set({ events, saveError: null });
      pending.add(event.id);
      repo
        .create(event, Object.values(events).flat())
        .catch((err) => {
          // Si no quedó guardado, no se deja a la vista como si lo estuviera.
          console.warn('[useTimelineStore] No se pudo guardar el contacto:', err);
          const current = get().events;
          set({
            events: { ...current, [leadId]: (current[leadId] ?? []).filter((e) => e.id !== event.id) },
            saveError: 'No se pudo guardar el contacto. Inténtalo de nuevo.',
          });
        })
        .finally(() => pending.delete(event.id));
      return true;
    },

    removeForLead: (leadId) => {
      const { [leadId]: _removed, ...rest } = get().events;
      set({ events: rest });
      if (getLeadEventRepository().mode === 'local') eventStorage.save(Object.values(rest).flat());
    },
  };
});
