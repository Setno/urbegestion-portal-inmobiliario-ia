import type { Lead, LeadStatus } from '../types/lead';
import type { LeadEvent } from '../types/leadEvent';
import { sourceLabel, attributionLabel } from './leadSource';
import { actionState } from './leadTasks';

// Reportes básicos del CRM (H-060). Todo se calcula con lo que el lead es hoy y con su historial de contactos.

const PATH: LeadStatus[] = ['nuevo', 'contactado', 'visita_agendada', 'en_negociacion', 'cerrado'];

const pct = (part: number, whole: number): number => (whole === 0 ? 0 : Math.round((part / whole) * 100));

export interface FunnelStage {
  status: LeadStatus;
  current: number; // leads que están hoy en esta etapa
  reached: number; // leads que llegaron a esta etapa o más lejos
  conversion: number | null; // % respecto de la etapa anterior (null en la primera o si no hay datos)
}

// Los descartados no cuentan en el embudo: se muestran aparte.
export const funnel = (leads: Lead[]): { stages: FunnelStage[]; discarded: number } => {
  const active = leads.filter((l) => l.status !== 'descartado');
  const stages = PATH.map((status, i) => {
    const reached = active.filter((l) => PATH.indexOf(l.status) >= i).length;
    return { status, current: active.filter((l) => l.status === status).length, reached, conversion: null as number | null };
  });
  stages.forEach((s, i) => {
    if (i > 0 && stages[i - 1].reached > 0) s.conversion = pct(s.reached, stages[i - 1].reached);
  });
  return { stages, discarded: leads.length - active.length };
};

export interface GroupRow {
  label: string;
  total: number;
  closed: number;
  rate: number; // % de cerrados sobre el total
}

const groupBy = (leads: Lead[], labelOf: (l: Lead) => string): GroupRow[] => {
  const map = new Map<string, GroupRow>();
  for (const l of leads) {
    const label = labelOf(l);
    const row = map.get(label) ?? { label, total: 0, closed: 0, rate: 0 };
    row.total += 1;
    if (l.status === 'cerrado') row.closed += 1;
    map.set(label, row);
  }
  return [...map.values()].map((r) => ({ ...r, rate: pct(r.closed, r.total) })).sort((a, b) => b.total - a.total);
};

export const bySource = (leads: Lead[]): GroupRow[] => groupBy(leads, (l) => sourceLabel(l.source));
export const byCampaign = (leads: Lead[]): GroupRow[] => groupBy(leads, (l) => attributionLabel(l.attribution));

const HOUR = 3_600_000;
// Llamada, WhatsApp, correo o visita: contactos reales con la persona. Las notas y los cambios de etapa no cuentan.
const REAL_CONTACT = new Set<LeadEvent['kind']>(['llamada', 'whatsapp', 'correo', 'visita']);

export interface ResponseStats {
  answered: number; // leads con un primer contacto registrado
  averageHours: number | null;
  unansweredOver24h: number; // leads nuevos sin contacto que llevan más de 24 horas
}

export const responseStats = (leads: Lead[], events: LeadEvent[], now: Date = new Date()): ResponseStats => {
  const byLead = new Map<string, LeadEvent[]>();
  for (const e of events) if (REAL_CONTACT.has(e.kind)) byLead.set(e.leadId, [...(byLead.get(e.leadId) ?? []), e]);

  let answered = 0;
  let totalMs = 0;
  let unanswered = 0;
  for (const l of leads) {
    // Sin la hora exacta de registro no se puede medir.
    const created = l.createdAtIso ? Date.parse(l.createdAtIso) : NaN;
    if (Number.isNaN(created)) continue;
    const firstContact = Math.min(
      ...(byLead.get(l.id) ?? []).map((e) => Date.parse(e.occurredAt)).filter((t) => t >= created),
    );
    if (Number.isFinite(firstContact)) {
      answered += 1;
      totalMs += firstContact - created;
    } else if (l.status === 'nuevo' && now.getTime() - created > 24 * HOUR) {
      unanswered += 1;
    }
  }
  return {
    answered,
    averageHours: answered === 0 ? null : Math.round((totalMs / answered / HOUR) * 10) / 10,
    unansweredOver24h: unanswered,
  };
};

