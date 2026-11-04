import type { LeadStatus } from '../types/lead';
import type { LeadEvent, LeadEventKind } from '../types/leadEvent';

const KIND_LABELS: Record<LeadEventKind, string> = {
  llamada: 'Llamada',
  whatsapp: 'WhatsApp',
  correo: 'Correo',
  visita: 'Visita',
  nota: 'Nota',
  estado: 'Cambio de etapa',
};

// Lo que el corredor registra a mano; el cambio de etapa lo anota el sistema.
export const MANUAL_KINDS: LeadEventKind[] = ['llamada', 'whatsapp', 'correo', 'visita', 'nota'];

export const kindLabel = (kind: LeadEventKind): string => KIND_LABELS[kind];

const STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  visita_agendada: 'Visita agendada',
  en_negociacion: 'En negociación',
  cerrado: 'Cerrado',
  descartado: 'Descartado',
};

export const statusLabel = (status: LeadStatus): string => STATUS_LABELS[status] ?? status;

export const sortEvents = (events: LeadEvent[]): LeadEvent[] =>
  [...events].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
