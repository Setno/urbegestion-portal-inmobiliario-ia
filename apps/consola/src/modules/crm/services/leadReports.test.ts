import { describe, it, expect } from 'vitest';
import { funnel, bySource, byCampaign, responseStats, inPeriod } from './leadReports';
import type { Lead } from '../types/lead';
import type { LeadEvent } from '../types/leadEvent';

const lead = (over: Partial<Lead>): Lead => ({
  id: 'x', fullName: 'Ana', email: '', phone: '', operationInterest: 'compra', status: 'nuevo',
  notes: [], source: 'formulario_contacto', createdAt: '2026-11-01', ...over,
});
const ev = (leadId: string, kind: LeadEvent['kind'], occurredAt: string): LeadEvent => ({ id: `${leadId}${kind}${occurredAt}`, leadId, kind, text: 't', occurredAt, author: 'a' });

describe('funnel', () => {
  it('cuenta cuántos llegaron a cada etapa y la conversión respecto de la anterior', () => {
    const f = funnel([
      lead({ id: '1', status: 'nuevo' }),
      lead({ id: '2', status: 'contactado' }),
      lead({ id: '3', status: 'visita_agendada' }),
      lead({ id: '4', status: 'en_negociacion' }),
      lead({ id: '5', status: 'cerrado' }),
      lead({ id: '6', status: 'descartado' }),
    ]);
    expect(f.discarded).toBe(1);
    expect(f.stages.map((s) => [s.status, s.current, s.reached])).toEqual([
      ['nuevo', 1, 5], ['contactado', 1, 4], ['visita_agendada', 1, 3], ['en_negociacion', 1, 2], ['cerrado', 1, 1],
    ]);
    expect(f.stages.map((s) => s.conversion)).toEqual([null, 80, 75, 67, 50]);
  });
  it('sin leads no divide por cero', () => {
    const f = funnel([]);
    expect(f.stages.every((s) => s.reached === 0 && s.conversion === null)).toBe(true);
  });
});

describe('bySource y byCampaign', () => {
  const leads = [
    lead({ id: '1', source: 'ficha_propiedad', status: 'cerrado', attribution: { fuente: 'google', medio: 'cpc', campana: 'verano' } }),
    lead({ id: '2', source: 'ficha_propiedad', attribution: { fuente: 'google', medio: 'cpc', campana: 'verano' } }),
    lead({ id: '3', source: 'asistente_ia' }),
    lead({ id: '4', source: 'ficha_propiedad', status: 'descartado' }),
  ];
  it('agrupa por origen con total, cerrados y conversión, del más grande al más chico', () => {
    const r = bySource(leads);
    expect(r[0]).toMatchObject({ label: 'Ficha de propiedad', total: 3, closed: 1, rate: 33 });
    expect(r[1]).toMatchObject({ label: 'Asistente IA', total: 1, closed: 0, rate: 0 });
  });
  it('agrupa por campaña y deja "Directo" a quienes no traen utm', () => {
    const r = byCampaign(leads);
    expect(r[0]).toMatchObject({ label: 'google / cpc / verano', total: 2, closed: 1, rate: 50 });
    expect(r[1]).toMatchObject({ label: 'Directo', total: 2 });
  });
});

describe('responseStats', () => {
  const now = new Date('2026-11-10T12:00:00Z');
  it('mide las horas hasta el primer contacto real (no notas ni cambios de etapa)', () => {
    const leads = [
      lead({ id: 'a', createdAtIso: '2026-11-09T10:00:00Z', status: 'contactado' }),
      lead({ id: 'b', createdAtIso: '2026-11-09T10:00:00Z', status: 'contactado' }),
    ];
    const events = [
      ev('a', 'nota', '2026-11-09T10:05:00Z'),
      ev('a', 'estado', '2026-11-09T10:06:00Z'),
      ev('a', 'llamada', '2026-11-09T12:00:00Z'),
      ev('a', 'whatsapp', '2026-11-09T18:00:00Z'),
      ev('b', 'correo', '2026-11-09T16:00:00Z'),
    ];
    const r = responseStats(leads, events, now);
    expect(r.answered).toBe(2);
    expect(r.averageHours).toBe(4); // (2 h + 6 h) / 2
  });
  it('cuenta los leads nuevos sin contacto que llevan más de 24 horas', () => {
    const leads = [
      lead({ id: 'viejo', createdAtIso: '2026-11-08T10:00:00Z' }),
      lead({ id: 'reciente', createdAtIso: '2026-11-10T08:00:00Z' }),
      lead({ id: 'contactado', createdAtIso: '2026-11-08T10:00:00Z' }),
      lead({ id: 'cerrado', createdAtIso: '2026-11-01T10:00:00Z', status: 'cerrado' }),
    ];
    const r = responseStats(leads, [ev('contactado', 'llamada', '2026-11-08T11:00:00Z')], now);
    expect(r.unansweredOver24h).toBe(1);
  });
  it('sin datos no inventa un promedio', () => {
    expect(responseStats([lead({})], [], now).averageHours).toBeNull();
  });
  it('ignora un contacto anterior a la creación del lead', () => {
    const r = responseStats([lead({ id: 'a', createdAtIso: '2026-11-09T10:00:00Z', status: 'contactado' })], [ev('a', 'llamada', '2026-11-09T09:00:00Z')], now);
    expect(r.answered).toBe(0);
  });
});

describe('inPeriod', () => {
  it('filtra por días desde la fecha de registro; "todo" deja pasar todo', () => {
    const now = new Date('2026-11-10T12:00:00Z');
    const leads = [lead({ id: 'a', createdAt: '2026-11-08' }), lead({ id: 'b', createdAt: '2026-09-01' })];
    expect(inPeriod(leads, 7, now).map((l) => l.id)).toEqual(['a']);
    expect(inPeriod(leads, null, now)).toHaveLength(2);
  });
});
