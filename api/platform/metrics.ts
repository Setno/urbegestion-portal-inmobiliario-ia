// SaaS → ventas (ADR-009): ventas consulta números agregados por corredora. Nunca devuelve contenido de leads,
// propiedades ni notas. Se autoriza con un token (PLATFORM_METRICS_TOKEN, solo en el servidor).
import { createClient } from '@supabase/supabase-js';
import { CONTRACT_VERSION } from '../../src/core/platform/contract.js';
import { safeEqual } from '../../src/core/platform/syncProtocol.js';

declare const process: { env: Record<string, string | undefined> };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

interface MetricsRow {
  tenant_id: string;
  name: string;
  agents_count: number;
  properties_total: number;
  properties_published: number;
  leads_30d: number;
  leads_total: number;
  last_login_at: string | null;
  last_activity_at: string | null;
}

export async function GET(request: Request): Promise<Response> {
  const token = process.env.PLATFORM_METRICS_TOKEN;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !serviceKey) return json({ error: 'not_configured' }, 503);

  const sent = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!sent || !(await safeEqual(sent, token))) return json({ error: 'unauthorized' }, 401);

  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.rpc('platform_metrics');
  if (error) {
    console.warn('[api/platform/metrics] server_error:', error.code ?? error.message);
    return json({ error: 'server_error' }, 500);
  }

  const rows = (data ?? []) as MetricsRow[];
  return json({
    contractVersion: CONTRACT_VERSION,
    capturedAt: new Date().toISOString(),
    platform: {
      tenantsTotal: rows.length,
      appVersion: (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || null,
      health: 'ok',
    },
    tenants: rows.map((r) => ({
      tenantId: r.tenant_id,
      name: r.name,
      agentsCount: r.agents_count,
      propertiesTotal: r.properties_total,
      propertiesPublished: r.properties_published,
      leads30d: r.leads_30d,
      leadsTotal: r.leads_total,
      lastLoginAt: r.last_login_at,
      lastActivityAt: r.last_activity_at,
    })),
  });
}
