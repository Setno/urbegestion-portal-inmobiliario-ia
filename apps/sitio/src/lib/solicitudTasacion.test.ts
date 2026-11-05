import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enviarSolicitudTasacion, validarTasacion } from './solicitudTasacion';
import type { DatosTasacion } from './tasacion';

// Desde H-063 los leads se crean con la clave de servicio del servidor, nunca con la clave pública.
beforeEach(() => vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave-de-servicio'));
afterEach(() => vi.unstubAllEnvs());

const env = { url: 'https://proyecto.supabase.co', key: 'clave-publicable', tenantId: 'tenant-1' };
const AHORA = new Date('2026-11-04T12:00:00Z');

const datos = (extra: Partial<DatosTasacion> = {}): DatosTasacion => ({
  operacion: 'venta',
  tipo: 'casa',
  comuna: 'Lo Barnechea',
  superficieM2: '140',
  dormitorios: '3',
  nombre: 'Ana Pérez',
  telefono: '+56 9 1111 2222',
  correo: 'ana@correo.cl',
  sitioWeb: '',
  ...extra,
});

function baseFalsa({ insertOk = true } = {}) {
  const insertados: Record<string, unknown>[] = [];
  const webhooks: { contact: { tags: string[] } }[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/rpc/create_site_lead')) {
      insertados.push(JSON.parse(String(init?.body)).p_lead);
      return { ok: insertOk, status: insertOk ? 201 : 403 };
    }
    if (url.includes('hooks.test')) {
      webhooks.push(JSON.parse(String(init?.body)));
      return { ok: true, status: 200 };
    }
    return { ok: true, json: async () => ({ brand: { brandName: 'Corredora Sur' } }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return { insertados, webhooks, fetchMock };
}

afterEach(() => vi.unstubAllGlobals());

describe('validarTasacion', () => {
  it('acepta datos correctos, con correo opcional', () => {
    expect(validarTasacion(datos())).toBeNull();
    expect(validarTasacion(datos({ correo: '' }))).toBeNull();
  });

  it('rechaza cada dato inservible con su motivo', () => {
    expect(validarTasacion(datos({ operacion: 'otra' as 'venta' }))).toBe('operacion');
    expect(validarTasacion(datos({ tipo: 'castillo' }))).toBe('tipo');
    expect(validarTasacion(datos({ comuna: ' ' }))).toBe('comuna');
    expect(validarTasacion(datos({ comuna: 'x'.repeat(101) }))).toBe('comuna');
    expect(validarTasacion(datos({ superficieM2: '0' }))).toBe('superficie');
    expect(validarTasacion(datos({ superficieM2: '-5' }))).toBe('superficie');
    expect(validarTasacion(datos({ superficieM2: 'abc' }))).toBe('superficie');
    expect(validarTasacion(datos({ superficieM2: '9999999' }))).toBe('superficie');
    expect(validarTasacion(datos({ dormitorios: '-1' }))).toBe('dormitorios');
    expect(validarTasacion(datos({ dormitorios: '40' }))).toBe('dormitorios');
    expect(validarTasacion(datos({ nombre: 'a' }))).toBe('nombre');
    expect(validarTasacion(datos({ telefono: '123' }))).toBe('telefono');
    expect(validarTasacion(datos({ correo: 'sin-arroba' }))).toBe('correo');
    expect(validarTasacion(datos({ correo: '=cmd|1@b.cl' }))).toBe('correo');
  });

  it('los dormitorios son opcionales (un terreno no tiene)', () => {
    expect(validarTasacion(datos({ dormitorios: '' }))).toBeNull();
  });
});

describe('enviarSolicitudTasacion', () => {
  it('crea un lead de propietario en la corredora del servidor, con los datos del inmueble y el aviso de privacidad', async () => {
    const { insertados } = baseFalsa();
    const resultado = await enviarSolicitudTasacion(datos({ nombre: '  Ana Pérez ' }), env, AHORA, undefined);
    expect(resultado).toEqual({ ok: true });
    expect(insertados).toHaveLength(1);
    const fila = insertados[0];
    expect(fila).toMatchObject({
      tenant_id: 'tenant-1',
      full_name: 'Ana Pérez',
      phone: '+56 9 1111 2222',
      email: 'ana@correo.cl',
      operation_interest: 'venta_propietario',
      source: 'captacion_propietarios',
      status: 'nuevo',
      property_title: 'Casa en Lo Barnechea (140 m²)',
      property_specs: { operation: 'venta', propertyType: 'casa', commune: 'Lo Barnechea', areaM2: '140', bedrooms: '3' },
    });
    expect(fila.privacy_notice).toBeTruthy();
    expect(typeof fila.id).toBe('string');
    expect((fila.notes as string[]).join(' ')).toContain('VENTA');
  });

  it('un robot que llena el campo trampa recibe éxito sin guardar nada', async () => {
    const { fetchMock } = baseFalsa();
    expect(await enviarSolicitudTasacion(datos({ sitioWeb: 'http://spam.cl' }), env, AHORA, undefined)).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('un dato inválido se informa sin tocar la base', async () => {
    const { fetchMock } = baseFalsa();
    expect(await enviarSolicitudTasacion(datos({ telefono: '1' }), env, AHORA, undefined)).toEqual({ ok: false, error: 'telefono' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sin dirección conocida no guarda', async () => {
    const { fetchMock } = baseFalsa();
    expect(await enviarSolicitudTasacion(datos(), null, AHORA, undefined)).toEqual({ ok: false, error: 'conexion' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si la base rechaza el lead, avisa conexión', async () => {
    baseFalsa({ insertOk: false });
    expect(await enviarSolicitudTasacion(datos(), env, AHORA, undefined)).toEqual({ ok: false, error: 'conexion' });
  });

  it('descarta lo que el navegador no debía enviar y acepta solo texto', async () => {
    const { insertados } = baseFalsa();
    const raro = { ...datos(), tenant_id: 'otra', nombre: 123 } as unknown as DatosTasacion;
    expect(await enviarSolicitudTasacion(raro, env, AHORA, undefined)).toEqual({ ok: false, error: 'nombre' });
    expect(insertados).toHaveLength(0);
  });

  it('avisa al webhook con la etiqueta de propietario cuando está configurado', async () => {
    const { webhooks } = baseFalsa();
    await enviarSolicitudTasacion(datos(), env, AHORA, 'https://hooks.test/lead');
    expect(webhooks).toHaveLength(1);
    expect(webhooks[0].contact.tags).toContain('Propietario');
    expect(webhooks[0].contact.tags).not.toContain('Comprador/Arrendatario');
  });
});
