// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../api/lead-webhook';

const URL_WEBHOOK = 'https://hooks.ejemplo.test/secreto-123';

const pedido = (body: string) =>
  new Request('http://localhost/api/lead-webhook', { method: 'POST', body });

describe('api/lead-webhook', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv('GHL_WEBHOOK_URL', URL_WEBHOOK);
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('GET', () => {
    it('informa que está configurado sin exponer la URL', async () => {
      const res = await GET();
      const cuerpo = await res.json();
      expect(cuerpo).toEqual({ configured: true });
      expect(JSON.stringify(cuerpo)).not.toContain('secreto-123');
    });

    it('informa que no está configurado si falta la URL', async () => {
      vi.stubEnv('GHL_WEBHOOK_URL', '');
      const res = await GET();
      expect(await res.json()).toEqual({ configured: false });
    });
  });

  describe('POST', () => {
    it('responde 503 si no hay URL de webhook', async () => {
      vi.stubEnv('GHL_WEBHOOK_URL', '');
      const res = await POST(pedido('{"a":1}'));
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: 'webhook_not_configured' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('responde 400 si el cuerpo está vacío', async () => {
      const res = await POST(pedido(''));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'invalid_payload' });
    });

    it('responde 400 si el cuerpo supera los 100.000 caracteres', async () => {
      const res = await POST(pedido(JSON.stringify({ x: 'a'.repeat(100_000) })));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'invalid_payload' });
    });

    it('responde 400 si el cuerpo no es JSON', async () => {
      const res = await POST(pedido('no es json'));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'invalid_json' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('reenvía el cuerpo tal cual a la URL configurada', async () => {
      fetchMock.mockResolvedValue(new Response('ok', { status: 200 }));
      const cuerpo = '{"nombre":"Ana","email":"ana@ejemplo.test"}';
      const res = await POST(pedido(cuerpo));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(URL_WEBHOOK);
      expect(init.method).toBe('POST');
      expect(init.body).toBe(cuerpo);
    });

    it('responde 502 si el destino rechaza el envío', async () => {
      fetchMock.mockResolvedValue(new Response('mal', { status: 500 }));
      const res = await POST(pedido('{"a":1}'));
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ ok: false });
    });

    it('responde 504 si el destino no responde', async () => {
      fetchMock.mockRejectedValue(new Error('red caída'));
      const res = await POST(pedido('{"a":1}'));
      expect(res.status).toBe(504);
      expect(await res.json()).toEqual({ error: 'webhook_unreachable' });
    });
  });
});
