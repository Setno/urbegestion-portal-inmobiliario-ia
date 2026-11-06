import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { useAuthStore } from './core/auth/useAuthStore';

// Consola de producción (VITE_MODO_PANEL=1): la dirección abre directo el inicio de sesión del panel.
// Sin la variable (previews, desarrollo) la aplicación se comporta como antes, con su portada de demostración.
vi.mock('./core/config/adminAccess', () => ({ ADMIN_ENABLED: true, PANEL_ONLY: true }));

import App from './App';

describe('App en modo panel (consola de producción)', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
    useAuthStore.setState({ status: 'sin_sesion', email: null, membership: null, init: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('muestra el inicio de sesión del panel sin la portada de demostración', () => {
    render(<App />);
    expect(screen.getByLabelText(/correo|email/i)).toBeTruthy();
    expect(screen.queryByLabelText('Modo Demostración')).toBeNull();
    expect(screen.queryByText('Abrir CRM Auto-Gestionable')).toBeNull();
  });

  it('no deja cerrar el panel: no hay botón de cerrar', () => {
    render(<App />);
    expect(screen.queryByRole('button', { name: /cerrar/i })).toBeNull();
  });
});
