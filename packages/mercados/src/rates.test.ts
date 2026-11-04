import { describe, it, expect } from 'vitest';
import { CHILE } from './cl';
import { getMarketPack } from './index';
import { parseMindicador } from './cl/rates';

// 4 de noviembre de 2026, mediodía en Chile (UTC-3)
const HOY = new Date('2026-11-04T15:00:00Z');

const serie = (...filas: [string, number][]) => ({ codigo: 'uf', serie: filas.map(([fecha, valor]) => ({ fecha: `${fecha}T03:00:00.000Z`, valor })) });

describe('tasa de la UF desde mindicador.cl (datos del Banco Central)', () => {
  it('toma el valor del día de hoy en Chile', () => {
    const json = serie(['2026-11-04', 41268.88], ['2026-11-03', 41263.57]);
    expect(parseMindicador(json, HOY)).toEqual({ value: 41268.88, date: '2026-11-04' });
  });

  it('si hoy aún no está publicado, usa el último día anterior', () => {
    const json = serie(['2026-11-03', 41263.57], ['2026-11-02', 41258.26]);
    expect(parseMindicador(json, HOY)).toEqual({ value: 41263.57, date: '2026-11-03' });
  });

  it('no usa valores de días futuros', () => {
    const json = serie(['2026-11-10', 41300], ['2026-11-03', 41263.57]);
    expect(parseMindicador(json, HOY)?.date).toBe('2026-11-03');
  });

  it('de noche en Chile ya es el día siguiente en UTC y se usa el día de Chile', () => {
    const json = serie(['2026-11-04', 41268.88], ['2026-11-05', 41274.19]);
    expect(parseMindicador(json, new Date('2026-11-05T02:00:00Z'))?.date).toBe('2026-11-04');
  });

  it('ignora filas dañadas y respuestas que no son lo esperado', () => {
    expect(parseMindicador(null, HOY)).toBeNull();
    expect(parseMindicador('texto', HOY)).toBeNull();
    expect(parseMindicador({ serie: 'x' }, HOY)).toBeNull();
    expect(parseMindicador({ serie: [] }, HOY)).toBeNull();
    expect(parseMindicador({ serie: [{ fecha: 'ayer', valor: 5 }, { valor: 40000 }, null, 7] }, HOY)).toBeNull();
    const mezcla = { serie: [{ fecha: '2026-11-04T03:00:00.000Z', valor: 'mucho' }, { fecha: '2026-11-03T03:00:00.000Z', valor: 41263.57 }] };
    expect(parseMindicador(mezcla, HOY)?.date).toBe('2026-11-03');
  });

  it('un valor imposible para la UF se descarta en vez de mostrar precios absurdos', () => {
    expect(parseMindicador(serie(['2026-11-04', 0]), HOY)).toBeNull();
    expect(parseMindicador(serie(['2026-11-04', -5]), HOY)).toBeNull();
    expect(parseMindicador(serie(['2026-11-04', 38.65]), HOY)).toBeNull();
    expect(parseMindicador(serie(['2026-11-04', 41268880]), HOY)).toBeNull();
  });
});

describe('fuentes de tasas del paquete de mercado', () => {
  it('Chile declara dónde leer la UF; el resto de los mercados no necesita ninguna', () => {
    const feed = CHILE.rateFeeds?.find((f) => f.currency === 'UF');
    expect(feed?.url).toMatch(/^https:\/\/mindicador\.cl\/api\/uf/);
    expect(feed?.source).toBeTruthy();
    expect(getMarketPack('cl').rateFeeds).toBe(CHILE.rateFeeds);
  });
});
