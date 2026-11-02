import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./authService', () => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSessionEmail: vi.fn(),
  getMembership: vi.fn(),
  onAuthStateChange: vi.fn(() => () => {}),
  requestPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
  setPublicationMode: vi.fn(),
}));

import * as servicio from './authService';
import { useAuthStore } from './useAuthStore';

const s = vi.mocked(servicio);
const inicial = { status: 'cargando', email: null, membership: null, error: null, busy: false } as const;

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    s.onAuthStateChange.mockReturnValue(() => {});
    useAuthStore.setState({ ...inicial });
  });

  describe('init', () => {
    it('sin sesión queda en "sin_sesion"', async () => {
      s.getSessionEmail.mockResolvedValue(null);
      await useAuthStore.getState().init();
      expect(useAuthStore.getState().status).toBe('sin_sesion');
    });

    it('con sesión y corredora queda en "con_sesion" con correo y rol', async () => {
      s.getSessionEmail.mockResolvedValue('ana@ejemplo.test');
      s.getMembership.mockResolvedValue({ tenantName: 'UrbeGestión', role: 'admin', publicationMode: 'con_aprobacion' });
      await useAuthStore.getState().init();
      const st = useAuthStore.getState();
      expect(st.status).toBe('con_sesion');
      expect(st.email).toBe('ana@ejemplo.test');
      expect(st.membership).toEqual({ tenantName: 'UrbeGestión', role: 'admin', publicationMode: 'con_aprobacion' });
    });

    it('con sesión pero sin corredora queda en "sin_membresia"', async () => {
      s.getSessionEmail.mockResolvedValue('ana@ejemplo.test');
      s.getMembership.mockResolvedValue(null);
      await useAuthStore.getState().init();
      expect(useAuthStore.getState().status).toBe('sin_membresia');
    });

    it('si falla la consulta de la corredora no abre el panel y avisa de la conexión', async () => {
      s.getSessionEmail.mockResolvedValue('ana@ejemplo.test');
      s.getMembership.mockRejectedValue(new Error('red'));
      await useAuthStore.getState().init();
      const st = useAuthStore.getState();
      expect(st.status).toBe('sin_sesion');
      expect(st.error).toBe('conexion');
    });
  });

  describe('signIn', () => {
    it('con credenciales correctas y corredora entra al panel', async () => {
      s.signInWithPassword.mockResolvedValue({ ok: true, email: 'ana@ejemplo.test' });
      s.getMembership.mockResolvedValue({ tenantName: 'UrbeGestión', role: 'agente', publicationMode: 'con_aprobacion' });
      await useAuthStore.getState().signIn('ana@ejemplo.test', 'clave');
      const st = useAuthStore.getState();
      expect(st.status).toBe('con_sesion');
      expect(st.membership?.role).toBe('agente');
      expect(st.error).toBeNull();
      expect(st.busy).toBe(false);
    });

    it('con credenciales incorrectas no entra y deja el error', async () => {
      s.signInWithPassword.mockResolvedValue({ ok: false, error: 'credenciales' });
      await useAuthStore.getState().signIn('ana@ejemplo.test', 'mala');
      const st = useAuthStore.getState();
      expect(st.status).not.toBe('con_sesion');
      expect(st.error).toBe('credenciales');
      expect(st.busy).toBe(false);
    });

    it('sin conexión deja el error "conexion"', async () => {
      s.signInWithPassword.mockResolvedValue({ ok: false, error: 'conexion' });
      await useAuthStore.getState().signIn('ana@ejemplo.test', 'clave');
      expect(useAuthStore.getState().error).toBe('conexion');
    });

    it('si el usuario no tiene corredora muestra "sin_membresia" (no ve el panel)', async () => {
      s.signInWithPassword.mockResolvedValue({ ok: true, email: 'ana@ejemplo.test' });
      s.getMembership.mockResolvedValue(null);
      await useAuthStore.getState().signIn('ana@ejemplo.test', 'clave');
      expect(useAuthStore.getState().status).toBe('sin_membresia');
    });
  });

  it('signOut limpia la sesión, el correo y la corredora', async () => {
    useAuthStore.setState({
      status: 'con_sesion',
      email: 'ana@ejemplo.test',
      membership: { tenantName: 'UrbeGestión', role: 'admin', publicationMode: 'con_aprobacion' },
    });
    s.signOut.mockResolvedValue(undefined);
    await useAuthStore.getState().signOut();
    const st = useAuthStore.getState();
    expect(st.status).toBe('sin_sesion');
    expect(st.email).toBeNull();
    expect(st.membership).toBeNull();
  });

  describe('recuperar contraseña', () => {
    it('al pedir el correo informa éxito sin revelar si el correo existe', async () => {
      s.requestPasswordReset.mockResolvedValue({ ok: true });
      expect(await useAuthStore.getState().resetPassword('quien-sea@ejemplo.test')).toEqual({ ok: true });
    });

    it('al volver del enlace de recuperación pasa a "recuperando"', async () => {
      let callback: (e: string, email: string | null) => void = () => {};
      s.onAuthStateChange.mockImplementation((cb) => {
        callback = cb;
        return () => {};
      });
      s.getSessionEmail.mockResolvedValue(null);
      await useAuthStore.getState().init();
      callback('PASSWORD_RECOVERY', 'ana@ejemplo.test');
      expect(useAuthStore.getState().status).toBe('recuperando');
    });

    it('al fijar la clave nueva con éxito vuelve a pedir ingreso', async () => {
      useAuthStore.setState({ status: 'recuperando', email: 'ana@ejemplo.test' });
      s.updatePassword.mockResolvedValue({ ok: true });
      s.signOut.mockResolvedValue(undefined);
      const r = await useAuthStore.getState().setNewPassword('una-clave-nueva');
      expect(r).toEqual({ ok: true });
      expect(useAuthStore.getState().status).toBe('sin_sesion');
    });

    it('si la clave nueva falla mantiene "recuperando" y devuelve el error', async () => {
      useAuthStore.setState({ status: 'recuperando', email: 'ana@ejemplo.test' });
      s.updatePassword.mockResolvedValue({ ok: false, error: 'clave_corta' });
      const r = await useAuthStore.getState().setNewPassword('123');
      expect(r).toEqual({ ok: false, error: 'clave_corta' });
      expect(useAuthStore.getState().status).toBe('recuperando');
    });
  });

  describe('changePublicationMode', () => {
    it('si la base lo acepta, actualiza el modo en la sesión', async () => {
      useAuthStore.setState({ membership: { tenantName: 'X', role: 'admin', publicationMode: 'con_aprobacion' } });
      s.setPublicationMode.mockResolvedValue({ ok: true });
      await useAuthStore.getState().changePublicationMode('directa');
      expect(s.setPublicationMode).toHaveBeenCalledWith('directa');
      expect(useAuthStore.getState().membership?.publicationMode).toBe('directa');
    });

    it('si falla, deja el modo como estaba', async () => {
      useAuthStore.setState({ membership: { tenantName: 'X', role: 'admin', publicationMode: 'con_aprobacion' } });
      s.setPublicationMode.mockResolvedValue({ ok: false, error: 'conexion' });
      await useAuthStore.getState().changePublicationMode('directa');
      expect(useAuthStore.getState().membership?.publicationMode).toBe('con_aprobacion');
    });
  });
});
