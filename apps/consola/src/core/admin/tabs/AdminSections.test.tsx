import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { TeamSection } from './TeamSection';
import { PlatformSection } from './PlatformSection';
import { PublicationModeSection } from './PublicationModeSection';
import { DataExportSection } from './DataExportSection';
import { AnalyticsTab } from './AnalyticsTab';
import { useAuthStore } from '../../auth/useAuthStore';
import { useLocaleStore } from '../../i18n/i18n';

const mocks = vi.hoisted(() => ({
  inviteAgent: vi.fn(),
  isPlatformOwner: vi.fn(),
  createTenant: vi.fn(),
}));

vi.mock('../../auth/authService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../auth/authService')>()),
  inviteAgent: mocks.inviteAgent,
}));
vi.mock('../../auth/platformService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../auth/platformService')>()),
  isPlatformOwner: mocks.isPlatformOwner,
  createTenant: mocks.createTenant,
}));

const entrar = (role: 'admin' | 'agente') =>
  useAuthStore.setState({ membership: { tenantId: 'tenant-1', tenantName: 'Corredora de prueba', role, publicationMode: 'con_aprobacion' } });

describe('secciones del panel (equipo, plataforma, publicación, exportación, métricas)', () => {
  beforeEach(() => {
    // Los gráficos (recharts) piden ResizeObserver, que jsdom no trae
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    mocks.inviteAgent.mockReset();
    mocks.isPlatformOwner.mockReset().mockResolvedValue(true);
    mocks.createTenant.mockReset();
    useAuthStore.setState({ membership: null });
    useLocaleStore.setState({ locale: 'es' });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('Equipo, Publicación y Exportación no se muestran al agente', () => {
    entrar('agente');
    for (const Seccion of [TeamSection, PublicationModeSection, DataExportSection]) {
      expect(render(<Seccion />).container.innerHTML).toBe('');
      cleanup();
    }
  });

  it('Equipo invita a un agente y confirma con su correo', async () => {
    entrar('admin');
    mocks.inviteAgent.mockResolvedValue({ ok: true, status: 'invitado' });
    render(<TeamSection />);
    expect(screen.getByText('Equipo: invitar a un agente')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Correo del agente'), { target: { value: 'nuevo@ejemplo.cl' } });
    fireEvent.click(screen.getByRole('button', { name: 'Invitar' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/^Invitación enviada a nuevo@ejemplo.cl\./));
  });

  it('Plataforma crea una corredora y confirma con su nombre', async () => {
    entrar('admin');
    mocks.createTenant.mockResolvedValue({ ok: true });
    render(<PlatformSection />);
    await screen.findByText('Plataforma: crear una corredora');
    fireEvent.change(screen.getByLabelText('Nombre de la corredora'), { target: { value: 'Casa Sur' } });
    fireEvent.change(screen.getByLabelText('Correo del administrador'), { target: { value: 'jefa@casasur.cl' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('Corredora "Casa Sur" creada. Se invitó a jefa@casasur.cl como administrador.'),
    );
  });

  it('Publicación muestra las dos opciones con la actual marcada', () => {
    entrar('admin');
    render(<PublicationModeSection />);
    expect(screen.getByText('Cómo se publican las propiedades')).toBeTruthy();
    expect(screen.getByRole('radio', { name: /El administrador aprueba/ }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: /Cada agente publica lo suyo/ }).getAttribute('aria-checked')).toBe('false');
  });

  it('Exportación ofrece las cuatro descargas', () => {
    entrar('admin');
    render(<DataExportSection />);
    for (const nombre of ['Propiedades (Excel)', 'Contactos (Excel)', 'Notas (Excel)', 'Copia completa (JSON)']) {
      expect(screen.getByRole('button', { name: nombre })).toBeTruthy();
    }
  });

  it('Métricas muestra los títulos', () => {
    render(<AnalyticsTab />);
    expect(screen.getByText('Métricas de Captación')).toBeTruthy();
    expect(screen.getByText('Origen de Prospectos')).toBeTruthy();
    expect(screen.getByText('Distribución de Propiedades')).toBeTruthy();
  });

  describe('en inglés', () => {
    beforeEach(() => useLocaleStore.setState({ locale: 'en' }));

    it('Equipo muestra el error de la invitación en inglés', async () => {
      entrar('admin');
      mocks.inviteAgent.mockResolvedValue({ ok: false, error: 'ya_miembro' });
      render(<TeamSection />);
      expect(screen.getByText('Team: invite an agent')).toBeTruthy();
      fireEvent.change(screen.getByLabelText('Agent email'), { target: { value: 'otro@ejemplo.cl' } });
      fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
      await waitFor(() =>
        expect(screen.getByRole('status').textContent).toBe('That person is already part of your brokerage or already has an invitation.'),
      );
    });

    it('Plataforma, Publicación, Exportación y Métricas salen en inglés', async () => {
      entrar('admin');
      render(<PlatformSection />);
      await screen.findByText('Platform: create a brokerage');
      cleanup();
      render(<PublicationModeSection />);
      expect(screen.getByText('How properties are published')).toBeTruthy();
      expect(screen.getByRole('radio', { name: /Each agent publishes their own/ })).toBeTruthy();
      cleanup();
      render(<DataExportSection />);
      expect(screen.getByRole('button', { name: 'Full copy (JSON)' })).toBeTruthy();
      cleanup();
      render(<AnalyticsTab />);
      expect(screen.getByText('Lead Generation Metrics')).toBeTruthy();
      expect(screen.getByText('Prospect Sources')).toBeTruthy();
    });
  });
});
