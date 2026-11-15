import { describe, it, expect } from 'vitest';
import { assignmentOptions, canChangeAssignment, defaultAssigneeFilter, matchesAssignee, memberLabel } from './leadAssignment';
import type { TeamMember } from './teamRepository';
import type { Lead } from '../types/lead';

const lead = (assignedTo?: string): Lead => ({
  id: 'l1',
  fullName: 'Ana',
  email: '',
  phone: '',
  operationInterest: 'compra',
  status: 'nuevo',
  notes: [],
  source: 'formulario_contacto',
  createdAt: '2026-11-15',
  ...(assignedTo ? { assignedTo } : {}),
});

const team: TeamMember[] = [
  { userId: 'admin-1', email: 'jefa@corredora.cl', role: 'admin' },
  { userId: 'agente-1', email: 'pedro@corredora.cl', role: 'agente' },
  { userId: 'agente-2', email: 'sofia@corredora.cl', role: 'agente' },
];

const admin = { role: 'admin' as const, userId: 'admin-1' };
const pedro = { role: 'agente' as const, userId: 'agente-1' };

describe('quién puede cambiar el responsable de un lead', () => {
  it('el administrador asigna, cambia o quita a cualquiera', () => {
    expect(canChangeAssignment(admin, lead(), 'agente-2')).toBe(true);
    expect(canChangeAssignment(admin, lead('agente-1'), 'agente-2')).toBe(true);
    expect(canChangeAssignment(admin, lead('agente-1'), undefined)).toBe(true);
  });

  it('un agente toma un lead sin responsable para sí y suelta el suyo', () => {
    expect(canChangeAssignment(pedro, lead(), 'agente-1')).toBe(true);
    expect(canChangeAssignment(pedro, lead('agente-1'), undefined)).toBe(true);
  });

  it('un agente no asigna a otro ni toca el lead de otro', () => {
    expect(canChangeAssignment(pedro, lead(), 'agente-2')).toBe(false);
    expect(canChangeAssignment(pedro, lead('agente-2'), 'agente-1')).toBe(false);
    expect(canChangeAssignment(pedro, lead('agente-2'), undefined)).toBe(false);
  });

  it('sin saber quién es el usuario no se cambia nada', () => {
    expect(canChangeAssignment({ role: 'admin', userId: undefined }, lead(), 'agente-1')).toBe(false);
    expect(canChangeAssignment({ role: null, userId: 'agente-1' }, lead(), 'agente-1')).toBe(false);
  });

  it('dejarlo igual no es un cambio', () => {
    expect(canChangeAssignment(admin, lead('agente-1'), 'agente-1')).toBe(false);
  });
});

describe('filtro por responsable', () => {
  it('"Mis leads" muestra solo los del usuario; "Sin asignar", los que no tienen responsable', () => {
    expect(matchesAssignee(lead('agente-1'), 'mine', 'agente-1')).toBe(true);
    expect(matchesAssignee(lead('agente-2'), 'mine', 'agente-1')).toBe(false);
    expect(matchesAssignee(lead(), 'mine', 'agente-1')).toBe(false);
    expect(matchesAssignee(lead(), 'unassigned', 'agente-1')).toBe(true);
    expect(matchesAssignee(lead('agente-2'), 'unassigned', 'agente-1')).toBe(false);
  });

  it('"Todos" deja pasar todo y un agente concreto filtra por su id', () => {
    expect(matchesAssignee(lead(), 'all', undefined)).toBe(true);
    expect(matchesAssignee(lead('agente-2'), 'agente-2', 'admin-1')).toBe(true);
    expect(matchesAssignee(lead('agente-1'), 'agente-2', 'admin-1')).toBe(false);
  });

  it('el agente abre en "Mis leads" y el administrador en "Todos"; sin equipo, siempre "Todos"', () => {
    expect(defaultAssigneeFilter('agente', 'agente-1', true)).toBe('mine');
    expect(defaultAssigneeFilter('admin', 'admin-1', true)).toBe('all');
    expect(defaultAssigneeFilter('agente', 'agente-1', false)).toBe('all');
    expect(defaultAssigneeFilter('agente', undefined, true)).toBe('all');
  });
});

describe('nombres del equipo', () => {
  it('muestra el correo del miembro, "Sin asignar" sin responsable y "Ex miembro" si ya no está en el equipo', () => {
    expect(memberLabel(team, 'agente-1')).toBe('pedro@corredora.cl');
    expect(memberLabel(team, undefined)).toBe('Sin asignar');
    expect(memberLabel(team, 'se-fue')).toBe('Ex miembro del equipo');
  });

  it('el administrador elige entre todo el equipo; el agente solo entre él mismo y nadie', () => {
    expect(assignmentOptions(admin, team).map((o) => o.userId)).toEqual(['', 'admin-1', 'agente-1', 'agente-2']);
    expect(assignmentOptions(pedro, team).map((o) => o.userId)).toEqual(['', 'agente-1']);
  });
});
