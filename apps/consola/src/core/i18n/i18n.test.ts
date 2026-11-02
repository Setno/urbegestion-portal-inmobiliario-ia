import { describe, it, expect, beforeEach } from 'vitest';
import { translate, plural, capitalize, t, tn, useLocaleStore, LOCALES } from './i18n';
import { es } from './messages.es';
import { en } from './messages.en';
import { CHILE } from '@portal/mercados/cl';
import { useMarketStore } from '../market/useMarketStore';

const params = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('traducciones: cada texto existe en todos los idiomas', () => {
  it('español e inglés tienen exactamente las mismas claves', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it('ningún texto está vacío', () => {
    for (const dict of [es, en]) for (const [k, v] of Object.entries(dict)) expect([k, v.trim().length > 0]).toEqual([k, true]);
  });

  it('cada texto usa los mismos {parámetros} en español y en inglés', () => {
    for (const key of Object.keys(es) as (keyof typeof es)[]) {
      expect([key, params(en[key])]).toEqual([key, params(es[key])]);
    }
  });

  it('los textos con plural tienen sus dos formas (.one y .other) en cada idioma', () => {
    for (const dict of [es, en] as Record<string, string>[]) {
      const bases = Object.keys(dict).filter((k) => k.endsWith('.one')).map((k) => k.slice(0, -4));
      for (const base of bases) expect([base, `${base}.other` in dict]).toEqual([base, true]);
    }
  });
});

describe('textos propios de cada mercado', () => {
  it('Chile define sus textos en todos los idiomas, con las mismas claves y claves que existen en la base', () => {
    const locales = Object.keys(CHILE.messages).sort();
    expect(locales).toEqual([...LOCALES].sort());
    const [primero, ...resto] = locales.map((l) => Object.keys(CHILE.messages[l]).sort());
    for (const keys of resto) expect(keys).toEqual(primero);
    for (const key of primero) expect(key in es).toBe(true);
  });
});

describe('translate', () => {
  it('devuelve el texto del idioma pedido', () => {
    expect(translate('es', 'search.clear')).toBe('Limpiar');
    expect(translate('en', 'search.clear')).toBe('Clear');
  });

  it('reemplaza los {parámetros}', () => {
    expect(translate('es', 'grid.title', { scope: 'Valparaíso' })).toBe('Propiedades en Valparaíso');
    expect(translate('en', 'grid.title', { scope: 'Valparaíso' })).toBe('Properties in Valparaíso');
  });

  it('un parámetro que falta deja el {marcador} a la vista en vez de romper', () => {
    expect(translate('es', 'grid.title')).toBe('Propiedades en {scope}');
  });

  it('los textos del mercado tienen prioridad sobre los de la base', () => {
    expect(translate('es', 'market.locality', undefined, CHILE.messages.es)).toBe('comuna');
    expect(translate('es', 'market.locality')).toBe('localidad');
    expect(translate('en', 'market.locality', undefined, CHILE.messages.en)).toBe('commune');
  });

  it('una clave que no existe devuelve la propia clave (se nota en pantalla y no rompe)', () => {
    expect(translate('es', 'no.existe' as never)).toBe('no.existe');
  });
});

describe('plural', () => {
  it('elige la forma según el idioma', () => {
    expect(plural('es', 1)).toBe('one');
    expect(plural('es', 0)).toBe('other');
    expect(plural('es', 5)).toBe('other');
    expect(plural('en', 1)).toBe('one');
    expect(plural('en', 2)).toBe('other');
  });
});

describe('capitalize', () => {
  it('pone la primera letra en mayúscula', () => {
    expect(capitalize('comuna')).toBe('Comuna');
    expect(capitalize('')).toBe('');
  });
});

describe('t y tn con el idioma y el mercado activos', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'es' });
    useMarketStore.setState({ marketId: 'cl', serviceAreas: [] });
  });

  it('t usa el idioma activo y el mercado de la corredora', () => {
    expect(t('market.locality')).toBe('comuna');
    useLocaleStore.setState({ locale: 'en' });
    expect(t('market.locality')).toBe('commune');
    expect(t('search.clear')).toBe('Clear');
  });

  it('tn elige singular o plural con el número', () => {
    expect(tn('search.count', 1)).toBe('1 propiedad');
    expect(tn('search.count', 8)).toBe('8 propiedades');
    useLocaleStore.setState({ locale: 'en' });
    expect(tn('search.count', 1)).toBe('1 property');
    expect(tn('search.count', 8)).toBe('8 properties');
  });
});
