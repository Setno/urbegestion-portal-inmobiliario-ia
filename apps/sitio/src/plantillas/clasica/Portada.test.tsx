// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, render } from '@testing-library/react';
import { NEUTRAL_CONTENT, neutralBrand } from '@portal/sitio-datos';
import { Portada } from './Portada';

const brand = neutralBrand('Casa Sur');
const hero = (extra: Partial<typeof NEUTRAL_CONTENT.hero> = {}) => ({ ...NEUTRAL_CONTENT.hero, ...extra });

// Simula la pantalla: ancha o angosta, con o sin "reducir movimiento".
function pantalla({ ancha, reducir = false }: { ancha: boolean; reducir?: boolean }) {
  vi.stubGlobal(
    'matchMedia',
    (consulta: string) => ({
      matches: consulta.includes('min-width') ? ancha : consulta.includes('reduce') ? reducir : false,
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  );
}

describe('portada propia de cada corredora (H-049)', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('una corredora sin foto ni video no carga nada de servidores ajenos: fondo neutro', () => {
    const html = renderToStaticMarkup(<Portada brand={brand} hero={hero()} />);
    expect(html).not.toContain('<video');
    expect(html).not.toContain('cloudfront');
    expect(html).not.toContain('unsplash');
    expect(html).not.toContain('<img');
  });

  it('con foto de portada la usa de fondo, sin video', () => {
    const html = renderToStaticMarkup(<Portada brand={brand} hero={hero({ imageUrl: 'https://a.cl/portada.jpg' })} />);
    expect(html).toContain('https://a.cl/portada.jpg');
    expect(html).not.toContain('<video');
  });

  it('en el HTML del servidor nunca hay video: el celular no lo descarga mientras no se sepa que la pantalla lo permite', () => {
    const html = renderToStaticMarkup(<Portada brand={brand} hero={hero({ videoUrl: 'https://a.cl/portada.mp4', imageUrl: 'https://a.cl/portada.jpg' })} />);
    expect(html).not.toContain('<video');
    expect(html).not.toContain('portada.mp4');
  });

  it('en una pantalla ancha, con el video elegido, lo reproduce sin sonido, con la foto como imagen previa', () => {
    pantalla({ ancha: true });
    const { container } = render(<Portada brand={brand} hero={hero({ videoUrl: 'https://a.cl/portada.mp4', imageUrl: 'https://a.cl/portada.jpg' })} />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.getAttribute('poster')).toBe('https://a.cl/portada.jpg');
    expect(video?.querySelector('source')?.getAttribute('src')).toBe('https://a.cl/portada.mp4');
    expect(video?.muted || video?.hasAttribute('muted')).toBe(true);
  });

  it('en un celular (pantalla angosta) no pone el video', () => {
    pantalla({ ancha: false });
    const { container } = render(<Portada brand={brand} hero={hero({ videoUrl: 'https://a.cl/portada.mp4' })} />);
    expect(container.querySelector('video')).toBeNull();
  });

  it('si la persona pidió reducir el movimiento, no pone el video', () => {
    pantalla({ ancha: true, reducir: true });
    const { container } = render(<Portada brand={brand} hero={hero({ videoUrl: 'https://a.cl/portada.mp4' })} />);
    expect(container.querySelector('video')).toBeNull();
  });
});
