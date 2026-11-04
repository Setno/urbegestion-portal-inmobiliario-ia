import { describe, it, expect } from 'vitest';
import { actionState, forToday, isValidDate, localToday } from './leadTasks';
import type { Lead } from '../types/lead';

const lead = (over: Partial<Lead>): Lead => ({
  id: 'x', fullName: 'Ana', email: '', phone: '', operationInterest: 'compra',
  status: 'contactado', notes: [], source: 'formulario_contacto', createdAt: '2026-01-01', ...over,
});

const HOY = '2026-11-04';

describe('isValidDate', () => {
  it('acepta fechas reales y rechaza texto o días que no existen', () => {
    expect(isValidDate('2026-11-04')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('mañana')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });
});

describe('localToday', () => {
  it('usa el día del reloj local, no el UTC', () => {
    expect(localToday(new Date(2026, 10, 4, 23, 30))).toBe('2026-11-04');
  });
});

describe('actionState', () => {
  it('distingue sin acción, vencida, de hoy y futura', () => {
    expect(actionState(lead({}), HOY)).toBe('sin_accion');
    expect(actionState(lead({ nextActionText: 'Llamar', nextActionDue: '2026-11-03' }), HOY)).toBe('vencida');
    expect(actionState(lead({ nextActionText: 'Llamar', nextActionDue: HOY }), HOY)).toBe('hoy');
    expect(actionState(lead({ nextActionText: 'Llamar', nextActionDue: '2026-11-09' }), HOY)).toBe('futura');
  });
  it('un lead cerrado o descartado no necesita acción', () => {
    expect(actionState(lead({ status: 'cerrado' }), HOY)).toBe('no_aplica');
    expect(actionState(lead({ status: 'descartado', nextActionText: 'x', nextActionDue: '2026-01-01' }), HOY)).toBe('no_aplica');
  });
});

describe('forToday', () => {
  it('ordena vencidas (la más antigua primero), de hoy y sin acción; omite futuras y cerrados', () => {
    const lista = forToday([
      lead({ id: 'sin' }),
      lead({ id: 'futura', nextActionText: 'a', nextActionDue: '2026-12-01' }),
      lead({ id: 'hoy', nextActionText: 'a', nextActionDue: HOY }),
      lead({ id: 'v2', nextActionText: 'a', nextActionDue: '2026-11-03' }),
      lead({ id: 'v1', nextActionText: 'a', nextActionDue: '2026-10-20' }),
      lead({ id: 'cerrado', status: 'cerrado' }),
    ], HOY);
    expect(lista.map((l) => l.id)).toEqual(['v1', 'v2', 'hoy', 'sin']);
  });
});

describe('forToday con cerrados', () => {
  it('un lead cerrado con acción vencida no aparece', () => {
    const l = lead({ id: 'c', status: 'cerrado', nextActionText: 'a', nextActionDue: '2026-01-01' });
    expect(forToday([l], HOY)).toEqual([]);
  });
});
