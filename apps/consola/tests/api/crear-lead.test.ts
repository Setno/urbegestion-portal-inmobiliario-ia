// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../api/crear-lead';

const TENANT = 'a1a1a1a1-0000-0000-0000-0000000000a1';
const LEAD = { id: '11111111-1111-4111-8111-111111111111', full_name: 'Ana Pérez', phone: '+56 9 1111 2222', operation_interest: 'compra', source: 'formulario_contacto' };

let ip = 0;
// Cada prueba llega desde una dirección distinta para no gastarse el límite entre sí.
const pedido = (body: unknown, direccion = `10.0.0.${++ip}`) =>
  new Request('http://localhost/api/crear-lead', {
    method: 'POST',
    headers: { 'x-forwarded-for': direccion },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('api/crear-lead (H-063)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'https://base.ejemplo.test');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave-de-servicio');
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify('11111111-1111-4111-8111-111111111111'), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('crea el lead llamando a la función de la base con la clave de servicio', async () => {
    const res = await POST(pedido({ tenantId: TENANT, lead: LEAD }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://base.ejemplo.test/rest/v1/rpc/create_site_lead');
    expect(init.headers.apikey).toBe('clave-de-servicio');
    expect(init.headers.Authorization).toBe('Bearer clave-de-servicio');
    expect(JSON.parse(init.body)).toEqual({ p_tenant: TENANT, p_lead: LEAD });
  });

  it('responde 503 si falta la clave de servicio o la dirección de la base', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const sinClave = await POST(pedido({ tenantId: TENANT, lead: LEAD }));
    expect(sinClave.status).toBe(503);
    expect(await sinClave.json()).toEqual({ error: 'not_configured' });
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave-de-servicio');
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    expect((await POST(pedido({ tenantId: TENANT, lead: LEAD }))).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rechaza por el tamaño declarado sin leer el cuerpo', async () => {
    const grande = new Request('http://localhost/api/crear-lead', {
      method: 'POST',
      headers: { 'x-forwarded-for': `10.1.0.${++ip}`, 'content-length': '50000' },
      body: JSON.stringify({ tenantId: TENANT, lead: LEAD }),
    });
    expect((await POST(grande)).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rechaza un cuerpo que no es JSON, vacío o demasiado grande', async () => {
    expect((await POST(pedido('no es json'))).status).toBe(400);
    expect((await POST(pedido(''))).status).toBe(400);
    const grande = await POST(pedido({ tenantId: TENANT, lead: { ...LEAD, notes: ['x'.repeat(30_000)] } }));
    expect(grande.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rechaza una corredora que no es un uuid y un lead que no es un objeto', async () => {
    expect((await POST(pedido({ tenantId: 'casasur', lead: LEAD }))).status).toBe(400);
    expect((await POST(pedido({ tenantId: TENANT, lead: [LEAD] }))).status).toBe(400);
    expect((await POST(pedido({ tenantId: TENANT, lead: 'texto' }))).status).toBe(400);
    expect((await POST(pedido({ lead: LEAD }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('limita los envíos por dirección IP y avisa cuánto esperar', async () => {
    const direccion = '203.0.113.7';
    const estados: number[] = [];
    for (let i = 0; i < 8; i++) estados.push((await POST(pedido({ tenantId: TENANT, lead: LEAD }, direccion))).status);
    expect(estados.slice(0, 6)).toEqual([200, 200, 200, 200, 200, 200]);
    expect(estados.slice(6)).toEqual([429, 429]);
    const bloqueada = await POST(pedido({ tenantId: TENANT, lead: LEAD }, direccion));
    expect(bloqueada.headers.get('Retry-After')).not.toBeNull();
    // otra dirección sigue pasando
    expect((await POST(pedido({ tenantId: TENANT, lead: LEAD }, '203.0.113.8'))).status).toBe(200);
  });

  it('traduce los topes de la base a 429 y los datos inválidos a 400, sin filtrar detalles', async () => {
    const respuestaDeLaBase = (message: string) => new Response(JSON.stringify({ code: 'P0001', message, details: 'detalle interno' }), { status: 400 });
    const casos: Array<[string, number]> = [
      ['limite_corredora', 429],
      ['limite_contacto', 429],
      ['lead_invalido', 400],
      ['sitio_no_disponible', 404],
      ['algo inesperado de postgres', 502],
    ];
    for (const [mensaje, estado] of casos) {
      fetchMock.mockResolvedValueOnce(respuestaDeLaBase(mensaje));
      const res = await POST(pedido({ tenantId: TENANT, lead: LEAD }));
      expect(res.status).toBe(estado);
      const texto = JSON.stringify(await res.json());
      expect(texto).not.toContain('detalle interno');
      expect(texto).not.toContain('postgres');
    }
  });

  it('responde 502 si la base no responde', async () => {
    fetchMock.mockRejectedValueOnce(new Error('red caída'));
    const res = await POST(pedido({ tenantId: TENANT, lead: LEAD }));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'upstream' });
  });
});
