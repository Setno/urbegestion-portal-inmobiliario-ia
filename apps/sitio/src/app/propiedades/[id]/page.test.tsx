import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_LAYOUT, DEFAULT_THEME, NEUTRAL_CONTENT, neutralBrand, type SiteData } from '@portal/sitio-datos';
import { getPropiedad } from '../../../lib/getPropiedad';
import { getSite } from '../../../lib/getSite';
import Page, { generateMetadata } from './page';

vi.mock('../../../lib/getSite', () => ({ getSite: vi.fn() }));
vi.mock('../../../lib/getPropiedad', () => ({ getPropiedad: vi.fn() }));
vi.mock('./acciones', () => ({ solicitarVisita: vi.fn() }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));

const site: SiteData = { templateId: 'clasica', brand: neutralBrand('Casa Sur'), theme: DEFAULT_THEME, layout: DEFAULT_LAYOUT, content: NEUTRAL_CONTENT };
const ficha = {
  marketId: 'cl',
  propiedad: {
    id: 'p1', title: 'Casa con vista', operation: 'venta' as const, propertyType: 'casa', priceAmount: 1000, priceCurrency: 'UF', commune: 'Viña', address: '',
    bedrooms: 0, bathrooms: 0, builtAreaM2: 0, totalAreaM2: 0, parkingSpots: 0, storageUnits: 0, expensesMonthlyClp: 0, mapQuery: '', featured: false, images: [], description: 'Luminosa', features: [],
  },
};
const params = Promise.resolve({ id: 'p1' });

describe('página de la ficha', () => {
  beforeEach(() => {
    vi.mocked(getSite).mockResolvedValue(site);
    vi.mocked(getPropiedad).mockResolvedValue(ficha);
  });

  it('muestra la propiedad con la plantilla de la corredora', async () => {
    expect(renderToStaticMarkup(await Page({ params }))).toContain('Casa con vista');
  });

  it('una propiedad que no corresponde da "no encontrada" y no muestra datos', async () => {
    vi.mocked(getPropiedad).mockResolvedValue(null);
    await expect(Page({ params })).rejects.toThrow('NOT_FOUND');
  });

  it('sin corredora avisa que el sitio no está disponible', async () => {
    vi.mocked(getSite).mockResolvedValue(null);
    expect(renderToStaticMarkup(await Page({ params }))).toContain('Sitio no disponible');
  });

  it('los buscadores no indexan lo que no está disponible', async () => {
    vi.mocked(getPropiedad).mockResolvedValue(null);
    expect((await generateMetadata({ params })).robots).toEqual({ index: false });
  });

  it('el título incluye la propiedad y la corredora', async () => {
    const meta = await generateMetadata({ params });
    expect(meta.title).toBe('Casa con vista | Casa Sur');
    expect(meta.description).toBe('Luminosa');
  });
});
