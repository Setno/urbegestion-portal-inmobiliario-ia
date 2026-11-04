import { describe, it, expect } from 'vitest';
import { kindLabel, statusLabel, sortEvents, MANUAL_KINDS } from './leadTimeline';
import type { LeadEvent } from '../types/leadEvent';

const ev = (id: string, occurredAt: string): LeadEvent => ({ id, leadId: 'l', kind: 'nota', text: id, occurredAt, author: 'a@b.cl' });

describe('leadTimeline', () => {
  it('nombra cada tipo y cada estado en español', () => {
    expect(kindLabel('llamada')).toBe('Llamada');
    expect(kindLabel('whatsapp')).toBe('WhatsApp');
    expect(kindLabel('estado')).toBe('Cambio de etapa');
    expect(statusLabel('visita_agendada')).toBe('Visita agendada');
  });
  it('los tipos manuales no incluyen el cambio de etapa, que es automático', () => {
    expect(MANUAL_KINDS).toEqual(['llamada', 'whatsapp', 'correo', 'visita', 'nota']);
  });
  it('ordena del más reciente al más antiguo sin modificar la lista original', () => {
    const lista = [ev('a', '2026-11-01T10:00:00Z'), ev('c', '2026-11-03T10:00:00Z'), ev('b', '2026-11-02T10:00:00Z')];
    expect(sortEvents(lista).map((e) => e.id)).toEqual(['c', 'b', 'a']);
    expect(lista[0].id).toBe('a');
  });
});
