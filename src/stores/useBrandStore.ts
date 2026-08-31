import { create } from 'zustand';
import { RealEstateBrandConfig, agencyConfig as defaultAgencyConfig } from '../config/agencyConfig';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  accent: string;
  accentHover: string;
}

export interface BrandStore {
  config: RealEstateBrandConfig;
  themeColors: ThemeColors;
  
  // Actions
  updateBrandConfig: (partial: Partial<RealEstateBrandConfig>) => void;
  updateThemeColors: (colors: Partial<ThemeColors>) => void;
  resetToDefault: () => void;
}

const defaultThemeColors: ThemeColors = {
  primary: '#164e63',
  primaryDark: '#0f3a4b',
  accent: '#c59b27',
  accentHover: '#b0881e',
};

// Color Presets for Real Estate Brokers
export const BRAND_COLOR_PRESETS: { name: string; primary: string; primaryDark: string; accent: string; accentHover: string }[] = [
  {
    name: 'Azul Océano & Oro (Clásico Urbe)',
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

export const useBrandStore = create<BrandStore>((set) => {
  let initialConfig = { ...defaultAgencyConfig };
  let initialColors = { ...defaultThemeColors };

  if (typeof window !== 'undefined') {
    const savedConfig = localStorage.getItem('urbe_brand_config');
    const savedColors = localStorage.getItem('urbe_theme_colors');

    if (savedConfig) {
      try {
        initialConfig = { ...defaultAgencyConfig, ...JSON.parse(savedConfig) };
      } catch (e) {
        console.warn('Error parsing saved brand config:', e);
      }
    }

    if (savedColors) {
      try {
        initialColors = { ...defaultThemeColors, ...JSON.parse(savedColors) };
      } catch (e) {
        console.warn('Error parsing saved theme colors:', e);
      }
    }

    applyCssVariables(initialColors);
  }

  return {
    config: initialConfig,
    themeColors: initialColors,

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
          localStorage.setItem('urbe_brand_config', JSON.stringify(updatedConfig));
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
          localStorage.setItem('urbe_theme_colors', JSON.stringify(updatedColors));
          applyCssVariables(updatedColors);
        }

        return { themeColors: updatedColors };
      });
    },

    resetToDefault: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('urbe_brand_config');
        localStorage.removeItem('urbe_theme_colors');
        applyCssVariables(defaultThemeColors);
      }

      set({
        config: { ...defaultAgencyConfig },
        themeColors: { ...defaultThemeColors },
      });
    },
  };
});
