import { describe, it, expect } from 'vitest';
import { SIGNATURE_MAX_AGE_MS, parseSyncMessage, safeEqual, signPayload, verifySignature } from './syncProtocol';

const SECRET = 'secreto';
const BODY = '{"tenantRef":"ventas-A"}';
const NOW = 1_800_000_000_000;

describe('syncProtocol (firma y lectura del mensaje de ventas)', () => {
  it('una firma correcta y reciente es válida', async () => {
    const ts = String(NOW - 1000);
    expect(await verifySignature(SECRET, ts, await signPayload(SECRET, ts, BODY), BODY, NOW)).toBe('ok');
  });

  it('la firma depende del secreto, de la marca de tiempo y del cuerpo', async () => {
    const ts = String(NOW);
    const firma = await signPayload(SECRET, ts, BODY);
    expect(await verifySignature('otro', ts, firma, BODY, NOW)).toBe('invalid');
    expect(await verifySignature(SECRET, String(NOW + 1), firma, BODY, NOW)).toBe('invalid');
    expect(await verifySignature(SECRET, ts, firma, BODY + ' ', NOW)).toBe('invalid');
  });

  it('falta de encabezados o marca de tiempo mala o fuera de plazo', async () => {
    expect(await verifySignature(SECRET, null, 'x', BODY, NOW)).toBe('missing');
    expect(await verifySignature(SECRET, String(NOW), null, BODY, NOW)).toBe('missing');
    expect(await verifySignature(SECRET, 'ayer', 'x', BODY, NOW)).toBe('expired');
    const viejo = String(NOW - SIGNATURE_MAX_AGE_MS - 1);
    expect(await verifySignature(SECRET, viejo, await signPayload(SECRET, viejo, BODY), BODY, NOW)).toBe('expired');
  });

  it('safeEqual compara textos', async () => {
    expect(await safeEqual('abc', 'abc')).toBe(true);
    expect(await safeEqual('abc', 'abd')).toBe(false);
    expect(await safeEqual('abc', 'abcd')).toBe(false);
  });

  it('parseSyncMessage pide corredora y fecha, y reutiliza el lector tolerante', () => {
    expect(parseSyncMessage(null)).toEqual({ ok: false, error: 'invalid_body' });
    expect(parseSyncMessage({ updatedAt: '2026-11-01T00:00:00Z' })).toEqual({ ok: false, error: 'tenant_required' });
    expect(parseSyncMessage({ tenantRef: 'x' })).toEqual({ ok: false, error: 'updated_at_required' });
    const r = parseSyncMessage({ tenantRef: ' ventas-A ', updatedAt: '2026-11-01T00:00:00Z', status: 'trial', features: { 'ai.chat': false, raro: 'si' } });
    expect(r.ok && r.message.tenantRef).toBe('ventas-A');
    expect(r.ok && r.message.entitlements.status).toBe('trial');
    expect(r.ok && r.message.entitlements.features).toEqual({ 'ai.chat': false });
  });
});
