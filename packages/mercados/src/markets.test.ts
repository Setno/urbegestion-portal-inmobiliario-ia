import { describe, it, expect } from 'vitest';
import { normalizePhone, getMarketPack, selectedAreas, zonesForAreas, localitiesForAreas, DEFAULT_MARKET_ID, matchesCommune } from './index';
import { CHILE } from './cl';

describe('paquete de mercado Chile', () => {
  it('tiene las 16 regiones, con códigos ISO únicos', () => {
    expect(CHILE.areas).toHaveLength(16);
    expect(new Set(CHILE.areas.map((a) => a.id)).size).toBe(16);
    expect(CHILE.areas.every((a) => /^CL-[A-Z]{2}$/.test(a.id))).toBe(true);
  });

  it('tiene las 346 comunas de Chile sin repetir ninguna dentro de su región', () => {
    const porRegion = Object.fromEntries(CHILE.areas.map((a) => [a.id, a.zones.flatMap((z) => z.localities)]));
    const total = Object.values(porRegion).flat().length;
    expect(total).toBe(346);
    for (const lista of Object.values(porRegion)) expect(new Set(lista).size).toBe(lista.length);
  });

  it('cada región tiene el número oficial de comunas', () => {
    const cuenta = Object.fromEntries(CHILE.areas.map((a) => [a.id, a.zones.flatMap((z) => z.localities).length]));
    expect(cuenta).toEqual({
      'CL-AP': 4, 'CL-TA': 7, 'CL-AN': 9, 'CL-AT': 9, 'CL-CO': 15, 'CL-VS': 38, 'CL-RM': 52, 'CL-LI': 33,
      'CL-ML': 30, 'CL-NB': 21, 'CL-BI': 33, 'CL-AR': 32, 'CL-LR': 12, 'CL-LL': 30, 'CL-AI': 10, 'CL-MA': 11,
    });
  });

  it('la Región Metropolitana conserva sus sectores', () => {
    const rm = CHILE.areas.find((a) => a.id === 'CL-RM')!;
    expect(rm.zones.length).toBeGreaterThan(1);
    expect(rm.zones.flatMap((z) => z.localities)).toContain('Vitacura');
  });

  it('define sus monedas (UF y peso), la base y la de uso por defecto', () => {
    expect(CHILE.currencies.map((c) => c.code)).toEqual(['UF', 'CLP']);
    expect(CHILE.baseCurrency).toBe('CLP');
    expect(CHILE.defaultCurrency).toBe('UF');
    expect(CHILE.currencies.map((c) => c.code)).toContain(CHILE.defaultCurrency);
  });

  it('define el prefijo y el ejemplo de teléfono, coherentes entre sí', () => {
    expect(CHILE.phonePrefix).toBe('+56');
    expect(CHILE.phoneExample.startsWith(CHILE.phonePrefix)).toBe(true);
  });

  it('nombra el primer nivel región y el segundo comuna, en español y en inglés', () => {
    expect([CHILE.messages.es['market.area'], CHILE.messages.es['market.locality']]).toEqual(['región', 'comuna']);
    expect([CHILE.messages.en['market.area'], CHILE.messages.en['market.locality']]).toEqual(['region', 'commune']);
  });
});

describe('getMarketPack', () => {
  it('devuelve Chile por su id y también cuando el id es desconocido, vacío o nulo', () => {
    expect(getMarketPack('cl')).toBe(CHILE);
    expect(getMarketPack('zz')).toBe(CHILE);
    expect(getMarketPack('')).toBe(CHILE);
    expect(getMarketPack(null)).toBe(CHILE);
    expect(getMarketPack(undefined).id).toBe(DEFAULT_MARKET_ID);
  });
});

