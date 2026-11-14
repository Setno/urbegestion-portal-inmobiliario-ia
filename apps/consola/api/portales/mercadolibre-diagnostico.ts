// Diagnóstico de solo lectura de la conexión con Mercado Libre (H-068.3d). Solo previews y desarrollo; en producción responde 403.
import { createClient } from '@supabase/supabase-js';
import { diagnoseMercadoLibre } from '../../../../packages/portales/src/diagnostico.js';
import type { TokenFetcher } from '../../../../packages/portales/src/oauth.js';
import { createRateLimiter, clientKey, tooManyRequests } from '../_limiteTasa.js';
import { accessTokenDelAdministrador } from './_conexion.js';
import { redirectUriFor, validationAllowed } from './_comun.js';

declare const process: { env: Record<string, string | undefined> };

const limiter = createRateLimiter({ max: 10, windowMs: 600000 });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const fetcher: TokenFetcher = async (url, init) => {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
  return { ok: response.ok, status: response.status, json: () => response.json() };
};

export async function POST(request: Request): Promise<Response> {
  const wait = limiter.check(clientKey(request));
  if (wait > 0) return tooManyRequests(wait);
  if (!validationAllowed(process.env.VERCEL_ENV)) return json({ error: 'not_available' }, 403);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  if (!supabaseUrl || !serviceKey || !clientId || !clientSecret) return json({ error: 'not_configured' }, 503);

  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'unauthorized' }, 401);

  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: caller, error: callerError } = await client.auth.getUser(token);
  if (callerError || !caller?.user) return json({ error: 'unauthorized' }, 401);

  try {
    const conexion = await accessTokenDelAdministrador(client, caller.user.id, { clientId, clientSecret, redirectUri: redirectUriFor(request) }, fetcher);
    if (!conexion.ok) return json({ error: conexion.error }, conexion.status);

    let categoryId: string | undefined;
    try {
      const map: unknown = JSON.parse(process.env.ML_CATEGORY_MAP ?? '');
      const first = map && typeof map === 'object' ? Object.values(map as Record<string, unknown>).find((v) => typeof v === 'string') : undefined;
      categoryId = typeof first === 'string' ? first : undefined;
    } catch {
      categoryId = undefined;
    }

    const lines = await diagnoseMercadoLibre({ accessToken: conexion.accessToken, clientId, categoryId, fetcher });
    return json({ ok: true, lines });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.warn('[api/mercadolibre-diagnostico] error inesperado:', e.code ?? e.message ?? '');
    return json({ error: 'server_error' }, 500);
  }
}
