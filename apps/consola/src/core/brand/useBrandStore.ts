import { create } from 'zustand';
import { RealEstateBrandConfig, agencyConfig as defaultAgencyConfig } from '../config/agencyConfig';
import { demoSiteContent } from '../config/demoSiteContent';
import { createLocalStore } from '../storage/localStore';
import { remoteContext } from '../data/dataSource';
import { fetchPublicSite, saveSiteBrand, saveSiteContent, type SiteSaveResult } from './siteService';
import {
  DEFAULT_LAYOUT,
  DEFAULT_TEMPLATE_ID,
  DEFAULT_THEME,
  NEUTRAL_CONTENT,
  neutralBrand,
  normalizeUrl,
  parseSiteData,
  serializeBrand,
  type SiteContent,
  type SiteData,
  type SiteLayout,
  type SiteTheme,
} from '@portal/sitio-datos';

export type ThemeColors = SiteTheme;
export type BrandLayoutConfig = SiteLayout;

export interface BrandStore {
  config: RealEstateBrandConfig;
  themeColors: ThemeColors;
  layoutConfig: BrandLayoutConfig;
  content: SiteContent;
  templateId: string;
  // Con Supabase, solo tras una lectura correcta se puede editar: guardar reemplaza la marca completa.
  loadStatus: 'idle' | 'ok' | 'error';

  // Con Supabase lee los datos públicos de la corredora; sin Supabase no hace nada.
  load: () => Promise<void>;
  // Guarda lo editado en el panel: con Supabase en la base (y solo si la base lo acepta), sin Supabase en el navegador.
  saveBrand: (brand: Partial<RealEstateBrandConfig>, colors: Partial<ThemeColors>, layout: Partial<BrandLayoutConfig>) => Promise<SiteSaveResult>;
  // Guarda solo los textos del sitio (H-032), con las mismas reglas que la marca.
  saveContent: (content: SiteContent) => Promise<SiteSaveResult>;

  // Actions
  updateBrandConfig: (partial: Partial<RealEstateBrandConfig>) => void;
  updateThemeColors: (colors: Partial<ThemeColors>) => void;
  updateLayoutConfig: (layout: Partial<BrandLayoutConfig>) => void;
  resetToDefault: () => void;
}

const defaultThemeColors: ThemeColors = DEFAULT_THEME;
const defaultLayoutConfig: BrandLayoutConfig = DEFAULT_LAYOUT;

// Color Presets for Real Estate Brokers
export const BRAND_COLOR_PRESETS: { name: string; primary: string; primaryDark: string; accent: string; accentHover: string }[] = [
  {
    name: 'Azul Océano & Oro (Clásico)',
    primary: '#164e63',
    primaryDark: '#0f3a4b',
    accent: '#c59b27',
    accentHover: '#b0881e',
  },
  {
    name: 'Esmeralda Lujo & Champán',
    primary: '#064e3b',
    primaryDark: '#022c22',
    accent: '#d97706',
    accentHover: '#b45309',
  },
  {
    name: 'Negro Obsidiana & Oro Real (Ultra Lujo)',
    primary: '#0f172a',
    primaryDark: '#020617',
    accent: '#eab308',
    accentHover: '#ca8a04',
  },
  {
    name: 'Borgoña & Oro Rosa (Boutique)',
    primary: '#4c0519',
    primaryDark: '#2e020d',
    accent: '#fb7185',
    accentHover: '#e11d48',
  },
  {
    name: 'Azul Zafiro & Platino',
    primary: '#1e3a8a',
    primaryDark: '#172554',
    accent: '#38bdf8',
    accentHover: '#0284c7',
  }
];

function applyCssVariables(colors: ThemeColors) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--color-urbe-primary', colors.primary);
    root.style.setProperty('--color-urbe-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-urbe-accent', colors.accent);
    root.style.setProperty('--color-urbe-accent-hover', colors.accentHover);
  }
}

// Copia de la marca de origen: updateBrandConfig mantiene sincronizado el objeto compartido agencyConfig,
// así que restaurar necesita su propia copia para no devolver lo ya editado (H-042).
const originalBrandConfig: RealEstateBrandConfig = structuredClone(defaultAgencyConfig);

