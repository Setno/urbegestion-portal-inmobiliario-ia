import { remoteContext } from '../data/dataSource';

interface EntitlementsRow {
  plan_code: string | null;
  status: string;
  trial_ends_at: string | null;
  grace_ends_at: string | null;
  features: unknown;
  limits: unknown;
  contract_version: number;
  source_updated_at: string;
}

// Pasa la fila de la base al formato del contrato que lee parseEntitlements.
export const rowToMessage = (row: EntitlementsRow): Record<string, unknown> => ({
  contractVersion: row.contract_version,
  planCode: row.plan_code,
  status: row.status,
  trialEndsAt: row.trial_ends_at,
  graceEndsAt: row.grace_ends_at,
  features: row.features,
  limits: row.limits,
  updatedAt: row.source_updated_at,
});

// Los derechos de la corredora del sitio, tal como los dejó ventas. Sin Supabase, sin fila o ante un error devuelve null
// y el producto sigue con los valores por defecto (todo prendido): un fallo aquí nunca debe dejar a nadie sin servicio.
export async function fetchEntitlements(): Promise<Record<string, unknown> | null> {
  const ctx = remoteContext();
  if (!ctx) return null;
  try {
    const { data, error } = await ctx.client.from('tenant_entitlements').select('*').eq('tenant_id', ctx.tenantId).maybeSingle();
    if (error || !data) return null;
    return rowToMessage(data as EntitlementsRow);
  } catch (err) {
    console.warn('[platform] No se pudieron leer los derechos de la corredora:', err);
    return null;
  }
}
