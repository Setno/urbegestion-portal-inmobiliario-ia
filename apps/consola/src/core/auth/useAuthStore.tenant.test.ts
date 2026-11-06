import { describe, it, expect, beforeEach, vi } from 'vitest';

// H-064: al entrar, la corredora de la sesión pasa a ser la de los datos; al salir, se suelta.
vi.mock('./authService', () => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSessionEmail: vi.fn(),
  getMembership: vi.fn(),
  onAuthStateChange: vi.fn(),
  requestPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
  setPublicationMode: vi.fn(),
}));
vi.mock('../data/dataSource', () => ({ setSessionTenant: vi.fn() }));

import * as servicio from './authService';
import { setSessionTenant } from '../data/dataSource';
import { useAuthStore } from './useAuthStore';

const s = vi.mocked(servicio);
const fijar = vi.mocked(setSessionTenant);
const membresia = { tenantId: 'tenant-1', tenantName: 'Casa Sur', role: 'admin', publicationMode: 'con_aprobacion' } as const;

describe('useAuthStore: corredora de la sesión', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    s.onAuthStateChange.mockReturnValue(() => {});
    useAuthStore.setState({ status: 'cargando', email: null, membership: null, error: null, busy: false });
  });

  it('al iniciar con sesión y corredora fija la corredora antes de abrir el panel', async () => {
    s.getSessionEmail.mockResolvedValue('ana@ejemplo.test');
    s.getMembership.mockResolvedValue({ ...membresia });
    let estadoAlFijar: string | null = null;
    fijar.mockImplementation(() => {
      estadoAlFijar = useAuthStore.getState().status;
    });
    await useAuthStore.getState().init();
    expect(fijar).toHaveBeenCalledWith('tenant-1');
    expect(estadoAlFijar).not.toBe('con_sesion');
    expect(useAuthStore.getState().status).toBe('con_sesion');
  });

  it('al entrar con clave fija la corredora', async () => {
    s.signInWithPassword.mockResolvedValue({ ok: true, email: 'ana@ejemplo.test' });
    s.getMembership.mockResolvedValue({ ...membresia });
    await useAuthStore.getState().signIn('ana@ejemplo.test', 'clave-larga');
    expect(fijar).toHaveBeenCalledWith('tenant-1');
  });

  it('con sesión pero sin corredora no deja ninguna corredora fijada', async () => {
    s.getSessionEmail.mockResolvedValue('ana@ejemplo.test');
    s.getMembership.mockResolvedValue(null);
    await useAuthStore.getState().init();
    expect(fijar).toHaveBeenLastCalledWith(null);
  });

  it('sin sesión al iniciar no deja ninguna corredora fijada', async () => {
    s.getSessionEmail.mockResolvedValue(null);
    await useAuthStore.getState().init();
    expect(fijar).toHaveBeenLastCalledWith(null);
  });

  it('si falla la consulta de la corredora, la suelta', async () => {
    s.getSessionEmail.mockResolvedValue('ana@ejemplo.test');
    s.getMembership.mockRejectedValue(new Error('red'));
    await useAuthStore.getState().init();
    expect(fijar).toHaveBeenLastCalledWith(null);
  });

  it('al cerrar sesión suelta la corredora', async () => {
    useAuthStore.setState({ status: 'con_sesion', email: 'ana@ejemplo.test', membership: { ...membresia } });
    s.signOut.mockResolvedValue(undefined);
    await useAuthStore.getState().signOut();
    expect(fijar).toHaveBeenLastCalledWith(null);
  });

  it('si la sesión se cierra mientras llega la membresía, la respuesta tardía no reabre el panel ni fija la corredora', async () => {
    let resolver!: (m: unknown) => void;
    s.getSessionEmail.mockResolvedValue('ana@ejemplo.test');
    s.getMembership.mockReturnValue(new Promise((r) => (resolver = r)) as never);
    s.signOut.mockResolvedValue(undefined);
    const inicio = useAuthStore.getState().init();
    await Promise.resolve();
    await Promise.resolve();
    await useAuthStore.getState().signOut();
    fijar.mockClear();
    resolver({ ...membresia });
    await inicio;
    expect(useAuthStore.getState().status).toBe('sin_sesion');
    expect(fijar).not.toHaveBeenCalledWith('tenant-1');
  });

  it('si la sesión se cierra desde otro lado (SIGNED_OUT) suelta la corredora', async () => {
    let avisar: (evento: 'SIGNED_OUT', correo: string | null) => void = () => undefined;
    s.onAuthStateChange.mockImplementation((cb) => {
      avisar = cb as typeof avisar;
      return () => {};
    });
    s.getSessionEmail.mockResolvedValue(null);
    await useAuthStore.getState().init();
    fijar.mockClear();
    avisar('SIGNED_OUT', null);
    expect(fijar).toHaveBeenCalledWith(null);
  });
});
