import { describe, it, expect } from 'vitest';
import { DEFAULT_TEMPLATE_ID, DEFAULT_THEME, NEUTRAL_CONTENT, hasAbout, hasTestimonials, instagramHandle, neutralBrand, normalizeUrl, parseSiteData, safeUrl, serializeBrand } from './siteData';

describe('parseSiteData (lo que llega de la base nunca rompe el sitio)', () => {
  it('sin datos de marca, una corredora nueva queda neutra y con su propio nombre', () => {
    const site = parseSiteData({ tenantName: 'Casa Sur', templateId: 'clasica', brand: {}, theme: {}, layout: {}, content: {} });
    expect(site?.brand.brandName).toBe('Casa Sur');
    expect(site?.brand.brokerName).toBe('Casa Sur');
    expect(site?.brand.contact.phoneDisplay).toBe('');
    expect(site?.brand.stats.propertiesSold).toBe('');
    expect(site?.content.hero.headline).not.toBe('');
    expect(site?.content.testimonials.items).toEqual([]);
    expect(site?.content.about.paragraphs).toEqual([]);
    expect(site?.theme).toEqual(DEFAULT_THEME);
    expect(site?.layout.showAiChat).toBe(true);
  });

  it('respeta lo guardado por la corredora y completa lo que falta', () => {
    const site = parseSiteData({
      tenantName: 'Casa Sur',
      brand: { brandName: 'Casa Sur Propiedades', experienceYears: 12, contact: { email: 'hola@casasur.cl' } },
      theme: { primary: '#112233' },
      layout: { showAboutSection: false },
    });
    expect(site?.brand.brandName).toBe('Casa Sur Propiedades');
    expect(site?.brand.experienceYears).toBe(12);
    expect(site?.brand.contact.email).toBe('hola@casasur.cl');
    expect(site?.brand.contact.phone).toBe('');
    expect(site?.theme.primary).toBe('#112233');
    expect(site?.theme.accent).toBe(DEFAULT_THEME.accent);
    expect(site?.layout.showAboutSection).toBe(false);
    expect(site?.layout.showSearchFilter).toBe(true);
  });

  it('descarta enlaces peligrosos e imágenes incrustadas', () => {
    const site = parseSiteData({
      tenantName: 'X',
      brand: {
        logoUrl: 'data:image/png;base64,AAAA',
        brokerPhotoUrl: 'javascript:alert(1)',
        contact: { instagram: 'javascript:alert(1)' },
        aiAgent: { calendarUrl: 'https://cal.com/casasur' },
      },
    });
    expect(site?.brand.logoUrl).toBe('');
    expect(site?.brand.brokerPhotoUrl).toBe('');
    expect(site?.brand.contact.instagram).toBe('');
    expect(site?.brand.aiAgent.calendarUrl).toBe('https://cal.com/casasur');
  });

  it('un color que no es hexadecimal no llega al CSS del sitio', () => {
    const site = parseSiteData({ tenantName: 'X', theme: { primary: 'red;background:url(x)', accent: '#ABCDEF' } });
    expect(site?.theme.primary).toBe(DEFAULT_THEME.primary);
    expect(site?.theme.accent).toBe('#ABCDEF');
  });

  it('ignora textos con tipos equivocados y testimonios sin cita', () => {
    const site = parseSiteData({
      tenantName: 'X',
      content: {
        hero: { headline: 42 },
        about: { paragraphs: ['Uno', 7, ''], highlights: [{ title: 'A', text: 'B' }, { title: 3 }] },
        testimonials: { items: [{ name: 'Ana', quote: 'Muy bien', stars: 99 }, { name: 'Sin cita' }, 'x'] },
        footer: { coverageAreas: ['Ñuñoa', null] },
      },
    });
    expect(site?.content.hero.headline).toBe('');
    expect(site?.content.about.paragraphs).toEqual(['Uno']);
    expect(site?.content.about.highlights).toEqual([{ title: 'A', text: 'B' }]);
    expect(site?.content.testimonials.items).toEqual([{ name: 'Ana', role: '', photo: '', initials: 'A', quote: 'Muy bien', stars: 5 }]);
    expect(site?.content.footer.coverageAreas).toEqual(['Ñuñoa']);
  });

  it('una plantilla sin nombre válido usa la predeterminada', () => {
    expect(parseSiteData({ tenantName: 'X', templateId: 7 })?.templateId).toBe(DEFAULT_TEMPLATE_ID);
    expect(parseSiteData({ tenantName: 'X', templateId: 'moderna' })?.templateId).toBe('moderna');
  });

  it('una respuesta sin corredora devuelve null', () => {
    expect(parseSiteData(null)).toBeNull();
    expect(parseSiteData('x')).toBeNull();
    expect(parseSiteData({})).toBeNull();
  });
});

describe('safeUrl', () => {
  it('solo acepta http y https', () => {
    expect(safeUrl('https://a.cl/x.png')).toBe('https://a.cl/x.png');
    expect(safeUrl('http://a.cl')).toBe('http://a.cl');
    expect(safeUrl('  JAVASCRIPT:alert(1)')).toBe('');
    expect(safeUrl('/relativa.png')).toBe('');
    expect(safeUrl(5)).toBe('');
  });
});

describe('normalizeUrl', () => {
  it('completa una dirección escrita sin https://', () => {
    expect(normalizeUrl('instagram.com/casasur')).toBe('https://instagram.com/casasur');
    expect(normalizeUrl(' www.casasur.cl/logo.png ')).toBe('https://www.casasur.cl/logo.png');
    expect(normalizeUrl('https://a.cl/x.png')).toBe('https://a.cl/x.png');
    expect(normalizeUrl('')).toBe('');
  });

  it('rechaza lo que no es una dirección web', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('data:image/png;base64,AAAA')).toBeNull();
    expect(normalizeUrl('casasur')).toBeNull();
    expect(normalizeUrl('casa sur.cl')).toBeNull();
  });
});

describe('secciones opcionales', () => {
  it('una corredora sin textos no tiene "Sobre nosotros" ni testimonios', () => {
    expect(hasAbout(NEUTRAL_CONTENT)).toBe(false);
    expect(hasTestimonials(NEUTRAL_CONTENT)).toBe(false);
  });

  it('basta el título o un párrafo para mostrar "Sobre nosotros"', () => {
    expect(hasAbout({ ...NEUTRAL_CONTENT, about: { ...NEUTRAL_CONTENT.about, title: 'Quiénes somos' } })).toBe(true);
    expect(hasAbout({ ...NEUTRAL_CONTENT, about: { ...NEUTRAL_CONTENT.about, paragraphs: ['Hola'] } })).toBe(true);
  });
});

describe('instagramHandle', () => {
  it('saca el perfil de la dirección y no inventa uno', () => {
    expect(instagramHandle('https://www.instagram.com/casasur/')).toBe('@casasur');
    expect(instagramHandle('https://instagram.com/casa.sur?hl=es')).toBe('@casa.sur');
    expect(instagramHandle('https://a.cl')).toBe('');
    expect(instagramHandle('')).toBe('');
  });
});

describe('serializeBrand', () => {
  it('guarda solo los datos públicos de la marca, sin los ajustes internos', () => {
    const brand = neutralBrand('Casa Sur');
    const saved = serializeBrand({ ...brand, market: { ufValueClp: 1 }, features: { mortgageSimulator: true } } as typeof brand);
    expect(saved.brandName).toBe('Casa Sur');
    expect(saved).not.toHaveProperty('market');
    expect(saved).not.toHaveProperty('features');
  });
});