describe('zonas de trabajo de la corredora', () => {
  it('sin selección ofrece todo el país', () => {
    expect(selectedAreas(CHILE, [])).toHaveLength(16);
    expect(localitiesForAreas(CHILE, [])).toHaveLength(346);
  });

  it('con una región ofrece solo sus comunas', () => {
    const comunas = localitiesForAreas(CHILE, ['CL-VS']);
    expect(comunas).toContain('Viña del Mar');
    expect(comunas).not.toContain('Vitacura');
    expect(comunas).toHaveLength(38);
  });

  it('con varias regiones suma sus comunas y mantiene los sectores de la metropolitana', () => {
    const zonas = zonesForAreas(CHILE, ['CL-VS', 'CL-RM']);
    expect(zonas.map((z) => z.groupName)).toContain('Valparaíso');
    expect(zonas.map((z) => z.groupName)).toContain('Sector Oriente (Alta Plusvalía)');
    expect(localitiesForAreas(CHILE, ['CL-VS', 'CL-RM'])).toHaveLength(90);
  });

  it('ids que no existen se ignoran, y si ninguno existe vale todo el país', () => {
    expect(localitiesForAreas(CHILE, ['CL-VS', 'XX'])).toHaveLength(38);
    expect(localitiesForAreas(CHILE, ['XX'])).toHaveLength(346);
  });
});

describe('matchesCommune', () => {
  it('acepta nombres más largos o más cortos que el guardado', () => {
    expect(matchesCommune('Lo Barnechea', 'Lo Barnechea (La Dehesa / Los Trapenses)', CHILE)).toBe(true);
    expect(matchesCommune('Providencia', 'Ñuñoa', CHILE)).toBe(false);
  });

  it('H-050: un nombre contenido dentro de otro comuna no coincide (Pinto no es María Pinto)', () => {
    expect(matchesCommune('María Pinto', 'Pinto', CHILE)).toBe(false);
    expect(matchesCommune('Pinto', 'María Pinto', CHILE)).toBe(false);
    expect(matchesCommune('Las Cabras', 'Cabras', CHILE)).toBe(false);
  });

  it('H-050: sigue aceptando el nombre principal seguido de sector entre paréntesis o con barra', () => {
    expect(matchesCommune('Melipilla (Agrícola / Parcelas)', 'Melipilla', CHILE)).toBe(true);
    expect(matchesCommune('Pirque / Paine (Agrícola)', 'Pirque', CHILE)).toBe(true);
    expect(matchesCommune('pinto', 'Pinto', CHILE)).toBe(true);
  });

  it('H-050: una comuna vacía no coincide con nada', () => {
    expect(matchesCommune('', 'Providencia', CHILE)).toBe(false);
    expect(matchesCommune('Providencia', '', CHILE)).toBe(false);
    expect(matchesCommune('  ', 'Providencia', CHILE)).toBe(false);
  });
});

describe('normalizePhone (H-067)', () => {
  it('lleva los números de Chile al formato +56 9 1234 5678, escritos como se escriban', () => {
    for (const escrito of ['+56 9 1234 5678', '+56912345678', '56912345678', '912345678', '9 1234 5678', '(9) 1234-5678', '+56 (9) 1234 5678']) {
      expect(normalizePhone(escrito, CHILE)).toBe('+56 9 1234 5678');
    }
    expect(normalizePhone('22 345 6789', CHILE)).toBe('+56 2 2345 6789');
  });

  it('rechaza lo que no es un número: letras, muy corto, muy largo o incompleto', () => {
    for (const malo of ['', 'abc', '12345678', '9 1234 567', '+56 9 1234 56789', 'llámame al 912345678', '9123-45678x']) {
      expect(normalizePhone(malo, CHILE)).toBeNull();
    }
  });

  it('acepta un número de otro país con su + y lo deja sin espacios', () => {
    expect(normalizePhone('+1 (415) 555-2671', CHILE)).toBe('+14155552671');
    expect(normalizePhone('+54 9 11 2345 6789', CHILE)).toBe('+5491123456789');
    expect(normalizePhone('+1 23', CHILE)).toBeNull();
  });
});
