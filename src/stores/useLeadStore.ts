import { create } from 'zustand';
import { Lead, LeadStatus } from '../types/lead';

interface LeadStore {
  leads: Lead[];
  selectedLead: Lead | null;
  
  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => string;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  addNoteToLead: (id: string, note: string) => void;
  setSelectedLead: (lead: Lead | null) => void;
  deleteLead: (id: string) => void;
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

export const useLeadStore = create<LeadStore>((set) => {
  const savedLeads = localStorage.getItem('urbe_leads');
  const initialData: Lead[] = savedLeads ? JSON.parse(savedLeads) : initialLeads;

  const saveToStorage = (leads: Lead[]) => {
    try {
      localStorage.setItem('urbe_leads', JSON.stringify(leads));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  return {
    leads: initialData,
    selectedLead: null,

    addLead: (leadData) => {
      const newId = `lead-${Date.now()}`;
      const newLead: Lead = {
        ...leadData,
        id: newId,
        createdAt: new Date().toISOString().split('T')[0],
      };
      set((state) => {
        const updated = [newLead, ...state.leads];
        saveToStorage(updated);
        return { leads: updated };
      });
      return newId;
    },

    updateLeadStatus: (id, status) => {
      set((state) => {
        const updated = state.leads.map((l) =>
          l.id === id ? { ...l, status } : l
        );
        saveToStorage(updated);
        return { leads: updated };
      });
    },

    addNoteToLead: (id, note) => {
      set((state) => {
        const updated = state.leads.map((l) =>
          l.id === id ? { ...l, notes: [...l.notes, note] } : l
        );
        saveToStorage(updated);
        return { leads: updated };
      });
    },

    setSelectedLead: (lead) => {
      set({ selectedLead: lead });
    },

    deleteLead: (id) => {
      set((state) => {
        const updated = state.leads.filter((l) => l.id !== id);
        saveToStorage(updated);
        return { leads: updated };
      });
    },
  };
});
