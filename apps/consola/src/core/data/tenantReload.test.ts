import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// H-064: al cambiar la corredora (entrar, salir, cambiar de cuenta) las tiendas no pueden quedarse con datos de la anterior.
const mocks = vi.hoisted(() => {
  const tienda = (nombre: string) => ({ reset: vi.fn(() => orden.push(`reset:${nombre}`)) });
  const orden: string[] = [];
  return {
    orden,
    listener: null as null | ((tenantId: string | null) => void),
    leads: tienda('leads'),
    timeline: tienda('timeline'),
    propiedades: { ...tienda('propiedades'), load: vi.fn(() => orden.push('load:propiedades')) },
    mercado: { ...tienda('mercado'), load: vi.fn(() => orden.push('load:mercado')) },
    derechos: { ...tienda('derechos'), loadPublic: vi.fn(() => orden.push('load:derechos')) },
    marca: { ...tienda('marca'), load: vi.fn(() => orden.push('load:marca')) },
  };
});

vi.mock('./dataSource', () => ({
  onTenantChange: (cb: (tenantId: string | null) => void) => {
    mocks.listener = cb;
    return () => {
      mocks.listener = null;
    };
  },
}));
vi.mock('../../modules/catalogo/stores/usePropertyStore', () => ({ usePropertyStore: { getState: () => mocks.propiedades } }));
vi.mock('../market/useMarketStore', () => ({ useMarketStore: { getState: () => mocks.mercado } }));
vi.mock('../platform/useEntitlementsStore', () => ({ useEntitlementsStore: { getState: () => mocks.derechos } }));
vi.mock('../brand/useBrandStore', () => ({ useBrandStore: { getState: () => mocks.marca } }));
vi.mock('../../modules/crm/stores/useLeadStore', () => ({ useLeadStore: { getState: () => mocks.leads } }));
vi.mock('../../modules/crm/stores/useTimelineStore', () => ({ useTimelineStore: { getState: () => mocks.timeline } }));

import { registerTenantReload } from './tenantReload';

describe('registerTenantReload', () => {
  let dejar: () => void;
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.orden.length = 0;
    dejar = registerTenantReload();
  });
  afterEach(() => dejar());

  it('al cambiar la corredora vacía TODAS las tiendas con datos de la corredora (leads, historial, propiedades, mercado, derechos y marca)', () => {
    mocks.listener?.('tenant-1');
    for (const t of [mocks.leads, mocks.timeline, mocks.propiedades, mocks.mercado, mocks.derechos, mocks.marca]) {
      expect(t.reset).toHaveBeenCalledTimes(1);
    }
  });

  it('después de vaciar recarga catálogo, mercado, derechos y marca con la corredora nueva', () => {
    mocks.listener?.('tenant-1');
    expect(mocks.propiedades.load).toHaveBeenCalledTimes(1);
    expect(mocks.mercado.load).toHaveBeenCalledTimes(1);
    expect(mocks.derechos.loadPublic).toHaveBeenCalledTimes(1);
    expect(mocks.marca.load).toHaveBeenCalledTimes(1);
    const ultimoReset = Math.max(...mocks.orden.map((o, i) => (o.startsWith('reset:') ? i : -1)));
    const primeraCarga = mocks.orden.findIndex((o) => o.startsWith('load:'));
    expect(ultimoReset).toBeLessThan(primeraCarga);
  });

  it('al soltar la corredora (cerrar sesión) vacía todo y no recarga', () => {
    mocks.listener?.(null);
    for (const t of [mocks.leads, mocks.timeline, mocks.propiedades, mocks.mercado, mocks.derechos, mocks.marca]) {
      expect(t.reset).toHaveBeenCalledTimes(1);
    }
    expect(mocks.propiedades.load).not.toHaveBeenCalled();
    expect(mocks.marca.load).not.toHaveBeenCalled();
  });

  it('devuelve una función para dejar de escuchar', () => {
    dejar();
    expect(mocks.listener).toBeNull();
  });
});
