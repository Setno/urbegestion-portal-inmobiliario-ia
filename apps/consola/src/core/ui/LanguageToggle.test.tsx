import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LanguageToggle } from './LanguageToggle';
import { AdminDashboard } from '../admin/AdminDashboard';
import { useAuthStore } from '../auth/useAuthStore';
import { useLocaleStore } from '../i18n/i18n';

describe('LanguageToggle (selector de idioma)', () => {
  beforeEach(() => {
    localStorage.clear();
    useLocaleStore.setState({ locale: 'es' });
  });

  afterEach(() => cleanup());

  it('muestra los dos idiomas con el actual marcado', () => {
    render(<LanguageToggle />);
    expect(screen.getByRole('group', { name: 'Idioma' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ES' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'EN' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('al elegir inglés cambia el idioma, lo recuerda en el navegador y la etiqueta también cambia', () => {
    render(<LanguageToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(useLocaleStore.getState().locale).toBe('en');
    expect(localStorage.getItem('ui.locale')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('group', { name: 'Language' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'EN' }).getAttribute('aria-pressed')).toBe('true');
  });
});

describe('AdminDashboard (marco del panel)', () => {
  const entrar = () =>
    useAuthStore.setState({
      status: 'con_sesion',
      email: 'ana@ejemplo.cl',
      membership: { tenantId: 'tenant-1', tenantName: 'Casa Sur', role: 'admin', publicationMode: 'con_aprobacion' },
    });

  beforeEach(() => {
    localStorage.clear();
    useLocaleStore.setState({ locale: 'es' });
  });

  afterEach(() => {
    cleanup();
    useAuthStore.setState({ status: 'cargando', email: null, membership: null });
  });

  it('en español muestra el título, el rol y las pestañas', () => {
    entrar();
    render(<AdminDashboard isOpen onClose={() => undefined} />);
    expect(screen.getByText('Panel Auto-Gestión & CRM')).toBeTruthy();
    expect(screen.getByText('Casa Sur • Administrador • ana@ejemplo.cl')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Leads CRM \(\d+\)/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Métricas' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cerrar panel' })).toBeTruthy();
  });

  it('en inglés se traducen el título, el rol, las pestañas y el cierre; el selector del panel cambia el idioma', () => {
    entrar();
    render(<AdminDashboard isOpen onClose={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByText('Self-Service Panel & CRM')).toBeTruthy();
    expect(screen.getByText('Casa Sur • Administrator • ana@ejemplo.cl')).toBeTruthy();
    expect(screen.getByRole('button', { name: /CRM Leads \(\d+\)/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Metrics' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Integrations & AI' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close panel' })).toBeTruthy();
  });
});
