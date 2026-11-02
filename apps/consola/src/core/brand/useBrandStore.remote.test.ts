import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DEFAULT_LAYOUT, DEFAULT_THEME, NEUTRAL_CONTENT, neutralBrand, type SiteData } from '@portal/sitio-datos';

const { fetchPublicSite, saveSiteBrand } = vi.hoisted(() => ({
  fetchPublicSite: vi.fn(),
  saveSiteBrand: vi.fn(),
}));
vi.mock('../data/dataSource', () => ({ remoteContext: () => ({ client: {}, tenantId: 'tenant-1' }) }));
vi.mock('./siteService', () => ({ fetchPublicSite, saveSiteBrand }));

import { useBrandStore } from './useBrandStore';
import { agencyConfig } from '../config/agencyConfig';

// Estado al importar, antes de la primera lectura: con datos remotos y sin caché debe ser neutro
const inicial = { ...useBrandStore.getState(), brandBeforeLoad: agencyConfig.brandName };

const CACHE_KEY = 'urbe_site_tenant-1';
const casaSur: SiteData = {
  templateId: 'clasica',
  brand: { ...neutralBrand('Casa Sur'), tagline: 'Tu casa en el sur' },
  theme: { ...DEFAULT_THEME, primary: '#112233' },
  layout: { ...DEFAULT_LAYOUT, showAiChat: false },
  content: { ...NEUTRAL_CONTENT, hero: { ...NEUTRAL_CONTENT.hero, badge: 'Desde 2010' } },
};

describe('useBrandStore (con Supabase)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    localStorage.clear();
    fetchPublicSite.mockResolvedValue(casaSur);
    await useBrandStore.getState().load();
    localStorage.clear();
  });

  it('nunca parte con los datos de UrbeGestión guardados en el código', () => {
    expect(inicial.config.brandName).toBe('');
    expect(inicial.config.brokerName).toBe('');
    expect(inicial.config.contact.phoneDisplay).toBe('');
    expect(inicial.content.testimonials.items).toEqual([]);
    expect(inicial.brandBeforeLoad).toBe('');
  });

  it('load aplica la marca, los colores, las secciones y los textos de la corredora para todos los visitantes', () => {
    const state = useBrandStore.getState();
    expect(fetchPublicSite).toHaveBeenCalledWith('tenant-1');
    expect(state.config.brandName).toBe('Casa Sur');
    expect(state.config.tagline).toBe('Tu casa en el sur');
    expect(state.themeColors.primary).toBe('#112233');
    expect(state.layoutConfig.showAiChat).toBe(false);
    expect(state.content.hero.badge).toBe('Desde 2010');
    expect(state.templateId).toBe('clasica');
    expect(document.documentElement.style.getPropertyValue('--color-urbe-primary')).toBe('#112233');
    // Quien lee la marca sin suscribirse (chat, integraciones) ve lo mismo
    expect(agencyConfig.brandName).toBe('Casa Sur');
  });

  it('load conserva los ajustes internos de la consola que no viven en la marca', () => {
    expect(useBrandStore.getState().config.market.defaultCurrency).toBe('UF');
    expect(useBrandStore.getState().config.features.mortgageSimulator).toBe(false);
  });

  it('load recuerda lo leído para la próxima visita', async () => {
    await useBrandStore.getState().load();
    expect(JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}').brand.brandName).toBe('Casa Sur');
  });

  it('si la lectura falla, el sitio sigue con los últimos datos disponibles', async () => {
    fetchPublicSite.mockResolvedValue(null);
    await useBrandStore.getState().load();
    expect(useBrandStore.getState().config.brandName).toBe('Casa Sur');
  });

  it('guardar envía la marca completa a la base y aplica el cambio solo si la base lo aceptó', async () => {
    saveSiteBrand.mockResolvedValue({ ok: true });
    const result = await useBrandStore.getState().saveBrand(
      { brandName: 'Casa Sur SpA', contact: { ...casaSur.brand.contact, email: 'hola@casasur.cl' } },
      { accent: '#445566' },
      { showAboutSection: false },
    );
    expect(result).toEqual({ ok: true });
    const [tenant, brand, theme, layout] = saveSiteBrand.mock.calls[0];
    expect(tenant).toBe('tenant-1');
    expect(brand.brandName).toBe('Casa Sur SpA');
    expect(brand.contact.email).toBe('hola@casasur.cl');
    expect(brand).not.toHaveProperty('market');
    expect(theme.accent).toBe('#445566');
    expect(layout.showAboutSection).toBe(false);
    const state = useBrandStore.getState();
    expect(state.config.brandName).toBe('Casa Sur SpA');
    expect(state.themeColors.accent).toBe('#445566');
    expect(state.layoutConfig.showAboutSection).toBe(false);
    expect(state.content.hero.badge).toBe('Desde 2010');
    expect(JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}').brand.brandName).toBe('Casa Sur SpA');
  });

  it('un enlace peligroso no se guarda y se avisa', async () => {
    const result = await useBrandStore.getState().saveBrand({ contact: { ...casaSur.brand.contact, instagram: 'javascript:alert(1)' } }, {}, {});
    expect(result).toEqual({ ok: false, error: 'enlace_invalido' });
    expect(saveSiteBrand).not.toHaveBeenCalled();
  });

  it('un enlace escrito sin https:// se completa al guardar', async () => {
    saveSiteBrand.mockResolvedValue({ ok: true });
    await useBrandStore.getState().saveBrand({ contact: { ...casaSur.brand.contact, instagram: 'instagram.com/casasur' } }, {}, {});
    expect(saveSiteBrand.mock.calls[0][1].contact.instagram).toBe('https://instagram.com/casasur');
    expect(useBrandStore.getState().config.contact.instagram).toBe('https://instagram.com/casasur');
  });

  it('si la lectura falló, guardar se rechaza: no se pisan los datos que el formulario no muestra', async () => {
    fetchPublicSite.mockResolvedValue(null);
    await useBrandStore.getState().load();
    expect(useBrandStore.getState().loadStatus).toBe('error');
    const result = await useBrandStore.getState().saveBrand({ brandName: 'Otro' }, {}, {});
    expect(result).toEqual({ ok: false, error: 'sin_datos' });
    expect(saveSiteBrand).not.toHaveBeenCalled();
  });

  it('antes de la primera lectura tampoco se puede guardar', () => {
    expect(inicial.loadStatus).toBe('idle');
  });

  it('si la base rechaza el cambio, la tienda no cambia y se informa el error', async () => {
    saveSiteBrand.mockResolvedValue({ ok: false, error: 'permiso' });
    const result = await useBrandStore.getState().saveBrand({ brandName: 'No debe quedar' }, { primary: '#000000' }, {});
    expect(result).toEqual({ ok: false, error: 'permiso' });
    expect(useBrandStore.getState().config.brandName).toBe('Casa Sur');
    expect(useBrandStore.getState().themeColors.primary).toBe('#112233');
  });
});
