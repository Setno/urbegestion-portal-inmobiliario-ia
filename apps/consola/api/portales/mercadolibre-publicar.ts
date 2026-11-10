// Publicar una propiedad aprobada en Mercado Libre / Portal Inmobiliario (H-068.3).
// Toda la lógica está en packages/portales (probada); aquí solo se arman la base (clave de servicio) y la red.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publishProperty, type PropertyRow } from '../../../../packages/portales/src/publicarPropiedad.js';
import type { TokenFetcher, TokenSet } from '../../../../packages/portales/src/oauth.js';
import { parseMindicador } from '../../../../packages/mercados/src/cl/rates.js';
import { createRateLimiter, clientKey, tooManyRequests } from '../_limiteTasa.js';
import { redirectUriFor } from './_comun.js';

declare const process: { env: Record<string, string | undefined> };

// Publicar es una acción cara y visible hacia afuera: 10 llamadas cada 10 minutos por dirección IP.
const limiter = createRateLimiter({ max: 10, windowMs: 600000 });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PORTAL = 'mercadolibre';
// Una reserva 'pendiente' más vieja que esto se da por abandonada (la función se cortó o hubo un fallo dudoso). Igual en el panel.
const STALE_CLAIM_MS = 10 * 60_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const fetcher: TokenFetcher = async (url, init) => {
  // Sin respuesta de Mercado Libre en 20 segundos se corta (se informa como caída de red).
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
  return { ok: response.ok, status: response.status, json: () => response.json() };
};

