import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolverVisita } from '../../../../lib/direccion';
import { enviarSolicitudVisita } from '../../../../lib/solicitudVisita';
import { solicitarVisita } from './acciones';

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ host: 'casasur.cl' }),
  cookies: async () => ({ get: () => ({ value: encodeURIComponent(JSON.stringify({ fuente: 'meta', medio: 'social' })) }) }),
}));
vi.mock('../../../../lib/direccion', () => ({ resolverVisita: vi.fn() }));
vi.mock('../../../../lib/solicitudVisita', () => ({ enviarSolicitudVisita: vi.fn() }));

const datos = { nombre: 'Ana', telefono: '+56911112222', correo: '', fecha: '', hora: '', sitioWeb: '' };
const env = { url: 'https://proyecto.supabase.co', key: 'k', tenantId: 't1', canonico: 'casasur.cl' };

describe('acción de solicitar visita (H-030)', () => {
  beforeEach(() => {
    vi.mocked(resolverVisita).mockReset();
    vi.mocked(enviarSolicitudVisita).mockReset().mockResolvedValue({ ok: true });
  });

  it('crea el lead en la corredora de la dirección a la que llegó la solicitud', async () => {
    vi.mocked(resolverVisita).mockResolvedValue(env);
    expect(await solicitarVisita('p1', datos)).toEqual({ ok: true });
    expect(resolverVisita).toHaveBeenCalledWith('casasur.cl');
    expect(vi.mocked(enviarSolicitudVisita).mock.calls[0].slice(0, 3)).toEqual(['p1', datos, env]);
    expect(vi.mocked(enviarSolicitudVisita).mock.calls[0][5]).toEqual({ fuente: 'meta', medio: 'social' });
  });

  it('si no se puede saber la corredora, avisa un problema de conexión', async () => {
    vi.mocked(resolverVisita).mockRejectedValue(new Error('503'));
    expect(await solicitarVisita('p1', datos)).toEqual({ ok: false, error: 'conexion' });
    expect(enviarSolicitudVisita).not.toHaveBeenCalled();
  });
});
