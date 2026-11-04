import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { SiteAddressSection } from './SiteAddressSection';
import { useAuthStore } from '../../auth/useAuthStore';
import { useEntitlementsStore } from '../../platform/useEntitlementsStore';
import { fetchSiteAddress, saveSiteAddress } from '../../brand/siteAddressService';

vi.mock('../../data/dataSource', () => ({ isRemoteData: true }));
vi.mock('../../brand/siteAddressService', async (original) => ({
  ...(await original<typeof import('../../brand/siteAddressService')>()),
  fetchSiteAddress: vi.fn(),
  saveSiteAddress: vi.fn(),
}));

const entrar = (role: 'admin' | 'agente') =>
  useAuthStore.setState({ membership: { tenantName: 'Corredora de prueba', role, publicationMode: 'con_aprobacion' } });

const subdominio = () => screen.getByLabelText('Subdominio') as HTMLInputElement;
const dominio = () => screen.getByLabelText('Dominio propio (opcional)') as HTMLInputElement;
const guardar = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar dirección' }));

describe('SiteAddressSection (dirección del sitio, H-030)', () => {
  beforeEach(() => {
    useEntitlementsStore.getState().reset();
    vi.mocked(fetchSiteAddress).mockReset().mockResolvedValue({ subdomain: 'casasur', customDomain: '' });
    vi.mocked(saveSiteAddress).mockReset().mockResolvedValue({ ok: true });
  });

  afterEach(() => cleanup());

  it('el agente no la ve', () => {
    entrar('agente');
    expect(render(<SiteAddressSection />).container.innerHTML).toBe('');
    expect(fetchSiteAddress).not.toHaveBeenCalled();
  });

  it('el administrador ve la dirección guardada y no puede guardar sin cambios', async () => {
    entrar('admin');
    render(<SiteAddressSection />);
    await waitFor(() => expect(subdominio().value).toBe('casasur'));
    expect((screen.getByRole('button', { name: 'Guardar dirección' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('guarda el subdominio y el dominio limpios: minúsculas, sin https:// ni www.', async () => {
    entrar('admin');
    render(<SiteAddressSection />);
    await waitFor(() => expect(subdominio().value).toBe('casasur'));
    fireEvent.change(subdominio(), { target: { value: 'CasaSur2' } });
    fireEvent.change(dominio(), { target: { value: 'https://www.CasaSur.cl/' } });
    guardar();
    await waitFor(() => expect(saveSiteAddress).toHaveBeenCalledWith({ subdomain: 'casasur2', customDomain: 'casasur.cl' }));
    expect(await screen.findByText(/Dirección guardada/)).toBeTruthy();
  });

  it('con un dominio escrito muestra los registros DNS para conectarlo', async () => {
    entrar('admin');
    render(<SiteAddressSection />);
    await waitFor(() => expect(subdominio().value).toBe('casasur'));
    fireEvent.change(dominio(), { target: { value: 'casasur.cl' } });
    expect(screen.getByText('76.76.21.21')).toBeTruthy();
    expect(screen.getByText('cname.vercel-dns.com')).toBeTruthy();
  });

  it('un subdominio reservado o mal escrito se avisa sin llamar a la base', async () => {
    entrar('admin');
    render(<SiteAddressSection />);
    await waitFor(() => expect(subdominio().value).toBe('casasur'));
    for (const malo of ['www', 'casa sur', '-casa']) {
      fireEvent.change(subdominio(), { target: { value: malo } });
      guardar();
      expect(screen.getByText(/solo puede tener letras minúsculas/)).toBeTruthy();
    }
    expect(saveSiteAddress).not.toHaveBeenCalled();
  });

  it('un dominio de Vercel no se acepta como dominio propio', async () => {
    entrar('admin');
    render(<SiteAddressSection />);
    await waitFor(() => expect(subdominio().value).toBe('casasur'));
    fireEvent.change(dominio(), { target: { value: 'otra.vercel.app' } });
    guardar();
    expect(screen.getByText(/No sirven las direcciones de la plataforma ni las de Vercel/)).toBeTruthy();
    expect(saveSiteAddress).not.toHaveBeenCalled();
  });

  it('una dirección que ya usa otra corredora se explica', async () => {
    vi.mocked(saveSiteAddress).mockResolvedValue({ ok: false, error: 'repetida' });
    entrar('admin');
    render(<SiteAddressSection />);
    await waitFor(() => expect(subdominio().value).toBe('casasur'));
    fireEvent.change(subdominio(), { target: { value: 'otra' } });
    guardar();
    expect(await screen.findByText(/ya la usa otra corredora/)).toBeTruthy();
  });

  it('sin dominio propio en el plan, el campo queda bloqueado y no se envía', async () => {
    useEntitlementsStore.setState({ entitlements: { ...useEntitlementsStore.getState().entitlements, features: { 'site.custom_domain': false } } });
    entrar('admin');
    render(<SiteAddressSection />);
    await waitFor(() => expect(subdominio().value).toBe('casasur'));
    expect(dominio().disabled).toBe(true);
    expect(screen.getByText('Tu plan no incluye dominio propio.')).toBeTruthy();
    fireEvent.change(subdominio(), { target: { value: 'nueva' } });
    guardar();
    await waitFor(() => expect(saveSiteAddress).toHaveBeenCalledWith({ subdomain: 'nueva', customDomain: '' }));
  });

  it('si no se pudo leer la dirección actual, no deja editar', async () => {
    vi.mocked(fetchSiteAddress).mockResolvedValue(null);
    entrar('admin');
    render(<SiteAddressSection />);
    expect(await screen.findByText(/No se pudo leer la dirección actual/)).toBeTruthy();
    expect(screen.queryByLabelText('Subdominio')).toBeNull();
  });
});
