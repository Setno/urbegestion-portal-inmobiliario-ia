// Paso 2 de conectar Mercado Libre (H-068.2): Mercado Libre vuelve aquí con un código. Se verifica el estado firmado, se
// canjea el código por los tokens y se guardan en la tabla solo del servidor. Luego se devuelve al administrador al panel.
import { createClient } from '@supabase/supabase-js';
import { requestTokens, verifyState, type TokenFetcher } from '../../../../packages/portales/src/oauth.js';
import { createRateLimiter, clientKey, tooManyRequests } from '../_limiteTasa.js';
import { redirectUriFor } from './_comun.js';

declare const process: { env: Record<string, string | undefined> };

const limiter = createRateLimiter({ max: 30, windowMs: 600000 });

const fetcher: TokenFetcher = async (url, init) => {
  // Sin respuesta de Mercado Libre en 10 segundos se corta (requestTokens lo trata como caída de red).
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
  return { ok: response.ok, status: response.status, json: () => response.json() };
};

// Vuelve al panel con un resultado en la dirección; el panel lo muestra y lo borra. Nunca incluye datos sensibles.
const backToPanel = (request: Request, result: string): Response => {
  const base = (process.env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, '');
  return new Response(null, { status: 302, headers: { Location: `${base}/?portales=${result}`, 'Cache-Control': 'no-store' } });
};

export async function GET(request: Request): Promise<Response> {
  const wait = limiter.check(clientKey(request));
  if (wait > 0) return tooManyRequests(wait);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  const stateSecret = process.env.PORTALES_STATE_SECRET;
  if (!supabaseUrl || !serviceKey || !clientId || !clientSecret || !stateSecret) return backToPanel(request, 'ml-no-configurado');

  const params = new URL(request.url).searchParams;
  if (params.get('error')) return backToPanel(request, 'ml-cancelado'); // el administrador no autorizó
  const code = params.get('code') ?? '';
  const state = await verifyState(params.get('state') ?? '', stateSecret);
  if (!code || !state) return backToPanel(request, 'ml-error');

  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // Quien pidió conectar debe seguir siendo administrador de esa corredora.
  const { data: member, error: memberError } = await client
    .from('memberships')
    .select('role')
    .eq('tenant_id', state.tenantId)
    .eq('user_id', state.userId)
    .maybeSingle();
  if (memberError || (member as { role?: string } | null)?.role !== 'admin') return backToPanel(request, 'ml-error');

  const result = await requestTokens(
    { type: 'code', code },
    { clientId, clientSecret, redirectUri: redirectUriFor(request) },
    fetcher,
  );
  if (!result.ok) {
    console.warn('[api/mercadolibre-retorno] no se pudo canjear el código:', result.reason);
    return backToPanel(request, 'ml-error');
  }

  const { error } = await client.from('portal_connections').upsert(
    {
      tenant_id: state.tenantId,
      portal: 'mercadolibre',
      account_id: result.tokens.accountId,
      access_token: result.tokens.accessToken,
      refresh_token: result.tokens.refreshToken,
      expires_at: result.tokens.expiresAt,
      connected_at: new Date().toISOString(),
      connected_by: state.userId,
      last_error: null,
    },
    { onConflict: 'tenant_id,portal' },
  );
  if (error) {
    console.warn('[api/mercadolibre-retorno] no se pudo guardar la conexión:', error.code ?? error.message);
    return backToPanel(request, 'ml-error');
  }
  return backToPanel(request, 'ml-ok');
}
