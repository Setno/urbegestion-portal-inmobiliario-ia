import { describe, it, expect, beforeEach, vi } from 'vitest';

// H-064: en la consola de producción no hay corredora fija: aparece al iniciar sesión. La tienda de la marca
// no puede decidir "local o remota" una sola vez al cargarse el módulo.
const mocks = vi.hoisted(() => ({
  contexto: null as null | { client: object; tenantId: string },
  fetchPublicSite: vi.fn(),
  saveSiteBrand: vi.fn(),
  saveSiteContent: vi.fn(),
}));

vi.mock('../data/dataSource', () => ({ remoteContext: () => mocks.contexto }));
vi.mock('../config/adminAccess', () => ({ ADMIN_ENABLED: true, PANEL_ONLY: true }));
vi.mock('./siteService', () => ({
  fetchPublicSite: mocks.fetchPublicSite,
  saveSiteBrand: mocks.saveSiteBrand,
  saveSiteContent: mocks.saveSiteContent,
}));

import { useBrandStore } from './useBrandStore';

const sitio = (nombre: string) => ({
  templateId: 'clasica',
  brand: { brandName: nombre, brokerName: nombre },
  theme: { primary: '#111111', primaryDark: '#000000', accent: '#c59b27', accentHover: '#b0881e' },
  layout: { showSearchFilter: true, showAboutSection: true, showTestimonialsSection: true, showAiChat: true },
  content: {},
});

describe('useBrandStore con la corredora de la sesión', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.contexto = null;
    mocks.fetchPublicSite.mockReset();
    mocks.saveSiteBrand.mockReset();
  });

  it('en modo panel parte neutra y sin lectura hecha: no muestra la marca de ejemplo de otra corredora', () => {
    const st = useBrandStore.getState();
    expect(st.loadStatus).toBe('idle');
    expect(st.config.brandName).not.toBe('UrbeGestión');
  });

  it('sin corredora (nadie ha iniciado sesión) cargar no pide nada', async () => {
    await useBrandStore.getState().load();
    expect(mocks.fetchPublicSite).not.toHaveBeenCalled();
  });

  it('al aparecer la corredora de la sesión, cargar lee la marca de ESA corredora', async () => {
    mocks.contexto = { client: {}, tenantId: 'tenant-1' };
    mocks.fetchPublicSite.mockResolvedValue(sitio('Casa Sur'));
    await useBrandStore.getState().load();
    expect(mocks.fetchPublicSite).toHaveBeenCalledWith('tenant-1');
    expect(useBrandStore.getState().loadStatus).toBe('ok');
    expect(useBrandStore.getState().config.brandName).toBe('Casa Sur');
  });

  it('al guardar con la corredora de la sesión escribe en la base, no en el navegador', async () => {
    mocks.contexto = { client: {}, tenantId: 'tenant-2' };
    mocks.fetchPublicSite.mockResolvedValue(sitio('Casa Norte'));
    mocks.saveSiteBrand.mockResolvedValue({ ok: true });
    await useBrandStore.getState().load();
    const result = await useBrandStore.getState().saveBrand({ brandName: 'Casa Norte SpA' }, {}, {});
    expect(result.ok).toBe(true);
    expect(mocks.saveSiteBrand).toHaveBeenCalledWith('tenant-2', expect.anything(), expect.anything(), expect.anything());
  });

  it('reset (al cerrar sesión) devuelve la marca neutra y exige una lectura nueva', async () => {
    mocks.contexto = { client: {}, tenantId: 'tenant-6' };
    mocks.fetchPublicSite.mockResolvedValue(sitio('Casa Seis'));
    await useBrandStore.getState().load();
    expect(useBrandStore.getState().config.brandName).toBe('Casa Seis');
    mocks.contexto = null;
    useBrandStore.getState().reset();
    expect(useBrandStore.getState().config.brandName).not.toBe('Casa Seis');
    expect(useBrandStore.getState().loadStatus).toBe('idle');
    // Sin corredora (modo panel) guardar se rechaza: no se persiste en el navegador la marca de la corredora anterior
    const result = await useBrandStore.getState().saveBrand({ brandName: 'X' }, {}, {});
    expect(result).toEqual({ ok: false, error: 'sin_datos' });
    expect(localStorage.getItem('urbe_brand_config')).toBeNull();
  });

  it('si la sesión cambia mientras se lee, no pinta la marca de la otra corredora', async () => {
    mocks.contexto = { client: {}, tenantId: 'tenant-3' };
    mocks.fetchPublicSite.mockImplementation(async () => {
      mocks.contexto = null;
      return sitio('Casa Vieja');
    });
    await useBrandStore.getState().load();
    expect(useBrandStore.getState().config.brandName).not.toBe('Casa Vieja');
  });

  it('con otra corredora, parte de neutro y exige una lectura nueva antes de poder guardar', async () => {
    mocks.contexto = { client: {}, tenantId: 'tenant-4' };
    mocks.fetchPublicSite.mockResolvedValueOnce(sitio('Casa Cuatro'));
    await useBrandStore.getState().load();
    expect(useBrandStore.getState().loadStatus).toBe('ok');

    mocks.contexto = { client: {}, tenantId: 'tenant-5' };
    let estadoMientrasLee = '';
    mocks.fetchPublicSite.mockImplementationOnce(async () => {
      estadoMientrasLee = useBrandStore.getState().loadStatus;
      return sitio('Casa Cinco');
    });
    await useBrandStore.getState().load();
    expect(estadoMientrasLee).toBe('idle');
    expect(useBrandStore.getState().config.brandName).toBe('Casa Cinco');
  });
});
