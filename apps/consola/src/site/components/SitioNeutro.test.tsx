import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DEFAULT_LAYOUT, DEFAULT_THEME, NEUTRAL_CONTENT, neutralBrand } from '@portal/sitio-datos';
import App from '../../App';
import { useBrandStore } from '../../core/brand/useBrandStore';
import { agencyConfig } from '../../core/config/agencyConfig';
import { demoSiteContent } from '../../core/config/demoSiteContent';

const original = useBrandStore.getState();

describe('sitio según los datos de la corredora', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
    vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    useBrandStore.setState(original, true);
  });

  it('una corredora nueva muestra su nombre y nada de otra corredora', () => {
    useBrandStore.setState({
      config: { ...agencyConfig, ...neutralBrand('Casa Sur') },
      themeColors: DEFAULT_THEME,
      layoutConfig: DEFAULT_LAYOUT,
      content: NEUTRAL_CONTENT,
    });
    const { container } = render(<App />);
    const texto = container.textContent ?? '';
    expect(screen.getAllByText('Casa Sur').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Encuentra tu próxima propiedad');
    for (const ajeno of ['Pilar', 'UrbeGestión', '@urbegestion', 'ACOP', '25+', '42 días', 'Verificada', 'Vitacura & Lo Barnechea', 'Santiago de Chile', 'Cartera selecta', 'alto estándar']) {
      expect(texto).not.toContain(ajeno);
    }
    // Sin textos ni testimonios no aparecen esas secciones ni los enlaces hacia ellas
    expect(container.querySelector('#sobre-mi')).toBeNull();
    expect(container.querySelector('#testimonios')).toBeNull();
    expect(container.querySelector('a[href="#sobre-mi"]')).toBeNull();
    expect(container.querySelector('a[href="#testimonios"]')).toBeNull();
    // Sin datos de contacto no quedan botones que no llevan a ninguna parte
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
    expect(container.querySelector('a[href^="https://wa.me/"]')).toBeNull();
    expect(container.querySelector('a[href*="instagram"]')).toBeNull();
  });

  it('muestra los textos cargados por la corredora en cada sección', () => {
    useBrandStore.setState({
      config: { ...agencyConfig, ...neutralBrand('Casa Sur'), stats: { yearsExperience: '12', propertiesSold: '', happyClients: '', averageDaysToSell: '' } },
      content: {
        hero: { ...NEUTRAL_CONTENT.hero, badge: 'Desde 2010 en Temuco', headline: 'Tu casa en el sur', verifiedLabel: 'Socia ACOP' },
        about: { eyebrow: 'Quiénes somos', title: 'Una corredora de barrio', paragraphs: ['Trabajamos en La Araucanía.'], credential: '', highlights: [{ title: 'Cercanía', text: 'Te atendemos directo.' }] },
        testimonials: { eyebrow: '', title: 'Nos recomiendan', subtitle: '', items: [{ name: 'Ana Soto', role: 'Compradora', photo: '', initials: 'AS', quote: 'Muy buena atención', stars: 4 }] },
        footer: { description: 'Corretaje en el sur.', coverageAreas: ['Temuco'], legalLine: 'RUT de ejemplo.' },
      },
    });
    const { container } = render(<App />);
    for (const propio of ['Desde 2010 en Temuco', 'Tu casa en el sur', 'Socia ACOP', 'Una corredora de barrio', 'Trabajamos en La Araucanía.', 'Cercanía', 'Nos recomiendan', 'Muy buena atención', 'Ana Soto', 'Corretaje en el sur.', 'Temuco', 'RUT de ejemplo.']) {
      expect(container.textContent).toContain(propio);
    }
    // Solo la estadística que la corredora cargó
    expect(container.textContent).toContain('Años de Trayectoria');
    expect(container.textContent).not.toContain('Propiedades Gestionadas');
  });

  it('sin Supabase, el prototipo sigue mostrando sus textos de ejemplo', () => {
    expect(useBrandStore.getState().content).toEqual(demoSiteContent);
    const { container } = render(<App />);
    expect(container.textContent).toContain('Testimonios de Clientes y Colegas');
    expect(container.textContent).toContain('Pilar Osorio');
  });
});
