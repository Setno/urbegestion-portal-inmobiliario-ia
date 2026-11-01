import { describe, it, expect } from 'vitest';
import { shortLocality, featuredLocalities, quickSearchChips } from './propertySummary';
import { initialProperties } from '../data/initialProperties';

describe('shortLocality', () => {
  it('deja solo el nombre principal de la comuna', () => {
    expect(shortLocality('Lo Barnechea (La Dehesa / Los Trapenses)')).toBe('Lo Barnechea');
    expect(shortLocality('Melipilla (Agrícola / Parcelas)')).toBe('Melipilla');
    expect(shortLocality('Pirque / Paine (Agrícola)')).toBe('Pirque');
    expect(shortLocality('Chicureo / Colina')).toBe('Chicureo');
    expect(shortLocality('Vitacura')).toBe('Vitacura');
  });
});

describe('featuredLocalities', () => {
  it('lista las comunas distintas de las propiedades, en orden y sin repetir', () => {
    expect(featuredLocalities(initialProperties, 4)).toEqual(['Vitacura', 'Lo Barnechea', 'Las Condes', 'Melipilla']);
  });

  it('con pocas propiedades devuelve las que haya, y sin propiedades una lista vacía', () => {
    expect(featuredLocalities(initialProperties.slice(0, 1), 4)).toEqual(['Vitacura']);
    expect(featuredLocalities([], 4)).toEqual([]);
  });
});

describe('quickSearchChips', () => {
  it('arma sugerencias de búsqueda con tipos distintos a partir de lo que hay publicado', () => {
    expect(quickSearchChips(initialProperties)).toEqual(['Deptos en Vitacura', 'Casas en Lo Barnechea', 'Parcelas en Melipilla']);
  });

  it('si hay pocos tipos completa con otras comunas, sin repetir sugerencias', () => {
    const soloDeptos = initialProperties.filter((p) => p.propertyType === 'departamento');
    const chips = quickSearchChips(soloDeptos);
    expect(new Set(chips).size).toBe(chips.length);
    expect(chips.every((c) => c.startsWith('Deptos en '))).toBe(true);
    expect(chips.length).toBeGreaterThan(1);
  });

  it('sin propiedades no sugiere nada', () => {
    expect(quickSearchChips([])).toEqual([]);
  });
});
