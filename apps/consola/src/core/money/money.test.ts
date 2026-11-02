import { describe, it, expect } from 'vitest';
import { formatMoney, convertMoney, toBase, comparePrices, priceLabels, type Money, type CurrencyRates } from './money';
import { CHILE } from '../../markets/cl';

const rates: CurrencyRates = { UF: 38650 }; // 1 UF = 38.650 CLP; CLP es la moneda base de Chile

describe('formatMoney', () => {
  it('la UF se muestra con su sigla después del monto, con puntos de miles', () => {
    expect(formatMoney({ amount: 18500, currency: 'UF' }, CHILE)).toBe('18.500 UF');
    expect(formatMoney({ amount: 45, currency: 'UF' }, CHILE)).toBe('45 UF');
  });

  it('los pesos chilenos se muestran con signo $, sin decimales y con su sigla', () => {
    expect(formatMoney({ amount: 1500000, currency: 'CLP' }, CHILE)).toBe('$1.500.000 CLP');
    expect(formatMoney({ amount: 1500000.6, currency: 'CLP' }, CHILE)).toBe('$1.500.001 CLP');
  });

  it('una moneda que el paquete no conoce se muestra con su código ISO', () => {
    expect(formatMoney({ amount: 250000, currency: 'USD' }, CHILE)).toBe('250.000 USD');
  });
});

describe('convertMoney y toBase', () => {
  it('convierte UF a pesos con la tasa de la UF', () => {
    expect(toBase({ amount: 100, currency: 'UF' }, CHILE, rates)).toBe(3865000);
    expect(convertMoney({ amount: 100, currency: 'UF' }, 'CLP', CHILE, rates)).toEqual({ amount: 3865000, currency: 'CLP' });
  });

  it('convierte pesos a UF', () => {
    const r = convertMoney({ amount: 3865000, currency: 'CLP' }, 'UF', CHILE, rates);
    expect(r.currency).toBe('UF');
    expect(r.amount).toBeCloseTo(100, 6);
  });

  it('la moneda base no cambia al convertirla a sí misma', () => {
    expect(convertMoney({ amount: 1000, currency: 'CLP' }, 'CLP', CHILE, rates)).toEqual({ amount: 1000, currency: 'CLP' });
  });

  it('sin tasa conocida para una moneda no inventa una conversión: devuelve el mismo monto sin convertir', () => {
    const usd: Money = { amount: 10, currency: 'USD' };
    expect(convertMoney(usd, 'CLP', CHILE, rates)).toEqual(usd);
  });
});

describe('comparePrices', () => {
  it('compara montos en monedas distintas por su valor en la moneda base', () => {
    const a: Money = { amount: 100, currency: 'UF' }; // 3.865.000
    const b: Money = { amount: 4000000, currency: 'CLP' };
    expect(comparePrices(a, b, CHILE, rates)).toBeLessThan(0);
    expect(comparePrices(b, a, CHILE, rates)).toBeGreaterThan(0);
    expect(comparePrices(a, a, CHILE, rates)).toBe(0);
  });
});

describe('priceLabels', () => {
  it('en UF muestra el precio y su equivalente en pesos', () => {
    const r = priceLabels({ amount: 18500, currency: 'UF' }, 'UF', CHILE, rates);
    expect(r.display).toBe('18.500 UF');
    expect(r.full).toBe('18.500 UF ≈ $715.025.000 CLP');
  });

  it('en pesos muestra el precio convertido y la referencia en UF', () => {
    const r = priceLabels({ amount: 100, currency: 'UF' }, 'CLP', CHILE, rates);
    expect(r.display).toBe('$3.865.000 CLP');
    expect(r.full).toBe('$3.865.000 CLP (100 UF)');
  });

  it('un precio ya cargado en pesos, visto en pesos, no repite la referencia', () => {
    const r = priceLabels({ amount: 150000000, currency: 'CLP' }, 'CLP', CHILE, rates);
    expect(r.display).toBe('$150.000.000 CLP');
    expect(r.full).toBe('$150.000.000 CLP');
  });
});
