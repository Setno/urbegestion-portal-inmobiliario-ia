import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { PortalsSection } from './PortalsSection';
import { useAuthStore } from '../../auth/useAuthStore';
import {
  fetchPortalConnections,
  startMercadoLibreConnection,
  disconnectPortal,
  consumePortalResult,
  diagnoseMercadoLibre,
  createMercadoLibreTestUser,
} from '../../portals/portalConnectionService';

vi.mock('../../data/dataSource', () => ({ isRemoteData: true }));
vi.mock('../../portals/portalConnectionService', () => ({
  fetchPortalConnections: vi.fn(),
  startMercadoLibreConnection: vi.fn(),
  disconnectPortal: vi.fn(),
  consumePortalResult: vi.fn(),
  diagnoseMercadoLibre: vi.fn(),
  createMercadoLibreTestUser: vi.fn(),
}));
const preview = vi.hoisted(() => ({ on: true }));
vi.mock('../../portals/previewOnly', () => ({
  get isPreviewBuild() {
    return preview.on;
  },
}));

const entrar = (role: 'admin' | 'agente') =>
  useAuthStore.setState({ membership: { tenantId: 'tenant-1', tenantName: 'Corredora de prueba', role, publicationMode: 'con_aprobacion' } });

const conectada = [{ portal: 'mercadolibre' as const, accountId: '987', connectedAt: '2026-11-09T10:00:00Z', lastError: null }];