const brandConfigStorage = createLocalStore<Partial<RealEstateBrandConfig>>('urbe_brand_config');
const themeColorsStorage = createLocalStore<Partial<ThemeColors>>('urbe_theme_colors');
const layoutConfigStorage = createLocalStore<Partial<BrandLayoutConfig>>('urbe_layout_config');
const siteContentStorage = createLocalStore<SiteContent>('urbe_site_content');

// Los textos se guardan tal como los leerá el sitio: pasan por el mismo lector, que descarta enlaces peligrosos.
const cleanContent = (content: SiteContent): SiteContent => parseSiteData({ tenantName: '-', content })?.content ?? NEUTRAL_CONTENT;

// Con datos remotos se recuerda lo último leído, por corredora: evita un parpadeo al abrir el sitio y sirve si falla la lectura.
const siteCache = (tenantId: string) => createLocalStore<SiteData>(`urbe_site_${tenantId}`);

// La marca pública se suma a los ajustes internos de la consola (mercado, simulador), que no viven en la base del sitio.
function applySite(site: SiteData): Pick<BrandStore, 'config' | 'themeColors' | 'layoutConfig' | 'content' | 'templateId'> {
  const config: RealEstateBrandConfig = { ...defaultAgencyConfig, ...site.brand };
  // Mantiene al día a quienes leen la marca sin suscribirse (chat, integraciones)
  Object.assign(defaultAgencyConfig, config);
  applyCssVariables(site.theme);
  return { config, themeColors: site.theme, layoutConfig: site.layout, content: site.content, templateId: site.templateId };
}

