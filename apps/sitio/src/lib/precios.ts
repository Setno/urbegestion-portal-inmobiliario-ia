import { convertMoney, type CurrencyRates } from '@portal/dinero';
import type { MarketPack } from '@portal/mercados';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';

export interface FiltroPrecio {
  moneda: string;
  min: number | null; // null: sin límite
  max: number | null;
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

// El paso de la banda: de 1, 2 o 5 por una potencia de diez, el menor que deje unos 100 pasos entre los extremos.
function pasoDeBanda(rango: number): number {
  const objetivo = rango / 100;
  for (let potencia = -2; potencia < 15; potencia++) {
    for (const base of [1, 2, 5]) {
      const paso = base * 10 ** potencia;
      if (paso >= objetivo) return Number(paso.toFixed(2));
    }
  }
  return rango;
}

const redondear = (valor: number): number => Number(valor.toFixed(6));

export interface RangoDePrecios {
  min: number;
  max: number;
  paso: number;
}

// Los extremos de la banda de precio: del más bajo al más alto del catálogo en la moneda elegida, redondeados hacia afuera a un
// paso cómodo para que ninguna propiedad quede fuera. Sin banda (null) si hay un solo precio o no se puede convertir todo.
export function rangoDePrecios(propiedades: PublicProperty[], moneda: string, pack: MarketPack, rates: CurrencyRates): RangoDePrecios | null {
  if (propiedades.length === 0) return null;
  if (!propiedades.every((p) => convertible(p.priceCurrency, moneda, pack, rates))) return null;
  const montos = propiedades.map((p) => convertMoney({ amount: p.priceAmount, currency: p.priceCurrency }, moneda, pack, rates).amount);
  const bajo = Math.min(...montos);
  const alto = Math.max(...montos);
  if (!(alto > bajo)) return null;
  const paso = pasoDeBanda(alto - bajo);
  return {
    min: Math.max(0, redondear(Math.floor(bajo / paso + 1e-9) * paso)),
    max: redondear(Math.ceil(alto / paso - 1e-9) * paso),
    paso,
  };
}
