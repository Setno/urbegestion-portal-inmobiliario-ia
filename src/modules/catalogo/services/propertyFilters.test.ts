import { describe, it, expect } from 'vitest';
import { matchesCommune, matchesFilters } from './propertyFilters';
import { initialProperties } from '../data/initialProperties';
import { CHILE as CHILE_PACK_FOR_TEST } from '../../../markets/cl';
import type { PropertyFilterState } from '../types/property';

const sinFiltros: PropertyFilterState = {
  operation: 'todas',
  propertyType: 'todos',
  commune: 'Todas las comunas',
  minPriceUf: '',
  maxPriceUf: '',
  minBedrooms: '',
  minBathrooms: '',
  searchQuery: '',
};

describe('matchesCommune', () => {
  it('coincide con la comuna exacta, sin distinguir mayúsculas', () => {
    expect(matchesCommune('Vitacura', 'vitacura')).toBe(true);
    expect(matchesCommune('Vitacura', 'Las Condes')).toBe(false);
  });

  it('coincide cuando la opción elegida es más larga que la comuna guardada, y al revés', () => {
    expect(matchesCommune('Lo Barnechea', 'Lo Barnechea (La Dehesa / Los Trapenses)')).toBe(true);
    expect(matchesCommune('Melipilla (Agrícola / Parcelas)', 'Melipilla')).toBe(true);
  });

  it('reconoce los sectores con alias (Chicureo, Pirque)', () => {
    expect(matchesCommune('Chicureo / Colina', 'Colina (Chicureo / Chamisero)')).toBe(true);
    expect(matchesCommune('Pirque / Paine (Agrícola)', 'Pirque')).toBe(true);
    expect(matchesCommune('Providencia', 'Pirque')).toBe(false);
  });
});

describe('matchesFilters', () => {
  it('sin filtros deja pasar todo', () => {
    expect(initialProperties.every((p) => matchesFilters(p, sinFiltros))).toBe(true);
  });

  it('combina operación, precio y dormitorios', () => {
    const f = { ...sinFiltros, operation: 'arriendo' as const, maxPriceUf: 50, minBedrooms: 2 };
    const titulos = initialProperties.filter((p) => matchesFilters(p, f)).map((p) => p.commune);
    expect(titulos.sort()).toEqual(['Las Condes', 'Providencia']);
  });
});

describe('sectores definidos por el paquete de mercado', () => {
  const otroPais = { ...CHILE_PACK_FOR_TEST, sectorKeywords: ['costa'] };

  it('usa las palabras clave del paquete que se le pase, no las de Chile', () => {
    expect(matchesCommune('Costa Norte', 'Sector Costa (Playas)', otroPais)).toBe(true);
    expect(matchesCommune('Pirque / Paine (Agrícola)', 'Pirque', otroPais)).toBe(true); // coincide por contener el nombre
    expect(matchesCommune('Chicureo / Colina', 'Colina (Chicureo / Chamisero)', otroPais)).toBe(false);
  });
});
