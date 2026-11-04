import React, { useMemo, useState } from 'react';
import { useLeadStore } from '../stores/useLeadStore';
import { conflictIds, formatDay, monthGrid, shiftMonth, visitsByDay, visitsOf, type Visit } from '../services/leadAgenda';
import { localToday } from '../services/leadTasks';
import type { Lead } from '../types/lead';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const VisitRow: React.FC<{ visit: Visit; conflict: boolean; onOpen: (lead: Lead) => void; onMoved: (lead: Lead, date: string) => void }> = ({ visit, conflict, onOpen, onMoved }) => {
  const reschedule = useLeadStore((s) => s.rescheduleVisit);
  const [date, setDate] = useState(visit.date);
  const [time, setTime] = useState(visit.time ?? '');
  const [error, setError] = useState('');

  const save = () => {
    if (reschedule(visit.lead.id, date, time)) {
      setError('');
      onMoved(visit.lead, date);
    } else setError('Elige una fecha y una hora válidas.');
  };

  return (
    <li className="p-3 rounded-xl border border-slate-200 bg-white text-xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-slate-900">
            {visit.time ?? 'Sin hora'} · {visit.lead.fullName}
          </p>
          <p className="text-slate-500">{visit.lead.propertyTitle || 'Consulta general'} · {visit.lead.phone}</p>
        </div>
        <button type="button" aria-label={`Abrir ${visit.lead.fullName}`} onClick={() => onOpen(visit.lead)} className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700">
          Abrir
        </button>
      </div>
      {conflict && <p className="text-red-600 font-bold">Choque de horario: hay otra visita a la misma hora.</p>}
      <div className="flex flex-wrap items-center gap-2">
        <input type="date" aria-label={`Fecha de la visita de ${visit.lead.fullName}`} value={date} onChange={(e) => setDate(e.target.value)} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg" />
        <input type="time" aria-label={`Hora de la visita de ${visit.lead.fullName}`} value={time} onChange={(e) => setTime(e.target.value)} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg" />
        <button type="button" onClick={save} className="px-2.5 py-1 rounded-lg bg-urbe-primary text-white font-bold">
          Reagendar
        </button>
      </div>
      {error && <p role="alert" className="text-red-600">{error}</p>}
    </li>
  );
};

// Calendario mensual de las visitas agendadas (H-059). Sin sincronizar con calendarios externos.
export const Agenda: React.FC<{ leads: Lead[]; onOpen: (lead: Lead) => void }> = ({ leads, onOpen }) => {
  const today = localToday();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
  const [day, setDay] = useState(today);
  const [notice, setNotice] = useState('');

  const visits = useMemo(() => visitsOf(leads), [leads]);
  const byDay = useMemo(() => visitsByDay(visits), [visits]);
  const conflicts = useMemo(() => conflictIds(visits), [visits]);
  const cells = monthGrid(year, month);
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const dayVisits = byDay[day] ?? [];

  const go = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
    // El día elegido siempre queda dentro del mes que se ve: hoy si es el mes actual, si no el día 1.
    const prefix = `${next.year}-${String(next.month + 1).padStart(2, '0')}`;
    setDay(today.startsWith(prefix) ? today : `${prefix}-01`);
  };

  // Tras reagendar, el calendario salta a la nueva fecha y se avisa (también a lectores de pantalla).
  const moved = (lead: Lead, date: string) => {
    setYear(Number(date.slice(0, 4)));
    setMonth(Number(date.slice(5, 7)) - 1);
    setDay(date);
    setNotice(`Visita de ${lead.fullName} movida al ${formatDay(date)}.`);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">Agenda de visitas · {MESES[month]} {year}</h3>
        <div className="flex gap-1.5 text-xs font-bold">
          <button type="button" onClick={() => go(-1)} className="px-2.5 py-1 rounded-lg bg-slate-100">Mes anterior</button>
          <button type="button" onClick={() => { setYear(Number(today.slice(0, 4))); setMonth(Number(today.slice(5, 7)) - 1); setDay(today); }} className="px-2.5 py-1 rounded-lg bg-slate-100">Hoy</button>
          <button type="button" onClick={() => go(1)} className="px-2.5 py-1 rounded-lg bg-slate-100">Mes siguiente</button>
        </div>
      </div>

      <div aria-hidden="true" className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
        {DIAS.map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c) => {
          const list = byDay[c] ?? [];
          const clash = list.some((v) => conflicts.has(v.lead.id));
          const inMonth = c.startsWith(monthPrefix);
          return (
            <button
              key={c}
              type="button"
              aria-label={`Día ${c}${list.length ? `, ${list.length} visita${list.length > 1 ? 's' : ''}` : ''}${clash ? ', hay choque de horario' : ''}`}
              aria-pressed={c === day}
              onClick={() => setDay(c)}
              className={`min-h-12 p-1 rounded-lg border text-xs flex flex-col items-center ${
                c === day ? 'border-urbe-primary bg-urbe-primary/5' : 'border-slate-100'
              } ${inMonth ? 'text-slate-800' : 'text-slate-300'} ${c === today ? 'font-black' : ''}`}
            >
              <span>{Number(c.slice(8))}</span>
              {list.length > 0 && (
                <span className={`mt-0.5 px-1.5 rounded-full text-[10px] font-bold ${clash ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                  {list.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p role="status" className="text-[11px] text-emerald-700">{notice}</p>
      <section aria-label={`Visitas del ${formatDay(day)}`} className="space-y-2">
        <h4 className="text-xs font-bold text-slate-800">Visitas del {formatDay(day)}</h4>
        {dayVisits.length === 0 ? (
          <p className="text-[11px] text-slate-400">No hay visitas agendadas este día.</p>
        ) : (
          <ul className="space-y-2">
            {dayVisits.map((v) => (
              <VisitRow key={`${v.lead.id}-${v.date}-${v.time ?? ''}`} visit={v} conflict={conflicts.has(v.lead.id)} onOpen={onOpen} onMoved={moved} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
