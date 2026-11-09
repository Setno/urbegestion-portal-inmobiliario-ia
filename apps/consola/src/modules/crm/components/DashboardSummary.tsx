import React from 'react';
import { change, discardReasons, followUp, timeToClose, formatHours, leadToVisit, previousPeriod, responseStats, visitsIn, weeklyLeads, type Change } from '../services/leadReports';
import { localToday } from '../services/leadTasks';
import type { Lead } from '../types/lead';
import type { LeadEvent } from '../types/leadEvent';

// Comparación con el período anterior. `lowerIsBetter`: en tiempos de respuesta, bajar es mejorar.
const Comparison: React.FC<{ c: Change; lowerIsBetter?: boolean }> = ({ c, lowerIsBetter }) => {
  if (c.kind === 'sin_base') return <span className="text-slate-400">Sin período anterior para comparar</span>;
  if (c.kind === 'igual') return <span className="text-slate-500">Igual que el período anterior</span>;
  const good = lowerIsBetter ? c.kind === 'baja' : c.kind === 'sube';
  return (
    <span className={good ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>
      {c.kind === 'sube' ? '▲' : '▼'} {c.pct} % {c.kind === 'sube' ? 'más' : 'menos'} que el período anterior
    </span>
  );
};

const Card: React.FC<{ title: string; value: string; detail?: React.ReactNode; alert?: boolean; children?: React.ReactNode }> = ({ title, value, detail, alert, children }) => (
  <div role="group" aria-label={title} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{title}</p>
    <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
    {detail && <p className="text-[11px] text-slate-500 mt-1">{detail}</p>}
    {children && <p className="text-[11px] mt-1">{children}</p>}
  </div>
);

interface Props {
  leads: Lead[]; // todos los contactos (para lo que se mira "hoy")
  scoped: Lead[]; // los del período elegido
  days: number | null;
  events: LeadEvent[];
  weeks: number;
}

const WEEK_LABEL = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

// Dashboard de gestión (H-061): números clave con comparación, y leads por semana con su origen.
export const DashboardSummary: React.FC<Props> = ({ leads, scoped, days, events, weeks }) => {
  const today = localToday();
  const prev = previousPeriod(leads, days);
  const visit = leadToVisit(scoped);
  const prevVisit = prev ? leadToVisit(prev) : null;
  const response = responseStats(scoped, events);
  const prevResponse = prev ? responseStats(prev, events) : null;
  const tracking = followUp(leads, today);
  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);
  const upcoming = visitsIn(leads, today, localToday(weekAhead));
  const closing = timeToClose(scoped);
  const prevClosing = prev ? timeToClose(prev) : null;
  const discards = discardReasons(scoped);
  const weekly = weeklyLeads(leads, weeks);
  const max = Math.max(1, ...weekly.map((w) => w.total));

  return (
    <>
      <section aria-label="Números clave" className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Leads nuevos" value={String(scoped.length)}>
          <Comparison c={change(prev ? scoped.length : null, prev ? prev.length : null)} />
        </Card>
        <Card
          title="De lead a visita"
          value={visit.rate === null ? 'sin datos' : `${visit.rate} %`}
          detail={visit.rate === null ? 'Aún no hay contactos en el período.' : `${visit.reached} de ${visit.total} llegaron a visita agendada o más lejos.`}
        >
          <Comparison c={change(visit.rate, prevVisit?.rate ?? null)} />
        </Card>
        <Card
          title="Primer contacto"
          value={formatHours(response.averageHours)}
          detail={
            response.averageHours === null
              ? 'Aún no hay ningún contacto registrado en el historial (llamada, WhatsApp, correo o visita).'
              : `Promedio de ${response.answered} lead${response.answered === 1 ? '' : 's'} medidos.`
          }
        >
          {response.averageHours !== null && <Comparison c={change(response.averageHours, prevResponse?.averageHours ?? null)} lowerIsBetter />}
        </Card>
        <Card
          title="Sin contactar hace más de 24 h"
          value={String(response.unansweredOver24h)}
          alert={response.unansweredOver24h > 0}
          detail="Leads nuevos del período que nadie ha atendido."
        />
        <Card
          title="Seguimiento"
          value={`${tracking.overdue} vencida${tracking.overdue === 1 ? '' : 's'}`}
          alert={tracking.overdue > 0}
          detail={`${tracking.withoutAction} sin próxima acción, de ${tracking.open} contacto${tracking.open === 1 ? '' : 's'} abierto${tracking.open === 1 ? '' : 's'} (hoy, sin importar el período).`}
        />
        <Card title="Visitas próximos 7 días" value={String(upcoming)} detail="Visitas agendadas desde hoy (sin importar el período)." />
        <Card
          title="Tiempo hasta el cierre"
          value={closing.averageDays === null ? 'sin datos' : `${String(closing.averageDays).replace('.', ',')} días`}
          detail={
            closing.averageDays === null
              ? 'Aún no hay cierres con fecha en el período (la fecha se guarda desde que un contacto pasa a Cerrado).'
              : `Promedio de ${closing.measured} cierre${closing.measured === 1 ? '' : 's'}${closing.closedWithoutDate > 0 ? `; ${closing.closedWithoutDate} cerrado${closing.closedWithoutDate === 1 ? '' : 's'} antes sin fecha no se midieron` : ''}.`
          }
        >
          {closing.averageDays !== null && <Comparison c={change(closing.averageDays, prevClosing?.averageDays ?? null)} lowerIsBetter />}
        </Card>
        <Card
          title="Motivos de descarte"
          value={String(discards.total)}
          detail={
            discards.total === 0
              ? 'No hay contactos descartados en el período.'
              : discards.rows.length === 0
                ? 'Ningún descarte tiene motivo todavía: indícalo en la ficha del contacto.'
                : `${discards.rows.map((r) => `${r.label}: ${r.count}`).join(' · ')}${discards.withoutReason > 0 ? ` · Sin indicar: ${discards.withoutReason}` : ''}`
          }
        />
      </section>

      <section aria-label="Leads por semana" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <h4 className="text-xs font-bold text-slate-800 mb-3">Leads por semana</h4>
        <div className="flex items-end gap-1.5 h-28">
          {weekly.map((w) => {
            const origins = Object.entries(w.bySource).map(([k, v]) => `${k}: ${v}`).join(', ');
            const label = `Semana del ${WEEK_LABEL(w.weekStart)}: ${w.total} lead${w.total === 1 ? '' : 's'}${origins ? ` (${origins})` : ''}`;
            return (
              <div key={w.weekStart} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                <span className="text-[10px] text-slate-600 font-semibold">{w.total}</span>
                <div role="img" aria-label={label} title={label} className="w-full rounded-t bg-urbe-primary opacity-80" style={{ height: w.total ? Math.max(4, Math.round((w.total / max) * 72)) : 1 }} />
                <span className="text-[9px] text-slate-400 mt-1">{WEEK_LABEL(w.weekStart)}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Cada barra es una semana (de lunes a domingo); pasa el cursor para ver el origen. Cuenta todos los contactos, sin importar el período elegido.</p>
      </section>
    </>
  );
};
