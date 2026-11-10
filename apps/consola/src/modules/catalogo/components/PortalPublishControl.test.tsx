import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { PortalPublishControl } from './PortalPublishControl';
import { useAuthStore } from '../../../core/auth/useAuthStore';
import { publishToMercadoLibre } from '../../../core/portals/portalConnectionService';
import type { Property } from '../types/property';

vi.mock('../../../core/data/dataSource', () => ({ isRemoteData: true }));
vi.mock('../../../core/portals/portalConnectionService', async (original) => ({
  ...(await original<typeof import('../../../core/portals/portalConnectionService')>()),
  publishToMercadoLibre: vi.fn(),
}));

const entrar = (role: 'admin' | 'agente') =>
  useAuthStore.setState({ membership: { tenantId: 'tenant-1', tenantName: 'Corredora', role, publicationMode: 'con_aprobacion' } });

const propiedad = (extra: Partial<Property> = {}): Property =>
  ({ id: 'prop-1', title: 'Casa', status: 'disponible', publicationStatus: 'publicada', ...extra }) as Property;

const listing = {
  portal: 'mercadolibre' as const,
  permalink: 'https://casa.mercadolibre.cl/MLC1',
  status: 'activa' as const,
  pending: false,
  updatedAt: new Date().toISOString(),
  lastError: null,
};
const boton = () => screen.getByRole('button', { name: /Publicar en Mercado Libre/ });

