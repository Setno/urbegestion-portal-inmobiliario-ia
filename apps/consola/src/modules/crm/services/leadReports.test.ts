import { describe, it, expect } from 'vitest';
import { funnel, bySource, byCampaign, responseStats, inPeriod, previousPeriod, leadToVisit, formatHours, change, weeklyLeads, followUp, visitsIn } from './leadReports';
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

describe('dashboard de leads (H-061)', () => {
  const NOW = new Date('2026-11-10T12:00:00Z'); // martes

  it('previousPeriod toma los días justo antes del período actual', () => {
    const ls = [lead({ id: 'a', createdAt: '2026-11-08' }), lead({ id: 'b', createdAt: '2026-11-04' }), lead({ id: 'c', createdAt: '2026-10-30' }), lead({ id: 'd', createdAt: '2026-10-01' })];
    expect(inPeriod(ls, 7, NOW).map((l) => l.id)).toEqual(['a', 'b']);
    expect(previousPeriod(ls, 7, NOW).map((l) => l.id)).toEqual(['c']);
    expect(previousPeriod(ls, null, NOW)).toBeNull(); // "todo el tiempo" no tiene período anterior
  });

  it('leadToVisit cuenta los que llegaron a visita o más y dice si no hay datos', () => {
    const r = leadToVisit([
      lead({ id: '1', status: 'nuevo' }), lead({ id: '2', status: 'visita_agendada' }),
      lead({ id: '3', status: 'cerrado' }), lead({ id: '4', status: 'descartado' }),
    ]);
    expect(r).toEqual({ reached: 2, total: 3, rate: 67 }); // el descartado no cuenta
    expect(leadToVisit([])).toEqual({ reached: 0, total: 0, rate: null });
  });

  it('formatHours muestra minutos bajo dos horas', () => {
    expect(formatHours(null)).toBe('sin datos');
    expect(formatHours(0.75)).toBe('45 min');
    expect(formatHours(1.9)).toBe('114 min');
    expect(formatHours(3.5)).toBe('3,5 h');
    expect(formatHours(30)).toBe('30 h');
  });

  it('change compara con el período anterior y no inventa un porcentaje sin base', () => {
    expect(change(12, 10)).toEqual({ kind: 'sube', pct: 20 });
    expect(change(5, 10)).toEqual({ kind: 'baja', pct: 50 });
    expect(change(10, 10)).toEqual({ kind: 'igual', pct: 0 });
    expect(change(4, 0)).toEqual({ kind: 'sin_base', pct: null });
    expect(change(4, null)).toEqual({ kind: 'sin_base', pct: null });
    expect(change(null, 3)).toEqual({ kind: 'sin_base', pct: null });
  });

  it('weeklyLeads agrupa por semana (lunes a domingo) con el origen de cada una, incluyendo semanas vacías', () => {
    const ls = [
      lead({ id: '1', createdAt: '2026-11-09', source: 'ficha_propiedad' }), // lunes de esta semana
      lead({ id: '2', createdAt: '2026-11-10', source: 'asistente_ia' }),
      lead({ id: '3', createdAt: '2026-11-01', source: 'ficha_propiedad' }), // domingo de la semana del 26-oct
    ];
    const w = weeklyLeads(ls, 3, NOW);
    expect(w.map((x) => x.weekStart)).toEqual(['2026-10-26', '2026-11-02', '2026-11-09']);
    expect(w.map((x) => x.total)).toEqual([1, 0, 2]);
    expect(Object.values(w[2].bySource).reduce((a, b) => a + b, 0)).toBe(2);
    expect(Object.keys(w[2].bySource)).toHaveLength(2);
  });

  it('followUp cuenta acciones vencidas y contactos abiertos sin acción, ignorando cerrados y descartados', () => {
    const r = followUp([
      lead({ id: '1', nextActionText: 'llamar', nextActionDue: '2026-11-05' }),
      lead({ id: '2', nextActionText: 'llamar', nextActionDue: '2026-11-10' }),
      lead({ id: '3' }),
      lead({ id: '4', status: 'cerrado' }),
      lead({ id: '5', status: 'descartado' }),
    ], '2026-11-10');
    expect(r).toEqual({ overdue: 1, withoutAction: 1, open: 3 });
  });

  it('visitsIn cuenta las visitas con fecha dentro de un rango, sin descartados', () => {
    const ls = [
      lead({ id: '1', appointmentDate: '2026-11-12' }), lead({ id: '2', appointmentDate: '2026-11-03' }),
      lead({ id: '3', appointmentDate: '2026-11-12', status: 'descartado' }), lead({ id: '4' }),
    ];
    expect(visitsIn(ls, '2026-11-10', '2026-11-16')).toBe(1);
  });
});
