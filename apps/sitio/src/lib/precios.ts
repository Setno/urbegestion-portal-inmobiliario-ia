import { convertMoney, type CurrencyRates } from '@portal/dinero';
import type { MarketPack } from '@portal/mercados';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';

export interface FiltroPrecio {
  moneda: string;
  min: number | null; // null: sin límite
  max: number | null;
}

// Un monto como se escribe en Chile: "5.000", "200.000.000", "3,5" o "1.250,5". Vacío es "sin límite" (null); lo que no es un monto también.
export function montoDesdeTexto(texto: string): number | null {
  const limpio = texto.trim();
  if (!limpio) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(limpio)) return Number(limpio.replace(/\./g, '').replace(',', '.'));
  if (/^\d+(,\d+)?$/.test(limpio)) return Number(limpio.replace(',', '.'));
  if (/^\d+\.\d{1,2}$/.test(limpio)) return Number(limpio);
  return null;
}

const convertible = (desde: string, hacia: string, pack: MarketPack, rates: CurrencyRates): boolean =>
  desde === hacia || convertMoney({ amount: 1, currency: desde }, hacia, pack, rates).currency === hacia;

// Las monedas en las que se puede comparar TODO el catálogo sin inventar una conversión: sin la tasa de la UF y con precios
// en UF y en pesos, no se ofrece ninguna.
export function monedasPosibles(propiedades: PublicProperty[], pack: MarketPack, rates: CurrencyRates): string[] {
  if (propiedades.length === 0) return [];
  const usadas = [...new Set(propiedades.map((p) => p.priceCurrency))];
  return pack.currencies.map((c) => c.code).filter((code) => usadas.every((desde) => convertible(desde, code, pack, rates)));
}

// Deja las propiedades cuyo precio, llevado a la moneda elegida, está entre el mínimo y el máximo (extremos incluidos).
// Si alguna no se puede convertir no filtra a ciegas: devuelve todo (la pantalla no ofrece ese caso).
export function filtrarPorPrecio(propiedades: PublicProperty[], filtro: FiltroPrecio, pack: MarketPack, rates: CurrencyRates): PublicProperty[] {
  if (filtro.min === null && filtro.max === null) return propiedades;
  if (!propiedades.every((p) => convertible(p.priceCurrency, filtro.moneda, pack, rates))) return propiedades;
  return propiedades.filter((p) => {
    const { amount } = convertMoney({ amount: p.priceAmount, currency: p.priceCurrency }, filtro.moneda, pack, rates);
    return (filtro.min === null || amount >= filtro.min) && (filtro.max === null || amount <= filtro.max);
  });
}
