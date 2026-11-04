import React, { useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import type { Lead } from '../types/lead';
import { useLeadStore } from '../stores/useLeadStore';
import { subscribeNewLeads } from '../services/leadRealtime';

const VISIBLE_MS = 10000;

// Con el panel abierto y sesión iniciada, avisa de cada lead nuevo y lo suma a la lista del CRM (H-054).
export const NewLeadNotice: React.FC<{ active: boolean; onOpenCrm: () => void }> = ({ active, onOpenCrm }) => {
  const [lead, setLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (!active) return;
    return subscribeNewLeads((incoming) => {
      // Un lead que ya estaba en la lista (por ejemplo, uno que creó esta misma persona) no se avisa
      if (useLeadStore.getState().receiveLead(incoming)) setLead(incoming);
    });
  }, [active]);

  useEffect(() => {
    if (!lead) return;
    const timer = setTimeout(() => setLead(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [lead]);

  if (!lead) return null;

  const visit = lead.appointmentDate ? ` · pide visita el ${lead.appointmentDate.split('-').reverse().join('-')}` : '';
  return (
    <div role="status" className="fixed bottom-4 right-4 z-[60] max-w-sm w-[calc(100%-2rem)] bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex gap-3 items-start">
      <BellRing className="w-5 h-5 text-urbe-accent shrink-0 mt-0.5" />
      <button
        type="button"
        onClick={() => {
          onOpenCrm();
          setLead(null);
        }}
        className="flex-1 text-left"
      >
        <span className="block text-sm font-bold">Nuevo lead: {lead.fullName}</span>
        <span className="block text-xs text-slate-300">
          {lead.propertyTitle || 'Consulta general'}
          {visit}
        </span>
        <span className="block text-[11px] text-urbe-accent font-bold mt-1">Ver en el CRM</span>
      </button>
      <button type="button" onClick={() => setLead(null)} aria-label="Cerrar el aviso" className="text-slate-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
