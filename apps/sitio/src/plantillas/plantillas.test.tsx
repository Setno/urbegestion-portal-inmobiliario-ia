import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_LAYOUT, DEFAULT_THEME, NEUTRAL_CONTENT, neutralBrand, type SiteContent, type SiteData } from '@portal/sitio-datos';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';
import { Clasica } from './Clasica';
import { resolvePlantilla } from './index';

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
  bathrooms: 2,
  builtAreaM2: 120,
  totalAreaM2: 300,
  parkingSpots: 1,
  storageUnits: 0,
  expensesMonthlyClp: 0,
  mapQuery: '',
  featured: true,
  images: ['https://a.cl/casa.jpg'],
  description: 'Luminosa',
  features: [],
};

const pintar = (data: SiteData = site(), propiedades: PublicProperty[] = []) =>
  renderToStaticMarkup(<Clasica site={data} catalogo={{ propiedades, marketId: 'cl' }} />);

const contenidoCompleto: SiteContent = {
  ...NEUTRAL_CONTENT,
  about: {
    eyebrow: 'Quiénes somos',
    title: 'Corredores del sur',
    paragraphs: ['Vendemos casas desde siempre.'],
    credential: 'Corredor certificado',
    highlights: [{ title: 'Confianza', text: 'Sin letra chica' }],
  },
  testimonials: {
    eyebrow: '',
    title: 'Lo que dicen',
    subtitle: '',
    items: [{ name: 'Ana Pérez', role: 'Compradora', photo: '', initials: 'AP', quote: 'Excelente trato', stars: 4 }],
  },
  footer: { description: 'Tu corredora', coverageAreas: ['Puerto Varas'], legalLine: 'RUT 1-9' },
};

describe('resolvePlantilla', () => {
  it('usa la plantilla asignada a la corredora', () => {
    expect(resolvePlantilla('clasica')).toBe(Clasica);
  });

  it('una plantilla que no existe no rompe el sitio: usa la predeterminada', () => {
    expect(resolvePlantilla('no-existe')).toBe(Clasica);
    expect(resolvePlantilla('constructor')).toBe(Clasica);
  });
});

describe('plantilla clásica', () => {
  it('muestra el nombre de la corredora y sus colores', () => {
    const html = pintar(site({ theme: { ...DEFAULT_THEME, primary: '#112233' } }));
    expect(html).toContain('Casa Sur');
    expect(html).toContain('#112233');
    expect(html).toContain('Encuentra tu próxima propiedad');
  });

  it('una corredora sin datos no muestra enlaces vacíos, secciones vacías ni datos de otra', () => {
    const html = pintar();
    expect(html).not.toContain('tel:');
    expect(html).not.toContain('mailto:');
    expect(html).not.toContain('wa.me');
    expect(html).not.toContain('instagram');
    expect(html).not.toContain('id="sobre-nosotros"');
    expect(html).not.toContain('id="testimonios"');
    expect(html).not.toContain('Zonas de Cobertura');
    expect(html).not.toContain('Años de Trayectoria');
    expect(html).not.toContain('Pilar');
    expect(html).not.toContain('UrbeGestión');
  });

  it('muestra el logo y el contacto cuando la corredora los cargó', () => {
    const brand = neutralBrand('Casa Sur');
    const html = pintar(
      site({
        brand: {
          ...brand,
          logoUrl: 'https://a.cl/logo.png',
          logoWhiteUrl: 'https://a.cl/logo-blanco.png',
          tagline: 'Tu casa en el sur',
          contact: {
            ...brand.contact,
            phone: '+56911112222',
            phoneDisplay: '+56 9 1111 2222',
            email: 'hola@casasur.cl',
            whatsapp: '56911112222',
            whatsappMessage: 'Hola, quiero información',
            instagram: 'https://www.instagram.com/casasur/',
          },
          stats: { ...brand.stats, yearsExperience: '+20' },
        },
      }),
    );
    expect(html).toContain('https://a.cl/logo.png');
    expect(html).toContain('https://a.cl/logo-blanco.png');
    expect(html).toContain('Tu casa en el sur');
    expect(html).toContain('tel:+56911112222');
    expect(html).toContain('mailto:hola@casasur.cl');
    expect(html).toContain('https://wa.me/56911112222?text=Hola%2C%20quiero%20informaci%C3%B3n');
    expect(html).toContain('@casasur');
    expect(html).toContain('Años de Trayectoria');
  });

  it('un contacto con solo espacios o caracteres inservibles no crea enlaces rotos', () => {
    const brand = neutralBrand('Casa Sur');
    const html = pintar(site({ brand: { ...brand, contact: { ...brand.contact, phone: '  ', whatsapp: ' - ', email: 'hola' } } }));
    expect(html).not.toContain('tel:');
    expect(html).not.toContain('wa.me');
    expect(html).not.toContain('mailto:');
  });

  it('muestra sobre nosotros, testimonios y zonas cuando tienen contenido', () => {
    const html = pintar(site({ content: contenidoCompleto }));
    expect(html).toContain('id="sobre-nosotros"');
    expect(html).toContain('Vendemos casas desde siempre.');
    expect(html).toContain('Confianza');
    expect(html).toContain('id="testimonios"');
    expect(html).toContain('Excelente trato');
    expect(html).toContain('>AP<');
    expect(html).toContain('Puerto Varas');
    expect(html).toContain('RUT 1-9');
  });

  it('respeta las secciones que la corredora apagó, también en los menús', () => {
    const html = pintar(
      site({ content: contenidoCompleto, layout: { ...DEFAULT_LAYOUT, showAboutSection: false, showTestimonialsSection: false, showSearchFilter: false } }),
    );
    expect(html).not.toContain('sobre-nosotros');
    expect(html).not.toContain('testimonios');
    expect(html).not.toContain('id="buscador"');
  });

  it('llega ya pintada con las propiedades: los buscadores las ven sin ejecutar nada', () => {
    const html = pintar(site(), [propiedad]);
    expect(html).toContain('Casa con vista al mar');
    expect(html).toContain('18.500 UF');
    expect(html).toContain('https://a.cl/casa.jpg');
    expect(html).toContain('Viña del Mar');
    expect(html).toContain('href="/propiedades/p1"');
    expect(html).toContain('2 Baños');
    expect(pintar(site(), [{ ...propiedad, bathrooms: 1 }])).toContain('1 Baño<');
  });

  it('sin propiedades avisa en vez de dejar un hueco', () => {
    expect(pintar()).toContain('Aún no hay propiedades publicadas');
  });
});
