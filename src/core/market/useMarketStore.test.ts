import { describe, it, expect, beforeEach } from 'vitest';
import { useMarketStore, marketView } from './useMarketStore';

describe('useMarketStore (sin Supabase)', () => {
  beforeEach(() => {
    useMarketStore.setState({ marketId: 'cl', serviceAreas: [], loaded: false });
  });

  it('parte en Chile y sin zonas elegidas (todo el mercado)', () => {
    const { marketId, serviceAreas } = useMarketStore.getState();
    expect(marketId).toBe('cl');
    expect(serviceAreas).toEqual([]);
  });

  it('load deja los valores por defecto y marca que terminó', async () => {
    await useMarketStore.getState().load();
    expect(useMarketStore.getState().loaded).toBe(true);
    expect(useMarketStore.getState().serviceAreas).toEqual([]);
  });

  it('guardar zonas las deja en la tienda, sin repetir', async () => {
    const r = await useMarketStore.getState().setServiceAreas(['CL-VS', 'CL-RM', 'CL-VS']);
    expect(r).toEqual({ ok: true });
    expect(useMarketStore.getState().serviceAreas).toEqual(['CL-VS', 'CL-RM']);
  });
});

describe('marketView', () => {
  it('sin zonas ofrece las 346 comunas de Chile', () => {
    const v = marketView('cl', []);
    expect(v.pack.id).toBe('cl');
    expect(v.localities).toHaveLength(346);
  });

  it('con una región ofrece solo sus comunas y propone la primera como valor inicial', () => {
    const v = marketView('cl', ['CL-VS']);
    expect(v.localities).toHaveLength(38);
    expect(v.defaultLocality).toBe('Valparaíso');
    expect(v.zones.map((z) => z.groupName)).toEqual(['Valparaíso']);
  });

  it('describe el alcance en palabras: "Chile" o los nombres de las regiones', () => {
    expect(marketView('cl', []).scopeLabel).toBe('Chile');
    expect(marketView('cl', ['CL-VS']).scopeLabel).toBe('Valparaíso');
    expect(marketView('cl', ['CL-VS', 'CL-BI']).scopeLabel).toBe('Biobío y Valparaíso');
    expect(marketView('cl', ['CL-VS', 'CL-BI', 'CL-AR']).scopeLabel).toBe('Biobío, La Araucanía y Valparaíso');
  });

  it('indica si la corredora acotó sus zonas (restricted)', () => {
    expect(marketView('cl', []).restricted).toBe(false);
    expect(marketView('cl', ['XX']).restricted).toBe(false); // ninguna zona válida: vale todo el país
    expect(marketView('cl', ['CL-VS']).restricted).toBe(true);
    expect(marketView('cl', ['CL-VS', 'CL-BI']).restricted).toBe(true);
  });

  it('un mercado desconocido cae en Chile', () => {
    expect(marketView('zz', []).pack.id).toBe('cl');
  });
});
