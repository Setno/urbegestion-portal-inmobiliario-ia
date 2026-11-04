import { describe, it, expect, vi } from 'vitest';
import type { MarketPack } from '@portal/mercados';
import { CHILE } from '@portal/mercados/cl';
import { fetchLiveRates } from './rates';

const HOY = new Date('2026-11-04T15:00:00Z');
const respuesta = (cuerpo: unknown, ok = true) => ({ ok, json: async () => cuerpo });
const uf = (valor: number) => ({ serie: [{ fecha: '2026-11-04T03:00:00.000Z', valor }] });

describe('tasas del día desde la fuente del mercado', () => {
  it('lee la UF de Chile y la deja como tasa en pesos, con su fecha y su fuente', async () => {
    const fetcher = vi.fn().mockResolvedValue(respuesta(uf(41268.88)));
    const r = await fetchLiveRates(CHILE, fetcher, HOY);
    expect(r.rates).toEqual({ UF: 41268.88 });
    expect(r.readings).toEqual([{ currency: 'UF', value: 41268.88, date: '2026-11-04', source: expect.stringContaining('Banco Central') }]);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('mindicador.cl'));
  });

  it('si la fuente falla, responde con error o trae basura, no inventa una tasa', async () => {
    expect((await fetchLiveRates(CHILE, vi.fn().mockRejectedValue(new Error('sin red')), HOY)).rates).toEqual({});
    expect((await fetchLiveRates(CHILE, vi.fn().mockResolvedValue(respuesta({}, false)), HOY)).rates).toEqual({});
    expect((await fetchLiveRates(CHILE, vi.fn().mockResolvedValue(respuesta('basura')), HOY)).rates).toEqual({});
    const sinJson = { ok: true, json: async () => Promise.reject(new Error('no es json')) };
    expect((await fetchLiveRates(CHILE, vi.fn().mockResolvedValue(sinJson), HOY)).readings).toEqual([]);
  });

  it('deja registro de por qué una moneda quedó sin tasa', async () => {
    const motivos: string[] = [];
    const registrar = (moneda: string, motivo: string) => motivos.push(`${moneda}: ${motivo}`);
    await fetchLiveRates(CHILE, vi.fn().mockRejectedValue(new Error('sin red')), HOY, registrar);
    await fetchLiveRates(CHILE, vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }), HOY, registrar);
    await fetchLiveRates(CHILE, vi.fn().mockResolvedValue(respuesta({ serie: [] })), HOY, registrar);
    expect(motivos).toEqual(['UF: sin red', expect.stringContaining('UF: la fuente respondió con error (503)'), expect.stringContaining('UF: la respuesta no tiene un valor')]);
  });

  it('un mercado sin fuentes no pide nada: fuera de Chile no hay UF', async () => {
    const otro: MarketPack = { ...CHILE, id: 'xx', baseCurrency: 'USD', defaultCurrency: 'USD', currencies: [{ code: 'USD', symbol: '$', fractionDigits: 2 }], rateFeeds: undefined };
    const fetcher = vi.fn();
    const r = await fetchLiveRates(otro, fetcher, HOY);
    expect(fetcher).not.toHaveBeenCalled();
    expect(r).toEqual({ rates: {}, readings: [] });
  });
});
