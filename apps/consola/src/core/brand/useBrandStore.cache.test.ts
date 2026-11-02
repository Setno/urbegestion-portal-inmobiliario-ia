import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DEFAULT_LAYOUT, DEFAULT_THEME, NEUTRAL_CONTENT, neutralBrand } from '@portal/sitio-datos';

vi.mock('../data/dataSource', () => ({ remoteContext: () => ({ client: {}, tenantId: 'tenant-1' }) }));
vi.mock('./siteService', () => ({ fetchPublicSite: vi.fn(), saveSiteBrand: vi.fn() }));

const CACHE_KEY = 'urbe_site_tenant-1';

describe('useBrandStore al abrir el sitio (con Supabase)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('parte de lo leído en la visita anterior, sin parpadeo', async () => {
    const brand = { ...neutralBrand('Casa Sur'), tagline: 'Tu casa en el sur' };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ templateId: 'clasica', brand, theme: DEFAULT_THEME, layout: DEFAULT_LAYOUT, content: NEUTRAL_CONTENT }));
    const { useBrandStore } = await import('./useBrandStore');
    expect(useBrandStore.getState().config.brandName).toBe('Casa Sur');
    expect(useBrandStore.getState().config.tagline).toBe('Tu casa en el sur');
    // La copia no habilita editar: eso exige una lectura correcta de la base
    expect(useBrandStore.getState().loadStatus).toBe('idle');
  });

  it('valida la copia guardada en el navegador como cualquier otro dato', async () => {
    const brand = { ...neutralBrand('Casa Sur'), contact: { instagram: 'javascript:alert(1)' } };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ brand, theme: { primary: 'red' } }));
    const { useBrandStore } = await import('./useBrandStore');
    expect(useBrandStore.getState().config.contact.instagram).toBe('');
    expect(useBrandStore.getState().themeColors.primary).toBe(DEFAULT_THEME.primary);
  });

  it('una copia dañada se ignora y parte neutro', async () => {
    localStorage.setItem(CACHE_KEY, '{"brand":');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { useBrandStore } = await import('./useBrandStore');
    expect(useBrandStore.getState().config.brandName).toBe('');
  });

  it('el resto de la consola también parte sin los datos de ejemplo', async () => {
    const { useBrandStore } = await import('./useBrandStore');
    const { agencyConfig } = await import('../config/agencyConfig');
    expect(useBrandStore.getState().config.brandName).toBe('');
    expect(agencyConfig.brokerName).toBe('');
    expect(agencyConfig.contact.phone).toBe('');
  });
});
