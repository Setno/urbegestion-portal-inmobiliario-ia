import { describe, it, expect, beforeEach, vi } from 'vitest';

// H-064 (revisión): lo que llega tarde de la corredora anterior no se aplica a la nueva.
const mocks = vi.hoisted(() => ({
  contexto: null as null | { client: object; tenantId: string },
  fetchPublicSettings: vi.fn(),
}));
vi.mock('../data/dataSource', () => ({ remoteContext: () => mocks.contexto }));
vi.mock('./marketService', async (original) => ({
  ...(await original<typeof import('./marketService')>()),
  fetchPublicSettings: mocks.fetchPublicSettings,
}));

import { useMarketStore } from './useMarketStore';

describe('useMarketStore: cambio de corredora', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.contexto = null;
    useMarketStore.setState({ marketId: 'cl', serviceAreas: [], loaded: false });
  });

  it('la respuesta tardía de A no se aplica si la sesión ya es de B', async () => {
    let resolver!: (v: unknown) => void;
    mocks.fetchPublicSettings.mockReturnValue(new Promise((r) => (resolver = r)));
    mocks.contexto = { client: {}, tenantId: 'A' };
    const carga = useMarketStore.getState().load();
    mocks.contexto = { client: {}, tenantId: 'B' };
    resolver({ marketId: 'cl', serviceAreas: ['de-A'] });
    await carga;
    expect(useMarketStore.getState().serviceAreas).toEqual([]);
    expect(useMarketStore.getState().loaded).toBe(false);
  });

  it('reset vuelve a los valores por defecto y a "no cargado"', () => {
    useMarketStore.setState({ serviceAreas: ['CL-BI'], loaded: true });
    useMarketStore.getState().reset();
    expect(useMarketStore.getState().serviceAreas).toEqual([]);
    expect(useMarketStore.getState().loaded).toBe(false);
  });
});
