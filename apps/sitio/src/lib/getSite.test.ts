import { describe, it, expect, vi, afterEach } from 'vitest';
import { getSite, siteEnv } from './getSite';

const env = { url: 'https://proyecto.supabase.co', key: 'clave-publicable', tenantId: 'tenant-1' };

describe('siteEnv', () => {
  it('acepta los nombres propios del sitio y, en local, los de la consola', () => {
    expect(siteEnv({ SUPABASE_URL: 'u', SUPABASE_PUBLISHABLE_KEY: 'k', SITIO_TENANT_ID: 't' })).toEqual({ url: 'u', key: 'k', tenantId: 't' });
    expect(siteEnv({ VITE_SUPABASE_URL: 'u', VITE_SUPABASE_PUBLISHABLE_KEY: 'k', VITE_TENANT_ID: 't' })).toEqual({ url: 'u', key: 'k', tenantId: 't' });
  });

  it('sin alguna de las tres variables no hay configuración', () => {
    expect(siteEnv({ SUPABASE_URL: 'u', SUPABASE_PUBLISHABLE_KEY: 'k' })).toBeNull();
  });
});

describe('getSite', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('pide a la base los datos públicos de la corredora y los valida', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tenantName: 'Casa Sur', brand: { contact: { instagram: 'javascript:alert(1)' } }, theme: { primary: '#112233' } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const site = await getSite(env);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://proyecto.supabase.co/rest/v1/rpc/get_tenant_public_site');
    expect(init.method).toBe('POST');
    expect(init.headers.apikey).toBe('clave-publicable');
    expect(JSON.parse(init.body)).toEqual({ p_tenant: 'tenant-1' });
    expect(site?.brand.brandName).toBe('Casa Sur');
    expect(site?.brand.contact.instagram).toBe('');
    expect(site?.theme.primary).toBe('#112233');
  });

  it('devuelve null si no hay configuración o la corredora no existe', async () => {
    expect(await getSite(null)).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => null }));
    expect(await getSite(env)).toBeNull();
  });

  it('si la base falla lanza un error: así Next conserva la última copia buena', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(getSite(env)).rejects.toThrow('500');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));
    await expect(getSite(env)).rejects.toThrow('sin red');
  });

  it('una respuesta correcta con contenido raro tampoco reemplaza la copia buena', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'pasarela' }) }));
    await expect(getSite(env)).rejects.toThrow('inesperada');
  });
});
