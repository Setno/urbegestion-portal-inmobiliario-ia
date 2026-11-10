// Paso 1 de conectar Mercado Libre (H-068.2): el administrador pide la dirección de autorización.
// Devuelve { url } con un estado firmado que ata la vuelta a su corredora. Las claves viven solo en el servidor.
import { createClient } from '@supabase/supabase-js';
import { buildAuthorizationUrl, signState } from '../../../../packages/portales/src/oauth.js';
import { createRateLimiter, clientKey, tooManyRequests } from '../_limiteTasa.js';
import { redirectUriFor } from './_comun.js';

declare const process: { env: Record<string, string | undefined> };

// Límite por dirección IP: 20 llamadas cada 10 minutos.
const limiter = createRateLimiter({ max: 20, windowMs: 600000 });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function POST(request: Request): Promise<Response> {
  const wait = limiter.check(clientKey(request));
  if (wait > 0) return tooManyRequests(wait);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const clientId = process.env.ML_CLIENT_ID;
  const stateSecret = process.env.PORTALES_STATE_SECRET;
  if (!supabaseUrl || !serviceKey || !clientId || !stateSecret) return json({ error: 'not_configured' }, 503);

  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'unauthorized' }, 401);

  let requestedTenant: string;
  try {
    const body = (await request.json()) as { tenantId?: unknown };
    requestedTenant = typeof body.tenantId === 'string' ? body.tenantId.trim() : '';
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (!requestedTenant) return json({ error: 'invalid_json' }, 400);

  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: caller, error: callerError } = await client.auth.getUser(token);
  if (callerError || !caller?.user) return json({ error: 'unauthorized' }, 401);

  // Solo un administrador conecta la cuenta, y de la corredora que está mirando en el panel (no de otra suya).
  const { data: adminRow, error: adminError } = await client
    .from('memberships')
    .select('tenant_id')
    .eq('user_id', caller.user.id)
    .eq('tenant_id', requestedTenant)
    .eq('role', 'admin')
    .maybeSingle();
  if (adminError) {
    console.warn('[api/mercadolibre-conectar] no se pudo leer la membresía:', adminError.code ?? adminError.message);
    return json({ error: 'server_error' }, 500);
  }
  const tenantId = (adminRow as { tenant_id?: string } | null)?.tenant_id;
  if (!tenantId) return json({ error: 'not_admin' }, 403);

  const state = await signState({ tenantId, userId: caller.user.id }, stateSecret);
  return json({ url: buildAuthorizationUrl({ clientId, redirectUri: redirectUriFor(request), state }) });
}