describe('PortalsSection (conexión con Mercado Libre, H-068.2)', () => {
  beforeEach(() => {
    vi.mocked(fetchPortalConnections).mockReset().mockResolvedValue([]);
    vi.mocked(startMercadoLibreConnection).mockReset().mockResolvedValue({ ok: true, url: 'https://auth.mercadolibre.cl/authorization?x=1' });
    vi.mocked(disconnectPortal).mockReset().mockResolvedValue({ ok: true });
    vi.mocked(consumePortalResult).mockReset().mockReturnValue(null);
  });

  afterEach(() => cleanup());

  describe('Diagnosticar Mercado Libre (solo previews)', () => {
    it('muestra el resultado del diagnóstico', async () => {
      entrar('admin');
      preview.on = true;
      vi.mocked(fetchPortalConnections).mockResolvedValue(conectada);
      vi.mocked(diagnoseMercadoLibre).mockReset().mockResolvedValue({ ok: true, lines: ['Cuenta: tipo normal.'] });
      render(<PortalsSection />);
      fireEvent.click(await screen.findByRole('button', { name: /Diagnosticar Mercado Libre/ }));
      expect(await screen.findByText('Cuenta: tipo normal.')).toBeTruthy();
    });

    it('crea un usuario de prueba tras confirmar y muestra sus datos de acceso', async () => {
      entrar('admin');
      preview.on = true;
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.mocked(fetchPortalConnections).mockResolvedValue(conectada);
      vi.mocked(createMercadoLibreTestUser).mockReset().mockResolvedValue({ ok: true, id: '99', nickname: 'TEST1', password: 'clave-x' });
      render(<PortalsSection />);
      fireEvent.click(await screen.findByRole('button', { name: /Crear usuario de prueba/ }));
      expect(await screen.findByText(/Usuario: TEST1/)).toBeTruthy();
      expect(screen.getByText(/Contraseña: clave-x/)).toBeTruthy();
      vi.restoreAllMocks();
    });

    it('si no confirma, no crea nada', async () => {
      entrar('admin');
      preview.on = true;
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      vi.mocked(fetchPortalConnections).mockResolvedValue(conectada);
      vi.mocked(createMercadoLibreTestUser).mockReset();
      render(<PortalsSection />);
      fireEvent.click(await screen.findByRole('button', { name: /Crear usuario de prueba/ }));
      expect(createMercadoLibreTestUser).not.toHaveBeenCalled();
      vi.restoreAllMocks();
    });

    it('en producción el botón no existe', async () => {
      entrar('admin');
      preview.on = false;
      vi.mocked(fetchPortalConnections).mockResolvedValue(conectada);
      render(<PortalsSection />);
      await screen.findByText(/Cuenta 987/);
      expect(screen.queryByRole('button', { name: /Diagnosticar/ })).toBeNull();
      expect(screen.queryByRole('button', { name: /Crear usuario de prueba/ })).toBeNull();
      preview.on = true;
    });
  });

  it('el agente no la ve', () => {
    entrar('agente');
    expect(render(<PortalsSection />).container.innerHTML).toBe('');
    expect(fetchPortalConnections).not.toHaveBeenCalled();
  });

  it('sin conexión ofrece conectar y avisa que hace falta un paquete de publicaciones', async () => {
    entrar('admin');
    render(<PortalsSection />);
    expect(await screen.findByRole('button', { name: /Conectar Mercado Libre/ })).toBeTruthy();
    expect(screen.getByText(/paquete de publicaciones/)).toBeTruthy();
  });

  it('conectar lleva al administrador a la dirección de Mercado Libre', async () => {
    entrar('admin');
    const irA = vi.fn();
    render(<PortalsSection navigate={irA} />);
    fireEvent.click(await screen.findByRole('button', { name: /Conectar Mercado Libre/ }));
    await waitFor(() => expect(irA).toHaveBeenCalledWith('https://auth.mercadolibre.cl/authorization?x=1'));
  });

  it('si el servidor no tiene las claves de la app lo explica', async () => {
    entrar('admin');
    vi.mocked(startMercadoLibreConnection).mockResolvedValue({ ok: false, error: 'plataforma' });
    const irA = vi.fn();
    render(<PortalsSection navigate={irA} />);
    fireEvent.click(await screen.findByRole('button', { name: /Conectar Mercado Libre/ }));
    expect(await screen.findByText(/aún no está disponible en la plataforma/)).toBeTruthy();
    expect(irA).not.toHaveBeenCalled();
  });

  it('conectada muestra la cuenta y permite desconectar tras confirmar', async () => {
    entrar('admin');
    vi.mocked(fetchPortalConnections).mockResolvedValueOnce(conectada).mockResolvedValue([]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<PortalsSection />);
    expect(await screen.findByText(/Cuenta 987/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Desconectar/ }));
    await waitFor(() => expect(disconnectPortal).toHaveBeenCalledWith('mercadolibre'));
    expect(await screen.findByText('Mercado Libre desconectado.')).toBeTruthy();
  });

  it('si el administrador no confirma, no desconecta', async () => {
    entrar('admin');
    vi.mocked(fetchPortalConnections).mockResolvedValue(conectada);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<PortalsSection />);
    fireEvent.click(await screen.findByRole('button', { name: /Desconectar/ }));
    expect(disconnectPortal).not.toHaveBeenCalled();
  });

  it('al volver de Mercado Libre muestra el resultado', async () => {
    entrar('admin');
    vi.mocked(consumePortalResult).mockReturnValue('ml-ok');
    vi.mocked(fetchPortalConnections).mockResolvedValue(conectada);
    render(<PortalsSection />);
    expect(await screen.findByText('Mercado Libre conectado.')).toBeTruthy();
  });

  it.each([
    ['ml-error', /No se pudo conectar/],
    ['ml-cancelado', /No autorizaste/],
  ] as const)('al volver con %s explica qué pasó', async (resultado, texto) => {
    entrar('admin');
    vi.mocked(consumePortalResult).mockReturnValue(resultado);
    render(<PortalsSection />);
    expect(await screen.findByText(texto)).toBeTruthy();
  });

  it('si no se puede leer el estado avisa en vez de inventarlo', async () => {
    entrar('admin');
    vi.mocked(fetchPortalConnections).mockResolvedValue(null);
    render(<PortalsSection />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Conectar Mercado Libre/ })).toBeNull();
  });
});
