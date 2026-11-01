import { create } from 'zustand';
import { Lead, LeadStatus } from '../types/lead';
import { webhookService } from '../../captacion/services/webhookService';
import { createLocalStore } from '../../../core/storage/localStore';
import { getLeadRepository } from '../services/leadRepository';

interface LeadStore {
  leads: Lead[];
  selectedLead: Lead | null;
  
  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => string;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  addNoteToLead: (id: string, note: string) => void;
  setSelectedLead: (lead: Lead | null) => void;
  deleteLead: (id: string) => void;
  // Trae los leads de la base (solo con Supabase; con almacenamiento local no hace nada).
  load: () => Promise<void>;
}

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
      const updated = get().leads.map((l) => (l.id === id ? { ...l, status } : l));
      set({ leads: updated });
      warnOnFail(getLeadRepository().update(id, { status }, updated), 'cambiar el estado del lead');
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

    setSelectedLead: (lead) => {
      set({ selectedLead: lead });
    },

    deleteLead: (id) => {
      const updated = get().leads.filter((l) => l.id !== id);
      set({ leads: updated });
      warnOnFail(getLeadRepository().remove(id, updated), 'borrar el lead');
    },

    load: async () => {
      const repo = getLeadRepository();
      if (repo.mode !== 'remote') return;
      try {
        const leads = await repo.list();
        if (leads) set({ leads });
      } catch (err) {
        console.warn('[useLeadStore] No se pudieron cargar los leads:', err);
      }
    },
  };
});
