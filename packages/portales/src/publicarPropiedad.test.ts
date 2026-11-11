import { describe, it, expect, vi } from 'vitest';
import { publishProperty, validateProperty, rowToPortalProperty, listingStatus, type PublishDeps, type PropertyRow } from './publicarPropiedad';
import type { TokenFetcher } from './oauth';

const ahora = new Date('2026-11-09T12:00:00Z');

const fila: PropertyRow = {
  id: 'prop-1',
  tenant_id: 'tenant-1',
  title: 'Departamento en Providencia',
  operation: 'venta',
  property_type: 'departamento',
  price_amount: '5000.00',
  price_currency: 'UF',
  commune: 'Providencia',
  address: 'Av. Providencia 1234',
  bedrooms: 3,
  bathrooms: 2,
  built_area_m2: '85.00',
  total_area_m2: '95.00',
  parking_spots: 1,
  storage_units: 0,
  images: ['https://fotos.ejemplo.cl/a.jpg'],
  description: 'Hermoso departamento.',
  features: ['Piscina'],
  lat: -33.43,
  lng: -70.61,
  status: 'disponible',
  publication_status: 'publicada',
};

const creado = { ok: true, status: 201, json: async () => ({ id: 'MLC999', permalink: 'https://casa.mercadolibre.cl/MLC-999', status: 'active' }) };
const fetcherOk: TokenFetcher = vi.fn(async () => creado);

const deps = (extra: Partial<PublishDeps> = {}): PublishDeps => ({
  loadProperty: vi.fn(async () => fila),
  isAdminOf: vi.fn(async () => true),
  loadConnection: vi.fn(async () => ({ accessToken: 'A', refreshToken: 'R', expiresAt: new Date(ahora.getTime() + 5 * 3_600_000).toISOString() })),
  claim: vi.fn(async () => 'ok' as const),
  release: vi.fn(async () => {}),
  saveTokens: vi.fn(async () => true),
  markUncertain: vi.fn(async () => {}),
  saveListing: vi.fn(async () => true),
  getRates: vi.fn(async () => ({ UF: 38000 })),
  fetcher: fetcherOk,
  credentials: { clientId: '123', clientSecret: 's3cr3t', redirectUri: 'https://app.cl/retorno' },
  categories: { 'venta:departamento': 'MLC-VD' },
  now: ahora,
  ...extra,
});

describe('rowToPortalProperty', () => {
  it('convierte la fila de la base (números como texto, columnas con guion bajo)', () => {
    expect(rowToPortalProperty(fila)).toMatchObject({
      title: 'Departamento en Providencia',
      operation: 'venta',
      propertyType: 'departamento',
      priceAmount: 5000,
      priceCurrency: 'UF',
      builtAreaM2: 85,
      totalAreaM2: 95,
      parkingSpots: 1,
      images: ['https://fotos.ejemplo.cl/a.jpg'],
      coordinates: { lat: -33.43, lng: -70.61 },
    });
  });

  it('valores ausentes quedan neutros y sin coordenadas', () => {
    const p = rowToPortalProperty({ ...fila, lat: null, lng: null, images: null, features: null, address: null, description: null, bedrooms: null });
    expect(p.coordinates).toBeUndefined();
    expect(p.images).toEqual([]);
    expect(p.address).toBe('');
    expect(p.bedrooms).toBe(0);
  });
});

describe('listingStatus', () => {
  it.each([
    ['active', 'activa'],
    ['paused', 'pausada'],
    ['closed', 'cerrada'],
    ['under_review', 'activa'],
    ['otra-cosa', 'activa'],
  ])('%s → %s', (de, a) => expect(listingStatus(de)).toBe(a));
});

