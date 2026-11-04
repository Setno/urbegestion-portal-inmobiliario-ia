import type { Lead } from '../types/lead';
import { isValidDate } from './leadTasks';

// Agenda de visitas (H-059): los leads con fecha de visita, ordenados por día y hora.
export interface Visit {
  lead: Lead;
  date: string; // AAAA-MM-DD
  time?: string; // HH:MM
}

export const isValidTime = (value: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

// Un lead cerrado o descartado ya no tiene visita pendiente.
export const visitsOf = (leads: Lead[]): Visit[] =>
  leads
    .filter((l) => l.status !== 'cerrado' && l.status !== 'descartado' && l.appointmentDate && isValidDate(l.appointmentDate))
    .map((l) => ({
      lead: l,
      date: l.appointmentDate as string,
      time: l.appointmentTime && isValidTime(l.appointmentTime) ? l.appointmentTime : undefined,
    }));

// Por día; dentro del día, por hora (las visitas sin hora van al final).
export const visitsByDay = (visits: Visit[]): Record<string, Visit[]> => {
  const out: Record<string, Visit[]> = {};
  for (const v of visits) (out[v.date] ??= []).push(v);
  for (const list of Object.values(out)) list.sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
  return out;
};

// Leads con otra visita el mismo día a la misma hora (sin mirar el agente: con varios agentes puede haber avisos de más).
export const conflictIds = (visits: Visit[]): Set<string> => {
  const seen = new Map<string, string[]>();
  for (const v of visits) {
    if (!v.time) continue;
    const key = `${v.date} ${v.time}`;
    seen.set(key, [...(seen.get(key) ?? []), v.lead.id]);
  }
  const ids = new Set<string>();
  for (const group of seen.values()) if (group.length > 1) group.forEach((id) => ids.add(id));
  return ids;
};

const MESES_MINUSCULA = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// "2026-11-04" → "4 de noviembre".
export const formatDay = (iso: string): string => {
  const mes = MESES_MINUSCULA[Number(iso.slice(5, 7)) - 1];
  return mes ? `${Number(iso.slice(8, 10))} de ${mes}` : iso;
};

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

// Días del mes en semanas completas que parten en lunes (month: 0 a 11).
export const monthGrid = (year: number, month: number): string[] => {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7; // lunes = 0
  const last = new Date(Date.UTC(year, month + 1, 0));
  const total = Math.ceil((offset + last.getUTCDate()) / 7) * 7;
  return Array.from({ length: total }, (_, i) => iso(new Date(Date.UTC(year, month, 1 - offset + i))));
};

export const shiftMonth = (year: number, month: number, delta: number): { year: number; month: number } => {
  const d = new Date(Date.UTC(year, month + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
};
