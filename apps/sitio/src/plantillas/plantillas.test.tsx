import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_LAYOUT, DEFAULT_THEME, NEUTRAL_CONTENT, neutralBrand, type SiteData } from '@portal/sitio-datos';
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
    const html = renderToStaticMarkup(<Clasica site={site({ theme: { ...DEFAULT_THEME, primary: '#112233' } })} />);
    expect(html).toContain('Casa Sur');
    expect(html).toContain('#112233');
    expect(html).toContain('Encuentra tu próxima propiedad');
  });

  it('una corredora sin datos de contacto no muestra enlaces vacíos ni datos de otra', () => {
    const html = renderToStaticMarkup(<Clasica site={site()} />);
    expect(html).not.toContain('tel:');
    expect(html).not.toContain('mailto:');
    expect(html).not.toContain('wa.me');
    expect(html).not.toContain('Pilar');
    expect(html).not.toContain('UrbeGestión');
  });

  it('muestra el logo y el contacto cuando la corredora los cargó', () => {
    const brand = neutralBrand('Casa Sur');
    const html = renderToStaticMarkup(
      <Clasica
        site={site({
          brand: {
            ...brand,
            logoUrl: 'https://a.cl/logo.png',
            tagline: 'Tu casa en el sur',
            contact: { ...brand.contact, phone: '+56911112222', phoneDisplay: '+56 9 1111 2222', email: 'hola@casasur.cl' },
          },
        })}
      />,
    );
    expect(html).toContain('https://a.cl/logo.png');
    expect(html).toContain('Tu casa en el sur');
    expect(html).toContain('tel:+56911112222');
    expect(html).toContain('mailto:hola@casasur.cl');
  });
});
