import { describe, it, expect } from 'vitest';
import { DEFAULT_LAYOUT, DEFAULT_THEME, NEUTRAL_CONTENT, neutralBrand, type SiteData } from '@portal/sitio-datos';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';
import { datosDeLaCorredora, datosDeLaFicha, descripcionDeLaFicha, mapaDelSitio, metadatosFicha, metadatosPortada, resumen, robots, urlDelSitio } from './seo';

const site = (extra: Partial<SiteData['brand']> = {}): SiteData => ({
  templateId: 'clasica',
  brand: { ...neutralBrand('Casa Sur'), ...extra },
  theme: DEFAULT_THEME,
  layout: DEFAULT_LAYOUT,
  content: { ...NEUTRAL_CONTENT, footer: { ...NEUTRAL_CONTENT.footer, description: 'Corredora en la Quinta Región.' } },
});

const propiedad = (extra: Partial<PublicProperty> = {}): PublicProperty => ({
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Casa con vista',
  operation: 'venta',
  propertyType: 'casa',
  priceAmount: 18500,
  priceCurrency: 'UF',
  commune: 'Viña del Mar',
  address: '',
  bedrooms: 3,
  bathrooms: 2,
  builtAreaM2: 120,
  totalAreaM2: 0,
  parkingSpots: 0,
  storageUnits: 0,
  expensesMonthlyClp: 0,
  mapQuery: '',
  featured: false,
  images: ['https://a.cl/1.jpg'],
  description: '',
  features: [],
  reservada: false,
  ...extra,
});

describe('SEO del sitio (H-031)', () => {
  it('la dirección del sitio usa https, salvo en el computador local', () => {
    expect(urlDelSitio('casasur.cl')).toBe('https://casasur.cl');
    expect(urlDelSitio('casasur.localhost')).toBe('http://casasur.localhost');
  });

  it('la portada tiene título, descripción, dirección canónica y vista previa para redes', () => {
    const meta = metadatosPortada(site({ tagline: 'Tu hogar en la costa', logoUrl: 'https://a.cl/logo.png' }), { host: 'www.casasur.cl', canonico: 'casasur.cl' });
    expect(meta.title).toBe('Casa Sur | Tu hogar en la costa');
    expect(meta.description).toBe('Corredora en la Quinta Región.');
    expect(meta.alternates?.canonical).toBe('/');
    expect(meta.metadataBase?.toString()).toBe('https://casasur.cl/');
    expect(meta.openGraph).toMatchObject({ siteName: 'Casa Sur', images: ['https://a.cl/logo.png'], locale: 'es_CL' });
    expect(meta.robots).toBeUndefined();
  });

  it('los previews y el computador local no se indexan', () => {
    expect(metadatosPortada(site(), { host: 'sitio-abc.vercel.app', canonico: 'urbe.miportal.cl' }).robots).toEqual({ index: false });
    expect(metadatosFicha(site(), propiedad(), { host: 'localhost', canonico: 'localhost' }).robots).toEqual({ index: false });
  });

  it('lo que no está disponible no se indexa', () => {
    expect(metadatosPortada(null, { host: 'casasur.cl', canonico: 'casasur.cl' })).toEqual({ title: 'Sitio no disponible', robots: { index: false } });
    expect(metadatosFicha(site(), null, { host: 'casasur.cl', canonico: 'casasur.cl' }).robots).toEqual({ index: false });
  });

  it('una ficha sin descripción se describe con sus datos; una larga se acorta', () => {
    expect(descripcionDeLaFicha(propiedad())).toBe('Casa con vista: propiedad en venta en Viña del Mar, 3 dormitorios.');
    const larga = resumen('palabra '.repeat(60));
    expect(larga.length).toBeLessThanOrEqual(160);
    expect(larga.endsWith('…')).toBe(true);
  });

  it('la ficha tiene su dirección canónica y su foto para redes', () => {
    const meta = metadatosFicha(site(), propiedad(), { host: 'casasur.miportal.cl', canonico: 'casasur.cl' });
    expect(meta.metadataBase?.toString()).toBe('https://casasur.cl/');
    expect(meta.title).toBe('Casa con vista | Casa Sur');
    expect(meta.alternates?.canonical).toBe('/propiedades/11111111-1111-4111-8111-111111111111');
    expect(meta.openGraph).toMatchObject({ images: ['https://a.cl/1.jpg'] });
  });

  it('los datos estructurados de la ficha llevan precio en CLF (la UF), disponibilidad y vendedor', () => {
    const datos = JSON.parse(datosDeLaFicha(site(), { propiedad: propiedad({ reservada: true }), marketId: 'cl' }, 'casasur.cl'));
    expect(datos).toMatchObject({
      '@type': 'RealEstateListing',
      url: 'https://casasur.cl/propiedades/11111111-1111-4111-8111-111111111111',
      offers: { price: 18500, priceCurrency: 'CLF', availability: 'https://schema.org/LimitedAvailability', seller: { name: 'Casa Sur' } },
      contentLocation: { address: { addressLocality: 'Viña del Mar' } },
    });
  });

  it('nadie puede cerrar la etiqueta <script> desde un texto de la propiedad', () => {
    const texto = datosDeLaFicha(site(), { propiedad: propiedad({ title: '</script><script>alert(1)</script>' }), marketId: 'cl' }, 'casasur.cl');
    expect(texto).not.toContain('</script>');
    expect(JSON.parse(texto).name).toBe('</script><script>alert(1)</script>');
  });

  it('la corredora en datos estructurados solo trae lo que cargó', () => {
    const datos = JSON.parse(datosDeLaCorredora(site({ contact: { ...neutralBrand('x').contact, phone: '+56911112222' } }), 'casasur.cl'));
    expect(datos).toEqual({ '@context': 'https://schema.org', '@type': 'RealEstateAgent', name: 'Casa Sur', url: 'https://casasur.cl', telephone: '+56911112222' });
  });

  it('el mapa del sitio trae la portada y cada ficha', () => {
    const xml = mapaDelSitio('casasur.cl', [propiedad(), propiedad({ id: '22222222-2222-4222-8222-222222222222' })]);
    expect(xml).toContain('<loc>https://casasur.cl/</loc>');
    expect(xml).toContain('<loc>https://casasur.cl/propiedades/22222222-2222-4222-8222-222222222222</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(3);
  });

  it('robots.txt apunta al mapa; sin corredora o en un preview pide no indexar', () => {
    expect(robots({ host: 'www.casasur.cl', canonico: 'casasur.cl' })).toBe('User-agent: *\nAllow: /\n\nSitemap: https://casasur.cl/sitemap.xml\n');
    expect(robots(null)).toBe('User-agent: *\nDisallow: /\n');
    expect(robots({ host: 'sitio-abc.vercel.app', canonico: 'urbe.miportal.cl' })).toBe('User-agent: *\nDisallow: /\n');
  });
});
