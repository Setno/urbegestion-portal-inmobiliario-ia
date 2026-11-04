import type { Lead } from '../types/lead';

// Próxima acción de un contacto (H-056): qué hay que hacer y para cuándo.
export type ActionState = 'sin_accion' | 'vencida' | 'hoy' | 'futura' | 'no_aplica';

// El día según el reloj del equipo (no el UTC, que de noche en Chile ya es "mañana").
export const localToday = (now: Date = new Date()): string => {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
};

export const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

export const actionState = (lead: Lead, today: string): ActionState => {
  if (lead.status === 'cerrado' || lead.status === 'descartado') return 'no_aplica';
  if (!lead.nextActionText || !lead.nextActionDue) return 'sin_accion';
  if (lead.nextActionDue < today) return 'vencida';
  if (lead.nextActionDue === today) return 'hoy';
  return 'futura';
};

const ORDER: Record<ActionState, number> = { vencida: 0, hoy: 1, sin_accion: 2, futura: 3, no_aplica: 4 };

// Lo que hay que mirar hoy: vencidas (la más antigua primero), de hoy y contactos sin acción.
export const forToday = (leads: Lead[], today: string): Lead[] =>
  leads
    .filter((l) => {
      const s = actionState(l, today);
      return s === 'vencida' || s === 'hoy' || s === 'sin_accion';
    })
    .sort((a, b) => {
      const sa = actionState(a, today);
      const sb = actionState(b, today);
      if (sa !== sb) return ORDER[sa] - ORDER[sb];
      return (a.nextActionDue ?? '').localeCompare(b.nextActionDue ?? '');
    });
