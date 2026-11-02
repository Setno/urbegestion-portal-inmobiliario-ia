import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFakeDb } from './fakeSupabase';

const db = vi.hoisted(() => ({ current: null as ReturnType<typeof import('./fakeSupabase').createFakeDb> | null }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => db.current!.client }));

import { GET } from './metrics';

const TOKEN = 'token-de-prueba';
const pedir = (token: string | null = TOKEN) =>
  GET(new Request('https://saas.test/api/platform/metrics', { headers: token ? { Authorization: `Bearer ${token}` } : {} }));

const fila = {
  tenant_id: 'a1a1a1a1-0000-4000-8000-0000000000a1',
  name: 'Corredora A',
  agents_count: 2,
  properties_total: 10,
  properties_published: 7,
  leads_30d: 4,
  leads_total: 25,
  last_login_at: '2026-11-01T08:00:00Z',
  last_activity_at: '2026-11-01T09:00:00Z',
};

describe('api/platform/metrics (SaaS → ventas)', () => {
  beforeEach(() => {
    vi.stubEnv('PLATFORM_METRICS_TOKEN', TOKEN);
    vi.stubEnv('SUPABASE_URL', 'https://supabase.test');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'f70bfa3197ae66d13f67d9d931ebc2dd17ad7698');
    db.current = createFakeDb({ rpc: { platform_metrics: [fila] } });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('sin token configurado responde "no configurado"', async () => {
    vi.stubEnv('PLATFORM_METRICS_TOKEN', '');
    expect((await pedir()).status).toBe(503);
  });

  it('rechaza sin token o con un token distinto', async () => {
    expect((await pedir(null)).status).toBe(401);
    expect((await pedir('otro')).status).toBe(401);
  });

  it('entrega solo cantidades y fechas por corredora, más el estado de la plataforma', async () => {
    const res = await pedir();
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const body = (await res.json()) as { contractVersion: number; platform: object; tenants: Array<Record<string, unknown>> };
    expect(body.contractVersion).toBe(1);
    expect(body.platform).toEqual({ tenantsTotal: 1, appVersion: 'f70bfa3', health: 'ok' });
    expect(body.tenants[0]).toEqual({
      tenantId: fila.tenant_id,
      name: 'Corredora A',
      agentsCount: 2,
      propertiesTotal: 10,
      propertiesPublished: 7,
      leads30d: 4,
      leadsTotal: 25,
      lastLoginAt: '2026-11-01T08:00:00Z',
      lastActivityAt: '2026-11-01T09:00:00Z',
    });
  });

  it('un error de la base responde 500 sin detalles', async () => {
    db.current!.failNext({ message: 'detalle interno' });
    const res = await pedir();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'server_error' });
  });
});
