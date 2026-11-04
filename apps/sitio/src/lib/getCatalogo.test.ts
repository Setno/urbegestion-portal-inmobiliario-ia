import { describe, it, expect, vi, afterEach } from 'vitest';
import { PUBLIC_PROPERTY_COLUMNS } from '@portal/sitio-datos/propiedades';
import { getCatalogo } from './getCatalogo';

const env = { url: 'https://proyecto.supabase.co', key: 'clave-publicable', tenantId: 'tenant-1' };

const fila = (id: string, commune: string) => ({
  id,
  title: `Propiedad ${id}`,
  operation: 'venta',
  property_type: 'casa',
  price_amount: 1000,
  price_currency: 'UF',
  commune,
  images: [],
});

// Responde según la dirección pedida: los ajustes de la corredora o sus propiedades.
function baseFalsa(filas: unknown[], ajustes: unknown = { market: 'cl', service_areas: [] }) {
  return vi.fn(async (url: string) => ({
    ok: true,
    json: async () => (url.includes('/rpc/') ? ajustes : filas),
  }));
}

describe('getCatalogo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pide solo las propiedades publicadas de esta corredora y solo columnas públicas', async () => {
    const fetchMock = baseFalsa([fila('a', 'Providencia')]);
    vi.stubGlobal('fetch', fetchMock);
    const catalogo = await getCatalogo(env);
    const direccion = fetchMock.mock.calls.map(([url]) => url).find((url) => url.includes('/properties?')) ?? '';
    const consulta = new URL(direccion).searchParams;
    expect(consulta.get('tenant_id')).toBe('eq.tenant-1');
    expect(consulta.get('publication_status')).toBe('eq.publicada');
    expect(consulta.get('status')).toBe('in.(disponible,reservada)');
    expect(consulta.get('select')?.split(',').sort()).toEqual(
      ['address', 'bathrooms', 'bedrooms', 'built_area_m2', 'commune', 'description', 'expenses_monthly_clp', 'featured', 'features', 'id', 'images', 'map_query', 'operation', 'parking_spots', 'price_amount', 'price_currency', 'property_type', 'status', 'storage_units', 'title', 'total_area_m2'],
    );
    expect(consulta.get('select')).toBe(PUBLIC_PROPERTY_COLUMNS);
    expect(catalogo.propiedades.map((p) => p.id)).toEqual(['a']);
    expect(catalogo.marketId).toBe('cl');
  });

  it('deja fuera lo que está fuera de las zonas de trabajo de la corredora', async () => {
    vi.stubGlobal('fetch', baseFalsa([fila('a', 'Providencia'), fila('b', 'Viña del Mar')], { market: 'cl', service_areas: ['CL-VS'] }));
    const catalogo = await getCatalogo(env);
    expect(catalogo.propiedades.map((p) => p.id)).toEqual(['b']);
  });

  it('una corredora que trabaja en todo el mercado muestra todo', async () => {
    vi.stubGlobal('fetch', baseFalsa([fila('a', 'Providencia'), fila('b', 'Viña del Mar')]));
    expect((await getCatalogo(env)).propiedades).toHaveLength(2);
  });

  it('sin configuración el catálogo queda vacío', async () => {
    expect((await getCatalogo(null)).propiedades).toEqual([]);
  });

  it('si la base falla lanza un error: así Next conserva la última copia buena', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(getCatalogo(env)).rejects.toThrow('500');
  });

  it('también lanza un error si falla solo una de las dos lecturas', async () => {
    const fallaSi = (parte: string) =>
      vi.fn(async (url: string) => (url.includes(parte) ? { ok: false, status: 503 } : { ok: true, json: async () => (url.includes('/rpc/') ? {} : []) }));
    vi.stubGlobal('fetch', fallaSi('/properties?'));
    await expect(getCatalogo(env)).rejects.toThrow('503');
    vi.stubGlobal('fetch', fallaSi('/rpc/'));
    await expect(getCatalogo(env)).rejects.toThrow('503');
  });

  it('una respuesta correcta con contenido raro no publica un catálogo vacío ni fuera de zona', async () => {
    vi.stubGlobal('fetch', baseFalsa({ message: 'pasarela' } as never));
    await expect(getCatalogo(env)).rejects.toThrow('inesperada');
    vi.stubGlobal('fetch', baseFalsa([fila('a', 'Providencia')], null));
    await expect(getCatalogo(env)).rejects.toThrow('inesperada');
  });
});
