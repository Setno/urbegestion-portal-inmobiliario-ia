import { create } from 'zustand';
import { Lead, LeadStatus } from '../types/lead';
import { webhookService } from '../../captacion/services/webhookService';
import { createLocalStore } from '../../../core/storage/localStore';
import { getLeadRepository } from '../services/leadRepository';
import { isValidDate, localToday } from '../services/leadTasks';
import { isValidTime } from '../services/leadAgenda';
import { statusLabel } from '../services/leadTimeline';
import { useTimelineStore } from './useTimelineStore';

interface LeadStore {
  leads: Lead[];
  selectedLead: Lead | null;
  
  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => string;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  addNoteToLead: (id: string, note: string) => void;
  // Próxima acción del contacto (H-056). Devuelve false si falta el texto o la fecha no es válida.
  setNextAction: (id: string, text: string, due: string) => boolean;
  // Cambia la fecha y hora de la visita (H-059). La hora puede ir vacía. Devuelve false si los datos no son válidos.
  rescheduleVisit: (id: string, date: string, time: string) => boolean;
  // Da por cumplida la acción: la borra y deja una nota con la fecha.
  completeNextAction: (id: string) => void;
  setSelectedLead: (lead: Lead | null) => void;
  deleteLead: (id: string) => void;
  // Deja el vínculo entre un lead de propietario y la propiedad en borrador creada a partir de él.
  linkProperty: (id: string, propertyId: string) => void;
  // Trae los leads de la base (solo con Supabase; con almacenamiento local no hace nada).
  load: () => Promise<void>;
  // Un lead que ya está en la base y llegó en vivo (H-054): se muestra arriba sin volver a guardarlo.
  // Devuelve true si el lead era nuevo en la lista.
  receiveLead: (lead: Lead) => boolean;
}

// Leads recibidos en vivo (H-054): si llegan mientras load() lee la lista, se conservan.
const liveLeadIds = new Set<string>();

const initialLeads: Lead[] = [
  {
    id: 'lead-01',
    fullName: 'Rodrigo Valenzuela',
    email: 'r.valenzuela@empresa.cl',
    phone: '+56 9 8812 3456',
    propertyInterestId: 'prop-01',
    propertyTitle: 'Penthouse Dúplex de Lujo en Vitacura',
    operationInterest: 'compra',
    budgetAmount: 19000,
    budgetCurrency: 'UF',
    mortgageStatus: 'pre_aprobado',
    targetMoveDate: '1_a_3_meses',
    status: 'visita_agendada',
    appointmentDate: '2026-08-28',
    appointmentTime: '11:00',
    notes: ['Cliente calificado con banco Santander', 'Interesado en visitar terraza y estacionamientos'],
    source: 'asistente_ia',
    createdAt: '2026-08-23',
  },
  {
    id: 'lead-02',
    fullName: 'Constanza Silva & Matías Errázuriz',
    email: 'constanza.silva@estudio.cl',
    phone: '+56 9 9345 6789',
    propertyInterestId: 'prop-02',
    propertyTitle: 'Casa Mediterránea en Los Trapenses',
    operationInterest: 'compra',
    budgetAmount: 25000,
    budgetCurrency: 'UF',
    mortgageStatus: 'al_contado',
    targetMoveDate: 'inmediato',
    status: 'en_negociacion',
    notes: ['Enviada promesa de compraventa para revisión de abogados', 'Piden visita con tasador'],
    source: 'ficha_propiedad',
    createdAt: '2026-08-22',
  },
  {
    id: 'lead-03',
    fullName: 'Ignacio Fuentes (Agrícola del Valle)',
    email: 'ifuentes@agricola.cl',
    phone: '+56 9 7123 9988',
    propertyInterestId: 'prop-04',
    propertyTitle: 'Parcela Agrícola Melipilla',
    operationInterest: 'compra',
    budgetAmount: 9000,
    budgetCurrency: 'UF',
    mortgageStatus: 'en_tramite',
    targetMoveDate: 'mas_de_3_meses',
    status: 'contactado',
    notes: ['Consultó por cantidad de litros por segundo inscritos en el CBR'],
    source: 'asistente_ia',
    createdAt: '2026-08-24',
  },
  {
    id: 'lead-04',
    fullName: 'Andrea Morales',
    email: 'andrea.morales@banco.cl',
    phone: '+56 9 6554 1122',
    propertyInterestId: 'prop-03',
    propertyTitle: 'Departamento Elegante Barrio El Golf',
    operationInterest: 'arriendo',
    budgetAmount: 45,
    budgetCurrency: 'UF',
    mortgageStatus: 'sin_evaluar',
    targetMoveDate: 'inmediato',
    status: 'nuevo',
    notes: ['Pide confirmar si admite mascota pequeña y si viene completamente equipado'],
    source: 'asistente_ia',
    createdAt: '2026-08-24',
  }
];

const leadsStorage = createLocalStore<Lead[]>('urbe_leads');

// Un fallo al guardar no rompe la pantalla: el dato queda en memoria y se avisa por consola.
const warnOnFail = (promise: Promise<void>, action: string) => {
  promise.catch((err) => console.warn(`[useLeadStore] No se pudo ${action}:`, err));
};

