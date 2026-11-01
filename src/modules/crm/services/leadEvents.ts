import { appEvents } from '../../../core/events/appEvents';
import { useLeadStore } from '../stores/useLeadStore';

let cancelActive: (() => void) | null = null;

// CRM escucha `lead.created` (lo emite Captación) y guarda el lead. Llamarla dos veces no duplica la suscripción.
export function registerLeadEvents(): () => void {
  if (!cancelActive) {
    const cancel = appEvents.on('lead.created', ({ lead }) => {
      useLeadStore.getState().addLead(lead);
    });
    cancelActive = () => {
      cancel();
      cancelActive = null;
    };
  }
  return cancelActive;
}
