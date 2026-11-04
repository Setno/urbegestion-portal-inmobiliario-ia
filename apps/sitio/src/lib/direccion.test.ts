import { describe, it, expect, vi, afterEach } from 'vitest';
import { conexion, dominioBase, leerDireccion, resolverVisita } from './direccion';

const TENANT = '11111111-1111-4111-8111-111111111111';
const c = { url: 'https://proyecto.supabase.co', key: 'clave-publicable', tenantPorDefecto: TENANT };

const responder = (cuerpo: unknown, ok = true) => vi.fn(async () => ({ ok, status: ok ? 200 : 503, json: async () => cuerpo }));

describe('conexion', () => {
  it('usa los nombres del sitio o, en local, los de la consola', () => {
    expect(conexion({ SUPABASE_URL: 'u', SUPABASE_PUBLISHABLE_KEY: 'k', SITIO_TENANT_ID: TENANT })).toEqual({ url: 'u', key: 'k', tenantPorDefecto: TENANT });
    expect(conexion({ VITE_SUPABASE_URL: 'u', VITE_SUPABASE_PUBLISHABLE_KEY: 'k', VITE_TENANT_ID: TENANT })).toEqual({ url: 'u', key: 'k', tenantPorDefecto: TENANT });
  });

  it('la corredora por defecto es opcional y se ignora si no es un identificador', () => {
    expect(conexion({ SUPABASE_URL: 'u', SUPABASE_PUBLISHABLE_KEY: 'k' })?.tenantPorDefecto).toBeNull();
    expect(conexion({ SUPABASE_URL: 'u', SUPABASE_PUBLISHABLE_KEY: 'k', SITIO_TENANT_ID: 'casasur' })?.tenantPorDefecto).toBeNull();
  });

  it('sin la base no hay conexión', () => {
    expect(conexion({ SUPABASE_URL: 'u' })).toBeNull();
  });
});

describe('dominioBase', () => {
  it('usa el dominio de la plataforma configurado, sin puntos sobrantes', () => {
    expect(dominioBase({ SITIO_DOMINIO_BASE: ' .MiPortal.cl. ', NODE_ENV: 'production' })).toBe('miportal.cl');
  });

  it('en local los subdominios cuelgan de localhost; en producción sin configurar no hay subdominios', () => {
    expect(dominioBase({ NODE_ENV: 'development' })).toBe('localhost');
    expect(dominioBase({ NODE_ENV: 'production' })).toBe('');
  });
});

describe('leerDireccion', () => {
  it('reconoce el subdominio de la plataforma, sin el puerto ni mayúsculas', () => {
    expect(leerDireccion('CasaSur.miportal.cl:443', 'miportal.cl')).toEqual({ subdominio: 'casasur', dominio: 'casasur.miportal.cl' });
    expect(leerDireccion('casasur.localhost:3001', 'localhost')).toEqual({ subdominio: 'casasur', dominio: 'casasur.localhost' });
  });

  it('cualquier otra dirección es un dominio propio (o un preview)', () => {
    expect(leerDireccion('www.casasur.cl', 'miportal.cl')).toEqual({ subdominio: null, dominio: 'www.casasur.cl' });
    expect(leerDireccion('localhost:3001', 'localhost')).toEqual({ subdominio: null, dominio: 'localhost' });
    expect(leerDireccion('otromiportal.cl', 'miportal.cl')).toEqual({ subdominio: null, dominio: 'otromiportal.cl' });
  });

  it('la portada de la plataforma (con o sin www) no es de ninguna corredora', () => {
    expect(leerDireccion('miportal.cl', 'miportal.cl')).toBeNull();
    expect(leerDireccion('www.miportal.cl', 'miportal.cl')).toBeNull();
  });

  it('una dirección con caracteres raros no se consulta', () => {
    for (const host of ['', 'casa sur.cl', 'casa/sur.cl', '-casa.cl', "a'b.cl"]) expect(leerDireccion(host, 'miportal.cl')).toBeNull();
  });
});

describe('resolverVisita', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('pregunta a la base por el subdominio o el dominio, con la corredora por defecto', async () => {
    const fetchMock = responder({ tenantId: TENANT, subdomain: 'casasur', customDomain: null });
    vi.stubGlobal('fetch', fetchMock);
    expect(await resolverVisita('casasur.miportal.cl', c, 'miportal.cl')).toEqual({ url: c.url, key: c.key, tenantId: TENANT, canonico: 'casasur.miportal.cl' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://proyecto.supabase.co/rest/v1/rpc/resolve_site');
    expect(JSON.parse(String(init.body))).toEqual({ p_subdomain: 'casasur', p_domain: 'casasur.miportal.cl', p_fallback: null });
  });

  it('la corredora por defecto solo se usa en localhost y en los previews, nunca en un dominio real', async () => {
    const fetchMock = responder({ tenantId: TENANT, subdomain: null, customDomain: null });
    vi.stubGlobal('fetch', fetchMock);
    const enviado = (i: number) => JSON.parse(String((fetchMock.mock.calls[i] as unknown as [string, RequestInit])[1].body)).p_fallback;
    await resolverVisita('localhost:3001', c, 'localhost');
    await resolverVisita('portal-sitio-abc.vercel.app', c, 'miportal.cl');
    await resolverVisita('casasur.cl', c, 'miportal.cl');
    expect([enviado(0), enviado(1), enviado(2)]).toEqual([TENANT, TENANT, null]);
  });

  it('la dirección canónica es el dominio propio; si no hay, el subdominio de la plataforma', async () => {
    vi.stubGlobal('fetch', responder({ tenantId: TENANT, subdomain: 'casasur', customDomain: 'casasur.cl' }));
    expect((await resolverVisita('casasur.miportal.cl', c, 'miportal.cl'))?.canonico).toBe('casasur.cl');
    vi.stubGlobal('fetch', responder({ tenantId: TENANT, subdomain: 'casasur', customDomain: null }));
    expect((await resolverVisita('www.casasur.cl', c, 'miportal.cl'))?.canonico).toBe('casasur.miportal.cl');
    // Sin dominio de la plataforma configurado, queda la dirección de la visita
    expect((await resolverVisita('casasur-abc.vercel.app', c, ''))?.canonico).toBe('casasur-abc.vercel.app');
  });

  it('si la base no reconoce la dirección, no hay sitio (nunca datos de otra corredora)', async () => {
    vi.stubGlobal('fetch', responder(null));
    expect(await resolverVisita('desconocida.miportal.cl', c, 'miportal.cl')).toBeNull();
  });

  it('una dirección inválida o sin conexión no consulta la base', async () => {
    const fetchMock = responder({ tenantId: TENANT });
    vi.stubGlobal('fetch', fetchMock);
    expect(await resolverVisita('casa sur', c, 'miportal.cl')).toBeNull();
    expect(await resolverVisita('www.miportal.cl', c, 'miportal.cl')).toBeNull();
    expect(await resolverVisita('casasur.cl', null, 'miportal.cl')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si la base falla o responde algo raro lanza un error, para conservar la copia buena', async () => {
    vi.stubGlobal('fetch', responder(null, false));
    await expect(resolverVisita('casasur.cl', c, 'miportal.cl')).rejects.toThrow('503');
    vi.stubGlobal('fetch', responder({ message: 'otra cosa' }));
    await expect(resolverVisita('casasur.cl', c, 'miportal.cl')).rejects.toThrow('inesperada');
  });
});
