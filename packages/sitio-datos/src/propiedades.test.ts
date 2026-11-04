import { describe, it, expect } from 'vitest';
import { ESTADOS_VISIBLES, filtrarPropiedades, ordenarDestacadas, parsePublicProperties, parsePublicSettings, SIN_FILTROS, type PublicProperty } from './propiedades';

const fila = (extra: Record<string, unknown> = {}) => ({
  id: 'p1',
  title: 'Casa con vista',
  operation: 'venta',
  property_type: 'casa',
  price_amount: 18500,
  price_currency: 'UF',
  commune: 'Viña del Mar',
  address: 'Calle 1',
  bedrooms: 3,
  bathrooms: 2,
  built_area_m2: 120,
  total_area_m2: 300,
  parking_spots: 1,
  storage_units: 2,
  expenses_monthly_clp: 150000,
  map_query: 'Reñaca',
  featured: true,
  images: ['https://a.cl/1.jpg'],
  description: 'Luminosa',
  features: ['Piscina'],
  ...extra,
});

describe('parsePublicProperties', () => {
  it('convierte las filas de la base en propiedades para el sitio', () => {
    expect(parsePublicProperties([fila()])[0]).toEqual({
      id: 'p1',
      title: 'Casa con vista',
      operation: 'venta',
      propertyType: 'casa',
      priceAmount: 18500,
      priceCurrency: 'UF',
      commune: 'Viña del Mar',
      address: 'Calle 1',
      bedrooms: 3,
      bathrooms: 2,
      builtAreaM2: 120,
      totalAreaM2: 300,
      parkingSpots: 1,
      storageUnits: 2,
      expensesMonthlyClp: 150000,
      mapQuery: 'Reñaca',
      featured: true,
      images: ['https://a.cl/1.jpg'],
      description: 'Luminosa',
      features: ['Piscina'],
      reservada: false,
    });
  });

  it('una reservada se muestra marcada; una vendida o arrendada no se muestra (H-048)', () => {
    const lista = parsePublicProperties([
      fila({ id: 'libre', status: 'disponible' }),
      fila({ id: 'reservada', status: 'reservada' }),
      fila({ id: 'vendida', status: 'vendida' }),
      fila({ id: 'arrendada', status: 'arrendada' }),
      fila({ id: 'sin-estado' }),
    ]);
    expect(lista.map((p) => [p.id, p.reservada])).toEqual([['libre', false], ['reservada', true], ['sin-estado', false]]);
  });

  it('pide a la base solo las disponibles y reservadas', () => {
    expect(ESTADOS_VISIBLES).toBe('in.(disponible,reservada)');
  });

  it('descarta las filas inservibles y las imágenes que no son direcciones web', () => {
    const [p, ...resto] = parsePublicProperties([
      fila({ images: ['javascript:alert(1)', 'data:image/png;base64,AAA', 'https://a.cl/ok.jpg', 7] }),
      { id: 'sin-titulo' },
      fila({ id: 'sin-precio', price_amount: 'mucho' }),
      fila({ id: 'operacion-rara', operation: 'permuta' }),
      null,
    ]);
    expect(p.images).toEqual(['https://a.cl/ok.jpg']);
    expect(resto).toEqual([]);
  });

  it('una respuesta que no es una lista no rompe el sitio', () => {
    expect(parsePublicProperties(null)).toEqual([]);
    expect(parsePublicProperties({ message: 'error' })).toEqual([]);
  });

  it('un tipo de propiedad desconocido no bota la propiedad', () => {
    expect(parsePublicProperties([fila({ property_type: 'castillo', bedrooms: null })])[0]).toMatchObject({ propertyType: 'castillo', bedrooms: 0 });
  });
});

describe('parsePublicSettings', () => {
  it('lee el mercado y las zonas de la corredora', () => {
    expect(parsePublicSettings({ market: 'cl', service_areas: ['CL-VS', 3] })).toEqual({ marketId: 'cl', serviceAreas: ['CL-VS'] });
  });

  it('sin datos usa el mercado por defecto y todas las zonas', () => {
    expect(parsePublicSettings(null)).toEqual({ marketId: 'cl', serviceAreas: [] });
  });
});

describe('filtrarPropiedades', () => {
  const lista = parsePublicProperties([
    fila({ id: 'a', operation: 'venta', property_type: 'casa', commune: 'Viña del Mar', bedrooms: 3 }),
    fila({ id: 'b', operation: 'arriendo', property_type: 'departamento', commune: 'Providencia', bedrooms: 1, title: 'Depto céntrico', description: 'Cerca del metro', features: [] }),
  ]);
  const ids = (r: PublicProperty[]) => r.map((p) => p.id);

  it('sin filtros muestra todo', () => {
    expect(ids(filtrarPropiedades(lista, SIN_FILTROS))).toEqual(['a', 'b']);
  });

  it('filtra por operación, tipo, comuna y dormitorios mínimos', () => {
    expect(ids(filtrarPropiedades(lista, { ...SIN_FILTROS, operation: 'arriendo' }))).toEqual(['b']);
    expect(ids(filtrarPropiedades(lista, { ...SIN_FILTROS, propertyType: 'casa' }))).toEqual(['a']);
    expect(ids(filtrarPropiedades(lista, { ...SIN_FILTROS, commune: 'Providencia' }))).toEqual(['b']);
    expect(ids(filtrarPropiedades(lista, { ...SIN_FILTROS, minBedrooms: 2 }))).toEqual(['a']);
  });

  it('busca texto sin distinguir mayúsculas ni tildes', () => {
    expect(ids(filtrarPropiedades(lista, { ...SIN_FILTROS, query: 'CENTRICO' }))).toEqual(['b']);
    expect(ids(filtrarPropiedades(lista, { ...SIN_FILTROS, query: 'piscina' }))).toEqual(['a']);
    expect(ids(filtrarPropiedades(lista, { ...SIN_FILTROS, query: 'vina' }))).toEqual(['a']);
  });
});

describe('ordenarDestacadas', () => {
  it('pone primero las destacadas y respeta el orden del resto', () => {
    const lista = parsePublicProperties([
      fila({ id: 'a', featured: false }),
      fila({ id: 'b', featured: true }),
      fila({ id: 'c', featured: false }),
    ]);
    expect(ordenarDestacadas(lista).map((p) => p.id)).toEqual(['b', 'a', 'c']);
  });
});
