import { describe, it, expect } from 'vitest';
import { visitsOf, visitsByDay, monthGrid, conflictIds, isValidTime, shiftMonth } from './leadAgenda';
import type { Lead } from '../types/lead';

const lead = (over: Partial<Lead>): Lead => ({
  id: 'x', fullName: 'Ana', email: '', phone: '', operationInterest: 'compra', status: 'visita_agendada',
  notes: [], source: 'formulario_contacto', createdAt: '2026-01-01', ...over,
});

describe('visitsOf', () => {
  it('toma solo los leads con fecha de visita y deja fuera cerrados y descartados', () => {
    const v = visitsOf([
      lead({ id: 'a', appointmentDate: '2026-11-10', appointmentTime: '11:00' }),
      lead({ id: 'b' }),
      lead({ id: 'c', status: 'cerrado', appointmentDate: '2026-11-10' }),
      lead({ id: 'd', status: 'descartado', appointmentDate: '2026-11-10' }),
      lead({ id: 'e', appointmentDate: 'mañana' }),
    ]);
    expect(v.map((x) => x.lead.id)).toEqual(['a']);
  });
});

describe('visitsByDay', () => {
  it('agrupa por día y ordena por hora; las sin hora van al final', () => {
    const v = visitsOf([
      lead({ id: 'tarde', appointmentDate: '2026-11-10', appointmentTime: '16:00' }),
      lead({ id: 'sinhora', appointmentDate: '2026-11-10' }),
      lead({ id: 'manana', appointmentDate: '2026-11-10', appointmentTime: '09:30' }),
      lead({ id: 'otro', appointmentDate: '2026-11-11', appointmentTime: '10:00' }),
    ]);
    const dias = visitsByDay(v);
    expect(dias['2026-11-10'].map((x) => x.lead.id)).toEqual(['manana', 'tarde', 'sinhora']);
    expect(dias['2026-11-11']).toHaveLength(1);
  });
});

describe('conflictIds', () => {
  it('marca los leads que tienen visita el mismo día y a la misma hora', () => {
    const v = visitsOf([
      lead({ id: 'a', appointmentDate: '2026-11-10', appointmentTime: '11:00' }),
      lead({ id: 'b', appointmentDate: '2026-11-10', appointmentTime: '11:00' }),
      lead({ id: 'c', appointmentDate: '2026-11-10', appointmentTime: '12:00' }),
      lead({ id: 'd', appointmentDate: '2026-11-11', appointmentTime: '11:00' }),
      lead({ id: 'e', appointmentDate: '2026-11-10' }),
      lead({ id: 'f', appointmentDate: '2026-11-10' }),
    ]);
    expect([...conflictIds(v)].sort()).toEqual(['a', 'b']);
  });
});

describe('monthGrid', () => {
  it('noviembre 2026 empieza en domingo y se muestra en semanas que parten en lunes', () => {
    const g = monthGrid(2026, 10);
    expect(g.length % 7).toBe(0);
    expect(g[0]).toBe('2026-10-26');
    expect(g).toContain('2026-11-01');
    expect(g).toContain('2026-11-30');
    expect(g[g.length - 1]).toBe('2026-12-06');
  });
  it('un mes que empieza en lunes no agrega días antes', () => {
    expect(monthGrid(2026, 5)[0]).toBe('2026-06-01');
  });
});

describe('isValidTime y shiftMonth', () => {
  it('acepta HH:MM reales', () => {
    expect(isValidTime('09:30')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:30')).toBe(false);
    expect(isValidTime('')).toBe(false);
  });
  it('pasa de un año a otro', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });
});