describe('publishProperty (H-068.3)', () => {
  it('publica, guarda el aviso y devuelve el enlace', async () => {
    const d = deps();
    const r = await publishProperty('prop-1', d);
    expect(r).toEqual({ status: 200, body: { ok: true, permalink: 'https://casa.mercadolibre.cl/MLC-999' } });
    expect(d.saveListing).toHaveBeenCalledWith('prop-1', 'tenant-1', expect.objectContaining({ externalId: 'MLC999' }));
    expect(d.release).not.toHaveBeenCalled();
  });

  it('usa la UF del día para convertir a pesos', async () => {
    const d = deps();
    await publishProperty('prop-1', d);
    expect(d.getRates).toHaveBeenCalledWith('UF');
    const [, init] = (d.fetcher as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(init.body).price).toBe(190000000);
  });

  it('no pide tasa si el precio ya está en pesos', async () => {
    const d = deps({ loadProperty: vi.fn(async () => ({ ...fila, price_currency: 'CLP', price_amount: '150000000' })) });
    await publishProperty('prop-1', d);
    expect(d.getRates).not.toHaveBeenCalled();
  });

  it('propiedad que no existe → 404', async () => {
    expect(await publishProperty('x', deps({ loadProperty: vi.fn(async () => null) }))).toEqual({ status: 404, body: { error: 'not_found' } });
  });

  it('quien no es administrador de esa corredora → 403, sin tocar nada más', async () => {
    const d = deps({ isAdminOf: vi.fn(async () => false) });
    expect(await publishProperty('prop-1', d)).toEqual({ status: 403, body: { error: 'not_admin' } });
    expect(d.claim).not.toHaveBeenCalled();
    expect(d.fetcher).not.toHaveBeenCalled();
  });

  it.each(['borrador', 'en_revision', 'rechazada'])('una propiedad %s no se publica en portales', async (estado) => {
    const d = deps({ loadProperty: vi.fn(async () => ({ ...fila, publication_status: estado })) });
    expect(await publishProperty('prop-1', d)).toEqual({ status: 409, body: { error: 'not_approved' } });
    expect(d.fetcher).not.toHaveBeenCalled();
  });

  it.each(['vendida', 'arrendada'])('una propiedad %s no se publica', async (estado) => {
    const d = deps({ loadProperty: vi.fn(async () => ({ ...fila, status: estado })) });
    expect(await publishProperty('prop-1', d)).toEqual({ status: 409, body: { error: 'not_on_offer' } });
  });

  it('sin cuenta conectada → 409 not_connected', async () => {
    const d = deps({ loadConnection: vi.fn(async () => null) });
    expect(await publishProperty('prop-1', d)).toEqual({ status: 409, body: { error: 'not_connected' } });
    expect(d.claim).not.toHaveBeenCalled();
  });

  it('ya publicada o en curso (doble clic) → 409 y no vuelve a llamar a Mercado Libre', async () => {
    const d = deps({ claim: vi.fn(async () => 'existe' as const) });
    expect(await publishProperty('prop-1', d)).toEqual({ status: 409, body: { error: 'already_published' } });
    expect(d.fetcher).not.toHaveBeenCalled();
    const e = deps({ claim: vi.fn(async () => 'en_curso' as const) });
    expect(await publishProperty('prop-1', e)).toEqual({ status: 409, body: { error: 'in_progress' } });
  });

  it('si los datos no sirven, libera el cupo y explica qué falta (422)', async () => {
    const d = deps({ loadProperty: vi.fn(async () => ({ ...fila, images: [] })) });
    const r = await publishProperty('prop-1', d);
    expect(r.status).toBe(422);
    expect(r.body).toMatchObject({ error: 'datos', messages: ['Falta al menos una foto con dirección pública.'] });
    expect(d.release).toHaveBeenCalledWith('prop-1');
  });

  it('si no se pudo obtener la UF, lo dice y libera el cupo (422)', async () => {
    const d = deps({ getRates: vi.fn(async () => ({})) });
    const r = await publishProperty('prop-1', d);
    expect(r.status).toBe(422);
    expect(JSON.stringify(r.body)).toMatch(/UF/);
    expect(d.release).toHaveBeenCalled();
  });

  it('un rechazo de Mercado Libre libera el cupo y se pasa el motivo', async () => {
    const rechazo: TokenFetcher = async () => ({ ok: false, status: 400, json: async () => ({ cause: [{ type: 'error', message: 'Falta el paquete' }] }) });
    const d = deps({ fetcher: rechazo });
    const r = await publishProperty('prop-1', d);
    expect(r).toEqual({ status: 422, body: { error: 'rechazado', messages: ['Falta el paquete'] } });
    expect(d.release).toHaveBeenCalledWith('prop-1');
  });

  it('conexión vencida → 409 reconnect', async () => {
    const vencida: TokenFetcher = async () => ({ ok: false, status: 401, json: async () => ({}) });
    const d = deps({ fetcher: vencida, loadConnection: vi.fn(async () => ({ accessToken: 'A', refreshToken: 'R', expiresAt: new Date(ahora.getTime() + 5 * 3_600_000).toISOString() })) });
    const r = await publishProperty('prop-1', d);
    expect(r.status).toBe(409);
    expect(r.body).toMatchObject({ error: 'reconnect' });
  });

  it('guarda los tokens renovados aunque la publicación falle', async () => {
    let n = 0;
    const fetcher: TokenFetcher = async (url) => {
      n++;
      if (url.endsWith('/oauth/token')) return { ok: true, status: 200, json: async () => ({ access_token: 'N', refresh_token: 'NR', expires_in: 21600, user_id: 1 }) };
      return { ok: false, status: 400, json: async () => ({ message: 'no' }) };
    };
    const d = deps({ fetcher, loadConnection: vi.fn(async () => ({ accessToken: 'A', refreshToken: 'R', expiresAt: new Date(ahora.getTime() - 1000).toISOString() })) });
    await publishProperty('prop-1', d);
    expect(n).toBe(2);
    expect(d.saveTokens).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ accessToken: 'N', refreshToken: 'NR' }));
  });

  it('si el aviso se publicó pero no se pudo guardar el registro, igual entrega el enlace con una advertencia', async () => {
    const d = deps({ saveListing: vi.fn(async () => false) });
    const r = await publishProperty('prop-1', d);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, permalink: 'https://casa.mercadolibre.cl/MLC-999', warning: expect.stringMatching(/registro/) });
    expect(d.release).not.toHaveBeenCalled(); // el cupo se queda: evita publicar el mismo aviso dos veces
  });

  it('una advertencia de Mercado Libre (descripción) se transmite', async () => {
    const llamadas: string[] = [];
    const fetcher: TokenFetcher = async (url) => {
      llamadas.push(url);
      return url.endsWith('/description') ? { ok: false, status: 400, json: async () => ({}) } : creado;
    };
    const r = await publishProperty('prop-1', deps({ fetcher }));
    expect(r.body).toMatchObject({ ok: true, warning: expect.stringMatching(/descripción/) });
  });

  describe('casos de la revisión: duplicados y tokens', () => {
    const caida: TokenFetcher = async () => {
      throw new Error('corte');
    };

    it('si el aviso pudo haberse creado (corte de red) NO libera la reserva y pide revisar la cuenta', async () => {
      const d = deps({ fetcher: caida });
      const r = await publishProperty('prop-1', d);
      expect(r.status).toBe(502);
      expect(r.body).toMatchObject({ error: 'uncertain' });
      expect(JSON.stringify(r.body)).toMatch(/Revisa tu cuenta de Mercado Libre/);
      expect(d.release).not.toHaveBeenCalled();
      expect(d.markUncertain).toHaveBeenCalledWith('prop-1', expect.stringMatching(/revisa tu cuenta/));
    });

    it('un 5xx de Mercado Libre se trata igual: pudo haberse creado', async () => {
      const cinco: TokenFetcher = async () => ({ ok: false, status: 503, json: async () => ({}) });
      const d = deps({ fetcher: cinco });
      expect((await publishProperty('prop-1', d)).body).toMatchObject({ error: 'uncertain' });
      expect(d.release).not.toHaveBeenCalled();
    });

    it('si algo revienta tras reservar, libera la reserva y propaga el error', async () => {
      const d = deps({ getRates: vi.fn(async () => { throw new Error('UF caída'); }) });
      await expect(publishProperty('prop-1', d)).rejects.toThrow('UF caída');
      expect(d.release).toHaveBeenCalledWith('prop-1');
    });

    it('una propiedad con título nulo en la base no revienta: se rechaza por datos y se libera', async () => {
      const d = deps({ loadProperty: vi.fn(async () => ({ ...fila, title: null as unknown as string })) });
      const r = await publishProperty('prop-1', d);
      expect(r.body).toMatchObject({ error: 'datos', messages: ['Falta el título.'] });
      expect(d.release).toHaveBeenCalled();
    });

    it('si otra publicación renovó el token primero, reintenta una vez con el token nuevo', async () => {
      const vencido = new Date(ahora.getTime() - 1000).toISOString();
      const vigente = new Date(ahora.getTime() + 5 * 3_600_000).toISOString();
      const loadConnection = vi
        .fn()
        .mockResolvedValueOnce({ accessToken: 'A', refreshToken: 'VIEJO', expiresAt: vencido })
        .mockResolvedValueOnce({ accessToken: 'OTRO', refreshToken: 'NUEVO', expiresAt: vigente });
      const fetcher: TokenFetcher = vi.fn(async (url, init) => {
        if (url.endsWith('/oauth/token')) return { ok: false, status: 400, json: async () => ({ error: 'invalid_grant' }) };
        expect(init.headers.Authorization).toBe('Bearer OTRO');
        return creado;
      });
      const d = deps({ loadConnection, fetcher });
      const r = await publishProperty('prop-1', d);
      expect(r.status).toBe(200);
      expect(loadConnection).toHaveBeenCalledTimes(2);
    });

    it('si la renovación se rechaza y el token no cambió, pide reconectar sin reintentar en bucle', async () => {
      const vencido = new Date(ahora.getTime() - 1000).toISOString();
      const loadConnection = vi.fn(async () => ({ accessToken: 'A', refreshToken: 'VIEJO', expiresAt: vencido }));
      const fetcher: TokenFetcher = vi.fn(async () => ({ ok: false, status: 400, json: async () => ({}) }));
      const d = deps({ loadConnection, fetcher });
      const r = await publishProperty('prop-1', d);
      expect(r.status).toBe(409);
      expect(r.body).toMatchObject({ error: 'reconnect' });
      expect(d.release).toHaveBeenCalled();
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('si no se pudieron guardar los tokens renovados, se advierte', async () => {
      const fetcher: TokenFetcher = async (url) =>
        url.endsWith('/oauth/token')
          ? { ok: true, status: 200, json: async () => ({ access_token: 'N', refresh_token: 'NR', expires_in: 21600, user_id: 1 }) }
          : creado;
      const d = deps({
        fetcher,
        saveTokens: vi.fn(async () => false),
        loadConnection: vi.fn(async () => ({ accessToken: 'A', refreshToken: 'R', expiresAt: new Date(ahora.getTime() - 1000).toISOString() })),
      });
      const r = await publishProperty('prop-1', d);
      expect(r.status).toBe(200);
      expect(r.body).toMatchObject({ ok: true, warning: expect.stringMatching(/renovación de la conexión/) });
    });
  });

  describe('validateProperty: probar sin publicar', () => {
    const valido: TokenFetcher = vi.fn(async () => ({ ok: true, status: 204, json: async () => ({}) }));

    it('valida con Mercado Libre y no reserva, no publica ni guarda ningún aviso', async () => {
      const d = deps({ fetcher: valido });
      const r = await validateProperty('prop-1', d);
      expect(r).toEqual({ status: 200, body: { ok: true, validated: true } });
      expect(d.claim).not.toHaveBeenCalled();
      expect(d.saveListing).not.toHaveBeenCalled();
      expect(d.release).not.toHaveBeenCalled();
      const [url] = (valido as ReturnType<typeof vi.fn>).mock.calls.at(-1) as [string];
      expect(url).toBe('https://api.mercadolibre.com/items/validate');
    });

    it('también sirve con una propiedad aún sin aprobar (es solo una prueba)', async () => {
      const d = deps({ fetcher: valido, loadProperty: vi.fn(async () => ({ ...fila, publication_status: 'borrador' })) });
      expect((await validateProperty('prop-1', d)).status).toBe(200);
    });

    it('exige ser administrador, existir y tener la cuenta conectada', async () => {
      expect(await validateProperty('x', deps({ loadProperty: vi.fn(async () => null) }))).toEqual({ status: 404, body: { error: 'not_found' } });
      expect(await validateProperty('prop-1', deps({ isAdminOf: vi.fn(async () => false) }))).toEqual({ status: 403, body: { error: 'not_admin' } });
      expect(await validateProperty('prop-1', deps({ loadConnection: vi.fn(async () => null) }))).toEqual({ status: 409, body: { error: 'not_connected' } });
    });

    it('devuelve los motivos de Mercado Libre (422) o los datos que faltan', async () => {
      const rechazo: TokenFetcher = async () => ({ ok: false, status: 400, json: async () => ({ cause: [{ type: 'error', message: 'Falta el atributo X' }] }) });
      expect(await validateProperty('prop-1', deps({ fetcher: rechazo }))).toEqual({ status: 422, body: { error: 'rechazado', messages: ['Falta el atributo X'] } });
      const r = await validateProperty('prop-1', deps({ loadProperty: vi.fn(async () => ({ ...fila, images: [] })) }));
      expect(r.body).toMatchObject({ error: 'datos' });
    });

    it('guarda los tokens renovados y un 401 pide reconectar', async () => {
      const fetcher: TokenFetcher = async (url) =>
        url.endsWith('/oauth/token')
          ? { ok: true, status: 200, json: async () => ({ access_token: 'N', refresh_token: 'NR', expires_in: 21600, user_id: 1 }) }
          : { ok: false, status: 401, json: async () => ({}) };
      const d = deps({ fetcher, loadConnection: vi.fn(async () => ({ accessToken: 'A', refreshToken: 'R', expiresAt: new Date(ahora.getTime() - 1000).toISOString() })) });
      const r = await validateProperty('prop-1', d);
      expect(r.status).toBe(409);
      expect(r.body).toMatchObject({ error: 'reconnect' });
      expect(d.saveTokens).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ accessToken: 'N' }));
    });
  });
});
