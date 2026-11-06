import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { LeadAlertsSection } from './LeadAlertsSection';
import { useAuthStore } from '../../auth/useAuthStore';
import { fetchLeadAlerts, saveLeadAlerts, startTelegramLink, unlinkTelegram } from '../../alerts/leadAlertService';

vi.mock('../../data/dataSource', () => ({ isRemoteData: true }));
vi.mock('../../alerts/leadAlertService', async (original) => ({
  ...(await original<typeof import('../../alerts/leadAlertService')>()),
  telegramBot: 'AvisosPortalBot',
  fetchLeadAlerts: vi.fn(),
  saveLeadAlerts: vi.fn(),
  startTelegramLink: vi.fn(),
  unlinkTelegram: vi.fn(),
}));

const entrar = (role: 'admin' | 'agente') =>
  useAuthStore.setState({ membership: { tenantId: 'tenant-1', tenantName: 'Corredora de prueba', role, publicationMode: 'con_aprobacion' } });

const sinAvisos = { emails: [], emailEnabled: false, telegramConnected: false, telegramEnabled: false };
const guardar = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar avisos' }));
const correo = (n: number) => screen.getByLabelText(`Correo ${n}`) as HTMLInputElement;

describe('LeadAlertsSection (avisos de leads nuevos, H-054)', () => {
  beforeEach(() => {
    vi.mocked(fetchLeadAlerts).mockReset().mockResolvedValue(sinAvisos);
    vi.mocked(saveLeadAlerts).mockReset().mockResolvedValue({ ok: true });
    vi.mocked(startTelegramLink).mockReset().mockResolvedValue('https://t.me/AvisosPortalBot?start=abc');
    vi.mocked(unlinkTelegram).mockReset().mockResolvedValue({ ok: true });
  });

  afterEach(() => cleanup());

  it('el agente no la ve', () => {
    entrar('agente');
    expect(render(<LeadAlertsSection />).container.innerHTML).toBe('');
    expect(fetchLeadAlerts).not.toHaveBeenCalled();
  });

  it('el administrador guarda hasta tres correos, limpios, con el aviso por correo prendido', async () => {
    entrar('admin');
    render(<LeadAlertsSection />);
    await waitFor(() => expect(correo(1)).toBeTruthy());
    fireEvent.click(screen.getByLabelText('Avisarme por correo'));
    fireEvent.change(correo(1), { target: { value: ' Ana@CasaSur.cl ' } });
    fireEvent.click(screen.getByRole('button', { name: /Agregar otro correo/ }));
    fireEvent.change(correo(2), { target: { value: 'luis@casasur.cl' } });
    fireEvent.click(screen.getByRole('button', { name: /Agregar otro correo/ }));
    expect(screen.queryByRole('button', { name: /Agregar otro correo/ })).toBeNull();
    guardar();
    await waitFor(() =>
      expect(saveLeadAlerts).toHaveBeenCalledWith({ emails: ['ana@casasur.cl', 'luis@casasur.cl'], emailEnabled: true, telegramEnabled: null }),
    );
    expect(await screen.findByText('Avisos guardados.')).toBeTruthy();
  });

  it('un correo mal escrito, o el aviso prendido sin correo, se explica sin llamar a la base', async () => {
    entrar('admin');
    render(<LeadAlertsSection />);
    await waitFor(() => expect(correo(1)).toBeTruthy());
    fireEvent.click(screen.getByLabelText('Avisarme por correo'));
    guardar();
    expect(screen.getByText(/Escribe al menos un correo/)).toBeTruthy();
    fireEvent.change(correo(1), { target: { value: 'ana@' } });
    guardar();
    expect(screen.getByText(/alguno no está bien escrito/)).toBeTruthy();
    expect(saveLeadAlerts).not.toHaveBeenCalled();
  });

  it('conectar Telegram abre el enlace de un solo uso del bot', async () => {
    const abrir = vi.spyOn(window, 'open').mockReturnValue(null);
    entrar('admin');
    render(<LeadAlertsSection />);
    fireEvent.click(await screen.findByRole('button', { name: /Conectar Telegram/ }));
    await waitFor(() => expect(abrir).toHaveBeenCalledWith('https://t.me/AvisosPortalBot?start=abc', '_blank', 'noopener,noreferrer'));
    expect(screen.getByRole('link', { name: 'https://t.me/AvisosPortalBot?start=abc' })).toBeTruthy();
    // "Ya lo conecté" vuelve a leer: ahora aparece conectado
    vi.mocked(fetchLeadAlerts).mockResolvedValue({ ...sinAvisos, telegramConnected: true, telegramEnabled: true });
    fireEvent.click(screen.getByRole('button', { name: 'Ya lo conecté' }));
    expect(await screen.findByText(/Avisarme por Telegram \(conectado\)/)).toBeTruthy();
    abrir.mockRestore();
  });

  it('con Telegram conectado, guardar envía si queda prendido o apagado', async () => {
    vi.mocked(fetchLeadAlerts).mockResolvedValue({ ...sinAvisos, telegramConnected: true, telegramEnabled: true });
    entrar('admin');
    render(<LeadAlertsSection />);
    fireEvent.click(await screen.findByLabelText(/Avisarme por Telegram/));
    guardar();
    await waitFor(() => expect(saveLeadAlerts).toHaveBeenCalledWith({ emails: [], emailEnabled: false, telegramEnabled: false }));
  });

  it('desconectar Telegram pide confirmación', async () => {
    vi.mocked(fetchLeadAlerts).mockResolvedValue({ ...sinAvisos, telegramConnected: true, telegramEnabled: true });
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);
    entrar('admin');
    render(<LeadAlertsSection />);
    fireEvent.click(await screen.findByRole('button', { name: 'Desconectar Telegram' }));
    await waitFor(() => expect(unlinkTelegram).toHaveBeenCalled());
    confirmar.mockRestore();
  });

  it('si no se pudo leer la configuración, no deja editar', async () => {
    vi.mocked(fetchLeadAlerts).mockResolvedValue(null);
    entrar('admin');
    render(<LeadAlertsSection />);
    expect(await screen.findByText(/No se pudo leer la configuración de avisos/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Guardar avisos' })).toBeNull();
  });
});
