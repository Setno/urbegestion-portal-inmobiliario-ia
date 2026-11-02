import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Navbar } from './Navbar';
import { MobileQuickBar } from './MobileQuickBar';
import { usePropertyStore } from '../../modules/catalogo/stores/usePropertyStore';
import { useLocaleStore } from '../../core/i18n/i18n';

describe('Barra de navegación y barra móvil', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'es' });
    usePropertyStore.setState({ currency: 'UF' });
  });

  afterEach(() => cleanup());

  it('la barra de navegación muestra sus enlaces en español', () => {
    render(<Navbar onOpenAdmin={vi.fn()} onOpenValuation={vi.fn()} />);
    expect(screen.getByText('Propiedades')).toBeTruthy();
    expect(screen.getByText('Vende con Nosotros')).toBeTruthy();
    expect(screen.getByText('Asistente IA')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeTruthy();
  });

  it('en inglés los enlaces y el menú móvil se muestran en inglés', () => {
    useLocaleStore.setState({ locale: 'en' });
    render(<Navbar onOpenAdmin={vi.fn()} onOpenValuation={vi.fn()} />);
    expect(screen.getByText('Properties')).toBeTruthy();
    expect(screen.getByText('Sell with Us')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByText('Portal currency:')).toBeTruthy();
    expect(screen.getByText('Property Catalog')).toBeTruthy();
    expect(screen.getByText(/Direct WhatsApp \(/)).toBeTruthy();
  });

  it('el selector de moneda ofrece las monedas del mercado y cambia la del catálogo', () => {
    render(<Navbar onOpenAdmin={vi.fn()} onOpenValuation={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'CLP' })[0]);
    expect(usePropertyStore.getState().currency).toBe('CLP');
  });

  it('la barra móvil traduce sus accesos', () => {
    render(<MobileQuickBar />);
    expect(screen.getByText('Buscar')).toBeTruthy();
    expect(screen.getByText('Llamar')).toBeTruthy();
    cleanup();
    useLocaleStore.setState({ locale: 'en' });
    render(<MobileQuickBar />);
    expect(screen.getByText('Search')).toBeTruthy();
    expect(screen.getByText('Call')).toBeTruthy();
    expect(screen.getByText('AI Chat')).toBeTruthy();
  });
});
