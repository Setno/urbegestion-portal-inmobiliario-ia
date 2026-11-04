import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_LAYOUT, DEFAULT_THEME, NEUTRAL_CONTENT, neutralBrand, type SiteData } from '@portal/sitio-datos';
import { getCatalogo } from '../../lib/getCatalogo';
import { getFunciones } from '../../lib/getFunciones';
import { getSite } from '../../lib/getSite';
import { resolverVisita } from '../../lib/direccion';
import Page, { generateMetadata } from './page';

vi.mock('../../lib/getSite', () => ({ getSite: vi.fn() }));
vi.mock('../../lib/getCatalogo', () => ({ getCatalogo: vi.fn() }));
vi.mock('../../lib/getFunciones', () => ({ getFunciones: vi.fn() }));
vi.mock('../../lib/getTasas', () => ({ getTasas: vi.fn().mockResolvedValue({ rates: {}, readings: [] }) }));
vi.mock('../../lib/direccion', () => ({ resolverVisita: vi.fn() }));

const site: SiteData = { templateId: 'clasica', brand: neutralBrand('Casa Sur'), theme: DEFAULT_THEME, layout: DEFAULT_LAYOUT, content: NEUTRAL_CONTENT };
const env = { url: 'https://proyecto.supabase.co', key: 'k', tenantId: 't1', canonico: 'casasur.cl' };
const params = Promise.resolve({ sitio: 'casasur.miportal.cl' });

describe('portada del sitio', () => {
  beforeEach(() => {
    vi.mocked(resolverVisita).mockResolvedValue(env);
    vi.mocked(getSite).mockResolvedValue(site);
    vi.mocked(getCatalogo).mockResolvedValue({ propiedades: [], marketId: 'cl' });
    vi.mocked(getFunciones).mockResolvedValue({ chat: false, valorizador: false });
  });

  it('muestra la corredora que corresponde a la dirección de la visita (H-030)', async () => {
    const html = renderToStaticMarkup(await Page({ params }));
    expect(resolverVisita).toHaveBeenCalledWith('casasur.miportal.cl');
    expect(getCatalogo).toHaveBeenCalledWith(env);
    expect(html).toContain('Casa Sur');
    expect(html).toContain('RealEstateAgent');
  });

  it('la sección para propietarios aparece solo si el plan de la corredora incluye el valorizador', async () => {
    vi.mocked(getFunciones).mockResolvedValue({ chat: false, valorizador: true });
    const con = renderToStaticMarkup(await Page({ params }));
    expect(getFunciones).toHaveBeenCalledWith(env);
    expect(con).toContain('id="vende"');
    vi.mocked(getFunciones).mockResolvedValue({ chat: true, valorizador: false });
    const sin = renderToStaticMarkup(await Page({ params }));
    expect(sin).not.toContain('id="vende"');
    expect(sin).not.toContain('Vende con nosotros');
  });

  it('el asistente de chat aparece solo si el plan de la corredora incluye el chat', async () => {
    vi.mocked(getFunciones).mockResolvedValue({ chat: true, valorizador: false });
    expect(renderToStaticMarkup(await Page({ params }))).toContain('Abrir asistente');
    vi.mocked(getFunciones).mockResolvedValue({ chat: false, valorizador: true });
    expect(renderToStaticMarkup(await Page({ params }))).not.toContain('Abrir asistente');
  });

  it('si no se puede leer el plan, la portada se ve igual, sin herramientas, en vez de caerse', async () => {
    vi.mocked(getFunciones).mockRejectedValue(new Error('migración pendiente'));
    const html = renderToStaticMarkup(await Page({ params }));
    expect(html).toContain('Casa Sur');
    expect(html).not.toContain('id="vende"');
    expect(html).not.toContain('Abrir asistente');
  });

  it('una dirección sin corredora avisa que el sitio no está disponible', async () => {
    vi.mocked(resolverVisita).mockResolvedValue(null);
    vi.mocked(getSite).mockResolvedValue(null);
    expect(renderToStaticMarkup(await Page({ params }))).toContain('Sitio no disponible');
    expect((await generateMetadata({ params })).robots).toEqual({ index: false });
  });

  it('el título sale de la corredora y la dirección canónica es la preferida, no la de la visita (H-031)', async () => {
    const meta = await generateMetadata({ params });
    expect(meta.title).toBe('Casa Sur');
    // Se entró por el subdominio, pero la corredora tiene dominio propio: Google conoce una sola dirección
    expect(meta.metadataBase?.toString()).toBe('https://casasur.cl/');
  });
});
