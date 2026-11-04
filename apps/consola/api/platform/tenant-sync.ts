// Ventas → SaaS (ADR-009): ventas informa el plan, el estado y los derechos de una corredora.
// Llamada firmada (HMAC con PLATFORM_SYNC_SECRET), idempotente y en orden: un mensaje más antiguo que el ya aplicado se ignora.
import { createClient } from '@supabase/supabase-js';
import { MAX_BODY_BYTES, parseSyncMessage, verifySignature } from '../../../../packages/plataforma/src/syncProtocol.js';

import { createRateLimiter, clientKey, tooManyRequests } from '../_limiteTasa.js';
declare const process: { env: Record<string, string | undefined> };

// Límite por dirección IP (H-005): 60 llamadas cada minuto.
const limiter = createRateLimiter({ max: 60, windowMs: 60000 });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function fail(code: string, status: number, cause?: unknown): Response {
  const c = cause as { code?: string; status?: number; message?: string } | null | undefined;
  console.warn(`[api/platform/tenant-sync] ${code}:`, c?.code ?? c?.status ?? c?.message ?? '');
  return json({ error: code }, status);
}

export async function POST(request: Request): Promise<Response> {
  const wait = limiter.check(clientKey(request));
  if (wait > 0) return tooManyRequests(wait);
  const secret = process.env.PLATFORM_SYNC_SECRET;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !url || !serviceKey) return json({ error: 'not_configured' }, 503);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'too_large' }, 413);

  const check = await verifySignature(
    secret,
    request.headers.get('X-Timestamp'),
    request.headers.get('X-Signature'),
    raw,
  );
  if (check !== 'ok') return json({ error: check === 'expired' ? 'expired' : 'unauthorized' }, 401);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const parsed = parseSyncMessage(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const { tenantId: givenId, tenantRef, entitlements: e, sourceUpdatedAt } = parsed.message;

  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 1. ¿Qué corredora es? Por su id; si no, por la referencia que ventas ya vinculó.
  let tenantId = givenId;
  if (tenantId) {
    const { data, error } = await client.from('tenants').select('id').eq('id', tenantId).maybeSingle();
    if (error) return fail('server_error', 500, error);
    if (!data) return json({ error: 'tenant_not_found' }, 404);
  } else {
    const { data, error } = await client.from('tenant_entitlements').select('tenant_id').eq('tenant_ref', tenantRef).maybeSingle();
    if (error) return fail('server_error', 500, error);
    if (!data) return json({ error: 'tenant_not_found' }, 404);
    tenantId = (data as { tenant_id: string }).tenant_id;
  }

  const row = {
    tenant_ref: tenantRef,
    plan_code: e.planCode,
    status: e.status,
    trial_ends_at: e.trialEndsAt,
    grace_ends_at: e.graceEndsAt,
    features: e.features,
    limits: e.limits,
    contract_version: e.contractVersion,
    source_updated_at: sourceUpdatedAt,
    received_at: new Date().toISOString(),
  };

  // 2. Si ya hay derechos guardados, se actualizan solo si el mensaje no es más antiguo que el aplicado.
  const { data: updated, error: updateError } = await client
    .from('tenant_entitlements')
    .update(row)
    .eq('tenant_id', tenantId)
    .lte('source_updated_at', sourceUpdatedAt)
    .select('tenant_id');
  if (updateError) {
    return updateError.code === '23505' ? json({ error: 'tenant_ref_taken' }, 409) : fail('server_error', 500, updateError);
  }
  if (updated && updated.length > 0) return json({ ok: true, applied: true });

  const { data: existing, error: existingError } = await client
    .from('tenant_entitlements')
    .select('tenant_id')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (existingError) return fail('server_error', 500, existingError);
  if (existing) return json({ ok: true, applied: false, reason: 'stale' });

  // 3. Primera vez para esta corredora.
  const { error: insertError } = await client.from('tenant_entitlements').insert({ tenant_id: tenantId, ...row });
  if (insertError) {
    if (insertError.code === '23505') {
      // Otro mensaje llegó primero (misma corredora) o la referencia ya pertenece a otra corredora
      const { data: again } = await client.from('tenant_entitlements').select('tenant_id').eq('tenant_id', tenantId).maybeSingle();
      return again ? json({ ok: true, applied: false, reason: 'stale' }) : json({ error: 'tenant_ref_taken' }, 409);
    }
    return fail('server_error', 500, insertError);
  }
  return json({ ok: true, applied: true });
}