// Categorías de Mercado Libre por "operación:tipo", por ejemplo {"venta:departamento":"MLC..."} (ver docs/guia-portales.md).
function readCategories(): Record<string, string> | null {
  try {
    const parsed: unknown = JSON.parse(process.env.ML_CATEGORY_MAP ?? '');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const entries = Object.entries(parsed).filter(([, v]) => typeof v === 'string' && v.trim());
    return entries.length > 0 ? (Object.fromEntries(entries) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

// La UF del día (Banco Central vía mindicador.cl). Si no responde, queda sin tasa y el aviso explica que falta; no se inventa.
async function getRates(currency: string): Promise<Record<string, number>> {
  if (currency !== 'UF') return {};
  try {
    const response = await fetch('https://mindicador.cl/api/uf', { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return {};
    const reading = parseMindicador(await response.json(), new Date());
    return reading ? { UF: reading.value } : {};
  } catch {
    return {};
  }
}

function buildDeps(client: SupabaseClient, callerId: string, credentials: { clientId: string; clientSecret: string; redirectUri: string }, categories: Record<string, string>) {
  const must = <T>(result: { data: T; error: { code?: string; message?: string } | null }): T => {
    if (result.error) throw Object.assign(new Error(result.error.message ?? 'error de base'), { code: result.error.code });
    return result.data;
  };

  return {
    loadProperty: async (id: string) => must(await client.from('properties').select('*').eq('id', id).maybeSingle()) as PropertyRow | null,

    isAdminOf: async (tenantId: string) => {
      const row = must(await client.from('memberships').select('role').eq('tenant_id', tenantId).eq('user_id', callerId).maybeSingle());
      return (row as { role?: string } | null)?.role === 'admin';
    },

    loadConnection: async (tenantId: string) => {
      const row = must(
        await client.from('portal_connections').select('access_token, refresh_token, expires_at').eq('tenant_id', tenantId).eq('portal', PORTAL).maybeSingle(),
      ) as { access_token: string; refresh_token: string; expires_at: string } | null;
      return row ? { accessToken: row.access_token, refreshToken: row.refresh_token, expiresAt: row.expires_at } : null;
    },

    // Reserva el cupo con una fila "pendiente": la clave primaria impide que dos clics publiquen dos avisos.
    claim: async (propertyId: string, tenantId: string): Promise<'ok' | 'existe' | 'en_curso'> => {
      for (let attempt = 0; attempt < 2; attempt++) {
        const { error } = await client
          .from('portal_listings')
          .insert({ property_id: propertyId, portal: PORTAL, tenant_id: tenantId, external_id: 'pendiente', status: 'activa' });
        if (!error) return 'ok';
        if (error.code !== '23505') throw Object.assign(new Error(error.message), { code: error.code });
        const existing = must(
          await client.from('portal_listings').select('external_id, updated_at').eq('property_id', propertyId).eq('portal', PORTAL).maybeSingle(),
        ) as { external_id: string; updated_at: string } | null;
        if (!existing) continue; // se liberó entre medio: se reintenta
        if (existing.external_id !== 'pendiente') return 'existe';
        if (Date.now() - Date.parse(existing.updated_at) < STALE_CLAIM_MS) return 'en_curso';
        // Una reserva vieja: se limpia solo si SIGUE siendo vieja (otra solicitud pudo haberla renovado entre medio) y se reintenta.
        must(
          await client
            .from('portal_listings')
            .delete()
            .eq('property_id', propertyId)
            .eq('portal', PORTAL)
            .eq('external_id', 'pendiente')
            .lt('updated_at', new Date(Date.now() - STALE_CLAIM_MS).toISOString()),
        );
      }
      return 'en_curso';
    },

    release: async (propertyId: string) => {
      await client.from('portal_listings').delete().eq('property_id', propertyId).eq('portal', PORTAL).eq('external_id', 'pendiente');
    },

    // El refresh_token es de un solo uso: perder esta escritura mata la conexión, así que se reintenta una vez.
    saveTokens: async (tenantId: string, tokens: TokenSet) => {
      for (let attempt = 0; attempt < 2; attempt++) {
        const { data, error } = await client
          .from('portal_connections')
          .update({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken, expires_at: tokens.expiresAt })
          .eq('tenant_id', tenantId)
          .eq('portal', PORTAL)
          .select('tenant_id');
        if (!error && (data ?? []).length === 1) return true;
        console.warn('[api/mercadolibre-publicar] no se pudieron guardar los tokens renovados:', error?.code ?? error?.message ?? 'sin filas');
      }
      return false;
    },

    markUncertain: async (propertyId: string, message: string) => {
      const { error } = await client
        .from('portal_listings')
        .update({ last_error: message, updated_at: new Date().toISOString() })
        .eq('property_id', propertyId)
        .eq('portal', PORTAL)
        .eq('external_id', 'pendiente');
      if (error) console.warn('[api/mercadolibre-publicar] no se pudo anotar el aviso dudoso:', error.code ?? error.message);
    },

    // upsert: aunque la reserva se hubiera perdido (limpieza o carrera), el aviso publicado queda registrado.
    saveListing: async (propertyId: string, tenantId: string, listing: { externalId: string; permalink: string | null; status: string }) => {
      const { error } = await client.from('portal_listings').upsert(
        {
          property_id: propertyId,
          portal: PORTAL,
          tenant_id: tenantId,
          external_id: listing.externalId,
          permalink: listing.permalink,
          status: listing.status === 'paused' ? 'pausada' : listing.status === 'closed' ? 'cerrada' : 'activa',
          last_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'property_id,portal' },
      );
      if (error) console.warn('[api/mercadolibre-publicar] no se pudo guardar el aviso:', error.code ?? error.message);
      return !error;
    },

    getRates,
    fetcher,
    credentials,
    categories,
  };
}

export async function POST(request: Request): Promise<Response> {
  const wait = limiter.check(clientKey(request));
  if (wait > 0) return tooManyRequests(wait);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  const categories = readCategories();
  if (!supabaseUrl || !serviceKey || !clientId || !clientSecret || !categories) return json({ error: 'not_configured' }, 503);

  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'unauthorized' }, 401);

  let propertyId: string;
  try {
    const body = (await request.json()) as { propertyId?: unknown };
    propertyId = typeof body.propertyId === 'string' ? body.propertyId.trim() : '';
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (!UUID_RE.test(propertyId)) return json({ error: 'invalid_property' }, 400);

  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: caller, error: callerError } = await client.auth.getUser(token);
  if (callerError || !caller?.user) return json({ error: 'unauthorized' }, 401);

  try {
    const result = await publishProperty(
      propertyId,
      buildDeps(client, caller.user.id, { clientId, clientSecret, redirectUri: redirectUriFor(request) }, categories),
    );
    return json(result.body, result.status);
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.warn('[api/mercadolibre-publicar] error inesperado:', e.code ?? e.message ?? '');
    return json({ error: 'server_error' }, 500);
  }
}
