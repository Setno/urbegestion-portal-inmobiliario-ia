import React, { useEffect, useState } from 'react';
import { useTimelineStore } from '../stores/useTimelineStore';
import { kindLabel, MANUAL_KINDS } from '../services/leadTimeline';
import type { LeadEvent, LeadEventKind } from '../types/leadEvent';

const NONE: LeadEvent[] = [];

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Historial de contacto de un lead (H-057): llamadas, WhatsApp, correos, visitas, notas y cambios de etapa.
export const Timeline: React.FC<{ leadId: string }> = ({ leadId }) => {
  const events = useTimelineStore((s) => s.events[leadId]) ?? NONE;
  const load = useTimelineStore((s) => s.load);
  const add = useTimelineStore((s) => s.add);
  const saveError = useTimelineStore((s) => s.saveError);
  const [kind, setKind] = useState<LeadEventKind>('llamada');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void load(leadId);
  }, [leadId, load]);

  const save = () => {
    if (add(leadId, kind, text)) {
      setText('');
      setError('');
    } else {
      setError('Escribe qué pasó en este contacto.');
    }
  };

  return (
    <div>
      <h4 className="text-xs font-bold text-slate-800 mb-1.5">Historial de contacto</h4>
      <div className="flex flex-wrap gap-2 mb-2">
        <select
          aria-label="Tipo de contacto"
          value={kind}
          onChange={(e) => setKind(e.target.value as LeadEventKind)}
          className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
        >
          {MANUAL_KINDS.map((k) => (
            <option key={k} value={k}>{kindLabel(k)}</option>
          ))}
        </select>
        <input
          type="text"
          aria-label="Detalle del contacto"
          placeholder="Qué pasó o qué se habló"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && save()}
          className="flex-1 min-w-[10rem] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
        />
        <button type="button" onClick={save} className="px-3 py-1.5 bg-urbe-primary text-white rounded-xl text-xs font-bold">
          Registrar
        </button>
      </div>
      {(error || saveError) && <p className="mb-1 text-[11px] text-red-600">{error || saveError}</p>}
      {events.length === 0 ? (
        <p className="text-[11px] text-slate-400">Aún no hay contactos registrados.</p>
      ) : (
        <ul className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-60 overflow-y-auto space-y-1.5 text-xs text-slate-700">
          {events.map((e) => (
            <li key={e.id} className="border-b border-slate-100 pb-1 last:border-none">
              <span className="font-bold text-slate-900">{kindLabel(e.kind)}</span>
              <span className="text-slate-400"> · {formatDate(e.occurredAt)}{e.author ? ` · ${e.author}` : ''}</span>
              <p>{e.text}</p>
            </li>
          ))}
        </ul>
      )}
      {events.length >= 200 && <p className="mt-1 text-[11px] text-slate-400">Se muestran los últimos 200 contactos.</p>}
      <p className="mt-1 text-[11px] text-slate-400">Las notas de la bitácora de abajo son aparte de este historial.</p>
    </div>
  );
};
