import { describe, it, expect, vi } from 'vitest';
import { publishToMercadoLibre, type PublishInput } from './publicar';
import type { TokenFetcher } from './oauth';
import type { PropiedadParaPortal } from './mercadolibre';

const ahora = new Date('2026-11-09T12:00:00Z');
const enHoras = (h: number) => new Date(ahora.getTime() + h * 3_600_000).toISOString();

const propiedad: PropiedadParaPortal = {
  title: 'Departamento en Providencia',
  operation: 'venta',
  propertyType: 'departamento',
  priceAmount: 5000,
  priceCurrency: 'UF',
  commune: 'Providencia',
  address: 'Av. Providencia 1234',
  bedrooms: 3,
  bathrooms: 2,
  builtAreaM2: 85,
  totalAreaM2: 95,
  parkingSpots: 1,
  storageUnits: 0,
  images: ['https://fotos.ejemplo.cl/a.jpg'],
  description: 'Hermoso departamento.',
  features: [],
};

const base = (fetcher: TokenFetcher, extra: Partial<PublishInput> = {}): PublishInput => ({
  property: propiedad,
  options: { categories: { 'venta:departamento': 'MLC-VD' }, rates: { UF: 38000 } },
  connection: { accessToken: 'ACCESO', refreshToken: 'REFRESCO', expiresAt: enHoras(5) },
  credentials: { clientId: '123', clientSecret: 's3cr3t', redirectUri: 'https://app.cl/retorno' },
  fetcher,
  now: ahora,
  ...extra,
});

type Respuesta = { ok: boolean; status: number; json: unknown };
// Un fetcher que contesta en orden y anota las llamadas.
const guion = (...respuestas: Respuesta[]) => {
  const llamadas: { url: string; init: Parameters<TokenFetcher>[1] }[] = [];
  const fetcher: TokenFetcher = vi.fn(async (url, init) => {
    llamadas.push({ url, init });
    const r = respuestas.shift() ?? { ok: false, status: 500, json: {} };
    return { ok: r.ok, status: r.status, json: async () => r.json };
  });
  return { fetcher, llamadas };
};

const creado = { ok: true, status: 201, json: { id: 'MLC999', permalink: 'https://casa.mercadolibre.cl/MLC-999', status: 'active' } };
const descripcionOk = { ok: true, status: 201, json: {} };
const tokensNuevos = { ok: true, status: 200, json: { access_token: 'NUEVO', refresh_token: 'NUEVO-R', expires_in: 21600, user_id: 7 } };

