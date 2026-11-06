// Alta de una corredora nueva con su primer administrador. Solo para el dueño del producto:
// su correo debe estar en PLATFORM_OWNER_EMAILS (lista separada por comas, solo en el servidor).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { createRateLimiter, clientKey, tooManyRequests } from './_limiteTasa.js';
declare const process: { env: Record<string, string | undefined> };

// Límite por dirección IP (H-005): 10 llamadas cada 10 minutos.
const limiter = createRateLimiter({ max: 10, windowMs: 600000 });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(code: string, status: number, cause?: unknown): Response {
  const c = cause as { code?: string; status?: number; message?: string } | null | undefined;
  console.warn("[api/create-tenant]", code, c?.code ?? c?.status ?? c?.message ?? '');
  return json({ error: code }, status);
}

// Devuelve el cliente de servicio y el usuario del token, o la respuesta de error que corresponda.
async function authenticate(
  request: Request,
): Promise<{ client: SupabaseClient; email: string } | Response> {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return json({ error: 'not_configured' }, 503);

  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'unauthorized' }, 401);

  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return json({ error: 'unauthorized' }, 401);
  return { client, email: (data.user.email ?? '').toLowerCase() };
}

const isOwner = (email: string): boolean =>
  Boolean(email) &&
  (process.env.PLATFORM_OWNER_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email);

// ¿Quien llama es dueño del producto? Sirve para que el panel muestre u oculte el formulario de alta.
export async function GET(request: Request): Promise<Response> {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;
  return json({ owner: isOwner(auth.email) });
}

export async function POST(request: Request): Promise<Response> {
  const wait = limiter.check(clientKey(request));
  if (wait > 0) return tooManyRequests(wait);
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;
  if (!isOwner(auth.email)) return json({ error: 'not_owner' }, 403);
  const { client } = auth;

  let body: { name?: unknown; adminEmail?: unknown };
  try {
    body = (await request.json()) as { name?: unknown; adminEmail?: unknown };
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const adminEmail = typeof body.adminEmail === 'string' ? body.adminEmail.trim().toLowerCase() : '';
  if (name.length < 2 || name.length > 80) return json({ error: 'invalid_name' }, 400);
  if (adminEmail.length > 254 || !EMAIL_RE.test(adminEmail)) return json({ error: 'invalid_email' }, 400);

  // 1. La corredora. El nombre es único en la base: repetido da 23505.
  const { data: tenant, error: tenantError } = await client.from('tenants').insert({ name }).select('id').single();
  if (tenantError || !tenant) {
    return tenantError?.code === '23505' ? json({ error: 'name_taken' }, 409) : fail('server_error', 500, tenantError);
  }
  const tenantId = (tenant as { id: string }).id;
  const undoTenant = () => client.from('tenants').delete().eq('id', tenantId);

  // 2. Invitación a su primer administrador (si ya tiene cuenta, no se le cambia de corredora).
  const redirectTo = `${(process.env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, '')}/`;
  const { data: invited, error: inviteError } = await client.auth.admin.inviteUserByEmail(adminEmail, { redirectTo });
  if (inviteError || !invited?.user) {
    await undoTenant();
    const exists = inviteError?.code === 'email_exists' || inviteError?.status === 422;
    return exists ? json({ error: 'email_exists' }, 409) : fail('invite_failed', 502, inviteError);
  }

  // 3. Su membresía de administrador.
  const { error: memberError } = await client
    .from('memberships')
    .insert({ tenant_id: tenantId, user_id: invited.user.id, role: 'admin' });
  if (memberError) {
    await client.auth.admin.deleteUser(invited.user.id);
    await undoTenant();
    return fail('server_error', 500, memberError);
  }
  return json({ ok: true });
}
