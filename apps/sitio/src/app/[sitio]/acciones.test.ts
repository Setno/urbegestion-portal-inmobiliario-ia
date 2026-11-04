import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolverVisita } from '../../lib/direccion';
import { getFunciones } from '../../lib/getFunciones';
import { enviarSolicitudChat } from '../../lib/solicitudChat';
import { enviarSolicitudTasacion } from '../../lib/solicitudTasacion';
import { solicitarContactoChat, solicitarTasacion } from './acciones';

let cookieAtribucion: string | undefined;
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ host: 'casasur.miportal.cl' }),
  cookies: async () => ({ get: (nombre: string) => (nombre === 'atribucion' && cookieAtribucion ? { value: cookieAtribucion } : undefined) }),
}));
vi.mock('../../lib/direccion', () => ({ resolverVisita: vi.fn() }));
vi.mock('../../lib/getFunciones', () => ({ getFunciones: vi.fn() }));
vi.mock('../../lib/solicitudTasacion', () => ({ enviarSolicitudTasacion: vi.fn() }));
vi.mock('../../lib/solicitudChat', () => ({ enviarSolicitudChat: vi.fn() }));

const env = { url: 'https://proyecto.supabase.co', key: 'k', tenantId: 't1', canonico: 'casasur.cl' };
const tasacion = { operacion: 'venta', tipo: 'casa', comuna: 'Vitacura', superficieM2: '100', dormitorios: '3', nombre: 'Ana Pérez', telefono: '+56911112222', correo: '', sitioWeb: '' } as const;
const chat = { nombre: 'Ana Pérez', telefono: '+56911112222', fecha: '', hora: '', consulta: 'hola', sitioWeb: '' };

describe('acciones del sitio: el plan manda también al llamarlas directo', () => {
  beforeEach(() => {
    vi.mocked(resolverVisita).mockResolvedValue(env);
    vi.mocked(enviarSolicitudTasacion).mockResolvedValue({ ok: true });
    vi.mocked(enviarSolicitudChat).mockResolvedValue({ ok: true });
  });

  it('con el valorizador en el plan, la tasación se guarda en la corredora de la dirección', async () => {
    vi.mocked(getFunciones).mockResolvedValue({ chat: false, valorizador: true });
    expect(await solicitarTasacion({ ...tasacion })).toEqual({ ok: true });
    expect(resolverVisita).toHaveBeenCalledWith('casasur.miportal.cl');
    expect(vi.mocked(enviarSolicitudTasacion).mock.calls[0].slice(0, 2)).toEqual([tasacion, env]);
  });

  it('sin el valorizador en el plan, una llamada directa a la acción no guarda nada', async () => {
    vi.mocked(getFunciones).mockResolvedValue({ chat: true, valorizador: false });
    await solicitarTasacion({ ...tasacion });
    expect(vi.mocked(enviarSolicitudTasacion).mock.calls[0].slice(0, 2)).toEqual([tasacion, null]);
  });

  it('con el chat en el plan, el contacto se guarda en la corredora de la dirección', async () => {
    vi.mocked(getFunciones).mockResolvedValue({ chat: true, valorizador: false });
    expect(await solicitarContactoChat({ ...chat })).toEqual({ ok: true });
    expect(vi.mocked(enviarSolicitudChat).mock.calls[0].slice(0, 2)).toEqual([chat, env]);
  });

  it('sin el chat en el plan, una llamada directa a la acción no guarda nada', async () => {
    vi.mocked(getFunciones).mockResolvedValue({ chat: false, valorizador: true });
    await solicitarContactoChat({ ...chat });
    expect(vi.mocked(enviarSolicitudChat).mock.calls[0].slice(0, 2)).toEqual([chat, null]);
  });

  it('si no se puede leer el plan, no guarda y avisa conexión en vez de romper', async () => {
    vi.mocked(getFunciones).mockRejectedValue(new Error('sin red'));
    expect(await solicitarTasacion({ ...tasacion })).toEqual({ ok: false, error: 'conexion' });
    expect(await solicitarContactoChat({ ...chat })).toEqual({ ok: false, error: 'conexion' });
  });
});

describe('acciones del sitio: atribución (H-058)', () => {
  beforeEach(() => {
    vi.mocked(resolverVisita).mockResolvedValue(env);
    vi.mocked(getFunciones).mockResolvedValue({ chat: true, valorizador: true });
    vi.mocked(enviarSolicitudTasacion).mockResolvedValue({ ok: true });
    vi.mocked(enviarSolicitudChat).mockResolvedValue({ ok: true });
  });

  it('pasa la campaña recordada en la cookie al guardar el lead', async () => {
    cookieAtribucion = encodeURIComponent(JSON.stringify({ fuente: 'google', campana: 'verano' }));
    await solicitarContactoChat({ ...chat });
    await solicitarTasacion({ ...tasacion });
    expect(vi.mocked(enviarSolicitudChat).mock.calls.at(-1)?.[4]).toEqual({ fuente: 'google', campana: 'verano' });
    expect(vi.mocked(enviarSolicitudTasacion).mock.calls.at(-1)?.[4]).toEqual({ fuente: 'google', campana: 'verano' });
  });

  it('sin cookie o con una cookie corrupta no hay atribución', async () => {
    cookieAtribucion = '%%%';
    await solicitarContactoChat({ ...chat });
    expect(vi.mocked(enviarSolicitudChat).mock.calls.at(-1)?.[4]).toBeNull();
    cookieAtribucion = undefined;
    await solicitarContactoChat({ ...chat });
    expect(vi.mocked(enviarSolicitudChat).mock.calls.at(-1)?.[4]).toBeNull();
  });
});
