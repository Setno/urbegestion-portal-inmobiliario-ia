// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRateLimiter, clientKey } from '../../api/_limiteTasa';
import { POST as chat } from '../../api/chat';
import { POST as leadWebhook } from '../../api/lead-webhook';

describe('límite de llamadas por IP (H-005)', () => {
  it('deja pasar hasta el máximo y avisa cuántos segundos esperar después', () => {
    const l = createRateLimiter({ max: 3, windowMs: 60_000 });
    expect([l.check('ip', 0), l.check('ip', 1000), l.check('ip', 2000)]).toEqual([0, 0, 0]);
    expect(l.check('ip', 3000)).toBe(57); // la primera llamada vence a los 60 s
  });
  it('vuelve a dejar pasar cuando termina la ventana', () => {
    const l = createRateLimiter({ max: 1, windowMs: 1000 });
    l.check('ip', 0);
    expect(l.check('ip', 500)).toBeGreaterThan(0);
    expect(l.check('ip', 1500)).toBe(0);
  });
  it('cada dirección lleva su propia cuenta y sin dirección no se limita', () => {
    const l = createRateLimiter({ max: 1, windowMs: 60_000 });
    l.check('a', 0);
    expect(l.check('b', 1)).toBe(0);
    expect(l.check(null, 2)).toBe(0);
    expect(l.check(null, 3)).toBe(0);
  });
  it('toma la dirección de x-forwarded-for (la primera) o de x-real-ip', () => {
    expect(clientKey(new Request('http://x', { headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' } }))).toBe('1.2.3.4');
    expect(clientKey(new Request('http://x', { headers: { 'x-real-ip': '5.6.7.8' } }))).toBe('5.6.7.8');
    expect(clientKey(new Request('http://x'))).toBeNull();
  });
});

const desde = (ip: string, body: unknown, extra: Record<string, string> = {}) =>
  new Request('http://localhost/api/x', { method: 'POST', headers: { 'x-forwarded-for': ip, ...extra }, body: typeof body === 'string' ? body : JSON.stringify(body) });

describe('api/chat: límite y tamaño (H-005)', () => {
  beforeEach(() => {
    vi.stubEnv('LLM_API_KEY', 'k');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: 'hola' } }] }), { status: 200 })));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('la llamada 16 desde la misma dirección en 10 minutos recibe 429 con Retry-After', async () => {
    const ip = '9.9.9.1';
    for (let i = 0; i < 15; i++) expect((await chat(desde(ip, { text: 'hola' }))).status).toBe(200);
    const r = await chat(desde(ip, { text: 'hola' }));
    expect(r.status).toBe(429);
    expect(Number(r.headers.get('Retry-After'))).toBeGreaterThan(0);
    // otra dirección sigue pudiendo usar el chat
    expect((await chat(desde('9.9.9.2', { text: 'hola' }))).status).toBe(200);
  });

  it('rechaza con 413 un cuerpo declarado demasiado grande', async () => {
    const r = await chat(desde('9.9.9.3', { text: 'hola' }, { 'content-length': '500000' }));
    expect(r.status).toBe(413);
  });
});

describe('api/lead-webhook: límite y forma (H-005)', () => {
  beforeEach(() => {
    vi.stubEnv('GHL_WEBHOOK_URL', 'https://hook.test/x');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('solo reenvía objetos JSON: un arreglo o un valor suelto se rechaza', async () => {
    expect((await leadWebhook(desde('8.8.8.1', '[1,2]'))).status).toBe(400);
    expect((await leadWebhook(desde('8.8.8.1', '"hola"'))).status).toBe(400);
    expect((await leadWebhook(desde('8.8.8.1', { event: 'lead_created' }))).status).toBe(200);
  });

  it('la llamada 11 desde la misma dirección recibe 429', async () => {
    const ip = '8.8.8.2';
    for (let i = 0; i < 10; i++) expect((await leadWebhook(desde(ip, { event: 'x' }))).status).toBe(200);
    expect((await leadWebhook(desde(ip, { event: 'x' }))).status).toBe(429);
  });
});
