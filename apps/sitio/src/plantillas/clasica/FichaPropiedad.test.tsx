import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_LAYOUT, DEFAULT_THEME, NEUTRAL_CONTENT, neutralBrand, type SiteData } from '@portal/sitio-datos';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';
import { FichaClasica } from './FichaPropiedad';
import { resolveFicha } from '../index';

const site = (overrides: Partial<SiteData> = {}): SiteData => ({
  templateId: 'clasica',
  brand: neutralBrand('Casa Sur'),
  theme: DEFAULT_THEME,
  layout: DEFAULT_LAYOUT,
  content: NEUTRAL_CONTENT,
  ...overrides,
});

const propiedad: PublicProperty = {
  id: 'p1',
  title: 'Casa con vista al mar',
  operation: 'venta',
  propertyType: 'casa',
  priceAmount: 18500,
  priceCurrency: 'UF',
  commune: 'Viña del Mar',
  address: 'Calle 1',
  bedrooms: 3,
  bathrooms: 1,
  builtAreaM2: 120,
  totalAreaM2: 300,
  parkingSpots: 2,
  storageUnits: 1,
  expensesMonthlyClp: 150000,
  mapQuery: '',
  featured: true,
  images: ['https://a.cl/1.jpg', 'https://a.cl/2.jpg'],
  description: 'Luminosa y amplia',
  features: ['Piscina', 'Quincho'],
};

const pintar = (p: PublicProperty = propiedad, s: SiteData = site()) =>
  renderToStaticMarkup(<FichaClasica site={s} propiedad={p} marketId="cl" enviarVisita={vi.fn()} />);

describe('ficha de la propiedad', () => {
  it('llega pintada con los datos: título, precio, características y descripción', () => {
    const html = pintar();
    expect(html).toContain('<h1');
    expect(html).toContain('Casa con vista al mar');
    expect(html).toContain('18.500 UF');
    expect(html).toContain('Viña del Mar');
    expect(html).toContain('120 m²');
    expect(html).toContain('300 m²');
    expect(html).toContain('1 Baño<');
    expect(html).toContain('Luminosa y amplia');
    expect(html).toContain('Piscina');
    expect(html).toContain('$150.000 CLP');
    expect(html).toContain('https://a.cl/1.jpg');
  });

  it('muestra el mapa con la dirección y permite volver al catálogo', () => {
    const html = pintar();
    expect(html).toContain('maps.google.com/maps?q=Calle%201%2C%20Vi%C3%B1a%20del%20Mar');
    expect(html).toContain('href="/#propiedades"');
  });

  it('usa la ubicación aproximada si la corredora la cargó', () => {
    expect(pintar({ ...propiedad, mapQuery: 'Reñaca, Viña' })).toContain('maps.google.com/maps?q=Re%C3%B1aca%2C%20Vi%C3%B1a');
  });

  it('una propiedad con pocos datos no muestra títulos ni casillas vacías', () => {
    const html = pintar({ ...propiedad, bedrooms: 0, bathrooms: 0, builtAreaM2: 0, totalAreaM2: 0, parkingSpots: 0, storageUnits: 0, expensesMonthlyClp: 0, description: '', features: [], images: [], address: '', commune: '' });
    expect(html).not.toContain('Descripción');
    expect(html).not.toContain('Características');
    expect(html).not.toContain('m²');
    expect(html).not.toContain('Gastos comunes');
    expect(html).not.toContain('maps.google');
  });

  it('el formulario de visita y su aviso de privacidad están presentes', () => {
    const html = pintar();
    expect(html).toContain('Solicitar visita');
    expect(html).toContain('la corredora usará tu nombre');
  });

  it('ofrece WhatsApp y calendario solo si la corredora los cargó', () => {
    const sin = pintar();
    expect(sin).not.toContain('wa.me');
    expect(sin).not.toContain('Agendar en línea');
    const brand = neutralBrand('Casa Sur');
    const con = pintar(propiedad, site({ brand: { ...brand, contact: { ...brand.contact, whatsapp: '56911112222' }, aiAgent: { ...brand.aiAgent, calendarUrl: 'https://cal.com/casasur' } } }));
    expect(con).toContain('https://wa.me/56911112222');
    expect(con).toContain('https://cal.com/casasur');
  });

  it('cada plantilla resuelve su ficha; una desconocida usa la predeterminada', () => {
    expect(resolveFicha('clasica')).toBe(FichaClasica);
    expect(resolveFicha('no-existe')).toBe(FichaClasica);
    expect(resolveFicha('constructor')).toBe(FichaClasica);
  });
});
