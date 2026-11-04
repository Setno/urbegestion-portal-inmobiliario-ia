import type { Lead, LeadStatus } from '../types/lead';
import type { LeadEvent } from '../types/leadEvent';
import { sourceLabel, attributionLabel } from './leadSource';

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
