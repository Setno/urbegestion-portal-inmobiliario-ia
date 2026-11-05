import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enviarSolicitudVisita, validarSolicitud, type DatosVisita } from './solicitudVisita';

// Desde H-063 los leads se crean con la clave de servicio del servidor, nunca con la clave pública.
beforeEach(() => vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave-de-servicio'));
afterEach(() => vi.unstubAllEnvs());

const env = { url: 'https://proyecto.supabase.co', key: 'clave-publicable', tenantId: 'tenant-1' };
const ID = '11111111-1111-4111-8111-111111111111';
const AHORA = new Date('2026-11-03T12:00:00Z');

const datos = (extra: Partial<DatosVisita> = {}): DatosVisita => ({
  nombre: 'Ana Pérez',
  telefono: '+56 9 1111 2222',
  correo: 'ana@correo.cl',
  fecha: '2026-11-10',
  hora: '11:30',
  sitioWeb: '',
  ...extra,
});

const fila = {
  id: ID,
  title: 'Casa con vista',
  operation: 'arriendo',
  property_type: 'casa',
  price_amount: 32,
  price_currency: 'UF',
  commune: 'Valparaíso',
  images: [],
};

// Base falsa: entrega la propiedad pedida y los ajustes, y guarda lo que se inserta.
function baseFalsa({ filas = [fila] as unknown[], insertOk = true } = {}) {
  const insertados: Record<string, unknown>[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/rpc/create_site_lead')) {
      insertados.push(JSON.parse(String(init?.body)).p_lead);
      return { ok: insertOk, status: insertOk ? 201 : 403 };
    }
    return { ok: true, json: async () => (url.includes('/rpc/') ? { market: 'cl', service_areas: [] } : filas) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return { insertados, fetchMock };
}

describe('validarSolicitud', () => {
  it('acepta datos correctos, con correo y fecha opcionales', () => {
    expect(validarSolicitud(datos(), AHORA)).toBeNull();
    expect(validarSolicitud(datos({ correo: '', fecha: '' }), AHORA)).toBeNull();
  });

  it('rechaza cada dato inservible con su motivo', () => {
    expect(validarSolicitud(datos({ nombre: ' a ' }), AHORA)).toBe('nombre');
    expect(validarSolicitud(datos({ nombre: 'x'.repeat(121) }), AHORA)).toBe('nombre');
    expect(validarSolicitud(datos({ telefono: '123' }), AHORA)).toBe('telefono');
    expect(validarSolicitud(datos({ telefono: `+56 ${'1'.repeat(40)}` }), AHORA)).toBe('telefono');
    expect(validarSolicitud(datos({ correo: 'sin-arroba' }), AHORA)).toBe('correo');
    expect(validarSolicitud(datos({ fecha: '10/11/2026' }), AHORA)).toBe('fecha');
    expect(validarSolicitud(datos({ fecha: '2026-02-31' }), AHORA)).toBe('fecha');
    expect(validarSolicitud(datos({ fecha: '2026-10-01' }), AHORA)).toBe('fecha');
    expect(validarSolicitud(datos({ hora: '03:00' }), AHORA)).toBe('hora');
    expect(validarSolicitud(datos({ fecha: '9999-12-31' }), AHORA)).toBe('fecha');
    expect(validarSolicitud(datos({ telefono: 'abc12345678' }), AHORA)).toBe('telefono');
  });

  it('rechaza correos con caracteres que podrían convertirse en fórmulas o parámetros', () => {
    for (const correo of ['x;=1+1;y@b.cl', '=cmd|1@b.cl', 'a"b@x.cl', 'a@b.cl?bcc=c@d.cl']) {
      expect(validarSolicitud(datos({ correo }), AHORA)).toBe('correo');
    }
  });

  it('el horario es opcional', () => {
    expect(validarSolicitud(datos({ hora: '' }), AHORA)).toBeNull();
  });

  it('acepta hoy aunque el servidor esté en otra zona horaria', () => {
    expect(validarSolicitud(datos({ fecha: '2026-11-02' }), AHORA)).toBeNull();
  });
});

describe('enviarSolicitudVisita', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('crea el lead con la corredora y los datos de la propiedad que conoce el servidor', async () => {
    const { insertados } = baseFalsa();
    expect(await enviarSolicitudVisita(ID, datos(), env, AHORA)).toEqual({ ok: true });
    expect(insertados).toHaveLength(1);
    expect(insertados[0]).toMatchObject({
      tenant_id: 'tenant-1',
      full_name: 'Ana Pérez',
      phone: '+56 9 1111 2222',
      email: 'ana@correo.cl',
      property_id: ID,
      property_title: 'Casa con vista',
      operation_interest: 'arriendo',
      budget_amount: 32,
      budget_currency: 'UF',
      status: 'visita_agendada',
      appointment_date: '2026-11-10',
      appointment_time: '11:30',
      source: 'ficha_propiedad',
    });
    expect(insertados[0].privacy_notice).toMatchObject({ purpose: 'contacto_por_consulta', shownAt: AHORA.toISOString() });
  });

  it('guarda exactamente las columnas previstas, aunque el navegador mande de más', async () => {
    const { insertados } = baseFalsa();
    const recibidos = {
      ...datos(),
      tenant_id: 'otra-corredora',
      status: 'cerrado',
      id: 'inventado',
      attachments: ['x'],
      nombre: 'Ana Pérez',
    } as DatosVisita;
    await enviarSolicitudVisita(ID, recibidos, env, AHORA);
    expect(Object.keys(insertados[0]).sort()).toEqual(
      ['appointment_date', 'appointment_time', 'budget_amount', 'budget_currency', 'email', 'full_name', 'id', 'notes', 'operation_interest', 'phone', 'privacy_notice', 'property_id', 'property_title', 'source', 'status', 'tenant_id'],
    );
    expect(insertados[0].tenant_id).toBe('tenant-1');
    expect(insertados[0].status).toBe('visita_agendada');
    expect(insertados[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
  });

  it('un dato que no es texto se trata como vacío', async () => {
    const { fetchMock } = baseFalsa();
    const raro = { ...datos(), nombre: { $ne: 1 } } as unknown as DatosVisita;
    expect(await enviarSolicitudVisita(ID, raro, env, AHORA)).toEqual({ ok: false, error: 'nombre' });
    expect(await enviarSolicitudVisita(ID, null as unknown as DatosVisita, env, AHORA)).toEqual({ ok: false, error: 'nombre' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('comprueba la propiedad con datos frescos, sin la caché de la página', async () => {
    const { fetchMock } = baseFalsa();
    await enviarSolicitudVisita(ID, datos(), env, AHORA);
    const lecturas = fetchMock.mock.calls.filter(([url]) => !url.includes('/rpc/create_site_lead'));
    expect(lecturas.length).toBeGreaterThan(0);
    for (const [, init] of lecturas) {
      expect(init?.cache).toBe('no-store');
      expect((init as { next?: unknown }).next).toBeUndefined();
    }
  });

  it('avisa al webhook con el mismo formato de la consola', async () => {
    const { fetchMock, insertados } = baseFalsa();
    await enviarSolicitudVisita(ID, datos(), env, AHORA, 'https://hooks.test/x');
    const llamada = fetchMock.mock.calls.find(([url]) => url === 'https://hooks.test/x');
    const cuerpo = JSON.parse(String(llamada?.[1]?.body));
    expect(cuerpo.event).toBe('lead_created');
    expect(cuerpo.contact).toMatchObject({ firstName: 'Ana', lastName: 'Pérez', phone: '+56 9 1111 2222', email: 'ana@correo.cl' });
    expect(cuerpo.contact.customFields).toMatchObject({ lead_id: insertados[0].id, property_id: ID, status: 'visita_agendada', appointment_date: '2026-11-10' });
  });

  it('sin webhook configurado no llama a nadie más', async () => {
    const { fetchMock } = baseFalsa();
    await enviarSolicitudVisita(ID, datos(), env, AHORA, undefined);
    expect(fetchMock.mock.calls.some(([url]) => url.includes('hooks'))).toBe(false);
  });

  it('si falla el webhook el lead ya quedó guardado: la persona ve éxito y no se registran sus datos', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fetchMock, insertados } = baseFalsa();
    const normal = fetchMock.getMockImplementation();
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === 'https://hooks.test/x') throw new Error('caído');
      return (normal as NonNullable<typeof normal>)(url, init);
    });
    expect(await enviarSolicitudVisita(ID, datos(), env, AHORA, 'https://hooks.test/x')).toEqual({ ok: true });
    expect(insertados).toHaveLength(1);
    expect(JSON.stringify(aviso.mock.calls)).not.toContain('Ana');
  });

  it('un lead que no se guardó no se avisa', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fetchMock } = baseFalsa({ insertOk: false });
    await enviarSolicitudVisita(ID, datos(), env, AHORA, 'https://hooks.test/x');
    expect(fetchMock.mock.calls.some(([url]) => url === 'https://hooks.test/x')).toBe(false);
  });

  it('sin fecha queda como una consulta nueva, sin una cita inventada', async () => {
    const { insertados } = baseFalsa();
    await enviarSolicitudVisita(ID, datos({ fecha: '' }), env, AHORA);
    expect(insertados[0].status).toBe('nuevo');
    expect(insertados[0].appointment_date).toBeNull();
    expect(insertados[0].appointment_time).toBeNull();
    expect(insertados[0].notes).toEqual(['Consulta desde el sitio; horario preferido: 11:30 hrs.']);
  });

  it('sin fecha ni horario no inventa una preferencia', async () => {
    const { insertados } = baseFalsa();
    await enviarSolicitudVisita(ID, datos({ fecha: '', hora: '' }), env, AHORA);
    expect(insertados[0].notes).toEqual(['Consulta desde el sitio.']);
  });

  it('una venta se registra como interés de compra', async () => {
    const { insertados } = baseFalsa({ filas: [{ ...fila, operation: 'venta' }] });
    await enviarSolicitudVisita(ID, datos(), env, AHORA);
    expect(insertados[0].operation_interest).toBe('compra');
  });

  it('con datos inválidos no toca la base', async () => {
    const { fetchMock } = baseFalsa();
    expect(await enviarSolicitudVisita(ID, datos({ telefono: '1' }), env, AHORA)).toEqual({ ok: false, error: 'telefono' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('una propiedad que no existe, o ya no está publicada, no crea el lead', async () => {
    const { insertados } = baseFalsa({ filas: [] });
    expect(await enviarSolicitudVisita(ID, datos(), env, AHORA)).toEqual({ ok: false, error: 'propiedad' });
    expect(insertados).toHaveLength(0);
  });

  it('el campo trampa simula éxito y no guarda nada: los robots no se enteran', async () => {
    const { fetchMock } = baseFalsa();
    expect(await enviarSolicitudVisita(ID, datos({ sitioWeb: 'http://spam.test' }), env, AHORA)).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si la base rechaza o falla lo informa, sin escribir datos personales en los registros', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    baseFalsa({ insertOk: false });
    expect(await enviarSolicitudVisita(ID, datos(), env, AHORA)).toEqual({ ok: false, error: 'conexion' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));
    expect(await enviarSolicitudVisita(ID, datos(), env, AHORA)).toEqual({ ok: false, error: 'conexion' });
    const registrado = JSON.stringify(aviso.mock.calls);
    expect(registrado).not.toContain('Ana');
    expect(registrado).not.toContain('1111');
  });

  it('sin configuración informa el error en vez de perder el contacto en silencio', async () => {
    expect(await enviarSolicitudVisita(ID, datos(), null, AHORA)).toEqual({ ok: false, error: 'conexion' });
  });
});

describe('enviarSolicitudVisita: atribución (H-058)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('guarda la fuente, el medio y la campaña con el lead', async () => {
    const { insertados } = baseFalsa();
    await enviarSolicitudVisita(ID, datos(), env, AHORA, undefined, { fuente: 'google', medio: 'cpc', campana: 'verano' });
    expect(insertados[0].attribution).toEqual({ fuente: 'google', medio: 'cpc', campana: 'verano' });
  });

  it('sin atribución no envía la columna, y limpia lo que traiga de más', async () => {
    const { insertados } = baseFalsa();
    await enviarSolicitudVisita(ID, datos(), env, AHORA, undefined, null);
    expect(insertados[0]).not.toHaveProperty('attribution');
    await enviarSolicitudVisita(ID, datos(), env, AHORA, undefined, { fuente: '<b>x</b>', admin: 'si' } as never);
    expect(insertados[1].attribution).toEqual({ fuente: 'bx/b' });
  });
});

describe('enviarSolicitudVisita: creación por función (H-052)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('llama a la función de la base con la corredora de la dirección, no a la tabla', async () => {
    const { fetchMock } = baseFalsa();
    await enviarSolicitudVisita(ID, datos(), env, AHORA);
    const llamada = fetchMock.mock.calls.find(([url]) => String(url).includes('/rpc/create_site_lead'))!;
    expect(String(llamada[0])).toBe('https://proyecto.supabase.co/rest/v1/rpc/create_site_lead');
    expect(JSON.parse(String((llamada[1] as RequestInit).body)).p_tenant).toBe('tenant-1');
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/rest/v1/leads'))).toBe(false);
  });

  it('usa la clave de servicio del servidor y nunca la clave pública (H-063)', async () => {
    const { fetchMock } = baseFalsa();
    await enviarSolicitudVisita(ID, datos(), env, AHORA);
    const llamada = fetchMock.mock.calls.find(([url]) => String(url).includes('/rpc/create_site_lead'))!;
    const cabeceras = (llamada[1] as RequestInit).headers as Record<string, string>;
    expect(cabeceras.apikey).toBe('clave-de-servicio');
    expect(cabeceras.Authorization).toBe('Bearer clave-de-servicio');
  });

  it('sin clave de servicio no guarda nada y la persona ve un error (H-063)', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fetchMock } = baseFalsa();
    expect(await enviarSolicitudVisita(ID, datos(), env, AHORA)).toEqual({ ok: false, error: 'conexion' });
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/rpc/create_site_lead'))).toBe(false);
  });

  it('si la base rechaza el envío por el tope, la persona ve un error y no se avisa al webhook', async () => {
    baseFalsa({ insertOk: false });
    const webhook = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).includes('/rpc/create_site_lead') ? { ok: false, status: 400 } : { ok: true, json: async () => [fila] })));
    expect(await enviarSolicitudVisita(ID, datos(), env, AHORA, 'https://hook.test/x')).toEqual({ ok: false, error: 'conexion' });
    expect(webhook).not.toHaveBeenCalled();
  });
});