export const useLeadStore = create<LeadStore>((set, get) => {
  // Con Supabase la lista parte vacía y se llena con load(); sin Supabase parte de lo guardado en el navegador.
  const initialData: Lead[] = getLeadRepository().mode === 'remote' ? [] : leadsStorage.load() ?? initialLeads;

  return {
    leads: initialData,
    selectedLead: null,

    addLead: (leadData) => {
      const repo = getLeadRepository();
      const leadId = repo.newId();
      const newLead: Lead = {
        ...leadData,
        id: leadId,
        createdAt: new Date().toISOString().split('T')[0],
      };

      const updated = [newLead, ...get().leads];
      set({ leads: updated });
      warnOnFail(repo.create(newLead, updated), 'guardar el lead');

      // Dispatch automatically to GoHighLevel / Webhook asynchronously
      webhookService.dispatchLeadToGHL(newLead).catch((err) => {
        console.warn('Auto GHL webhook dispatch note:', err);
      });

      return leadId;
    },

    updateLeadStatus: (id, status) => {
      const before = get().leads.find((l) => l.id === id);
      const changed = Boolean(before && before.status !== status);
      const updated = get().leads.map((l) => (l.id === id ? { ...l, status } : l));
      set({ leads: updated });
      const repo = getLeadRepository();
      const saved = repo.update(id, { status }, updated);
      warnOnFail(saved, 'cambiar el estado del lead');
      if (!changed) return;
      const record = () => useTimelineStore.getState().add(id, 'estado', `Pasó a ${statusLabel(status)}`, true);
      // Con la base, el historial anota el cambio solo si quedó guardado; en el navegador se anota de inmediato.
      if (repo.mode === 'remote') saved.then(record, () => undefined);
      else record();
    },

    addNoteToLead: (id, note) => {
      const lead = get().leads.find((l) => l.id === id);
      if (!lead) return;
      const notes = [...lead.notes, note];
      const updated = get().leads.map((l) => (l.id === id ? { ...l, notes } : l));
      set({ leads: updated });
      const repo = getLeadRepository();
      warnOnFail(
        repo.appendNote ? repo.appendNote(id, note) : repo.update(id, { notes }, updated),
        'guardar la nota del lead',
      );
    },

    setNextAction: (id, text, due) => {
      const clean = text.trim();
      if (!clean || !isValidDate(due) || !get().leads.some((l) => l.id === id)) return false;
      const updated = get().leads.map((l) => (l.id === id ? { ...l, nextActionText: clean, nextActionDue: due } : l));
      set({ leads: updated });
      warnOnFail(getLeadRepository().update(id, { nextActionText: clean, nextActionDue: due }, updated), 'guardar la próxima acción');
      return true;
    },

    rescheduleVisit: (id, date, time) => {
      const lead = get().leads.find((l) => l.id === id);
      if (!lead || !isValidDate(date) || (time !== '' && !isValidTime(time))) return false;
      // Sin cambios no se escribe nada ni se ensucia el historial.
      if (lead.appointmentDate === date && (lead.appointmentTime ?? '') === time) return true;
      const patch: Partial<Lead> = { appointmentDate: date, appointmentTime: time || undefined, status: lead.status === 'nuevo' || lead.status === 'contactado' ? 'visita_agendada' : lead.status };
      const updated = get().leads.map((l) => (l.id === id ? { ...l, ...patch } : l));
      set({ leads: updated });
      warnOnFail(getLeadRepository().update(id, patch, updated), 'reagendar la visita');
      if (patch.status !== lead.status) {
        useTimelineStore.getState().add(id, 'estado', `Pasó a ${statusLabel(patch.status as LeadStatus)}`, true);
      }
      useTimelineStore.getState().add(id, 'visita', `Visita agendada para el ${date}${time ? ` a las ${time}` : ''}`);
      return true;
    },

    completeNextAction: (id) => {
      const lead = get().leads.find((l) => l.id === id);
      if (!lead || !lead.nextActionText) return;
      const note = `Hecho: ${lead.nextActionText} (${localToday()})`;
      const notes = [...lead.notes, note];
      const updated = get().leads.map((l) =>
        l.id === id ? { ...l, notes, nextActionText: undefined, nextActionDue: undefined } : l,
      );
      set({ leads: updated });
      const repo = getLeadRepository();
      const cleared = { nextActionText: undefined, nextActionDue: undefined };
      // Con la base, primero se limpia la acción y después se agrega la nota (atómica): si algo falla,
      // lo peor es una nota que falta, nunca una acción "fantasma" que reaparece o una nota duplicada.
      warnOnFail(
        repo.appendNote
          ? repo.update(id, cleared, updated).then(() => repo.appendNote!(id, note))
          : repo.update(id, { notes, ...cleared }, updated),
        'cumplir la próxima acción',
      );
    },

    setSelectedLead: (lead) => {
      set({ selectedLead: lead });
    },

    deleteLead: (id) => {
      const updated = get().leads.filter((l) => l.id !== id);
      set({ leads: updated });
      warnOnFail(getLeadRepository().remove(id, updated), 'borrar el lead');
      useTimelineStore.getState().removeForLead(id);
    },

    linkProperty: (id, propertyId) => {
      const updated = get().leads.map((l) => (l.id === id ? { ...l, convertedPropertyId: propertyId } : l));
      set({ leads: updated });
      warnOnFail(getLeadRepository().update(id, { convertedPropertyId: propertyId }, updated), 'vincular la propiedad al lead');
    },

    receiveLead: (lead) => {
      if (get().leads.some((l) => l.id === lead.id)) return false;
      liveLeadIds.add(lead.id);
      set({ leads: [lead, ...get().leads] });
      return true;
    },

    load: async () => {
      const repo = getLeadRepository();
      if (repo.mode !== 'remote') return;
      try {
        const leads = await repo.list();
        // Un lead que llegó en vivo mientras se leía la lista no se pierde
        if (leads) {
          const ids = new Set(leads.map((l) => l.id));
          set({ leads: [...get().leads.filter((l) => liveLeadIds.has(l.id) && !ids.has(l.id)), ...leads] });
        }
      } catch (err) {
        console.warn('[useLeadStore] No se pudieron cargar los leads:', err);
      }
    },
  };
});
