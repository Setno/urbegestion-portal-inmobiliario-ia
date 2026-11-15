import type { SupabaseClient } from '@supabase/supabase-js';
import type { Role } from '../../../core/auth/permissions';
import { throwIfError } from '../../../core/data/repository';
import { createScopedRepository } from '../../../core/data/dataSource';

// Un miembro de la corredora (H-069.1). Se muestra por su correo: la plataforma aún no guarda nombres.
export interface TeamMember {
  userId: string;
  email: string;
  role: Role;
}

export interface TeamRepository {
  list: () => Promise<TeamMember[]>;
}

const ROLES: Role[] = ['admin', 'agente'];

// La base solo entrega el equipo a sus miembros (función `team_members`); la tabla de membresías sigue mostrando a cada uno solo lo propio.
export function createRemoteTeamRepository(client: SupabaseClient, tenantId: string): TeamRepository {
  return {
    list: async () => {
      const { data, error } = await client.rpc('team_members', { p_tenant: tenantId });
      throwIfError(error);
      return ((data ?? []) as Array<Record<string, unknown>>)
        .filter((r) => typeof r.user_id === 'string' && r.user_id && ROLES.includes(r.role as Role))
        .map((r) => ({ userId: String(r.user_id), email: typeof r.email === 'string' ? r.email : '', role: r.role as Role }));
    },
  };
}

// Sin base (datos en el navegador) no hay equipo: la asignación no aparece.
export function createLocalTeamRepository(): TeamRepository {
  return { list: async () => [] };
}

const scoped = createScopedRepository<TeamRepository>((ctx) => (ctx ? createRemoteTeamRepository(ctx.client, ctx.tenantId) : createLocalTeamRepository()));

export function getTeamRepository(): TeamRepository {
  return scoped.get();
}

// Solo para pruebas.
export function setTeamRepository(repo: TeamRepository | null): void {
  scoped.set(repo);
}
