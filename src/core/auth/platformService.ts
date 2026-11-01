import { supabase } from './supabaseClient';

export type CreateTenantError =
  | 'nombre_invalido'
  | 'correo_invalido'
  | 'nombre_repetido'
  | 'correo_existente'
  | 'sin_permiso'
  | 'conexion';
export type CreateTenantResult = { ok: true } | { ok: false; error: CreateTenantError };

const ERRORS: Record<string, CreateTenantError> = {
  invalid_name: 'nombre_invalido',
  invalid_email: 'correo_invalido',
  name_taken: 'nombre_repetido',
  email_exists: 'correo_existente',
  not_owner: 'sin_permiso',
  unauthorized: 'sin_permiso',
};

async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// ¿La persona con sesión es dueña del producto? El servidor decide (lista PLATFORM_OWNER_EMAILS); aquí solo se pregunta.
export async function isPlatformOwner(): Promise<boolean> {
  try {
    const token = await accessToken();
    if (!token) return false;
    const res = await fetch('/api/create-tenant', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return false;
    return ((await res.json()) as { owner?: boolean }).owner === true;
  } catch (err) {
    console.warn('[platform] No se pudo consultar si es dueño del producto:', err);
    return false;
  }
}

// Crea una corredora y envía la invitación a su primer administrador.
export async function createTenant(name: string, adminEmail: string): Promise<CreateTenantResult> {
  try {
    const token = await accessToken();
    if (!token) return { ok: false, error: 'sin_permiso' };
    const res = await fetch('/api/create-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim(), adminEmail: adminEmail.trim() }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) return { ok: true };
    return { ok: false, error: ERRORS[body.error ?? ''] ?? 'conexion' };
  } catch (err) {
    console.warn('[platform] No se pudo crear la corredora:', err);
    return { ok: false, error: 'conexion' };
  }
}
