import { describe, it, expect, beforeEach, vi } from 'vitest';

const { auth, consulta, from } = vi.hoisted(() => {
  const consulta = { maybeSingle: vi.fn() };
  return {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    consulta,
    from: vi.fn(() => ({ select: () => ({ limit: () => consulta }) })),
  };
});

vi.mock('./supabaseClient', () => ({ supabase: { auth, from } }));

import {
  signInWithPassword,
  signOut,
  getSessionEmail,
  getMembership,
  requestPasswordReset,
  updatePassword,
  onAuthStateChange,
} from './authService';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithPassword', () => {
    it('entra con credenciales correctas y devuelve el correo', async () => {
      auth.signInWithPassword.mockResolvedValue({ data: { user: { email: 'ana@ejemplo.test' } }, error: null });
      const r = await signInWithPassword('ana@ejemplo.test', 'clave-larga');
      expect(r).toEqual({ ok: true, email: 'ana@ejemplo.test' });
      expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'ana@ejemplo.test', password: 'clave-larga' });
    });

    it('con credenciales incorrectas devuelve el error "credenciales"', async () => {
      auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { status: 400, code: 'invalid_credentials', message: 'Invalid login credentials' },
      });
      expect(await signInWithPassword('ana@ejemplo.test', 'mala')).toEqual({ ok: false, error: 'credenciales' });
    });

    it('sin conexión devuelve el error "conexion"', async () => {
      auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { name: 'AuthRetryableFetchError', status: 0, message: 'fetch failed' },
      });
      expect(await signInWithPassword('ana@ejemplo.test', 'clave')).toEqual({ ok: false, error: 'conexion' });
    });

    it('si la llamada lanza una excepción devuelve "conexion" y no la propaga', async () => {
      auth.signInWithPassword.mockRejectedValue(new Error('red caída'));
      expect(await signInWithPassword('ana@ejemplo.test', 'clave')).toEqual({ ok: false, error: 'conexion' });
    });

    it('rechaza correo o clave vacíos sin llamar a Supabase', async () => {
      expect(await signInWithPassword('  ', 'clave')).toEqual({ ok: false, error: 'credenciales' });
      expect(await signInWithPassword('ana@ejemplo.test', '')).toEqual({ ok: false, error: 'credenciales' });
      expect(auth.signInWithPassword).not.toHaveBeenCalled();
    });
  });

  it('cierra la sesión en Supabase', async () => {
    auth.signOut.mockResolvedValue({ error: null });
    await signOut();
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('devuelve el correo de la sesión actual o null si no hay', async () => {
    auth.getSession.mockResolvedValueOnce({ data: { session: { user: { email: 'ana@ejemplo.test' } } } });
    expect(await getSessionEmail()).toBe('ana@ejemplo.test');
    auth.getSession.mockResolvedValueOnce({ data: { session: null } });
    expect(await getSessionEmail()).toBeNull();
  });

  describe('getMembership', () => {
    it('devuelve la corredora y el rol del usuario', async () => {
      consulta.maybeSingle.mockResolvedValue({ data: { role: 'admin', tenants: { name: 'UrbeGestión' } }, error: null });
      expect(await getMembership()).toEqual({ tenantName: 'UrbeGestión', role: 'admin' });
    });

    it('devuelve null si el usuario no pertenece a ninguna corredora', async () => {
      consulta.maybeSingle.mockResolvedValue({ data: null, error: null });
      expect(await getMembership()).toBeNull();
    });

    it('lanza error si la consulta falla (para no confundirlo con "sin corredora")', async () => {
      consulta.maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } });
      await expect(getMembership()).rejects.toThrow();
    });

    it('ignora roles desconocidos y los trata como sin membresía', async () => {
      consulta.maybeSingle.mockResolvedValue({ data: { role: 'superman', tenants: { name: 'X' } }, error: null });
      expect(await getMembership()).toBeNull();
    });
  });

  describe('recuperar contraseña', () => {
    it('pide el correo de recuperación y lo da por enviado', async () => {
      auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
      const r = await requestPasswordReset('ana@ejemplo.test');
      expect(r).toEqual({ ok: true });
      expect(auth.resetPasswordForEmail.mock.calls[0][0]).toBe('ana@ejemplo.test');
    });

    it('sin conexión devuelve "conexion"', async () => {
      auth.resetPasswordForEmail.mockRejectedValue(new Error('red caída'));
      expect(await requestPasswordReset('ana@ejemplo.test')).toEqual({ ok: false, error: 'conexion' });
    });

    it('rechaza una clave nueva demasiado corta sin llamar a Supabase', async () => {
      expect(await updatePassword('123')).toEqual({ ok: false, error: 'clave_corta' });
      expect(auth.updateUser).not.toHaveBeenCalled();
    });

    it('actualiza la clave cuando es válida', async () => {
      auth.updateUser.mockResolvedValue({ data: {}, error: null });
      expect(await updatePassword('una-clave-nueva')).toEqual({ ok: true });
      expect(auth.updateUser).toHaveBeenCalledWith({ password: 'una-clave-nueva' });
    });

    it('con un enlace vencido devuelve "enlace_invalido"', async () => {
      auth.updateUser.mockResolvedValue({ data: {}, error: { status: 401, message: 'Auth session missing!' } });
      expect(await updatePassword('una-clave-nueva')).toEqual({ ok: false, error: 'enlace_invalido' });
    });
  });

  it('traduce los eventos de Supabase y permite desuscribirse', () => {
    const unsubscribe = vi.fn();
    let callback: (evento: string, sesion: { user: { email: string } } | null) => void = () => {};
    auth.onAuthStateChange.mockImplementation((cb) => {
      callback = cb;
      return { data: { subscription: { unsubscribe } } };
    });
    const eventos: Array<[string, string | null]> = [];
    const baja = onAuthStateChange((evento, email) => eventos.push([evento, email]));
    callback('SIGNED_IN', { user: { email: 'ana@ejemplo.test' } });
    callback('PASSWORD_RECOVERY', { user: { email: 'ana@ejemplo.test' } });
    callback('SIGNED_OUT', null);
    callback('TOKEN_REFRESHED', { user: { email: 'ana@ejemplo.test' } });
    expect(eventos).toEqual([
      ['SIGNED_IN', 'ana@ejemplo.test'],
      ['PASSWORD_RECOVERY', 'ana@ejemplo.test'],
      ['SIGNED_OUT', null],
    ]);
    baja();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
