import { describe, it, expect, beforeEach, vi } from 'vitest';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../auth/supabaseClient', () => ({ supabase: { rpc } }));

import { fetchPublicSettings, saveServiceAreas, parseSettings } from './marketService';

describe('parseSettings', () => {
  it('lee el mercado y las zonas', () => {
    expect(parseSettings({ market: 'cl', service_areas: ['CL-VS', 'CL-RM'] })).toEqual({
      marketId: 'cl',
      serviceAreas: ['CL-VS', 'CL-RM'],
    });
  });

  it('con datos incompletos o raros usa el mercado por defecto y ninguna zona (todo el mercado)', () => {
    expect(parseSettings(null)).toEqual({ marketId: 'cl', serviceAreas: [] });
    expect(parseSettings({})).toEqual({ marketId: 'cl', serviceAreas: [] });
    expect(parseSettings({ market: 5, service_areas: 'CL-VS' })).toEqual({ marketId: 'cl', serviceAreas: [] });
  });

  it('descarta de las zonas lo que no sea texto', () => {
    expect(parseSettings({ market: 'cl', service_areas: ['CL-VS', 7, null] }).serviceAreas).toEqual(['CL-VS']);
  });
});

describe('marketService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('pide al servidor los ajustes públicos de la corredora', async () => {
    rpc.mockResolvedValue({ data: { market: 'cl', service_areas: ['CL-BI'] }, error: null });
    const r = await fetchPublicSettings('tenant-1');
    expect(rpc).toHaveBeenCalledWith('get_tenant_public_settings', { p_tenant: 'tenant-1' });
    expect(r).toEqual({ marketId: 'cl', serviceAreas: ['CL-BI'] });
  });

  it('si el servidor falla o la corredora no existe devuelve null, sin romper', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'x' } });
    expect(await fetchPublicSettings('t')).toBeNull();
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await fetchPublicSettings('t')).toBeNull();
    rpc.mockRejectedValue(new Error('sin red'));
    expect(await fetchPublicSettings('t')).toBeNull();
  });

  it('guarda las zonas con la función protegida del servidor', async () => {
    rpc.mockResolvedValue({ error: null });
    expect(await saveServiceAreas(['CL-VS'])).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith('set_service_areas', { p_areas: ['CL-VS'] });
  });

  it('si no se puede guardar informa el error de conexión', async () => {
    rpc.mockResolvedValue({ error: { message: 'no' } });
    expect(await saveServiceAreas(['CL-VS'])).toEqual({ ok: false, error: 'conexion' });
    rpc.mockRejectedValue(new Error('sin red'));
    expect(await saveServiceAreas([])).toEqual({ ok: false, error: 'conexion' });
  });
});