export const useBrandStore = create<BrandStore>((set, get) => {
  const ctx = remoteContext();

  if (ctx) {
    // Nunca se parte con la marca de ejemplo escrita en el código: sería mostrar los datos de otra corredora.
    const stored = siteCache(ctx.tenantId).load();
    const initial: SiteData = (stored && parseSiteData({ ...stored, tenantName: stored.brand?.brandName })) ?? {
      templateId: DEFAULT_TEMPLATE_ID,
      brand: neutralBrand(''),
      theme: DEFAULT_THEME,
      layout: DEFAULT_LAYOUT,
      content: NEUTRAL_CONTENT,
    };
    return {
      ...applySite(initial),
      loadStatus: 'idle',
      load: async () => {
        const site = await fetchPublicSite(ctx.tenantId);
        if (!site) {
          set({ loadStatus: 'error' });
          return;
        }
        siteCache(ctx.tenantId).save(site);
        set({ ...applySite(site), loadStatus: 'ok' });
      },
      saveBrand: async (brand, colors, layout) => {
        const state = get();
        // Sin una lectura correcta se borrarían los datos que el formulario no muestra.
        if (state.loadStatus !== 'ok') return { ok: false, error: 'sin_datos' };
        const merged = {
          ...state.config,
          ...brand,
          contact: { ...state.config.contact, ...(brand.contact || {}) },
          stats: { ...state.config.stats, ...(brand.stats || {}) },
        };
        const logoUrl = normalizeUrl(merged.logoUrl);
        const logoWhiteUrl = normalizeUrl(merged.logoWhiteUrl);
        const brokerPhotoUrl = normalizeUrl(merged.brokerPhotoUrl);
        const instagram = normalizeUrl(merged.contact.instagram);
        if (logoUrl === null || logoWhiteUrl === null || brokerPhotoUrl === null || instagram === null) {
          return { ok: false, error: 'enlace_invalido' };
        }
        merged.logoUrl = logoUrl;
        merged.logoWhiteUrl = logoWhiteUrl;
        merged.brokerPhotoUrl = brokerPhotoUrl;
        merged.contact.instagram = instagram;
        // Se guarda lo mismo que después leerá el sitio: pasa por el mismo lector, que descarta enlaces peligrosos y colores raros.
        const clean = parseSiteData({
          tenantName: state.config.brandName,
          templateId: state.templateId,
          brand: serializeBrand(merged),
          theme: { ...state.themeColors, ...colors },
          layout: { ...state.layoutConfig, ...layout },
        });
        if (!clean) return { ok: false, error: 'conexion' };
        const result = await saveSiteBrand(ctx.tenantId, clean.brand, clean.theme, clean.layout);
        if (!result.ok) return result;
        const site: SiteData = { ...clean, content: state.content };
        siteCache(ctx.tenantId).save(site);
        set({ ...applySite(site), loadStatus: 'ok' });
        return result;
      },
      saveContent: async (content) => {
        const state = get();
        if (state.loadStatus !== 'ok') return { ok: false, error: 'sin_datos' };
        const clean = cleanContent(content);
        const result = await saveSiteContent(ctx.tenantId, clean);
        if (!result.ok) return result;
        siteCache(ctx.tenantId).save({
          templateId: state.templateId,
          brand: serializeBrand(state.config),
          theme: state.themeColors,
          layout: state.layoutConfig,
          content: clean,
        });
        set({ content: clean });
        return result;
      },
      // Con datos remotos no hay marca "original" a la cual volver
      updateBrandConfig: () => undefined,
      updateThemeColors: () => undefined,
      updateLayoutConfig: () => undefined,
      resetToDefault: () => undefined,
    };
  }

  let initialConfig = { ...defaultAgencyConfig };
  let initialColors = { ...defaultThemeColors };
  let initialLayout = { ...defaultLayoutConfig };
  let storedContent: SiteContent | null = null;

  if (typeof window !== 'undefined') {
    initialConfig = { ...defaultAgencyConfig, ...brandConfigStorage.load() };
    initialColors = { ...defaultThemeColors, ...themeColorsStorage.load() };
    initialLayout = { ...defaultLayoutConfig, ...layoutConfigStorage.load() };
    storedContent = siteContentStorage.load();

    applyCssVariables(initialColors);
  }

  return {
    config: initialConfig,
    themeColors: initialColors,
    layoutConfig: initialLayout,
    content: storedContent ? cleanContent(storedContent) : demoSiteContent,
    templateId: DEFAULT_TEMPLATE_ID,
    loadStatus: 'ok',

    load: async () => undefined,

    saveBrand: async (brand, colors, layout) => {
      get().updateBrandConfig(brand);
      get().updateThemeColors(colors);
      get().updateLayoutConfig(layout);
      return { ok: true };
    },

    saveContent: async (content) => {
      const clean = cleanContent(content);
      siteContentStorage.save(clean);
      set({ content: clean });
      return { ok: true };
    },

    updateBrandConfig: (partial) => {
      set((state) => {
        const updatedConfig = {
          ...state.config,
          ...partial,
          contact: {
            ...state.config.contact,
            ...(partial.contact || {}),
          },
          stats: {
            ...state.config.stats,
            ...(partial.stats || {}),
          },
        };

        if (typeof window !== 'undefined') {
          brandConfigStorage.save(updatedConfig);
        }

        // Keep default export in sync
        Object.assign(defaultAgencyConfig, updatedConfig);

        return { config: updatedConfig };
      });
    },

    updateThemeColors: (newColors) => {
      set((state) => {
        const updatedColors = { ...state.themeColors, ...newColors };
        
        if (typeof window !== 'undefined') {
          themeColorsStorage.save(updatedColors);
          applyCssVariables(updatedColors);
        }

        return { themeColors: updatedColors };
      });
    },

    updateLayoutConfig: (layout) => {
      set((state) => {
        const updatedLayout = { ...state.layoutConfig, ...layout };
        if (typeof window !== 'undefined') {
          layoutConfigStorage.save(updatedLayout);
        }
        return { layoutConfig: updatedLayout };
      });
    },

    resetToDefault: () => {
      if (typeof window !== 'undefined') {
        brandConfigStorage.clear();
        themeColorsStorage.clear();
        layoutConfigStorage.clear();
        siteContentStorage.clear();
        applyCssVariables(defaultThemeColors);
      }

      const original = structuredClone(originalBrandConfig);
      Object.assign(defaultAgencyConfig, original);

      set({
        config: original,
        themeColors: { ...defaultThemeColors },
        layoutConfig: { ...defaultLayoutConfig },
        content: demoSiteContent,
      });
    },
  };
});
