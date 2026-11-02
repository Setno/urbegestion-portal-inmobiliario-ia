import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { BrandingTab } from './BrandingTab';
import { useBrandStore, BRAND_COLOR_PRESETS } from '../../brand/useBrandStore';

// Guardar es asíncrono (con Supabase espera a la base): act deja terminar la operación
const guardar = () => act(async () => {
  fireEvent.click(screen.getByRole('button', { name: /Guardar y Aplicar$/ }));
});

describe('BrandingTab (identidad y marca)', () => {
  beforeEach(() => {
    localStorage.clear();
    useBrandStore.getState().resetToDefault();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('muestra los datos actuales de la marca en el formulario', () => {
    render(<BrandingTab />);
    const { config } = useBrandStore.getState();
    expect(screen.getByDisplayValue(config.brandName)).toBeTruthy();
    expect(screen.getByDisplayValue(config.brokerName)).toBeTruthy();
    expect(screen.getByDisplayValue(config.contact.phoneDisplay)).toBeTruthy();
    expect(screen.getByText('Personalizador de Identidad de Marca (White-Label)')).toBeTruthy();
  });

  it('Guardar y Aplicar escribe el nombre nuevo en la marca, avisa y vuelve al texto normal a los 3 segundos', async () => {
    vi.useFakeTimers();
    render(<BrandingTab />);
    fireEvent.change(screen.getByPlaceholderText('Ej: Inmobiliaria Las Condes'), { target: { value: 'Casa Sur' } });
    // Antes de guardar, la marca no cambia
    expect(useBrandStore.getState().config.brandName).not.toBe('Casa Sur');
    await guardar();
    expect(useBrandStore.getState().config.brandName).toBe('Casa Sur');
    expect(screen.getByText('La identidad de la marca y la paleta de colores han sido actualizadas en vivo en todo el portal.')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByText(/han sido actualizadas en vivo/)).toBeNull();
  });

  it('elegir una paleta y guardar cambia los colores del sitio', async () => {
    render(<BrandingTab />);
    const preset = BRAND_COLOR_PRESETS[2];
    fireEvent.click(screen.getByRole('button', { name: new RegExp(preset.name.replace(/[()&]/g, '.')) }));
    await guardar();
    const { themeColors } = useBrandStore.getState();
    expect(themeColors.primary).toBe(preset.primary);
    expect(themeColors.accent).toBe(preset.accent);
    expect(document.documentElement.style.getPropertyValue('--color-urbe-primary')).toBe(preset.primary);
  });

  it('guardar actualiza los datos de contacto sin perder los que no se editan', async () => {
    render(<BrandingTab />);
    const before = useBrandStore.getState().config.contact;
    fireEvent.change(screen.getByPlaceholderText('contacto@inmobiliaria.cl'), { target: { value: 'hola@casasur.cl' } });
    await guardar();
    const { contact } = useBrandStore.getState().config;
    expect(contact.email).toBe('hola@casasur.cl');
    expect(contact.phoneDisplay).toBe(before.phoneDisplay);
    expect(contact.instagram).toBe(before.instagram);
  });

  it('si la base rechaza el guardado, lo dice y no anuncia éxito', async () => {
    const saveBrand = vi.fn().mockResolvedValue({ ok: false, error: 'permiso' });
    const original = useBrandStore.getState().saveBrand;
    useBrandStore.setState({ saveBrand });
    render(<BrandingTab />);
    await guardar();
    expect(screen.getByRole('alert').textContent).toContain('Los cambios no se guardaron');
    expect(screen.queryByText(/han sido actualizadas en vivo/)).toBeNull();
    useBrandStore.setState({ saveBrand: original });
  });

  it('cambiar el logo cambia también el del pie de página', async () => {
    render(<BrandingTab />);
    fireEvent.change(screen.getAllByPlaceholderText('O pegar URL de imagen...')[0], { target: { value: 'https://a.cl/logo.png' } });
    await guardar();
    const { logoUrl, logoWhiteUrl } = useBrandStore.getState().config;
    expect(logoUrl).toBe('https://a.cl/logo.png');
    expect(logoWhiteUrl).toBe('https://a.cl/logo.png');
  });

  it('Restaurar Original pide confirmación; si se cancela no cambia nada', () => {
    useBrandStore.getState().updateBrandConfig({ brandName: 'Casa Sur' });
    vi.stubGlobal('confirm', vi.fn(() => false));
    render(<BrandingTab />);
    fireEvent.click(screen.getByRole('button', { name: /Restaurar Original/ }));
    expect(useBrandStore.getState().config.brandName).toBe('Casa Sur');
  });

  it('Restaurar Original confirmado vuelve a la marca de origen y refresca el formulario', () => {
    useBrandStore.getState().updateBrandConfig({ brandName: 'Casa Sur' });
    const original = useBrandStore.getState;
    vi.stubGlobal('confirm', vi.fn(() => true));
    render(<BrandingTab />);
    expect(screen.getByDisplayValue('Casa Sur')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Restaurar Original/ }));
    expect(screen.queryByDisplayValue('Casa Sur')).toBeNull();
    expect(original().config.brandName).not.toBe('Casa Sur');
  });
});
