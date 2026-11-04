import React, { useState } from 'react';
import { useLeadStore } from '../stores/useLeadStore';
import { actionState, forToday, localToday } from '../services/leadTasks';
import type { Lead } from '../types/lead';

// Etiqueta de la próxima acción de un lead (H-056): "Vencida", "Hoy", la fecha o "Sin próxima acción".
export const ActionBadge: React.FC<{ lead: Lead }> = ({ lead }) => {
  const state = actionState(lead, localToday());
  if (state === 'no_aplica') return null;
  if (state === 'sin_accion') {
    return <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Sin próxima acción</span>;
  }
  const style =
    state === 'vencida' ? 'text-red-700 bg-red-50 border-red-200'
    : state === 'hoy' ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-slate-600 bg-slate-50 border-slate-200';
  const label = state === 'vencida' ? 'Vencida' : state === 'hoy' ? 'Hoy' : lead.nextActionDue;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${style}`}>
      {label}: {lead.nextActionText}
    </span>
  );
};

// Recuadro "Para hoy": lo vencido, lo de hoy y los contactos que no tienen próxima acción.
export const TodayPanel: React.FC<{ leads: Lead[]; onOpen: (lead: Lead) => void }> = ({ leads, onOpen }) => {
  const items = forToday(leads, localToday());
  if (items.length === 0) return null;
  return (
    <section aria-label="Para hoy" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 mb-2">Para hoy ({items.length})</h3>
      <ul className="space-y-1.5 max-h-40 overflow-y-auto">
        {items.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => onOpen(l)}
              className="w-full flex items-center justify-between gap-2 text-left text-xs p-2 rounded-lg hover:bg-slate-50"
            >
              <span className="font-semibold text-slate-800 truncate">{l.fullName}</span>
              <ActionBadge lead={l} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

// Editor de la próxima acción dentro de la ficha del lead.
export const NextActionEditor: React.FC<{ leadId: string }> = ({ leadId }) => {
  const lead = useLeadStore((s) => s.leads.find((l) => l.id === leadId));
  const setNextAction = useLeadStore((s) => s.setNextAction);
  const completeNextAction = useLeadStore((s) => s.completeNextAction);
  const [text, setText] = useState('');
  const [due, setDue] = useState('');
  const [error, setError] = useState('');
  if (!lead) return null;

  const save = () => {
    if (setNextAction(leadId, text, due || localToday())) {
      setText('');
      setDue('');
      setError('');
    } else {
      setError('Escribe la acción y elige una fecha válida.');
    }
  };

  return (
    <div>
      <h4 className="text-xs font-bold text-slate-800 mb-1.5">Próxima acción</h4>
      {lead.nextActionText && (
        <div className="mb-2 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <ActionBadge lead={lead} />
          <button type="button" onClick={() => completeNextAction(leadId)} className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold">
            Marcar hecha
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          aria-label="Acción a realizar"
          placeholder="Ej.: Llamar para confirmar la visita"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 min-w-[10rem] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
        />
        <input
          type="date"
          aria-label="Fecha de la acción"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
        />
        <button type="button" onClick={save} className="px-3 py-1.5 bg-urbe-primary text-white rounded-xl text-xs font-bold">
          {lead.nextActionText ? 'Cambiar' : 'Guardar'}
        </button>
      </div>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
};
