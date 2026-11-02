import { describe, it, expect } from 'vitest';
import { fetchEntitlements, rowToMessage } from './entitlementsService';
import { parseEntitlements, can, limitOf } from './contract';

describe('entitlementsService', () => {
  it('pasa la fila de la base al formato del contrato', () => {
    const e = parseEntitlements(
      rowToMessage({
        plan_code: 'completo',
        status: 'past_due',
        trial_ends_at: null,
        grace_ends_at: '2026-11-20T00:00:00Z',
        features: { 'ai.chat': false },
        limits: { 'limit.agents': 5 },
        contract_version: 1,
        source_updated_at: '2026-11-02T10:00:00Z',
      }),
    );
    expect(e.status).toBe('past_due');
    expect(e.graceEndsAt).toBe('2026-11-20T00:00:00Z');
    expect(can(e, 'ai.chat')).toBe(false);
    expect(limitOf(e, 'limit.agents')).toBe(5);
  });

  it('sin Supabase (también en pruebas) no hay derechos y el producto sigue completo', async () => {
    expect(await fetchEntitlements()).toBeNull();
  });
});