describe('publishToMercadoLibre (H-068.3)', () => {
  it('publica el aviso y su descripción, y devuelve el enlace', async () => {
    const { fetcher, llamadas } = guion(creado, descripcionOk);
    const r = await publishToMercadoLibre(base(fetcher));
    expect(r).toMatchObject({ ok: true, listing: { externalId: 'MLC999', permalink: 'https://casa.mercadolibre.cl/MLC-999', status: 'active' } });
    expect(llamadas[0].url).toBe('https://api.mercadolibre.com/items');
    expect(llamadas[0].init.headers.Authorization).toBe('Bearer ACCESO');
    const item = JSON.parse(llamadas[0].init.body);
    expect(item).toMatchObject({ category_id: 'MLC-VD', currency_id: 'CLF', price: 5000 });
    expect(llamadas[1].url).toBe('https://api.mercadolibre.com/items/MLC999/description');
    expect(JSON.parse(llamadas[1].init.body)).toEqual({ plain_text: 'Hermoso departamento.' });
    expect('tokens' in r && r.tokens).toBeFalsy();
  });

  it('si los datos no sirven, no llama a Mercado Libre y explica qué falta', async () => {
    const { fetcher } = guion();
    const r = await publishToMercadoLibre(base(fetcher, { property: { ...propiedad, images: [] } }));
    expect(r).toEqual({ ok: false, kind: 'datos', errors: ['Falta al menos una foto con dirección pública.'] });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('renueva el token antes de publicar si está por vencer y lo devuelve para guardarlo', async () => {
    const { fetcher, llamadas } = guion(tokensNuevos, creado, descripcionOk);
    const r = await publishToMercadoLibre(base(fetcher, { connection: { accessToken: 'VIEJO', refreshToken: 'REFRESCO', expiresAt: enHoras(0.01) } }));
    expect(llamadas[0].url).toBe('https://api.mercadolibre.com/oauth/token');
    expect(llamadas[1].init.headers.Authorization).toBe('Bearer NUEVO');
    expect(r.ok).toBe(true);
    expect('tokens' in r && r.tokens).toMatchObject({ accessToken: 'NUEVO', refreshToken: 'NUEVO-R' });
  });

  it('si Mercado Libre responde 401, renueva una vez y reintenta', async () => {
    const { fetcher, llamadas } = guion({ ok: false, status: 401, json: { message: 'invalid token' } }, tokensNuevos, creado, descripcionOk);
    const r = await publishToMercadoLibre(base(fetcher));
    expect(r.ok).toBe(true);
    expect(llamadas.map((l) => l.url)).toEqual([
      'https://api.mercadolibre.com/items',
      'https://api.mercadolibre.com/oauth/token',
      'https://api.mercadolibre.com/items',
      'https://api.mercadolibre.com/items/MLC999/description',
    ]);
    expect(llamadas[2].init.headers.Authorization).toBe('Bearer NUEVO');
  });

  it('si la renovación falla pide volver a conectar, y no publica', async () => {
    const { fetcher } = guion({ ok: false, status: 400, json: { error: 'invalid_grant' } });
    const r = await publishToMercadoLibre(base(fetcher, { connection: { accessToken: 'VIEJO', refreshToken: 'MALO', expiresAt: enHoras(-1) } }));
    expect(r).toMatchObject({ ok: false, kind: 'sesion' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('un 401 que persiste tras renovar también pide volver a conectar', async () => {
    const { fetcher } = guion({ ok: false, status: 401, json: {} }, tokensNuevos, { ok: false, status: 401, json: {} });
    const r = await publishToMercadoLibre(base(fetcher));
    expect(r).toMatchObject({ ok: false, kind: 'sesion' });
    // los tokens renovados se devuelven igual: el refresh_token anterior ya no sirve
    expect('tokens' in r && r.tokens).toMatchObject({ accessToken: 'NUEVO' });
  });

  it('un rechazo de Mercado Libre trae sus motivos en texto, sin secretos, acotados', async () => {
    const { fetcher } = guion({
      ok: false,
      status: 400,
      json: {
        message: 'validation error',
        cause: [
          { type: 'error', message: 'Falta el paquete de publicaciones' },
          { type: 'warning', message: 'ignorado' },
          { type: 'error', message: 'x'.repeat(500) },
        ],
      },
    });
    const r = await publishToMercadoLibre(base(fetcher));
    expect(r.ok).toBe(false);
    if ('listing' in r) return;
    expect(r.kind).toBe('rechazado');
    expect(r.errors[0]).toBe('Falta el paquete de publicaciones');
    expect(r.errors).toHaveLength(2);
    expect(r.errors[1].length).toBeLessThanOrEqual(200);
    expect(JSON.stringify(r)).not.toContain('ACCESO');
  });

  it('un rechazo sin causas usa el mensaje general, y sin nada uno genérico', async () => {
    const a = await publishToMercadoLibre(base(guion({ ok: false, status: 400, json: { message: 'category not allowed' } }).fetcher));
    expect(a).toMatchObject({ ok: false, kind: 'rechazado', errors: ['category not allowed'] });
    const b = await publishToMercadoLibre(base(guion({ ok: false, status: 400, json: 'raro' }).fetcher));
    expect(b).toMatchObject({ ok: false, kind: 'rechazado', errors: ['Mercado Libre rechazó el aviso (código 400).'] });
  });

  it('un rechazo claro (4xx) significa que el aviso NO se creó', async () => {
    const r = await publishToMercadoLibre(base(guion({ ok: false, status: 400, json: { message: 'no' } }).fetcher));
    expect('maybeCreated' in r && r.maybeCreated).toBeFalsy();
  });

  it('un error 5xx de Mercado Libre es reintentable pero el aviso pudo haberse creado', async () => {
    const r = await publishToMercadoLibre(base(guion({ ok: false, status: 503, json: {} }).fetcher));
    expect(r).toMatchObject({ ok: false, kind: 'red', maybeCreated: true });
  });

  it('una respuesta sin id es un error, no un éxito, y el aviso pudo haberse creado', async () => {
    const r = await publishToMercadoLibre(base(guion({ ok: true, status: 201, json: { hola: 1 } }).fetcher));
    expect(r).toMatchObject({ ok: false, kind: 'respuesta', maybeCreated: true });
  });

  it('si la red falla al enviar la descripción, el aviso igual quedó publicado y solo se advierte', async () => {
    let n = 0;
    const fetcher: TokenFetcher = async () => {
      n++;
      if (n === 1) return { ok: true, status: 201, json: async () => creado.json };
      throw new Error('corte ACCESO');
    };
    const r = await publishToMercadoLibre(base(fetcher));
    expect(r).toMatchObject({ ok: true, listing: { externalId: 'MLC999' } });
    expect('warning' in r && r.warning).toMatch(/descripción/);
    expect(JSON.stringify(r)).not.toContain('ACCESO');
  });

  it('si la descripción falla, el aviso igual quedó publicado y se avisa', async () => {
    const r = await publishToMercadoLibre(base(guion(creado, { ok: false, status: 400, json: {} }).fetcher));
    expect(r).toMatchObject({ ok: true, listing: { externalId: 'MLC999' } });
    expect('warning' in r && r.warning).toMatch(/descripción/);
  });

  it('una caída de red es un error de red, no una excepción', async () => {
    const caido: TokenFetcher = async () => {
      throw new Error('boom ACCESO');
    };
    const r = await publishToMercadoLibre(base(caido));
    // el corte pudo ocurrir con el aviso ya creado: quien llama no debe liberar la reserva a ciegas
    expect(r).toEqual({ ok: false, kind: 'red', maybeCreated: true, errors: ['No se pudo contactar a Mercado Libre. Inténtalo de nuevo en unos minutos.'] });
  });

  it('sin enlace en la respuesta, el enlace queda vacío', async () => {
    const r = await publishToMercadoLibre(base(guion({ ok: true, status: 201, json: { id: 'MLC1' } }, descripcionOk).fetcher));
    expect(r).toMatchObject({ ok: true, listing: { externalId: 'MLC1', permalink: null, status: 'active' } });
  });

  describe('solo validar (dryRun): no crea nada en Mercado Libre', () => {
    const valido = { ok: true, status: 204, json: undefined as unknown };

    it('llama a /items/validate, no a /items, y no envía la descripción', async () => {
      const { fetcher, llamadas } = guion(valido);
      const r = await publishToMercadoLibre(base(fetcher, { dryRun: true }));
      expect(r).toMatchObject({ ok: true, validated: true });
      expect(llamadas.map((l) => l.url)).toEqual(['https://api.mercadolibre.com/items/validate']);
      expect(JSON.parse(llamadas[0].init.body)).toMatchObject({ category_id: 'MLC-VD', currency_id: 'CLF' });
    });

    it('un 204 sin cuerpo (json que falla) igual cuenta como válido', async () => {
      const sinCuerpo: TokenFetcher = async () => ({ ok: true, status: 204, json: async () => { throw new Error('vacío'); } });
      expect(await publishToMercadoLibre(base(sinCuerpo, { dryRun: true }))).toMatchObject({ ok: true, validated: true });
    });

    it('un rechazo trae los motivos y nunca marca "pudo haberse creado"', async () => {
      const { fetcher } = guion({ ok: false, status: 400, json: { cause: [{ type: 'error', message: 'Falta el atributo ROOMS' }] } });
      const r = await publishToMercadoLibre(base(fetcher, { dryRun: true }));
      expect(r).toMatchObject({ ok: false, kind: 'rechazado', errors: ['Falta el atributo ROOMS'] });
      expect('maybeCreated' in r && r.maybeCreated).toBeFalsy();
    });

    it('un corte de red o un 5xx tampoco marcan "pudo haberse creado" (no hay nada que duplicar)', async () => {
      const caido: TokenFetcher = async () => { throw new Error('corte'); };
      const a = await publishToMercadoLibre(base(caido, { dryRun: true }));
      expect(a).toMatchObject({ ok: false, kind: 'red' });
      expect('maybeCreated' in a && a.maybeCreated).toBeFalsy();
      const b = await publishToMercadoLibre(base(guion({ ok: false, status: 503, json: {} }).fetcher, { dryRun: true }));
      expect('maybeCreated' in b && b.maybeCreated).toBeFalsy();
    });

    it('renueva el token si hace falta y lo devuelve, igual que al publicar', async () => {
      const { fetcher, llamadas } = guion(tokensNuevos, valido);
      const r = await publishToMercadoLibre(base(fetcher, { dryRun: true, connection: { accessToken: 'VIEJO', refreshToken: 'REFRESCO', expiresAt: enHoras(0.01) } }));
      expect(llamadas[1].url).toBe('https://api.mercadolibre.com/items/validate');
      expect('tokens' in r && r.tokens).toMatchObject({ accessToken: 'NUEVO' });
    });

    it('si los datos propios no sirven, ni siquiera llama a Mercado Libre', async () => {
      const { fetcher } = guion();
      const r = await publishToMercadoLibre(base(fetcher, { dryRun: true, property: { ...propiedad, images: [] } }));
      expect(r).toMatchObject({ ok: false, kind: 'datos' });
      expect(fetcher).not.toHaveBeenCalled();
    });
  });
});
