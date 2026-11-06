import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../auth/supabaseClient';

// H-064: la corredora sale de la sesión del usuario (su membresía), no de una variable fija del despliegue.
// VITE_TENANT_ID queda solo como respaldo: la portada pública de desarrollo y los previews, donde nadie ha iniciado sesión.
const envTenantId: string | undefined = import.meta.env.VITE_TENANT_ID || undefined;
let sessionTenantId: string | undefined;
const listeners = new Set<(tenantId: string | null) => void>();

// La corredora con la que se leen y escriben los datos: la de la sesión y, si no hay, la de la variable.
export const getTenantId = (): string | undefined => sessionTenantId ?? envTenantId;

// Lo llama el store de sesión: al entrar fija la corredora del usuario y al salir la suelta.
// Avisa a los oyentes solo si la corredora efectiva cambió.
export function setSessionTenant(tenantId: string | null): void {
  const before = getTenantId();
  sessionTenantId = tenantId || undefined;
  const after = getTenantId();
  if (before === after) return;
  listeners.forEach((listener) => listener(after ?? null));
}

// Para cargas que esperan a la base: se toma antes del `await` y se consulta después. Si la corredora cambió mientras
// tanto (cerró sesión, entró otra cuenta), la respuesta es de la corredora anterior y debe descartarse.
export function tenantGuard(): () => boolean {
  const captured = getTenantId();
  return () => getTenantId() !== captured;
}

export function onTenantChange(listener: (tenantId: string | null) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Hay una base a la cual hablar (URL y clave configuradas). En pruebas siempre se usa el almacenamiento local
// (las pruebas que necesitan otro repositorio lo inyectan a mano), para no tocar nunca la base real.
// La corredora concreta se resuelve aparte, en cada operación (getTenantId).
export const isRemoteData: boolean = isSupabaseConfigured && import.meta.env.MODE !== 'test';

export interface RemoteContext {
  client: SupabaseClient;
  tenantId: string;
}

// Datos remotos solo si hay base y una corredora (de la sesión o de la variable).
export const remoteContext = (): RemoteContext | null => {
  const tenantId = getTenantId();
  return isRemoteData && supabase && tenantId ? { client: supabase, tenantId } : null;
};

// Un repositorio por corredora: se arma con el contexto actual y se rearma cuando la corredora cambia
// (entrar, salir, cambiar de cuenta), para no seguir escribiendo en la anterior.
// `set` es para pruebas: un repositorio inyectado a mano no se reemplaza.
export function createScopedRepository<T>(build: (ctx: RemoteContext | null) => T): { get: () => T; set: (repo: T | null) => void } {
  let current: T | null = null;
  let builtFor: string | null = null;
  let injected = false;
  return {
    get: () => {
      const ctx = remoteContext();
      const key = ctx?.tenantId ?? '';
      if (current === null || (!injected && builtFor !== key)) {
        current = build(ctx);
        builtFor = key;
        injected = false;
      }
      return current;
    },
    set: (repo) => {
      current = repo;
      injected = repo !== null;
      builtFor = null;
    },
  };
}
