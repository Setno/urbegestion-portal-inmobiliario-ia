// Un contacto o suceso en la historia de un lead (H-057).
export type LeadEventKind = 'llamada' | 'whatsapp' | 'correo' | 'visita' | 'nota' | 'estado';

export interface LeadEvent {
  id: string;
  leadId: string;
  kind: LeadEventKind;
  text: string;
  occurredAt: string; // fecha y hora ISO
  author: string; // correo de quien lo registró
}
