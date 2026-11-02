// Protocolo de la llamada firmada que el proyecto de ventas hace al SaaS (ADR-009).
// Lo usan api/platform/tenant-sync.ts y sus pruebas; vive en src para poder probarlo con Vitest.
// Firma: HMAC-SHA256 en hexadecimal de "<marca de tiempo>.<cuerpo exacto>", con el secreto compartido
// (PLATFORM_SYNC_SECRET, solo en el servidor). La marca de tiempo caduca a los 5 minutos para frenar repeticiones.
import { parseEntitlements, type TenantEntitlements } from './contract';

export const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;
export const MAX_BODY_BYTES = 64 * 1024;

const encoder = new TextEncoder();
const toHex = (bytes: ArrayBuffer): string =>
  Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

// Firma que ventas debe enviar en el encabezado X-Signature (formato "sha256=<hex>").
export async function signPayload(secret: string, timestamp: string, body: string): Promise<string> {
  return `sha256=${await hmacHex(secret, `${timestamp}.${body}`)}`;
}

// Compara dos textos sin que el tiempo de respuesta delate cuánto coinciden.
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export type SignatureCheck = 'ok' | 'missing' | 'expired' | 'invalid';

export async function verifySignature(
  secret: string,
  timestamp: string | null,
  signature: string | null,
  body: string,
  now: number = Date.now(),
): Promise<SignatureCheck> {
  if (!timestamp || !signature) return 'missing';
  // La marca de tiempo viaja en milisegundos desde 1970
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(now - sentAt) > SIGNATURE_MAX_AGE_MS) return 'expired';
  return (await safeEqual(signature, await signPayload(secret, timestamp, body))) ? 'ok' : 'invalid';
}

export interface SyncMessage {
  // La corredora se identifica por su id en el SaaS o por la referencia que ventas ya vinculó antes
  tenantId: string | null;
  tenantRef: string | null;
  entitlements: TenantEntitlements;
  // Fecha del mensaje de ventas (obligatoria: define el orden)
  sourceUpdatedAt: string;
}

export type SyncParse = { ok: true; message: SyncMessage } | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseSyncMessage(raw: unknown): SyncParse {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: 'invalid_body' };
  const body = raw as Record<string, unknown>;

  const tenantId = typeof body.tenantId === 'string' && body.tenantId ? body.tenantId : null;
  if (tenantId && !UUID_RE.test(tenantId)) return { ok: false, error: 'invalid_tenant_id' };
  const tenantRef = typeof body.tenantRef === 'string' && body.tenantRef.trim() ? body.tenantRef.trim().slice(0, 120) : null;
  if (!tenantId && !tenantRef) return { ok: false, error: 'tenant_required' };

  const updatedAt = typeof body.updatedAt === 'string' && !Number.isNaN(Date.parse(body.updatedAt)) ? body.updatedAt : null;
  if (!updatedAt) return { ok: false, error: 'updated_at_required' };

  // Se reutiliza el lector tolerante: ignora claves desconocidas y descarta valores de tipo incorrecto
  return { ok: true, message: { tenantId, tenantRef, entitlements: parseEntitlements(body), sourceUpdatedAt: updatedAt } };
}
