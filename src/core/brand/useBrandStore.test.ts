import { describe, it, expect, beforeEach } from 'vitest';
import { useBrandStore, BRAND_COLOR_PRESETS } from './useBrandStore';
import { agencyConfig } from '../config/agencyConfig';

const originalBrandName = agencyConfig.brandName;
const originalPhone = agencyConfig.contact.phoneDisplay;

describe('useBrandStore (marca de la corredora)', () => {
  beforeEach(() => {
    localStorage.clear();
    useBrandStore.getState().resetToDefault();
  });

  it('parte con la marca y la paleta clásicas, con todas las secciones del sitio visibles', () => {
    const { config, themeColors, layoutConfig } = useBrandStore.getState();
    expect(config.brandName).toBe(originalBrandName);
    expect(themeColors).toEqual({ primary: '#164e63', primaryDark: '#0f3a4b', accent: '#c59b27', accentHover: '#b0881e' });
    expect(layoutConfig).toEqual({ showSearchFilter: true, showAboutSection: true, showTestimonialsSection: true, showAiChat: true });
  });

  it('actualizar la marca guarda el cambio, lo recuerda en el navegador y conserva el resto', () => {
    useBrandStore.getState().updateBrandConfig({ brandName: 'Casa Sur' });
    const { config } = useBrandStore.getState();
    expect(config.brandName).toBe('Casa Sur');
    expect(config.brokerName).toBe(agencyConfig.brokerName);
    expect(JSON.parse(localStorage.getItem('urbe_brand_config') ?? '{}').brandName).toBe('Casa Sur');
  });

  it('actualizar un solo dato de contacto no borra los demás', () => {
    useBrandStore.getState().updateBrandConfig({ contact: { ...agencyConfig.contact, email: 'hola@casasur.cl' } });
    const { contact } = useBrandStore.getState().config;
    expect(contact.email).toBe('hola@casasur.cl');
    expect(contact.phoneDisplay).toBe(originalPhone);
  });

  it('cambiar los colores actualiza las variables CSS del sitio y se recuerda', () => {
    const preset = BRAND_COLOR_PRESETS[1];
    useBrandStore.getState().updateThemeColors({ primary: preset.primary, accent: preset.accent });
    expect(useBrandStore.getState().themeColors.primary).toBe(preset.primary);
    expect(document.documentElement.style.getPropertyValue('--color-urbe-primary')).toBe(preset.primary);
    expect(document.documentElement.style.getPropertyValue('--color-urbe-accent')).toBe(preset.accent);
    expect(JSON.parse(localStorage.getItem('urbe_theme_colors') ?? '{}').primary).toBe(preset.primary);
  });

  it('ocultar una sección cambia solo esa sección y se recuerda', () => {
    useBrandStore.getState().updateLayoutConfig({ showAiChat: false });
    expect(useBrandStore.getState().layoutConfig).toEqual({
      showSearchFilter: true,
      showAboutSection: true,
      showTestimonialsSection: true,
      showAiChat: false,
    });
    expect(JSON.parse(localStorage.getItem('urbe_layout_config') ?? '{}').showAiChat).toBe(false);
  });

  it('restaurar vuelve a los valores originales, borra lo guardado y repone las variables CSS', () => {
    useBrandStore.getState().updateBrandConfig({ brandName: 'Casa Sur' });
    useBrandStore.getState().updateThemeColors({ primary: '#000000' });
    useBrandStore.getState().updateLayoutConfig({ showAboutSection: false });
    useBrandStore.getState().resetToDefault();
    const { config, themeColors, layoutConfig } = useBrandStore.getState();
    expect(config.brandName).toBe(originalBrandName);
    expect(themeColors.primary).toBe('#164e63');
    expect(layoutConfig.showAboutSection).toBe(true);
    expect(localStorage.getItem('urbe_brand_config')).toBeNull();
    expect(localStorage.getItem('urbe_theme_colors')).toBeNull();
    expect(localStorage.getItem('urbe_layout_config')).toBeNull();
    expect(document.documentElement.style.getPropertyValue('--color-urbe-primary')).toBe('#164e63');
  });

  it('ofrece cinco paletas, todas con colores hexadecimales válidos', () => {
    expect(BRAND_COLOR_PRESETS).toHaveLength(5);
    for (const p of BRAND_COLOR_PRESETS) {
      for (const color of [p.primary, p.primaryDark, p.accent, p.accentHover]) expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
