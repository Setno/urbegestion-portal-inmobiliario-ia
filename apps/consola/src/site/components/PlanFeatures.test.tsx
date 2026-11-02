import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { MobileQuickBar } from './MobileQuickBar';
import { useEntitlementsStore } from '../../core/platform/useEntitlementsStore';
import { useLocaleStore } from '../../core/i18n/i18n';

const aplicar = (features: Record<string, boolean>) =>
  useEntitlementsStore.getState().apply({ updatedAt: '2026-11-02T10:00:00Z', features });

describe('el sitio público según el plan de la corredora (H-045)', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'es' });
    useEntitlementsStore.getState().reset();
  });

  afterEach(() => cleanup());

  it('con el plan completo (o sin ventas conectadas) se ven el asistente y "Vende con Nosotros"', () => {
    render(<Navbar onOpenAdmin={vi.fn()} onOpenValuation={vi.fn()} />);
    expect(screen.getByText('Asistente IA')).toBeTruthy();
    expect(screen.getByText('Vende con Nosotros')).toBeTruthy();
    cleanup();
    render(<HeroSection onOpenValuation={vi.fn()} />);
    expect(screen.getByText('Consultar con Asistente IA')).toBeTruthy();
    expect(screen.getByText('Vende tu Propiedad')).toBeTruthy();
  });

  it('sin la función del chat desaparece el botón del asistente en la barra, la portada y la barra móvil', () => {
    aplicar({ 'ai.chat': false });
    render(<Navbar onOpenAdmin={vi.fn()} onOpenValuation={vi.fn()} />);
    expect(screen.queryByText('Asistente IA')).toBeNull();
    expect(screen.getByText('Vende con Nosotros')).toBeTruthy();
    cleanup();
    render(<HeroSection onOpenValuation={vi.fn()} />);
    expect(screen.queryByText('Consultar con Asistente IA')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Agendar' })).toBeNull();
    cleanup();
    const { container } = render(<MobileQuickBar />);
    expect(container.querySelector('.grid-cols-3')).toBeTruthy();
    expect(container.querySelector('.grid-cols-4')).toBeNull();
  });

  it('sin el formulario de propietarios desaparecen los accesos a vender, también en el menú móvil', () => {
    aplicar({ 'valuation.owner_form': false });
    render(<Navbar onOpenAdmin={vi.fn()} onOpenValuation={vi.fn()} />);
    expect(screen.queryByText('Vende con Nosotros')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(screen.queryByText(/Vende con nosotros/i)).toBeNull();
    expect(screen.getByText('Asistente IA')).toBeTruthy();
    cleanup();
    render(<HeroSection onOpenValuation={vi.fn()} />);
    expect(screen.queryByText('Vende tu Propiedad')).toBeNull();
  });

  it('la barra móvil con el chat prendido sigue con cuatro accesos', () => {
    const { container } = render(<MobileQuickBar />);
    expect(container.querySelector('.grid-cols-4')).toBeTruthy();
  });
});
