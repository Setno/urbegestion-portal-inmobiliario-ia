import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearLeadEnBase } from './crearLead';

const env = { url: 'https://proyecto.supabase.co', key: 'clave-publicable', tenantId: 'tenant-1' };
const fila = { id: '11111111-1111-4111-8111-111111111111', full_name: 'Ana Pérez', phone: '+56 9 1111 2222' };

describe('crearLeadEnBase (H-063)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave-de-servicio');
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('llama a la función de la base con la clave de servicio y no con la clave pública', async () => {
    expect(await crearLeadEnBase(env, fila)).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://proyecto.supabase.co/rest/v1/rpc/create_site_lead');
    expect(init.headers.apikey).toBe('clave-de-servicio');
    expect(init.headers.Authorization).toBe('Bearer clave-de-servicio');
    expect(JSON.stringify(init.headers)).not.toContain('clave-publicable');
    expect(JSON.parse(init.body)).toEqual({ p_tenant: 'tenant-1', p_lead: fila });
  });

  it('sin clave de servicio no intenta nada y avisa en los registros sin datos personales', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await crearLeadEnBase(env, fila)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(JSON.stringify(aviso.mock.calls)).not.toContain('Ana');
  });

  it('si la base rechaza el envío devuelve false', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400 });
    expect(await crearLeadEnBase(env, fila)).toBe(false);
    expect(JSON.stringify(aviso.mock.calls)).not.toContain('Ana');
  });
});
