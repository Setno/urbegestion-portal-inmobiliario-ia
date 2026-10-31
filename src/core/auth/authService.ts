import { supabase } from './supabaseClient';
import type { Role } from './permissions';

export interface Membership {
  tenantName: string;
  role: Role;
}

export type AuthError = 'credenciales' | 'conexion' | 'no_configurado' | 'clave_corta' | 'enlace_invalido';
export type SignInResult = { ok: true; email: string } | { ok: false; error: AuthError };
export type SimpleResult = { ok: true } | { ok: false; error: AuthError };
export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'PASSWORD_RECOVERY';

const MIN_PASSWORD_LENGTH = 8;
const VALID_ROLES: Role[] = ['admin', 'agente'];

interface SupabaseErrorLike {
  status?: number;
  code?: string;
  message?: string;
}

const isBadCredentials = (e: SupabaseErrorLike) => e.code === 'invalid_credentials' || e.status === 400;

export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  if (!supabase) return { ok: false, error: 'no_configurado' };
  if (!email.trim() || !password) return { ok: false, error: 'credenciales' };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, error: isBadCredentials(error) ? 'credenciales' : 'conexion' };
    return { ok: true, email: data.user?.email ?? email.trim() };
  } catch (err) {
    console.warn('[auth] No se pudo iniciar sesión:', err);
    return { ok: false, error: 'conexion' };
  }
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('[auth] No se pudo cerrar la sesión en el servidor:', err);
  }
}

export async function getSessionEmail(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.email ?? null;
  } catch {
    return null;
  }
}

// La base (RLS) solo entrega la membresía del propio usuario. Lanza error si la consulta falla,
// para no confundir "sin conexión" con "sin corredora".
export async function getMembership(): Promise<Membership | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('memberships').select('role, tenants(name)').limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as unknown as { role: string; tenants: { name: string } | { name: string }[] | null };
  const tenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
  if (!VALID_ROLES.includes(row.role as Role) || !tenant?.name) return null;
  return { tenantName: tenant.name, role: row.role as Role };
}

// Siempre informa éxito si Supabase acepta la petición, exista o no el correo (no se revela quién tiene cuenta).
export async function requestPasswordReset(email: string): Promise<SimpleResult> {
  if (!supabase) return { ok: false, error: 'no_configurado' };
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    });
    return error ? { ok: false, error: 'conexion' } : { ok: true };
  } catch (err) {
    console.warn('[auth] No se pudo pedir la recuperación de clave:', err);
    return { ok: false, error: 'conexion' };
  }
}

export async function updatePassword(newPassword: string): Promise<SimpleResult> {
  if (!supabase) return { ok: false, error: 'no_configurado' };
  if (newPassword.length < MIN_PASSWORD_LENGTH) return { ok: false, error: 'clave_corta' };
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.status === 401 || error.status === 403 ? 'enlace_invalido' : 'conexion' };
    return { ok: true };
  } catch (err) {
    console.warn('[auth] No se pudo actualizar la clave:', err);
    return { ok: false, error: 'conexion' };
  }
}

export function onAuthStateChange(callback: (event: AuthEvent, email: string | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY') {
      callback(event, session?.user?.email ?? null);
    }
  });
  return () => data.subscription.unsubscribe();
}