describe('PortalPublishControl (H-068.3)', () => {
  beforeEach(() => {
    vi.mocked(publishToMercadoLibre).mockReset().mockResolvedValue({ ok: true, permalink: 'https://casa.mercadolibre.cl/MLC1' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('el agente no lo ve', () => {
    entrar('agente');
    expect(render(<PortalPublishControl property={propiedad()} connected onChanged={() => {}} />).container.innerHTML).toBe('');
  });

  it('una propiedad sin aprobar, vendida o arrendada no ofrece publicar', () => {
    entrar('admin');
    for (const extra of [{ publicationStatus: 'borrador' as const }, { status: 'vendida' as const }, { status: 'arrendada' as const }]) {
      const { container, unmount } = render(<PortalPublishControl property={propiedad(extra)} connected onChanged={() => {}} />);
      expect(container.querySelector('button')).toBeNull();
      unmount();
    }
  });

  it('sin cuenta conectada orienta a conectarla, sin botón', () => {
    entrar('admin');
    render(<PortalPublishControl property={propiedad()} connected={false} onChanged={() => {}} />);
    expect(screen.getByText(/Conecta Mercado Libre/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Publicar en Mercado Libre/ })).toBeNull();
  });

  it('publica tras confirmar, avisa y recarga', async () => {
    entrar('admin');
    const onChanged = vi.fn();
    render(<PortalPublishControl property={propiedad()} connected onChanged={onChanged} />);
    fireEvent.click(boton());
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(publishToMercadoLibre).toHaveBeenCalledWith('prop-1'));
    expect(await screen.findByText(/Publicada en Mercado Libre/)).toBeTruthy();
    expect(onChanged).toHaveBeenCalled();
  });

  it('si no confirma, no publica', () => {
    entrar('admin');
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<PortalPublishControl property={propiedad()} connected onChanged={() => {}} />);
    fireEvent.click(boton());
    expect(publishToMercadoLibre).not.toHaveBeenCalled();
  });

  it('muestra la advertencia de Mercado Libre junto con el éxito', async () => {
    entrar('admin');
    vi.mocked(publishToMercadoLibre).mockResolvedValue({ ok: true, permalink: null, warning: 'Revisa la descripción.' });
    render(<PortalPublishControl property={propiedad()} connected onChanged={() => {}} />);
    fireEvent.click(boton());
    expect(await screen.findByText(/Revisa la descripción\./)).toBeTruthy();
  });

  it.each([
    ['datos', ['Falta al menos una foto con dirección pública.'], /Falta al menos una foto/],
    ['rechazado', ['Falta el paquete de publicaciones'], /Falta el paquete de publicaciones/],
    ['reconnect', [], /Vuelve a conectar Mercado Libre/],
    ['not_connected', [], /Conecta Mercado Libre/],
    ['not_approved', [], /aprobada/],
    ['red', [], /No se pudo contactar/],
    ['not_configured', [], /aún no está disponible/],
    ['conexion', [], /Revisa tu conexión/],
  ] as const)('explica el error %s', async (error, messages, texto) => {
    entrar('admin');
    vi.mocked(publishToMercadoLibre).mockResolvedValue({ ok: false, error, messages: [...messages] });
    render(<PortalPublishControl property={propiedad()} connected onChanged={() => {}} />);
    fireEvent.click(boton());
    expect(await screen.findByText(texto)).toBeTruthy();
    expect(boton()).toBeTruthy(); // se puede reintentar
  });

  it('con el aviso ya publicado muestra el enlace y no ofrece publicar de nuevo', () => {
    entrar('admin');
    render(<PortalPublishControl property={propiedad()} listing={listing} connected onChanged={() => {}} />);
    const link = screen.getByRole('link', { name: /Ver aviso/ }) as HTMLAnchorElement;
    expect(link.href).toBe('https://casa.mercadolibre.cl/MLC1');
    expect(link.rel).toContain('noopener');
    expect(screen.queryByRole('button', { name: /Publicar en Mercado Libre/ })).toBeNull();
  });

  it('un aviso pendiente se muestra como "publicándose"', () => {
    entrar('admin');
    render(<PortalPublishControl property={propiedad()} listing={{ ...listing, pending: true, permalink: null }} connected onChanged={() => {}} />);
    expect(screen.getByText(/Publicándose/)).toBeTruthy();
  });

  it('un aviso dudoso muestra la nota del servidor y no deja publicar de nuevo todavía', () => {
    entrar('admin');
    render(
      <PortalPublishControl
        property={propiedad()}
        listing={{ ...listing, pending: true, permalink: null, lastError: 'Revisa tu cuenta de Mercado Libre antes de reintentar.' }}
        connected
        onChanged={() => {}}
      />,
    );
    expect(screen.getByText(/Revisa tu cuenta de Mercado Libre antes de reintentar/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Publicar en Mercado Libre/ })).toBeNull();
  });

  it('una reserva pendiente abandonada (más de 10 minutos) vuelve a ofrecer el botón', () => {
    entrar('admin');
    const vieja = new Date(Date.now() - 11 * 60_000).toISOString();
    render(<PortalPublishControl property={propiedad()} listing={{ ...listing, pending: true, permalink: null, updatedAt: vieja, lastError: 'Revisa tu cuenta.' }} connected onChanged={() => {}} />);
    expect(boton()).toBeTruthy();
    expect(screen.getByText('Revisa tu cuenta.')).toBeTruthy();
  });

  it('un corte dudoso del servidor se explica sin invitar a reintentar a ciegas', async () => {
    entrar('admin');
    vi.mocked(publishToMercadoLibre).mockResolvedValue({ ok: false, error: 'uncertain', messages: ['No se sabe si el aviso llegó a publicarse. Revisa tu cuenta de Mercado Libre antes de reintentar.'] });
    const onChanged = vi.fn();
    render(<PortalPublishControl property={propiedad()} connected onChanged={onChanged} />);
    fireEvent.click(boton());
    expect(await screen.findByText(/Revisa tu cuenta de Mercado Libre antes de reintentar/)).toBeTruthy();
    expect(onChanged).toHaveBeenCalled(); // recarga: ahora la propiedad aparece con el aviso pendiente
  });

  it('el aviso publicado se sigue viendo aunque la propiedad ya se vendió', () => {
    entrar('admin');
    render(<PortalPublishControl property={propiedad({ status: 'vendida' })} listing={listing} connected onChanged={() => {}} />);
    expect(screen.getByRole('link', { name: /Ver aviso/ })).toBeTruthy();
  });
});
