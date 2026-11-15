import type { Role } from '../../../core/auth/permissions';
import type { Lead } from '../types/lead';
import type { TeamMember } from './teamRepository';

// Asignación de leads a mano (H-069.1). Las mismas reglas las aplica la base (migración 20261115100000);
// aquí solo deciden qué se muestra, para no ofrecer algo que la base va a rechazar.

export interface Actor {
  role: Role | null;
  userId: string | undefined;
}

// 'mine' = los del usuario; 'all' = todos; 'unassigned' = sin responsable; cualquier otro valor = id de un miembro.
export type AssigneeFilter = 'mine' | 'all' | 'unassigned' | string;

// El administrador asigna, cambia o quita a cualquiera. Un agente solo toma un lead sin responsable para sí o suelta el suyo.
export function canChangeAssignment(actor: Actor, lead: Lead, target: string | undefined): boolean {
  if (!actor.role || !actor.userId) return false;
  if ((lead.assignedTo ?? undefined) === target) return false;
  if (actor.role === 'admin') return true;
  if (!lead.assignedTo && target === actor.userId) return true;
  if (lead.assignedTo === actor.userId && target === undefined) return true;
  return false;
}

export function matchesAssignee(lead: Lead, filter: AssigneeFilter, userId: string | undefined): boolean {
  if (filter === 'all') return true;
  if (filter === 'unassigned') return !lead.assignedTo;
  if (filter === 'mine') return Boolean(userId) && lead.assignedTo === userId;
  return lead.assignedTo === filter;
}

// El agente abre en "Mis leads" (decisión del 2026-11-15); el administrador, en "Todos". Sin equipo no hay filtro.
export function defaultAssigneeFilter(role: Role | null, userId: string | undefined, hasTeam: boolean): AssigneeFilter {
  return hasTeam && role === 'agente' && userId ? 'mine' : 'all';
}

export const UNASSIGNED_LABEL = 'Sin asignar';

export function memberLabel(team: TeamMember[], userId: string | undefined): string {
  if (!userId) return UNASSIGNED_LABEL;
  const member = team.find((m) => m.userId === userId);
  if (!member) return 'Ex miembro del equipo';
  return member.email || 'Miembro sin correo';
}

// Opciones del selector de responsable. '' = sin asignar.
export function assignmentOptions(actor: Actor, team: TeamMember[]): { userId: string; label: string }[] {
  const none = { userId: '', label: UNASSIGNED_LABEL };
  if (actor.role === 'admin') return [none, ...team.map((m) => ({ userId: m.userId, label: memberLabel(team, m.userId) }))];
  return [none, ...team.filter((m) => m.userId === actor.userId).map((m) => ({ userId: m.userId, label: memberLabel(team, m.userId) }))];
}
