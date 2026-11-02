import { describe, it, expect, vi, beforeEach } from 'vitest';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../auth/supabaseClient', () => ({ supabase: { rpc } }));

import { fetchPublicSite, saveSiteBrand } from './siteService';
import { DEFAULT_LAYOUT, DEFAULT_THEME, neutralBrand } from '@portal/sitio-datos';

const guardar = () => saveSiteBrand('tenant-1', neutralBrand('Casa Sur'), DEFAULT_THEME, DEFAULT_LAYOUT);

describe('siteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('lee los datos públicos de la corredora y los valida', async () => {
    rpc.mockResolvedValue({ data: { tenantName: 'Casa Sur', brand: { brandName: 'Casa Sur SpA' } }, error: null });
    const site = await fetchPublicSite('tenant-1');
    expect(rpc).toHaveBeenCalledWith('get_tenant_public_site', { p_tenant: 'tenant-1' });
    expect(site?.brand.brandName).toBe('Casa Sur SpA');
  });

  it('devuelve null si la corredora no existe, la consulta falla o no hay conexión', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(await fetchPublicSite('x')).toBeNull();
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    expect(await fetchPublicSite('x')).toBeNull();
    rpc.mockRejectedValueOnce(new Error('sin red'));
    expect(await fetchPublicSite('x')).toBeNull();
  });

  it('guarda la marca, los colores y las secciones de esa corredora', async () => {
    rpc.mockResolvedValue({ error: null });
    expect(await guardar()).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith('set_site_brand', {
      p_tenant: 'tenant-1',
      p_brand: neutralBrand('Casa Sur'),
      p_theme: DEFAULT_THEME,
      p_layout: DEFAULT_LAYOUT,
    });
  });

  it('distingue una falta de permiso, un exceso de tamaño y un problema de conexión', async () => {
    rpc.mockResolvedValueOnce({ error: { code: '42501' } });
    expect(await guardar()).toEqual({ ok: false, error: 'permiso' });
    rpc.mockResolvedValueOnce({ error: { code: '23514' } });
    expect(await guardar()).toEqual({ ok: false, error: 'demasiado_grande' });
    rpc.mockResolvedValueOnce({ error: { code: 'XX000' } });
    expect(await guardar()).toEqual({ ok: false, error: 'conexion' });
    rpc.mockRejectedValueOnce(new Error('sin red'));
    expect(await guardar()).toEqual({ ok: false, error: 'conexion' });
  });
});
