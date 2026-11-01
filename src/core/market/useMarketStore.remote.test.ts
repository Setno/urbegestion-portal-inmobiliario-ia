import { describe, it, expect, beforeEach, vi } from 'vitest';

const { fetchPublicSettings, saveServiceAreas } = vi.hoisted(() => ({
  fetchPublicSettings: vi.fn(),
  saveServiceAreas: vi.fn(),
}));
vi.mock('../data/dataSource', () => ({ remoteContext: () => ({ client: {}, tenantId: 'tenant-1' }) }));
vi.mock('./marketService', async (original) => ({
  ...(await original<typeof import('./marketService')>()),
  fetchPublicSettings,
  saveServiceAreas,
}));

import { useMarketStore } from './useMarketStore';

describe('useMarketStore (con Supabase)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMarketStore.setState({ marketId: 'cl', serviceAreas: [], loaded: false });
  });

  it('load trae el mercado y las zonas de la corredora del sitio', async () => {
    fetchPublicSettings.mockResolvedValue({ marketId: 'cl', serviceAreas: ['CL-BI'] });
    await useMarketStore.getState().load();
    expect(fetchPublicSettings).toHaveBeenCalledWith('tenant-1');
    expect(useMarketStore.getState().serviceAreas).toEqual(['CL-BI']);
    expect(useMarketStore.getState().loaded).toBe(true);
  });

  it('si el servidor no responde se queda con los valores por defecto', async () => {
    fetchPublicSettings.mockResolvedValue(null);
    await useMarketStore.getState().load();
    expect(useMarketStore.getState().serviceAreas).toEqual([]);
    expect(useMarketStore.getState().loaded).toBe(true);
  });

  it('guardar zonas las envía al servidor y solo si resulta cambia la tienda', async () => {
    saveServiceAreas.mockResolvedValue({ ok: true });
    await useMarketStore.getState().setServiceAreas(['CL-VS']);
    expect(saveServiceAreas).toHaveBeenCalledWith(['CL-VS']);
    expect(useMarketStore.getState().serviceAreas).toEqual(['CL-VS']);
  });

  it('si el servidor rechaza el cambio, la tienda no cambia y se informa el error', async () => {
    saveServiceAreas.mockResolvedValue({ ok: false, error: 'conexion' });
    const r = await useMarketStore.getState().setServiceAreas(['CL-VS']);
    expect(r).toEqual({ ok: false, error: 'conexion' });
    expect(useMarketStore.getState().serviceAreas).toEqual([]);
  });
});
