import { describe, it, expect } from 'vitest';
import { createTestUser } from './usuarioPrueba';
import type { TokenFetcher } from './oauth';

const fetcherCon = (status: number, body: unknown, spy?: { url?: string; init?: Parameters<TokenFetcher>[1] }): TokenFetcher =>
  (async (url: string, init: Parameters<TokenFetcher>[1]) => {
    if (spy) {
      spy.url = url;
      spy.init = init;
    }
    return { ok: status < 400, status, json: async () => body };
  }) as unknown as TokenFetcher;

describe('createTestUser', () => {
  it('crea el usuario en el sitio de Chile y devuelve sus datos de acceso', async () => {
    const spy: { url?: string; init?: Parameters<TokenFetcher>[1] } = {};
    const r = await createTestUser({ accessToken: 'TOK', fetcher: fetcherCon(201, { id: 99, nickname: 'TEST1', password: 'abc', site_status: 'active' }, spy) });
    expect(r).toEqual({ ok: true, user: { id: '99', nickname: 'TEST1', password: 'abc' } });
    expect(spy.url).toBe('https://api.mercadolibre.com/users/test_user');
    expect(spy.init?.method).toBe('POST');
    expect(JSON.parse(spy.init?.body ?? '{}')).toEqual({ site_id: 'MLC' });
    expect(spy.init?.headers.Authorization).toBe('Bearer TOK');
  });

  it('un rechazo de Mercado Libre se informa con su motivo', async () => {
    const r = await createTestUser({ accessToken: 't', fetcher: fetcherCon(400, { message: 'límite de usuarios de prueba' }) });
    expect(r).toEqual({ ok: false, error: 'rechazado', message: 'límite de usuarios de prueba' });
  });

  it('una respuesta sin contraseña no se da por buena', async () => {
    expect(await createTestUser({ accessToken: 't', fetcher: fetcherCon(201, { id: 1, nickname: 'x' }) })).toEqual({ ok: false, error: 'respuesta' });
  });

  it('un error del servidor o un corte de red se informan como caída de red', async () => {
    expect(await createTestUser({ accessToken: 't', fetcher: fetcherCon(503, {}) })).toEqual({ ok: false, error: 'red' });
    const cae = (async () => {
      throw new Error('x');
    }) as unknown as TokenFetcher;
    expect(await createTestUser({ accessToken: 't', fetcher: cae })).toEqual({ ok: false, error: 'red' });
  });
});
