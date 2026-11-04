import { describe, it, expect, vi, afterEach } from 'vitest';
import { getFunciones } from './getFunciones';

const env = { url: 'https://proyecto.supabase.co', key: 'clave-publicable', tenantId: 'tenant-1' };
const respuesta = (cuerpo: unknown) => vi.fn().mockResolvedValue({ ok: true, json: async () => cuerpo });

describe('getFunciones (plan de la corredora en el sitio)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('pregunta a la base por la corredora de la dirección y devuelve qué herramientas tiene', async () => {
    const fetchMock = respuesta({ chat: true, valuation: false });
    vi.stubGlobal('fetch', fetchMock);
    expect(await getFunciones(env)).toEqual({ chat: true, valorizador: false });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://proyecto.supabase.co/rest/v1/rpc/get_site_features');
    expect(init.method).toBe('POST');
    expect(init.headers.apikey).toBe('clave-publicable');
    expect(JSON.parse(init.body)).toEqual({ p_tenant: 'tenant-1' });
  });

  it('sin dirección conocida o sin respuesta de la base no ofrece ninguna herramienta', async () => {
    expect(await getFunciones(null)).toEqual({ chat: false, valorizador: false });
    vi.stubGlobal('fetch', respuesta(null));
    expect(await getFunciones(env)).toEqual({ chat: false, valorizador: false });
  });

  it('solo un "sí" de verdad la enciende: un texto o un número no cuentan', async () => {
    vi.stubGlobal('fetch', respuesta({ chat: 'true', valuation: 1 }));
    expect(await getFunciones(env)).toEqual({ chat: false, valorizador: false });
    vi.stubGlobal('fetch', respuesta('basura'));
    expect(await getFunciones(env)).toEqual({ chat: false, valorizador: false });
  });

  it('si la base falla lanza un error: así Next conserva la última copia buena en vez de apagar las herramientas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(getFunciones(env)).rejects.toThrow('500');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));
    await expect(getFunciones(env)).rejects.toThrow('sin red');
  });
});
