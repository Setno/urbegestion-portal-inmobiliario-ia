// Auxiliar de las funciones de portales de solo previews: entrega un access_token vigente del administrador que llama.
// El guion bajo evita que Vercel lo publique como una función. Si el token estaba por vencer, se renueva y se guarda
// (el refresh_token anterior ya no sirve: perder esa escritura mata la conexión).
import type { SupabaseClient } from '@supabase/supabase-js';
import { requestTokens, tokenNeedsRefresh, type Credentials, type TokenFetcher } from '../../../../packages/portales/src/oauth.js';

const PORTAL = 'mercadolibre';

export type ConexionResult = { ok: true; accessToken: string } | { ok: false; status: number; error: 'not_admin' | 'not_connected' | 'reconnect' };

export async function accessTokenDelAdministrador(client: SupabaseClient, callerId: string, credentials: Credentials, fetcher: TokenFetcher): Promise<ConexionResult> {
  const { data: membership } = await client.from('memberships').select('tenant_id, role').eq('user_id', callerId).eq('role', 'admin').limit(1).maybeSingle();
  const tenantId = (membership as { tenant_id?: string } | null)?.tenant_id;
  if (!tenantId) return { ok: false, status: 403, error: 'not_admin' };

  const { data: row } = await client.from('portal_connections').select('access_token, refresh_token, expires_at').eq('tenant_id', tenantId).eq('portal', PORTAL).maybeSingle();
  const connection = row as { access_token: string; refresh_token: string; expires_at: string } | null;
  if (!connection) return { ok: false, status: 409, error: 'not_connected' };

  if (!tokenNeedsRefresh(connection.expires_at, new Date())) return { ok: true, accessToken: connection.access_token };

  const renewed = await requestTokens({ type: 'refresh', refreshToken: connection.refresh_token }, credentials, fetcher, new Date());
  if (!renewed.ok) return { ok: false, status: 409, error: 'reconnect' };
  const { error } = await client
    .from('portal_connections')
    .update({ access_token: renewed.tokens.accessToken, refresh_token: renewed.tokens.refreshToken, expires_at: renewed.tokens.expiresAt })
    .eq('tenant_id', tenantId)
    .eq('portal', PORTAL);
  if (error) console.warn('[api/portales] no se pudieron guardar los tokens renovados:', error.code ?? error.message);
  return { ok: true, accessToken: renewed.tokens.accessToken };
}
