import { describe, it, expect } from 'vitest';
import { getMarketPack } from '@portal/mercados';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';
import { filtrarPorPrecio, monedasPosibles, montoDesdeTexto } from './precios';

const cl = getMarketPack('cl');
const UF = 40000; // 1 UF = 40.000 pesos
const prop = (id: string, priceAmount: number, priceCurrency: string): PublicProperty =>
  ({ id, priceAmount, priceCurrency }) as PublicProperty;

const catalogo = [prop('barata', 2000, 'UF'), prop('media', 5000, 'UF'), prop('cara', 12000, 'UF'), prop('en-pesos', 200_000_000, 'CLP')];
const ids = (l: PublicProperty[]) => l.map((p) => p.id);

describe('montoDesdeTexto', () => {
  it('entiende los montos como se escriben en Chile', () => {
    expect(montoDesdeTexto('5000')).toBe(5000);
    expect(montoDesdeTexto('5.000')).toBe(5000);
    expect(montoDesdeTexto('200.000.000')).toBe(200_000_000);
    expect(montoDesdeTexto('3,5')).toBe(3.5);
    expect(montoDesdeTexto('1.250,5')).toBe(1250.5);
    expect(montoDesdeTexto('  7500  ')).toBe(7500);
  });

  it('lo vacío significa sin límite y lo que no es un monto no cuenta', () => {
    expect(montoDesdeTexto('')).toBeNull();
    expect(montoDesdeTexto('   ')).toBeNull();
    expect(montoDesdeTexto('abc')).toBeNull();
    expect(montoDesdeTexto('-5')).toBeNull();
    expect(montoDesdeTexto('1e9')).toBeNull();
    expect(montoDesdeTexto('0')).toBe(0);
  });
});

describe('monedasPosibles', () => {
  it('con la tasa de la UF se puede ver y filtrar en UF o en pesos', () => {
    expect(monedasPosibles(catalogo, cl, { UF })).toEqual(['UF', 'CLP']);
  });

  it('sin tasa solo ofrece lo que se puede comparar sin inventar: nada si hay precios en monedas distintas', () => {
    expect(monedasPosibles(catalogo, cl, {})).toEqual([]);
    expect(monedasPosibles([prop('a', 100, 'UF'), prop('b', 200, 'UF')], cl, {})).toEqual(['UF']);
  });

  it('sin propiedades no hay nada que filtrar', () => {
    expect(monedasPosibles([], cl, { UF })).toEqual([]);
  });
});

describe('filtrarPorPrecio', () => {
  it('sin mínimo ni máximo deja todo', () => {
    expect(ids(filtrarPorPrecio(catalogo, { moneda: 'UF', min: null, max: null }, cl, { UF }))).toEqual(['barata', 'media', 'cara', 'en-pesos']);
  });

  it('el rango incluye los extremos y compara en la moneda elegida', () => {
    expect(ids(filtrarPorPrecio(catalogo, { moneda: 'UF', min: 2000, max: 5000 }, cl, { UF }))).toEqual(['barata', 'media', 'en-pesos']);
    expect(ids(filtrarPorPrecio(catalogo, { moneda: 'UF', min: 6000, max: null }, cl, { UF }))).toEqual(['cara']);
    expect(ids(filtrarPorPrecio(catalogo, { moneda: 'UF', min: null, max: 1000 }, cl, { UF }))).toEqual([]);
  });

  it('una propiedad en pesos se compara con un rango en UF y al revés', () => {
    // 200.000.000 CLP = 5.000 UF
    expect(ids(filtrarPorPrecio(catalogo, { moneda: 'UF', min: 4900, max: 5100 }, cl, { UF }))).toEqual(['media', 'en-pesos']);
    // 2.000 UF = 80.000.000 CLP; 12.000 UF = 480.000.000 CLP
    expect(ids(filtrarPorPrecio(catalogo, { moneda: 'CLP', min: 100_000_000, max: 300_000_000 }, cl, { UF }))).toEqual(['media', 'en-pesos']);
  });

  it('si la moneda elegida no se puede convertir, no filtra a ciegas: no deja pasar ni oculta nada', () => {
    expect(ids(filtrarPorPrecio(catalogo, { moneda: 'CLP', min: 1, max: 2 }, cl, {}))).toEqual(['barata', 'media', 'cara', 'en-pesos']);
  });
});
