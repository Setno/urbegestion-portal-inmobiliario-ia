import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { AdminDashboard } from './AdminDashboard';
import { useAuthStore } from '../auth/useAuthStore';
import { useLocaleStore } from '../i18n/i18n';
import { useEntitlementsStore } from '../platform/useEntitlementsStore';

const mocks = vi.hoisted(() => ({ isPlatformOwner: vi.fn() }));
vi.mock('../auth/platformService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../auth/platformService')>()),
  isPlatformOwner: mocks.isPlatformOwner,
}));

const entrar = (role: 'admin' | 'agente') =>
  useAuthStore.setState({
    status: 'con_sesion',
    email: 'ana@ejemplo.cl',
    membership: { tenantId: 'tenant-1', tenantName: 'Casa Sur', role, publicationMode: 'con_aprobacion' },
  });

const pestana = (nombre: RegExp | string) => screen.queryByRole('button', { name: nombre });

describe('AdminDashboard: pestañas según el rol', () => {
  beforeEach(() => {
    // Los gráficos (recharts) piden ResizeObserver, que jsdom no trae
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    mocks.isPlatformOwner.mockReset().mockResolvedValue(false);
    useEntitlementsStore.getState().reset();
    localStorage.clear();
    useLocaleStore.setState({ locale: 'es' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
    useAuthStore.setState({ status: 'cargando', email: null, membership: null });
  });

  it('el agente ve solo Leads, Propiedades y Métricas', async () => {
    entrar('agente');
    render(<AdminDashboard isOpen onClose={() => undefined} />);
    expect(pestana(/Leads CRM/)).toBeTruthy();
    expect(pestana(/Propiedades \(/)).toBeTruthy();
    expect(pestana('Métricas')).toBeTruthy();
    for (const oculta of ['Mi corredora', 'Integraciones & IA', 'Identidad & Marca', 'Plataforma']) expect(pestana(oculta)).toBeNull();
    await waitFor(() => expect(mocks.isPlatformOwner).toHaveBeenCalled());
  });

  it('el administrador ve además Mi corredora, Integraciones e Identidad, pero no Plataforma', async () => {
    entrar('admin');
    render(<AdminDashboard isOpen onClose={() => undefined} />);
    for (const visible of ['Mi corredora', 'Integraciones & IA', 'Identidad & Marca']) expect(pestana(visible)).toBeTruthy();
    expect(pestana('Plataforma')).toBeNull();
    await waitFor(() => expect(mocks.isPlatformOwner).toHaveBeenCalled());
  });

  it('el dueño del producto ve la pestaña Plataforma cuando el servidor lo confirma', async () => {
    mocks.isPlatformOwner.mockResolvedValue(true);
    entrar('admin');
    render(<AdminDashboard isOpen onClose={() => undefined} />);
    expect(await screen.findByRole('button', { name: 'Plataforma' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Plataforma' }));
    expect(await screen.findByText('Plataforma: crear una corredora')).toBeTruthy();
  });

  it('Mi corredora reúne equipo, zonas, publicación y descarga de datos para el administrador', () => {
    entrar('admin');
    render(<AdminDashboard isOpen onClose={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mi corredora' }));
    expect(screen.getByText('Equipo: invitar a un agente')).toBeTruthy();
    expect(screen.getByText('Dónde trabaja tu corredora')).toBeTruthy();
    expect(screen.getByText('Cómo se publican las propiedades')).toBeTruthy();
    expect(screen.getByText('Tus datos son tuyos: descargar una copia')).toBeTruthy();
  });

  it('Integraciones quedó solo con conectores e IA: ya no trae equipo, zonas, publicación ni descarga', () => {
    entrar('admin');
    render(<AdminDashboard isOpen onClose={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Integraciones & IA' }));
    expect(screen.getByText('Ajustes & Conectores de Integración')).toBeTruthy();
    for (const movido of ['Equipo: invitar a un agente', 'Dónde trabaja tu corredora', 'Cómo se publican las propiedades', 'Tus datos son tuyos: descargar una copia']) {
      expect(screen.queryByText(movido)).toBeNull();
    }
  });

  it('en inglés las pestañas nuevas se traducen', () => {
    entrar('admin');
    useLocaleStore.setState({ locale: 'en' });
    render(<AdminDashboard isOpen onClose={() => undefined} />);
    expect(pestana('My brokerage')).toBeTruthy();
  });

  describe('planes y estado de la suscripción (H-033)', () => {
    const aplicar = (msg: object) => useEntitlementsStore.getState().apply({ updatedAt: '2026-11-02T10:00:00Z', ...msg });
    const exportar = () => screen.queryByRole('button', { name: /Exportar Excel/ }) as HTMLButtonElement | null;
    // jsdom marca como inactivo (:disabled) también lo que está dentro de un fieldset deshabilitado
    const inactivo = (b: HTMLElement | null) => b?.matches(':disabled');

    it('al día no hay aviso y todo está activo', () => {
      entrar('admin');
      render(<AdminDashboard isOpen onClose={() => undefined} />);
      expect(screen.queryByRole('status')).toBeNull();
      expect(inactivo(exportar())).toBe(false);
    });

    it('con pago pendiente dentro del plazo hay aviso con la fecha, y todo sigue activo', () => {
      aplicar({ status: 'past_due', graceEndsAt: '2099-12-31T00:00:00Z' });
      entrar('admin');
      render(<AdminDashboard isOpen onClose={() => undefined} />);
      expect(screen.getByRole('status').textContent).toMatch(/pago pendiente\. Todo sigue funcionando hasta el/);
      expect(inactivo(exportar())).toBe(false);
    });

    it('suspendida: aviso de solo lectura y los botones del trabajo quedan inactivos, pero las pestañas siguen navegables', () => {
      aplicar({ status: 'suspended' });
      entrar('admin');
      render(<AdminDashboard isOpen onClose={() => undefined} />);
      expect(screen.getByRole('status').textContent).toMatch(/modo solo lectura/);
      expect(inactivo(exportar())).toBe(true);
      const pestanaMetricas = screen.getByRole('button', { name: 'Métricas' }) as HTMLButtonElement;
      expect(inactivo(pestanaMetricas)).toBe(false);
      fireEvent.click(pestanaMetricas);
      expect(screen.getByText('Métricas de Captación')).toBeTruthy();
    });

    it('suspendida: en Mi corredora se bloquea todo menos la descarga de datos', () => {
      aplicar({ status: 'suspended' });
      entrar('admin');
      render(<AdminDashboard isOpen onClose={() => undefined} />);
      fireEvent.click(screen.getByRole('button', { name: 'Mi corredora' }));
      expect(inactivo(screen.getByRole('button', { name: 'Invitar' }))).toBe(true);
      expect(inactivo(screen.getByRole('button', { name: 'Copia completa (JSON)' }))).toBe(false);
    });

    it('cancelada: el administrador solo ve Mi corredora y allí solo la descarga de datos', () => {
      aplicar({ status: 'cancelled' });
      entrar('admin');
      render(<AdminDashboard isOpen onClose={() => undefined} />);
      expect(screen.getByRole('status').textContent).toMatch(/suscripción fue cancelada/);
      for (const oculta of [/Leads CRM/, /^Propiedades \(\d+\)$/, 'Métricas', 'Integraciones & IA', 'Identidad & Marca']) expect(pestana(oculta)).toBeNull();
      expect(screen.getByText('Tus datos son tuyos: descargar una copia')).toBeTruthy();
      expect(screen.queryByText('Equipo: invitar a un agente')).toBeNull();
    });

    it('cancelada: un agente no ve pestañas y se le pide hablar con el administrador', () => {
      aplicar({ status: 'cancelled' });
      entrar('agente');
      render(<AdminDashboard isOpen onClose={() => undefined} />);
      expect(screen.getByRole('status').textContent).toMatch(/Pide al administrador/);
      expect(pestana(/Leads CRM/)).toBeNull();
    });

    it('si el plan no incluye edición de marca, desaparece Identidad & Marca', () => {
      aplicar({ features: { 'branding.edit': false } });
      entrar('admin');
      render(<AdminDashboard isOpen onClose={() => undefined} />);
      expect(pestana('Identidad & Marca')).toBeNull();
      expect(pestana('Integraciones & IA')).toBeTruthy();
    });

    it('si el plan no incluye exportación, desaparecen el botón del CRM y la descarga de datos', () => {
      aplicar({ features: { 'crm.export': false } });
      entrar('admin');
      render(<AdminDashboard isOpen onClose={() => undefined} />);
      expect(exportar()).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Mi corredora' }));
      expect(screen.queryByText('Tus datos son tuyos: descargar una copia')).toBeNull();
    });
  });
});
