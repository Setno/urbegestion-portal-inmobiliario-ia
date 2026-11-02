import { supabase } from './supabaseClient';
import type { Role } from './permissions';

// Cómo se publican las propiedades de la corredora: el administrador aprueba (corredoras grandes)
// o cada agente publica lo suyo y responde por ello (corredoras de una o dos personas).
export type PublicationMode = 'con_aprobacion' | 'directa';

export interface Membership {
  tenantName: string;
  role: Role;
  publicationMode: PublicationMode;
}

export type AuthError = 'credenciales' | 'conexion' | 'no_configurado' | 'clave_corta' | 'enlace_invalido';
export type SignInResult = { ok: true; email: string } | { ok: false; error: AuthError };
export type SimpleResult = { ok: true } | { ok: false; error: AuthError };
export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'PASSWORD_RECOVERY';
export type InviteError =
  | 'correo_invalido'
  | 'ya_miembro'
  | 'otra_corredora'
  | 'sin_permiso'
  | 'no_configurado'
  | 'limite_alcanzado'
  | 'solo_lectura'
  | 'conexion';
export type InviteResult = { ok: true; status: 'invitado' | 'agregado' } | { ok: false; error: InviteError };

const MIN_PASSWORD_LENGTH = 8;
const VALID_ROLES: Role[] = ['admin', 'agente'];
const VALID_MODES: PublicationMode[] = ['con_aprobacion', 'directa'];

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
  const { data, error } = await supabase.from('memberships').select('role, tenants(name, publication_mode)').limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  type TenantRow = { name: string; publication_mode?: string };
  const row = data as unknown as { role: string; tenants: TenantRow | TenantRow[] | null };
  const tenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
  if (!VALID_ROLES.includes(row.role as Role) || !tenant?.name) return null;
  const mode = VALID_MODES.includes(tenant.publication_mode as PublicationMode)
    ? (tenant.publication_mode as PublicationMode)
    : 'con_aprobacion';
  return { tenantName: tenant.name, role: row.role as Role, publicationMode: mode };
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

// Solo el administrador puede cambiar el modo de publicación (lo exige la base con una función protegida).
export async function setPublicationMode(mode: PublicationMode): Promise<SimpleResult> {
  if (!supabase) return { ok: false, error: 'no_configurado' };
  try {
    const { error } = await supabase.rpc('set_publication_mode', { p_mode: mode });
    return error ? { ok: false, error: 'conexion' } : { ok: true };
  } catch (err) {
    console.warn('[auth] No se pudo cambiar el modo de publicación:', err);
    return { ok: false, error: 'conexion' };
  }
}

// El enlace del correo de invitación llega con `type=invite` en la dirección; el invitado aún no tiene clave.
export const isInviteHash = (hash: string): boolean => /(^|[#&])type=invite(&|$)/.test(hash);

// Se lee al cargar el módulo, antes de que Supabase limpie la dirección. Vale solo un minuto: si el enlace
// venció y no se abrió sesión, un inicio de sesión posterior con clave no debe tratarse como invitación.
const INVITE_WINDOW_MS = 60_000;
let inviteDeadline = typeof window !== 'undefined' && isInviteHash(window.location.hash) ? Date.now() + INVITE_WINDOW_MS : 0;

const INVITE_ERRORS: Record<string, InviteError> = {
  invalid_email: 'correo_invalido',
  already_member: 'ya_miembro',
  other_tenant: 'otra_corredora',
  not_admin: 'sin_permiso',
  unauthorized: 'sin_permiso',
  invite_not_configured: 'no_configurado',
  limit_reached: 'limite_alcanzado',
  read_only: 'solo_lectura',
};

// Pide al servidor (api/invite) invitar a un agente a la corredora del administrador con sesión.
export async function inviteAgent(email: string): Promise<InviteResult> {
  if (!supabase) return { ok: false, error: 'no_configurado' };
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ok: false, error: 'sin_permiso' };
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: email.trim() }),
    });
    const body = (await res.json().catch(() => ({}))) as { status?: 'invitado' | 'agregado'; error?: string };
    if (res.ok && body.status) return { ok: true, status: body.status };
    return { ok: false, error: INVITE_ERRORS[body.error ?? ''] ?? 'conexion' };
  } catch (err) {
    console.warn('[auth] No se pudo invitar al agente:', err);
    return { ok: false, error: 'conexion' };
  }
}

export function onAuthStateChange(callback: (event: AuthEvent, email: string | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    // Quien llega por una invitación debe fijar su clave: se trata como la pantalla de clave nueva.
    // (Si Supabase abrió la sesión antes de suscribirnos, llega como INITIAL_SESSION.)
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && Date.now() < inviteDeadline) {
      inviteDeadline = 0;
      callback('PASSWORD_RECOVERY', session.user?.email ?? null);
      return;
    }
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY') {
      callback(event, session?.user?.email ?? null);
    }
  });
  return () => data.subscription.unsubscribe();
}
