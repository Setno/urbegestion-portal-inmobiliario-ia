import type { MarketPack } from '@portal/mercados';

// Dinero con su moneda. Los precios se guardan siempre así y se muestran en la moneda que elija quien mira (ADR-008).
export interface Money {
  amount: number;
  currency: string;
}

// Valor de 1 unidad de cada moneda en la moneda base del mercado (la moneda base vale 1). En Chile: { UF: 38650 }.
export type CurrencyRates = Record<string, number>;

const rateOf = (code: string, pack: MarketPack, rates: CurrencyRates): number | undefined =>
  code === pack.baseCurrency ? 1 : rates[code];

const numberFormat = (pack: MarketPack, digits: number) =>
  new Intl.NumberFormat(pack.locale, { minimumFractionDigits: 0, maximumFractionDigits: digits });

// "18.500 UF", "$1.500.000 CLP"; una moneda que el paquete no define se muestra con su código ISO.
export function formatMoney(m: Money, pack: MarketPack): string {
  const def = pack.currencies.find((c) => c.code === m.currency);
  const digits = def?.fractionDigits ?? 2;
  const n = numberFormat(pack, digits).format(m.amount);
  return `${def?.symbol ?? ''}${n} ${m.currency}`;
}

// Valor en la moneda base; sin tasa conocida no se inventa una conversión (queda el monto tal cual).
export function toBase(m: Money, pack: MarketPack, rates: CurrencyRates): number {
  const rate = rateOf(m.currency, pack, rates);
  return rate === undefined ? m.amount : m.amount * rate;
}

export function convertMoney(m: Money, to: string, pack: MarketPack, rates: CurrencyRates): Money {
  if (m.currency === to) return m;
  const from = rateOf(m.currency, pack, rates);
  const target = rateOf(to, pack, rates);
  if (from === undefined || target === undefined) return m;
  return { amount: (m.amount * from) / target, currency: to };
}

// Para ordenar y filtrar precios en monedas distintas.
export const comparePrices = (a: Money, b: Money, pack: MarketPack, rates: CurrencyRates): number =>
  toBase(a, pack, rates) - toBase(b, pack, rates);

// Textos de un precio en la moneda elegida: `display` es el corto y `full` agrega la equivalencia.
export function priceLabels(
  price: Money,
  displayCurrency: string,
  pack: MarketPack,
  rates: CurrencyRates,
): { display: string; full: string } {
  const shown = convertMoney(price, displayCurrency, pack, rates);
  const display = formatMoney(shown, pack);
  if (shown.currency !== price.currency) return { display, full: `${display} (${formatMoney(price, pack)})` };
  if (shown.currency === pack.baseCurrency) return { display, full: display };
  const base = convertMoney(shown, pack.baseCurrency, pack, rates);
  return { display, full: base.currency === shown.currency ? display : `${display} ≈ ${formatMoney(base, pack)}` };
}
