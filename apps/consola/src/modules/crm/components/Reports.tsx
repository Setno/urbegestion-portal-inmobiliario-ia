import React, { useEffect, useMemo, useState } from 'react';
import { useTimelineStore } from '../stores/useTimelineStore';
import { bySource, byCampaign, funnel, inPeriod, responseStats, type GroupRow } from '../services/leadReports';
import { DashboardSummary } from './DashboardSummary';
import { statusLabel } from '../services/leadTimeline';
import type { Lead } from '../types/lead';

const PERIODS: { label: string; days: number | null }[] = [
  { label: 'Últimos 7 días', days: 7 },
  { label: 'Últimos 30 días', days: 30 },
  { label: 'Últimos 90 días', days: 90 },
  { label: 'Todo el tiempo', days: null },
];

const GroupTable: React.FC<{ title: string; rows: GroupRow[] }> = ({ title, rows }) => (
  <section aria-label={title} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
    <h4 className="text-xs font-bold text-slate-800 mb-2">{title}</h4>
    {rows.length === 0 ? (
      <p className="text-[11px] text-slate-400">Sin datos en este período.</p>
    ) : (
      <table className="w-full text-xs text-left">
        <thead className="text-slate-500">
          <tr><th className="py-1 font-bold">Origen</th><th className="py-1 font-bold">Leads</th><th className="py-1 font-bold">Cerrados</th><th className="py-1 font-bold">Cierre</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-slate-100">
              <td className="py-1.5 text-slate-800">{r.label}</td><td>{r.total}</td><td>{r.closed}</td><td>{r.rate} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </section>
);

// Reportes básicos del CRM (H-060): embudo, origen y campaña, y tiempos de respuesta.
export const Reports: React.FC<{ leads: Lead[] }> = ({ leads }) => {
  const [days, setDays] = useState<number | null>(30);
  const events = useTimelineStore((s) => s.events);
  const loadAll = useTimelineStore((s) => s.loadAll);
  const allStatus = useTimelineStore((s) => s.allStatus);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const scoped = useMemo(() => inPeriod(leads, days), [leads, days]);
  const flow = useMemo(() => funnel(scoped), [scoped]);
  const unmeasured = scoped.filter((l) => !l.createdAtIso).length;
  const allEvents = useMemo(() => Object.values(events).flat(), [events]);
  const response = useMemo(() => responseStats(scoped, allEvents), [scoped, allEvents]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Reportes · {scoped.length} lead{scoped.length === 1 ? '' : 's'}</h3>
        <select
          aria-label="Período del reporte"
          value={days === null ? 'todo' : String(days)}
          onChange={(e) => setDays(e.target.value === 'todo' ? null : Number(e.target.value))}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
        >
          {PERIODS.map((p) => (
            <option key={p.label} value={p.days === null ? 'todo' : String(p.days)}>{p.label}</option>
          ))}
        </select>
      </div>

      <DashboardSummary leads={leads} scoped={scoped} days={days} events={allEvents} weeks={days !== null && days <= 30 ? 8 : 13} />

      <section aria-label="Embudo por etapa" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <h4 className="text-xs font-bold text-slate-800 mb-2">Embudo por etapa</h4>
        <table className="w-full text-xs text-left">
          <thead className="text-slate-500">
            <tr><th className="py-1 font-bold">Etapa</th><th className="py-1 font-bold">Hoy en la etapa</th><th className="py-1 font-bold">Llegaron</th><th className="py-1 font-bold">Pasaron de la anterior</th><th className="py-1 w-1/3"><span className="sr-only">Barra</span></th></tr>
          </thead>
          <tbody>
            {flow.stages.map((s) => (
              <tr key={s.status} className="border-t border-slate-100">
                <td className="py-1.5 text-slate-800">{statusLabel(s.status)}</td>
                <td>{s.current}</td>
                <td>{s.reached}</td>
                <td>{s.conversion === null ? '—' : `${s.conversion} %`}</td>
                <td aria-hidden="true"><div className="h-2 rounded bg-urbe-primary/70" style={{ width: `${(s.reached / Math.max(1, flow.stages[0].reached)) * 100}%` }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-slate-400">Descartados: {flow.discarded}. "Llegaron" cuenta los contactos que están hoy en esa etapa o en una posterior.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <GroupTable title="Por origen del contacto" rows={bySource(scoped)} />
        <GroupTable title="Por campaña" rows={byCampaign(scoped)} />
      </div>

      <section aria-label="Tiempos de respuesta" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 text-xs">
        <h4 className="font-bold text-slate-800">Tiempos de respuesta</h4>
        {allStatus === 'loading' && <p role="status" className="text-slate-500">Cargando el historial de contactos…</p>}
        {allStatus === 'error' && <p role="alert" className="text-red-600">No se pudo cargar el historial de contactos: los tiempos de abajo pueden estar incompletos.</p>}
        {allStatus === 'truncated' && <p role="alert" className="text-amber-700">Hay más contactos de los que el reporte puede leer: los tiempos pueden estar incompletos.</p>}
        <p>
          Primer contacto en promedio:{' '}
          <strong>{response.averageHours === null ? 'sin datos todavía' : `${response.averageHours} horas`}</strong>
          {response.answered > 0 && <span className="text-slate-500"> ({response.answered} lead{response.answered === 1 ? '' : 's'} medidos)</span>}
        </p>
        <p>
          Nuevos sin contactar hace más de 24 horas:{' '}
          <strong className={response.unansweredOver24h > 0 ? 'text-red-600' : ''}>{response.unansweredOver24h}</strong>
        </p>
        {unmeasured > 0 && <p className="text-[11px] text-slate-500">{unmeasured} lead{unmeasured === 1 ? '' : 's'} sin hora exacta de registro no se midieron.</p>}
        <p className="text-[11px] text-slate-400">Un lead movido de etapa sin registrar un contacto en el historial no cuenta como atendido ni como sin contactar. Cuenta llamadas, WhatsApp, correos y visitas registrados en el historial de contacto. El reporte por agente llegará con la asignación de leads.</p>
      </section>
    </div>
  );
};
