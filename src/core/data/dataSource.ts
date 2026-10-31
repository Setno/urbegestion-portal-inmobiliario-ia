import { supabase, isSupabaseConfigured } from '../auth/supabaseClient';

// El sitio atiende a una corredora fija (VITE_TENANT_ID). El mapeo dominio → corredora llega con las plantillas de sitio.
export const tenantId: string | undefined = import.meta.env.VITE_TENANT_ID || undefined;

// Los datos van a Supabase solo si hay URL, clave y corredora. En pruebas siempre se usa el almacenamiento local
// (las pruebas que necesitan otro repositorio lo inyectan a mano), para no tocar nunca la base real.
export const isRemoteData: boolean = isSupabaseConfigured && Boolean(tenantId) && import.meta.env.MODE !== 'test';

export const remoteContext = (): { client: NonNullable<typeof supabase>; tenantId: string } | null =>
  isRemoteData && supabase && tenantId ? { client: supabase, tenantId } : null;
