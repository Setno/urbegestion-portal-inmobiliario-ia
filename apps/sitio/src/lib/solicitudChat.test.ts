import { describe, it, expect, vi, afterEach } from 'vitest';
import { enviarSolicitudChat, validarContactoChat } from './solicitudChat';
import type { DatosChat } from './chat';

const env = { url: 'https://proyecto.supabase.co', key: 'clave-publicable', tenantId: 'tenant-1' };
const AHORA = new Date('2026-11-04T12:00:00Z');

const datos = (extra: Partial<DatosChat> = {}): DatosChat => ({
  nombre: 'Ana Pérez',
  telefono: '+56 9 1111 2222',
  fecha: '2026-11-10',
  hora: '11:30',
  consulta: 'busco una casa en Vitacura',
  sitioWeb: '',
  ...extra,
});

function baseFalsa({ insertOk = true } = {}) {
  const insertados: Record<string, unknown>[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/rpc/create_site_lead')) {
      insertados.push(JSON.parse(String(init?.body)).p_lead);
      return { ok: insertOk, status: insertOk ? 201 : 403 };
    }
    return { ok: true, json: async () => null };
  });
  vi.stubGlobal('fetch', fetchMock);
  return { insertados, fetchMock };
}

afterEach(() => vi.unstubAllGlobals());

describe('validarContactoChat', () => {
  it('acepta datos correctos, con fecha y hora opcionales', () => {
    expect(validarContactoChat(datos(), AHORA)).toBeNull();
    expect(validarContactoChat(datos({ fecha: '', hora: '' }), AHORA)).toBeNull();
  });

  it('rechaza cada dato inservible con su motivo', () => {
    expect(validarContactoChat(datos({ nombre: 'a' }), AHORA)).toBe('nombre');
    expect(validarContactoChat(datos({ telefono: '123' }), AHORA)).toBe('telefono');
    expect(validarContactoChat(datos({ fecha: '2026-02-31' }), AHORA)).toBe('fecha');
    expect(validarContactoChat(datos({ hora: '03:00' }), AHORA)).toBe('hora');
  });
});

describe('enviarSolicitudChat', () => {
  it('crea un lead del asistente en la corredora del servidor, con cita si la pidió', async () => {
    const { insertados } = baseFalsa();
    expect(await enviarSolicitudChat(datos(), env, AHORA, undefined)).toEqual({ ok: true });
    expect(insertados).toHaveLength(1);
    expect(insertados[0]).toMatchObject({
      tenant_id: 'tenant-1',
      full_name: 'Ana Pérez',
      phone: '+56 9 1111 2222',
      email: '',
      operation_interest: 'compra',
      source: 'asistente_ia',
      status: 'visita_agendada',
      appointment_date: '2026-11-10',
      appointment_time: '11:30',
    });
    expect(insertados[0].privacy_notice).toBeTruthy();
    expect((insertados[0].notes as string[]).join(' ')).toContain('busco una casa en Vitacura');
  });

  it('sin fecha el lead queda como nuevo y sin cita', async () => {
    const { insertados } = baseFalsa();
    await enviarSolicitudChat(datos({ fecha: '', hora: '' }), env, AHORA, undefined);
    expect(insertados[0]).toMatchObject({ status: 'nuevo', appointment_date: null, appointment_time: null });
  });

  it('la consulta se recorta: no se guarda un texto enorme escrito por un visitante', async () => {
    const { insertados } = baseFalsa();
    await enviarSolicitudChat(datos({ consulta: 'x'.repeat(5000) }), env, AHORA, undefined);
    expect((insertados[0].notes as string[]).join(' ').length).toBeLessThan(600);
  });

  it('un robot que llena el campo trampa recibe éxito sin guardar nada', async () => {
    const { fetchMock } = baseFalsa();
    expect(await enviarSolicitudChat(datos({ sitioWeb: 'http://spam.cl' }), env, AHORA, undefined)).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('un dato inválido, o una dirección desconocida, se informan sin tocar la base', async () => {
    const { fetchMock } = baseFalsa();
    expect(await enviarSolicitudChat(datos({ telefono: '1' }), env, AHORA, undefined)).toEqual({ ok: false, error: 'telefono' });
    expect(await enviarSolicitudChat(datos(), null, AHORA, undefined)).toEqual({ ok: false, error: 'conexion' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si la base rechaza el lead, avisa conexión', async () => {
    baseFalsa({ insertOk: false });
    expect(await enviarSolicitudChat(datos(), env, AHORA, undefined)).toEqual({ ok: false, error: 'conexion' });
  });

  it('descarta lo que el navegador no debía enviar', async () => {
    const { insertados } = baseFalsa();
    const raro = { ...datos(), tenant_id: 'otra', nombre: 7 } as unknown as DatosChat;
    expect(await enviarSolicitudChat(raro, env, AHORA, undefined)).toEqual({ ok: false, error: 'nombre' });
    expect(insertados).toHaveLength(0);
  });
});
