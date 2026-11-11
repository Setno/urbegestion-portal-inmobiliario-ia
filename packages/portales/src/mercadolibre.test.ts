import { describe, it, expect } from 'vitest';
import { toMercadoLibreItem, type PropiedadParaPortal, type OpcionesMercadoLibre, type ResultadoAviso } from './mercadolibre';

const propiedad: PropiedadParaPortal = {
  title: 'Departamento luminoso en Providencia con vista despejada',
  operation: 'venta',
  propertyType: 'departamento',
  priceAmount: 5000,
  priceCurrency: 'UF',
  commune: 'Providencia',
  address: 'Av. Providencia 1234',
  bedrooms: 3,
  bathrooms: 2,
  builtAreaM2: 85,
  totalAreaM2: 95,
  parkingSpots: 1,
  storageUnits: 1,
  images: ['https://fotos.ejemplo.cl/a.jpg', 'https://fotos.ejemplo.cl/b.jpg'],
  description: 'Hermoso departamento.',
  features: ['Piscina', 'Gimnasio'],
  coordinates: { lat: -33.43, lng: -70.61 },
};

const opciones: OpcionesMercadoLibre = {
  categories: { 'venta:departamento': 'MLC-CAT-VD', 'arriendo:departamento': 'MLC-CAT-AD' },
  rates: { UF: 38000 },
};

const errores = (r: ResultadoAviso): string[] => ('errors' in r ? r.errors : []);