// Leads registrados en los últimos `days` días (null = todos).
export const inPeriod = (leads: Lead[], days: number | null, now: Date = new Date()): Lead[] => {
  if (days === null) return leads;
  const limit = new Date(now.getTime() - days * 24 * HOUR).toISOString().slice(0, 10);
  return leads.filter((l) => l.createdAt >= limit);
};

// ---- Dashboard de gestión (H-061) ----

const DAY = 24 * HOUR;
const isoDay = (t: number): string => new Date(t).toISOString().slice(0, 10);

// Los `days` días justo antes del período actual, para comparar. "Todo el tiempo" no tiene anterior.
export const previousPeriod = (leads: Lead[], days: number | null, now: Date = new Date()): Lead[] | null => {
  if (days === null) return null;
  const to = isoDay(now.getTime() - days * DAY);
  const from = isoDay(now.getTime() - 2 * days * DAY);
  return leads.filter((l) => l.createdAt >= from && l.createdAt < to);
};

// De los contactos activos (sin descartados), cuántos llegaron a visita agendada o más lejos.
export const leadToVisit = (leads: Lead[]): { reached: number; total: number; rate: number | null } => {
  const active = leads.filter((l) => l.status !== 'descartado');
  const reached = active.filter((l) => PATH.indexOf(l.status) >= PATH.indexOf('visita_agendada')).length;
  return { reached, total: active.length, rate: active.length === 0 ? null : pct(reached, active.length) };
};

// Bajo dos horas se muestra en minutos: la velocidad de respuesta se mide en minutos, no en horas.
export const formatHours = (hours: number | null): string => {
  if (hours === null) return 'sin datos';
  if (hours < 2) return `${Math.round(hours * 60)} min`;
  return `${String(Math.round(hours * 10) / 10).replace('.', ',')} h`;
};

export type Change = { kind: 'sube' | 'baja' | 'igual' | 'sin_base'; pct: number | null };

// Variación respecto del período anterior; sin base (anterior vacío o sin dato) no se inventa un porcentaje.
export const change = (current: number | null, previous: number | null): Change => {
  if (current === null || previous === null || previous === 0) return { kind: 'sin_base', pct: null };
  if (current === previous) return { kind: 'igual', pct: 0 };
  const p = Math.round((Math.abs(current - previous) / previous) * 100);
  return { kind: current > previous ? 'sube' : 'baja', pct: p };
};

export interface WeekRow {
  weekStart: string; // lunes, AAAA-MM-DD
  total: number;
  bySource: Record<string, number>;
}

const mondayOf = (isoDate: string): number => {
  const t = Date.parse(`${isoDate}T00:00:00Z`);
  const dow = (new Date(t).getUTCDay() + 6) % 7; // lunes = 0
  return t - dow * DAY;
};

// Leads que entran por semana (lunes a domingo) y su origen, de las últimas `weeks` semanas contando la actual.
export const weeklyLeads = (leads: Lead[], weeks: number, now: Date = new Date()): WeekRow[] => {
  const last = mondayOf(isoDay(now.getTime()));
  const rows: WeekRow[] = Array.from({ length: weeks }, (_, i) => ({
    weekStart: isoDay(last - (weeks - 1 - i) * 7 * DAY), total: 0, bySource: {},
  }));
  const byStart = new Map(rows.map((r) => [r.weekStart, r]));
  for (const l of leads) {
    const row = byStart.get(isoDay(mondayOf(l.createdAt)));
    if (!row) continue;
    const label = sourceLabel(l.source);
    row.total += 1;
    row.bySource[label] = (row.bySource[label] ?? 0) + 1;
  }
  return rows;
};

// Disciplina de seguimiento hoy: de los contactos abiertos, cuántos tienen la acción vencida o ninguna.
export const followUp = (leads: Lead[], today: string): { overdue: number; withoutAction: number; open: number } => {
  const open = leads.filter((l) => l.status !== 'cerrado' && l.status !== 'descartado');
  return {
    open: open.length,
    overdue: open.filter((l) => actionState(l, today) === 'vencida').length,
    withoutAction: open.filter((l) => actionState(l, today) === 'sin_accion').length,
  };
};

// Visitas con fecha entre `from` y `to` (inclusive).
export const visitsIn = (leads: Lead[], from: string, to: string): number =>
  leads.filter((l) => l.status !== 'descartado' && l.appointmentDate && l.appointmentDate >= from && l.appointmentDate <= to).length;
