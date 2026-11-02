import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { AdminDashboard } from './AdminDashboard';
import { useAuthStore } from '../auth/useAuthStore';
import { useLocaleStore } from '../i18n/i18n';

const mocks = vi.hoisted(() => ({ isPlatformOwner: vi.fn() }));
vi.mock('../auth/platformService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../auth/platformService')>()),
  isPlatformOwner: mocks.isPlatformOwner,
}));

const entrar = (role: 'admin' | 'agente') =>
  useAuthStore.setState({
    status: 'con_sesion',
    email: 'ana@ejemplo.cl',
    membership: { tenantName: 'Casa Sur', role, publicationMode: 'con_aprobacion' },
  });

const pestana = (nombre: RegExp | string) => screen.queryByRole('button', { name: nombre });

describe('AdminDashboard: pestañas según el rol', () => {
  beforeEach(() => {
    mocks.isPlatformOwner.mockReset().mockResolvedValue(false);
    localStorage.clear();
    useLocaleStore.setState({ locale: 'es' });
  });

  afterEach(() => {
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
});
