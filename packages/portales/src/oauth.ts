// Conexión de la cuenta de Mercado Libre por OAuth (H-068.2). Código puro: la red entra por un `fetcher` y el reloj por `now`,
// así se prueba sin llamar a nadie. Los secretos (clave de la app, secreto del estado) los pasa el servidor; nunca viven aquí.
// Pendiente de confirmar con la app real: la dirección de autorización de Chile (auth.mercadolibre.cl).

const AUTH_URL = 'https://auth.mercadolibre.cl/authorization';
const TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
const STATE_TTL_MS = 10 * 60_000;
const REFRESH_MARGIN_MS = 5 * 60_000;

export interface StateData {
  tenantId: string;
  userId: string;
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO
  accountId: string;
}

export function buildAuthorizationUrl(p: { clientId: string; redirectUri: string; state: string }): string {
  const url = new URL(AUTH_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', p.clientId);
  url.searchParams.set('redirect_uri', p.redirectUri);
  url.searchParams.set('state', p.state);
  return url.toString();
}

// ---- Estado firmado: ata la vuelta de Mercado Libre a la corredora y al usuario que la pidió, y vence a los 10 minutos.

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  try {
    const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4);
    return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

const hmacKey = (secret: string, usage: 'sign' | 'verify') =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);

export async function signState(data: StateData, secret: string, now: Date = new Date()): Promise<string> {
  if (!secret) throw new Error('Falta el secreto para firmar el estado');
  const body = toBase64Url(encoder.encode(JSON.stringify({ ...data, exp: now.getTime() + STATE_TTL_MS })));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret, 'sign'), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

// Los datos del estado, o null si la firma no cuadra, está adulterado o venció.
export async function verifyState(state: string, secret: string, now: Date = new Date()): Promise<StateData | null> {
  if (!secret) return null;
  const parts = state.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [body, signature] = parts;
  const signatureBytes = fromBase64Url(signature);
  if (!signatureBytes) return null;
  try {
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret, 'verify'), signatureBytes, encoder.encode(body));
    if (!valid) return null;
    const bytes = fromBase64Url(body);
    if (!bytes) return null;
    const data = JSON.parse(new TextDecoder().decode(bytes)) as Partial<StateData> & { exp?: unknown };
    if (typeof data.tenantId !== 'string' || typeof data.userId !== 'string' || typeof data.exp !== 'number') return null;
    if (now.getTime() > data.exp) return null;
    return { tenantId: data.tenantId, userId: data.userId };
  } catch {
    return null;
  }
}

// ---- Tokens

export function parseTokenResponse(json: unknown, now: Date = new Date()): TokenSet | null {
  if (!json || typeof json !== 'object') return null;
  const j = json as Record<string, unknown>;
  const accountId = typeof j.user_id === 'number' || typeof j.user_id === 'string' ? String(j.user_id) : '';
  if (typeof j.access_token !== 'string' || !j.access_token) return null;
  if (typeof j.refresh_token !== 'string' || !j.refresh_token) return null;
  if (typeof j.expires_in !== 'number' || !Number.isFinite(j.expires_in) || j.expires_in <= 0) return null;
  if (!accountId) return null;
  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token,
    expiresAt: new Date(now.getTime() + j.expires_in * 1000).toISOString(),
    accountId,
  };
}

export type TokenFetcher = (
  url: string,
  init: { method: 'POST'; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export interface Credentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export type TokenResult = { ok: true; tokens: TokenSet } | { ok: false; reason: 'rechazado' | 'respuesta' | 'red' };

// Canjea el código de autorización o renueva con el refresh_token. El motivo del fallo nunca incluye secretos.
export async function requestTokens(
  grant: { type: 'code'; code: string } | { type: 'refresh'; refreshToken: string },
  credentials: Credentials,
  fetcher: TokenFetcher,
  now: Date = new Date(),
): Promise<TokenResult> {
  const form = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    ...(grant.type === 'code'
      ? { grant_type: 'authorization_code', code: grant.code, redirect_uri: credentials.redirectUri }
      : { grant_type: 'refresh_token', refresh_token: grant.refreshToken }),
  });
  try {
    const response = await fetcher(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: form.toString(),
    });
    if (!response.ok) return { ok: false, reason: 'rechazado' };
    const tokens = parseTokenResponse(await response.json(), now);
    return tokens ? { ok: true, tokens } : { ok: false, reason: 'respuesta' };
  } catch {
    return { ok: false, reason: 'red' };
  }
}

// Mercado Libre entrega el access_token por unas 6 horas; se renueva con margen. Una fecha ilegible cuenta como vencida.
export function tokenNeedsRefresh(expiresAt: string, now: Date = new Date(), marginMs: number = REFRESH_MARGIN_MS): boolean {
  const t = Date.parse(expiresAt);
  return !Number.isFinite(t) || t - now.getTime() < marginMs;
}
