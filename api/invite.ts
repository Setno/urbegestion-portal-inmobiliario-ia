// Invita a un agente a la corredora de quien llama (solo administradores).
// Usa la clave de servicio de Supabase, que vive solo en el servidor (SUPABASE_SERVICE_ROLE_KEY).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { accessMode, entitlementsFromRow, limitOf, type EntitlementsRow } from '../src/core/platform/contract.js';

declare const process: { env: Record<string, string | undefined> };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAGE_SIZE = 1000;
const MAX_USER_PAGES = 10;

const STATUS: Record<string, number> = { server_error: 500, invite_failed: 502, already_member: 409 };

// Registra el motivo (sin datos personales) para poder diagnosticar y responde con un código genérico.
function fail(code: string, cause: unknown): Response {
  const c = cause as { code?: string; status?: number; message?: string } | null;
  console.warn(`[api/invite] ${code}:`, c?.code ?? c?.status ?? c?.message ?? '');
  return json({ error: code }, STATUS[code] ?? 500);
}

// Supabase responde 422 / email_exists cuando el correo ya tiene cuenta.
const isAlreadyRegistered = (e: unknown): boolean => {
  const err = e as { code?: string; status?: number; message?: string } | null;
  return err?.code === 'email_exists' || err?.status === 422 || /already.*registered/i.test(err?.message ?? '');
};

// Aplica lo que ventas dispuso (ADR-009): una cuenta en solo lectura o cancelada no invita, y el plan limita los agentes.
// Si no hay derechos guardados o no se pueden leer, no se bloquea: un fallo aquí no debe dejar a nadie sin servicio.
async function checkAgentRoom(client: SupabaseClient, tenantId: string): Promise<Response | null> {
  const { data, error } = await client.from('tenant_entitlements').select('*').eq('tenant_id', tenantId).maybeSingle();
  if (error || !data) {
    if (error) console.warn('[api/invite] no se pudieron leer los derechos:', error.code ?? error.message);
    return null;
  }
  const entitlements = entitlementsFromRow(data as EntitlementsRow);
  const mode = accessMode(entitlements);
  if (mode === 'read_only' || mode === 'export_only') return json({ error: 'read_only' }, 403);

  const max = limitOf(entitlements, 'limit.agents');
  if (max === null) return null;
  const { count, error: countError } = await client
    .from('memberships')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  if (countError) {
    console.warn('[api/invite] no se pudo contar a los agentes:', countError.code ?? countError.message);
    return null;
  }
  return (count ?? 0) >= max ? json({ error: 'limit_reached' }, 403) : null;
}

export async function POST(request: Request): Promise<Response> {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return json({ error: 'invite_not_configured' }, 503);

  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'unauthorized' }, 401);

  let email = '';
  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 1. Quién llama: el token tiene que ser de un usuario real.
  const { data: caller, error: callerError } = await client.auth.getUser(token);
  if (callerError || !caller?.user) return json({ error: 'unauthorized' }, 401);

  // 2. Solo un administrador puede invitar; la invitación va a SU corredora.
  const { data: adminRow, error: adminError } = await client
    .from('memberships')
    .select('tenant_id')
    .eq('user_id', caller.user.id)
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();
  if (adminError) return fail('server_error', adminError);
  const tenantId = (adminRow as { tenant_id?: string } | null)?.tenant_id;
  if (!tenantId) return json({ error: 'not_admin' }, 403);

  if (email.length > 254 || !EMAIL_RE.test(email)) return json({ error: 'invalid_email' }, 400);

  const blocked = await checkAgentRoom(client, tenantId);
  if (blocked) return blocked;

  // 3. Se intenta invitar primero: si el correo es nuevo, Supabase envía el correo con el enlace.
  // Con barra final: Supabase solo respeta el destino si coincide exactamente con uno de la lista de Redirect URLs.
  const redirectTo = `${(process.env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, '')}/`;
  const { data: invited, error: inviteError } = await client.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (!inviteError && invited?.user) {
    const { error: insertError } = await client
      .from('memberships')
      .insert({ tenant_id: tenantId, user_id: invited.user.id, role: 'agente' });
    if (insertError) {
      // Sin membresía la cuenta quedaría huérfana: se deshace la invitación.
      await client.auth.admin.deleteUser(invited.user.id);
      return fail(insertError.code === '23505' ? 'already_member' : 'server_error', insertError);
    }
    return json({ ok: true, status: 'invitado' });
  }

  // 4. Si el correo ya tiene cuenta: no se duplica ni se cambia de corredora.
  if (!isAlreadyRegistered(inviteError)) return fail('invite_failed', inviteError);

  let existingId: string | null = null;
  for (let page = 1; page <= MAX_USER_PAGES && !existingId; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) return fail('server_error', error);
    const users = data?.users ?? [];
    existingId = users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
    if (users.length < PAGE_SIZE) break;
  }
  if (!existingId) return fail('invite_failed', inviteError);

  const { data: member, error: memberError } = await client
    .from('memberships')
    .select('tenant_id')
    .eq('user_id', existingId)
    .limit(1)
    .maybeSingle();
  if (memberError) return fail('server_error', memberError);
  const memberTenant = (member as { tenant_id?: string } | null)?.tenant_id;
  if (memberTenant === tenantId) return json({ error: 'already_member' }, 409);
  if (memberTenant) return json({ error: 'other_tenant' }, 409);

  const { error: insertError } = await client
    .from('memberships')
    .insert({ tenant_id: tenantId, user_id: existingId, role: 'agente' });
  if (insertError) return fail(insertError.code === '23505' ? 'already_member' : 'server_error', insertError);
  return json({ ok: true, status: 'agregado' });
}
