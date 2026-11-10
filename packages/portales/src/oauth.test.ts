import { describe, it, expect, vi } from 'vitest';
import {
  buildAuthorizationUrl,
  signState,
  verifyState,
  parseTokenResponse,
  requestTokens,
  tokenNeedsRefresh,
  type TokenFetcher,
} from './oauth';

const ahora = new Date('2026-11-09T12:00:00Z');
const secreto = 'secreto-de-prueba-largo-y-aleatorio';
const datos = { tenantId: 't-1', userId: 'u-1' };

describe('buildAuthorizationUrl', () => {
  it('arma la dirección de autorización con el estado y el retorno', () => {
    const url = new URL(buildAuthorizationUrl({ clientId: '123', redirectUri: 'https://app.cl/api/portales/mercadolibre-retorno', state: 'abc' }));
    expect(url.origin).toBe('https://auth.mercadolibre.cl');
    expect(url.pathname).toBe('/authorization');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('123');
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.cl/api/portales/mercadolibre-retorno');
    expect(url.searchParams.get('state')).toBe('abc');
  });
});

describe('estado firmado', () => {
  it('se verifica con el mismo secreto y devuelve los datos', async () => {
    const state = await signState(datos, secreto, ahora);
    expect(await verifyState(state, secreto, ahora)).toEqual(datos);
  });

  it('vence a los 10 minutos', async () => {
    const state = await signState(datos, secreto, ahora);
    const nueve = new Date(ahora.getTime() + 9 * 60_000);
    const once = new Date(ahora.getTime() + 11 * 60_000);
    expect(await verifyState(state, secreto, nueve)).toEqual(datos);
    expect(await verifyState(state, secreto, once)).toBeNull();
  });

  it('rechaza otro secreto', async () => {
    const state = await signState(datos, secreto, ahora);
    expect(await verifyState(state, 'otro-secreto', ahora)).toBeNull();
  });

  it('rechaza un estado adulterado (cambiar la corredora)', async () => {
    const state = await signState(datos, secreto, ahora);
    const [cuerpo, firma] = state.split('.');
    const falso = btoa(JSON.stringify({ ...datos, tenantId: 't-ajena', exp: ahora.getTime() + 60_000 }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(await verifyState(`${falso}.${firma}`, secreto, ahora)).toBeNull();
    expect(cuerpo).not.toBe(falso);
  });

  it.each(['', 'sin-punto', 'a.b.c', '.', 'a.'])('rechaza basura (%s)', async (basura) => {
    expect(await verifyState(basura, secreto, ahora)).toBeNull();
  });

  it('no firma con un secreto vacío', async () => {
    await expect(signState(datos, '', ahora)).rejects.toThrow();
    expect(await verifyState('a.b', '', ahora)).toBeNull();
  });
});

describe('parseTokenResponse', () => {
  const buena = { access_token: 'APP_USR-1', refresh_token: 'TG-1', expires_in: 21600, user_id: 987654, token_type: 'Bearer' };

  it('lee los tokens, el vencimiento y la cuenta', () => {
    expect(parseTokenResponse(buena, ahora)).toEqual({
      accessToken: 'APP_USR-1',
      refreshToken: 'TG-1',
      expiresAt: new Date(ahora.getTime() + 21600 * 1000).toISOString(),
      accountId: '987654',
    });
  });

  it.each([
    ['sin token', { ...buena, access_token: undefined }],
    ['sin renovación', { ...buena, refresh_token: '' }],
    ['sin vigencia', { ...buena, expires_in: 'x' }],
    ['vigencia cero', { ...buena, expires_in: 0 }],
    ['sin cuenta', { ...buena, user_id: undefined }],
    ['no es objeto', null],
  ])('devuelve null: %s', (_motivo, json) => {
    expect(parseTokenResponse(json, ahora)).toBeNull();
  });
});

describe('requestTokens', () => {
  const credenciales = { clientId: '123', clientSecret: 's3cr3t', redirectUri: 'https://app.cl/retorno' };
  const respuestaBuena = { access_token: 'A', refresh_token: 'R', expires_in: 3600, user_id: 5 };
  const fetcherCon = (ok: boolean, json: unknown): TokenFetcher =>
    vi.fn(async () => ({ ok, status: ok ? 200 : 400, json: async () => json }));

  it('canjea el código con los datos en formato de formulario', async () => {
    const fetcher = fetcherCon(true, respuestaBuena);
    const r = await requestTokens({ type: 'code', code: 'CODIGO' }, credenciales, fetcher, ahora);
    expect(r).toMatchObject({ ok: true, tokens: { accessToken: 'A', refreshToken: 'R', accountId: '5' } });
    const [url, init] = (fetcher as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://api.mercadolibre.com/oauth/token');
    expect(init.method).toBe('POST');
    const body = new URLSearchParams(init.body);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('CODIGO');
    expect(body.get('client_id')).toBe('123');
    expect(body.get('client_secret')).toBe('s3cr3t');
    expect(body.get('redirect_uri')).toBe('https://app.cl/retorno');
  });

  it('renueva con el refresh_token', async () => {
    const fetcher = fetcherCon(true, respuestaBuena);
    await requestTokens({ type: 'refresh', refreshToken: 'VIEJO' }, credenciales, fetcher, ahora);
    const body = new URLSearchParams((fetcher as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.get('grant_type')).toBe('refresh_token');
    expect(body.get('refresh_token')).toBe('VIEJO');
  });

  it('distingue rechazo, respuesta inútil y caída de red, sin filtrar secretos', async () => {
    expect(await requestTokens({ type: 'code', code: 'x' }, credenciales, fetcherCon(false, { error: 'invalid_grant' }), ahora)).toEqual({ ok: false, reason: 'rechazado' });
    expect(await requestTokens({ type: 'code', code: 'x' }, credenciales, fetcherCon(true, { hola: 1 }), ahora)).toEqual({ ok: false, reason: 'respuesta' });
    const caido: TokenFetcher = async () => {
      throw new Error('boom s3cr3t');
    };
    const r = await requestTokens({ type: 'code', code: 'x' }, credenciales, caido, ahora);
    expect(r).toEqual({ ok: false, reason: 'red' });
  });
});

describe('tokenNeedsRefresh', () => {
  it('pide renovar cuando falta menos del margen (5 min por defecto) o ya venció', () => {
    const en = (min: number) => new Date(ahora.getTime() + min * 60_000).toISOString();
    expect(tokenNeedsRefresh(en(60), ahora)).toBe(false);
    expect(tokenNeedsRefresh(en(4), ahora)).toBe(true);
    expect(tokenNeedsRefresh(en(-1), ahora)).toBe(true);
    expect(tokenNeedsRefresh('no-es-fecha', ahora)).toBe(true);
  });
});
