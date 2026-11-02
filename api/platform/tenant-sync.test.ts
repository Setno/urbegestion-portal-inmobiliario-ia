import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signPayload } from '../../src/core/platform/syncProtocol';
import { createFakeDb } from './fakeSupabase';

const db = vi.hoisted(() => ({ current: null as ReturnType<typeof import('./fakeSupabase').createFakeDb> | null }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => db.current!.client }));

import { POST } from './tenant-sync';

const SECRET = 'secreto-de-prueba';
const TENANT_A = 'a1a1a1a1-0000-4000-8000-0000000000a1';
const TENANT_B = 'b2b2b2b2-0000-4000-8000-0000000000b2';

async function llamar(body: unknown, opts: { secret?: string; timestamp?: number; sign?: boolean } = {}) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  const ts = String(opts.timestamp ?? Date.now());
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (opts.sign !== false) {
    headers.set('X-Timestamp', ts);
    headers.set('X-Signature', await signPayload(opts.secret ?? SECRET, ts, raw));
  }
  return POST(new Request('https://saas.test/api/platform/tenant-sync', { method: 'POST', headers, body: raw }));
}

const mensaje = (extra: object = {}) => ({
  tenantId: TENANT_A,
  tenantRef: 'ventas-A',
  planCode: 'completo',
  status: 'active',
  features: { 'ai.chat': false },
  limits: { 'limit.agents': 3 },
  updatedAt: '2026-11-02T10:00:00Z',
  ...extra,
});

describe('api/platform/tenant-sync (ventas → SaaS)', () => {
  beforeEach(() => {
    vi.stubEnv('PLATFORM_SYNC_SECRET', SECRET);
    vi.stubEnv('SUPABASE_URL', 'https://supabase.test');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    db.current = createFakeDb({ tenants: [{ id: TENANT_A }, { id: TENANT_B }] });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('sin secreto configurado responde "no configurado"', async () => {
    vi.stubEnv('PLATFORM_SYNC_SECRET', '');
    expect((await llamar(mensaje())).status).toBe(503);
  });

  it('rechaza una llamada sin firma, con firma de otro secreto o caducada', async () => {
    expect((await llamar(mensaje(), { sign: false })).status).toBe(401);
    expect((await llamar(mensaje(), { secret: 'otro-secreto' })).status).toBe(401);
    const vieja = await llamar(mensaje(), { timestamp: Date.now() - 10 * 60 * 1000 });
    expect(vieja.status).toBe(401);
    expect(((await vieja.json()) as { error: string }).error).toBe('expired');
    expect(db.current!.tables.tenant_entitlements).toHaveLength(0);
  });

  it('rechaza un cuerpo alterado después de firmar', async () => {
    const raw = JSON.stringify(mensaje());
    const ts = String(Date.now());
    const firma = await signPayload(SECRET, ts, raw);
    const res = await POST(
      new Request('https://saas.test/x', {
        method: 'POST',
        headers: { 'X-Timestamp': ts, 'X-Signature': firma },
        body: raw.replace('"completo"', '"gratis"'),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('valida el cuerpo: JSON, corredora y fecha obligatorias', async () => {
    expect((await llamar('no es json')).status).toBe(400);
    expect(((await (await llamar(mensaje({ tenantId: undefined, tenantRef: undefined }))).json()) as { error: string }).error).toBe('tenant_required');
    expect(((await (await llamar(mensaje({ updatedAt: undefined }))).json()) as { error: string }).error).toBe('updated_at_required');
    expect(((await (await llamar(mensaje({ tenantId: 'no-es-uuid' }))).json()) as { error: string }).error).toBe('invalid_tenant_id');
  });

  it('una corredora que no existe da 404', async () => {
    const res = await llamar(mensaje({ tenantId: 'c3c3c3c3-0000-4000-8000-0000000000c3' }));
    expect(res.status).toBe(404);
  });

  it('el primer mensaje guarda plan, estado, funciones y cupos', async () => {
    const res = await llamar(mensaje());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, applied: true });
    expect(db.current!.tables.tenant_entitlements[0]).toMatchObject({
      tenant_id: TENANT_A,
      tenant_ref: 'ventas-A',
      plan_code: 'completo',
      status: 'active',
      features: { 'ai.chat': false },
      limits: { 'limit.agents': 3 },
      source_updated_at: '2026-11-02T10:00:00Z',
    });
  });

  it('repetir el mismo mensaje deja el mismo resultado (idempotente)', async () => {
    await llamar(mensaje());
    const antes = JSON.stringify(db.current!.tables.tenant_entitlements.map((r) => ({ ...r, received_at: 0 })));
    const res = await llamar(mensaje());
    expect(res.status).toBe(200);
    expect(db.current!.tables.tenant_entitlements).toHaveLength(1);
    expect(JSON.stringify(db.current!.tables.tenant_entitlements.map((r) => ({ ...r, received_at: 0 })))).toBe(antes);
  });

  it('un mensaje más nuevo actualiza; uno más antiguo se ignora', async () => {
    await llamar(mensaje());
    const nuevo = await llamar(mensaje({ status: 'past_due', updatedAt: '2026-11-03T10:00:00Z' }));
    expect(await nuevo.json()).toEqual({ ok: true, applied: true });
    expect(db.current!.tables.tenant_entitlements[0].status).toBe('past_due');

    const viejo = await llamar(mensaje({ status: 'active', updatedAt: '2026-11-01T10:00:00Z' }));
    expect(await viejo.json()).toEqual({ ok: true, applied: false, reason: 'stale' });
    expect(db.current!.tables.tenant_entitlements[0].status).toBe('past_due');
  });

  it('una vez vinculada la referencia, ventas puede escribir solo con ella', async () => {
    await llamar(mensaje());
    const res = await llamar({ tenantRef: 'ventas-A', status: 'suspended', updatedAt: '2026-11-04T10:00:00Z' });
    expect(res.status).toBe(200);
    expect(db.current!.tables.tenant_entitlements[0].status).toBe('suspended');
    expect((await llamar({ tenantRef: 'desconocida', updatedAt: '2026-11-04T10:00:00Z' })).status).toBe(404);
  });

  it('una referencia que ya pertenece a otra corredora da 409 y no cambia nada', async () => {
    await llamar(mensaje());
    const res = await llamar(mensaje({ tenantId: TENANT_B, tenantRef: 'ventas-A' }));
    expect(res.status).toBe(409);
    expect(db.current!.tables.tenant_entitlements).toHaveLength(1);
  });

  it('las claves desconocidas viajan y se guardan sin romper (se pueden agregar variables)', async () => {
    await llamar(mensaje({ features: { 'futuro.algo': true }, limits: { 'limit.futuro': 9 } }));
    expect(db.current!.tables.tenant_entitlements[0]).toMatchObject({ features: { 'futuro.algo': true }, limits: { 'limit.futuro': 9 } });
  });

  it('un error de la base responde 500 sin detalles', async () => {
    db.current!.failNext({ message: 'boom con datos internos' });
    const res = await llamar(mensaje());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'server_error' });
  });
});