describe('toMercadoLibreItem', () => {
  it('arma el aviso con categoría, moneda en pesos, fotos y atributos', () => {
    const r = toMercadoLibreItem(propiedad, opciones);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.item.category_id).toBe('MLC-CAT-VD');
    // la UF se publica en UF (CLF en Mercado Libre), sin convertir a pesos
    expect(r.item.currency_id).toBe('CLF');
    expect(r.item.price).toBe(5000);
    expect(r.item.buying_mode).toBe('classified');
    expect(r.item.listing_type_id).toBe('silver');
    expect(r.item.pictures).toEqual([
      { source: 'https://fotos.ejemplo.cl/a.jpg' },
      { source: 'https://fotos.ejemplo.cl/b.jpg' },
    ]);
    const attr = (id: string) => r.item.attributes.find((a) => a.id === id);
    expect(attr('BEDROOMS')?.value_name).toBe('3');
    expect(attr('FULL_BATHROOMS')?.value_name).toBe('2');
    expect(attr('PARKING_LOTS')?.value_name).toBe('1');
    expect(attr('COVERED_AREA')?.value_struct).toEqual({ number: 85, unit: 'm²' });
    expect(attr('TOTAL_AREA')?.value_struct).toEqual({ number: 95, unit: 'm²' });
  });

  it('usa la categoría de arriendo cuando la operación es arriendo', () => {
    const r = toMercadoLibreItem({ ...propiedad, operation: 'arriendo', priceAmount: 600000, priceCurrency: 'CLP' }, opciones);
    expect(r.ok && r.item.category_id).toBe('MLC-CAT-AD');
    expect(r.ok && r.item.price).toBe(600000);
  });

  it('acepta la moneda en minúsculas o con espacios; la UF conserva sus decimales (hasta 2)', () => {
    const r = toMercadoLibreItem({ ...propiedad, priceAmount: 1234.567, priceCurrency: ' uf ' }, { ...opciones, rates: {} });
    expect(r.ok && r.item.currency_id).toBe('CLF');
    expect(r.ok && r.item.price).toBe(1234.57);
  });

  it('la UF no necesita tasa de conversión: se publica igual sin ella', () => {
    expect(toMercadoLibreItem(propiedad, { ...opciones, rates: {} }).ok).toBe(true);
  });

  it('USD se publica en dólares y los pesos redondean a enteros', () => {
    const usd = toMercadoLibreItem({ ...propiedad, priceAmount: 250000.5, priceCurrency: 'USD' }, opciones);
    expect(usd.ok && usd.item.currency_id).toBe('USD');
    expect(usd.ok && usd.item.price).toBe(250000.5);
    const clp = toMercadoLibreItem({ ...propiedad, priceAmount: 150000.6, priceCurrency: 'CLP' }, opciones);
    expect(clp.ok && clp.item.price).toBe(150001);
  });

  it('otra moneda se convierte a pesos con su tasa', () => {
    const r = toMercadoLibreItem({ ...propiedad, priceAmount: 100, priceCurrency: 'EUR' }, { ...opciones, rates: { EUR: 1000 } });
    expect(r.ok && r.item.currency_id).toBe('CLP');
    expect(r.ok && r.item.price).toBe(100000);
  });

  it('usa el tipo de aviso indicado, o silver si viene vacío', () => {
    const a = toMercadoLibreItem(propiedad, { ...opciones, listingTypeId: 'gold' });
    const b = toMercadoLibreItem(propiedad, { ...opciones, listingTypeId: '' });
    expect(a.ok && a.item.listing_type_id).toBe('gold');
    expect(b.ok && b.item.listing_type_id).toBe('silver');
  });

  it('recorta el título a 60 caracteres', () => {
    const r = toMercadoLibreItem({ ...propiedad, title: 'x'.repeat(90) }, opciones);
    expect(r.ok && r.item.title.length).toBe(60);
  });

  it('incluye ubicación con coordenadas y la dirección; sin coordenadas solo la dirección', () => {
    const con = toMercadoLibreItem(propiedad, opciones);
    expect(con.ok && con.item.location).toEqual({ address_line: 'Av. Providencia 1234', latitude: -33.43, longitude: -70.61 });
    const sin = toMercadoLibreItem({ ...propiedad, coordinates: undefined }, opciones);
    expect(sin.ok && sin.item.location).toEqual({ address_line: 'Av. Providencia 1234' });
  });

  it('arma la descripción con el texto y las características', () => {
    const r = toMercadoLibreItem(propiedad, opciones);
    expect(r.ok && r.description).toContain('Hermoso departamento.');
    expect(r.ok && r.description).toContain('Piscina');
  });

  it('descarta fotos que no son direcciones públicas (data:, blob:, vacías)', () => {
    const r = toMercadoLibreItem({ ...propiedad, images: ['data:image/png;base64,AAA', 'blob:x', '', 'https://fotos.ejemplo.cl/ok.jpg'] }, opciones);
    expect(r.ok && r.item.pictures).toEqual([{ source: 'https://fotos.ejemplo.cl/ok.jpg' }]);
  });

  it('no inventa datos: omite atributos en cero o sin valor', () => {
    const r = toMercadoLibreItem({ ...propiedad, parkingSpots: 0, builtAreaM2: 0 }, opciones);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.item.attributes.find((a) => a.id === 'PARKING_LOTS')).toBeUndefined();
    expect(r.item.attributes.find((a) => a.id === 'COVERED_AREA')).toBeUndefined();
  });

  describe('rechaza con motivos claros', () => {
    it('sin fotos públicas', () => {
      const r = toMercadoLibreItem({ ...propiedad, images: [] }, opciones);
      expect(r).toEqual({ ok: false, errors: ['Falta al menos una foto con dirección pública.'] });
    });

    it('precio en una moneda sin tasa (no se inventa la conversión)', () => {
      const r = toMercadoLibreItem({ ...propiedad, priceCurrency: 'EUR' }, { ...opciones, rates: {} });
      expect(r.ok).toBe(false);
      expect(errores(r)[0]).toMatch(/EUR/);
    });

    it('precio cero o negativo', () => {
      const r = toMercadoLibreItem({ ...propiedad, priceAmount: 0 }, opciones);
      expect(errores(r)).toEqual(['El precio debe ser mayor que cero.']);
    });

    it.each([0, -5, NaN, Infinity])('tasa inválida (%s) no se usa para convertir', (tasa) => {
      const r = toMercadoLibreItem({ ...propiedad, priceCurrency: 'EUR' }, { ...opciones, rates: { EUR: tasa } });
      expect(errores(r)[0]).toMatch(/EUR/);
    });

    it.each([NaN, Infinity])('monto inválido (%s)', (monto) => {
      const r = toMercadoLibreItem({ ...propiedad, priceAmount: monto }, opciones);
      expect(errores(r)).toEqual(['El precio debe ser mayor que cero.']);
    });

    it('precio que redondea a cero pesos', () => {
      const r = toMercadoLibreItem({ ...propiedad, priceAmount: 0.4, priceCurrency: 'CLP' }, opciones);
      expect(errores(r)).toEqual(['El precio es demasiado bajo (menos de $1).']);
    });

    it('moneda vacía tiene mensaje propio', () => {
      const r = toMercadoLibreItem({ ...propiedad, priceCurrency: ' ' }, opciones);
      expect(errores(r)).toEqual(['Falta la moneda del precio.']);
    });

    it('sin dirección ni coordenadas válidas', () => {
      const r = toMercadoLibreItem({ ...propiedad, address: ' ', coordinates: { lat: 95, lng: 10 } }, opciones);
      expect(errores(r)).toEqual(['Falta la dirección o las coordenadas.']);
    });

    it('tipo de propiedad sin categoría configurada', () => {
      const r = toMercadoLibreItem({ ...propiedad, propertyType: 'terreno' }, opciones);
      expect(errores(r)[0]).toMatch(/categor/i);
    });

    it('sin superficie total ni construida', () => {
      const r = toMercadoLibreItem({ ...propiedad, totalAreaM2: 0, builtAreaM2: 0 }, opciones);
      expect(errores(r)).toEqual(['Falta la superficie (total o construida).']);
    });

    it('acumula todos los problemas juntos', () => {
      const r = toMercadoLibreItem({ ...propiedad, images: [], priceAmount: 0, title: '  ' }, opciones);
      expect(errores(r)).toEqual([
        'Falta el título.',
        'El precio debe ser mayor que cero.',
        'Falta al menos una foto con dirección pública.',
      ]);
    });
  });
});
