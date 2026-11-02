import { createEventBus } from './eventBus';
import type { Lead } from '../../modules/crm/types/lead';

// Datos con los que Captación avisa que llegó un contacto nuevo. CRM decide cómo guardarlo.
export type NewLeadData = Omit<Lead, 'id' | 'createdAt'>;

export interface AppEvents extends Record<string, unknown> {
  'lead.created': { lead: NewLeadData };
}

export const appEvents = createEventBus<AppEvents>();

export const emitLeadCreated = (lead: NewLeadData) => appEvents.emit('lead.created', { lead });
