import { describe, it, expect, vi, afterEach } from 'vitest';
import { getPropiedad } from './getPropiedad';

const env = { url: 'https://proyecto.supabase.co', key: 'clave-publicable', tenantId: 'tenant-1' };
const ID = '11111111-1111-4111-8111-111111111111';

const fila = (commune = 'Providencia') => ({
  id: ID,
  title: 'Casa con vista',
  operation: 'venta',
  property_type: 'casa',
  price_amount: 1000,
  price_currency: 'UF',
  commune,
  images: [],
});

function baseFalsa(filas: unknown, ajustes: unknown = { market: 'cl', service_areas: [] }) {
  const fetchMock = vi.fn(async (url: string) => ({
    ok: true,
    json: async () => (url.includes('/rpc/') ? ajustes : filas),
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('getPropiedad', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pide esa propiedad solo si es de esta corredora y está publicada', async () => {
    const fetchMock = baseFalsa([fila()]);
    const resultado = await getPropiedad(ID, env);
    const direccion = fetchMock.mock.calls.map(([url]) => url).find((url) => url.includes('/properties?')) ?? '';
    const consulta = new URL(direccion).searchParams;
    expect(consulta.get('id')).toBe(`eq.${ID}`);
    expect(consulta.get('tenant_id')).toBe('eq.tenant-1');
    expect(consulta.get('publication_status')).toBe('eq.publicada');
    expect(resultado?.propiedad.title).toBe('Casa con vista');
    expect(resultado?.marketId).toBe('cl');
  });

  it('un identificador raro ni siquiera llega a la base', async () => {
    const fetchMock = baseFalsa([]);
    expect(await getPropiedad('1 or 1=1', env)).toBeNull();
    expect(await getPropiedad(`${ID}&tenant_id=eq.otra`, env)).toBeNull();
    expect(await getPropiedad('AAAAAAAA-1111-4111-8111-111111111111', env)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si no existe, o está fuera de las zonas de la corredora, devuelve null', async () => {
    baseFalsa([]);
    expect(await getPropiedad(ID, env)).toBeNull();
    baseFalsa([fila('Providencia')], { market: 'cl', service_areas: ['CL-VS'] });
    expect(await getPropiedad(ID, env)).toBeNull();
  });

  it('sin configuración devuelve null', async () => {
    expect(await getPropiedad(ID, null)).toBeNull();
  });

  it('si la base falla o responde algo raro lanza un error: así no se publica un "no existe" falso', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(getPropiedad(ID, env)).rejects.toThrow('500');
    baseFalsa({ message: 'pasarela' });
    await expect(getPropiedad(ID, env)).rejects.toThrow('inesperada');
  });
});
