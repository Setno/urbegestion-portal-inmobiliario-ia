import { describe, it, expect, beforeEach, vi } from 'vitest';

const { auth } = vi.hoisted(() => ({ auth: { getSession: vi.fn() } }));
vi.mock('./supabaseClient', () => ({ supabase: { auth } }));

import { isPlatformOwner, createTenant } from './platformService';

const responde = (status: number, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }));

describe('platformService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok-1' } } });
  });

  describe('isPlatformOwner', () => {
    it('consulta /api/create-tenant con el token y devuelve si es dueño', async () => {
      responde(200, { owner: true });
      expect(await isPlatformOwner()).toBe(true);
      const [url, init] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('/api/create-tenant');
      expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok-1' });
    });

    it('devuelve false si el servidor responde error, no hay sesión o falla la red', async () => {
      responde(401, { error: 'unauthorized' });
      expect(await isPlatformOwner()).toBe(false);
      auth.getSession.mockResolvedValue({ data: { session: null } });
      expect(await isPlatformOwner()).toBe(false);
      auth.getSession.mockResolvedValue({ data: { session: { access_token: 't' } } });
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));
      expect(await isPlatformOwner()).toBe(false);
    });
  });

  describe('createTenant', () => {
    it('envía nombre y correo y devuelve ok', async () => {
      responde(200, { ok: true });
      expect(await createTenant('Corredora Sur', 'ana@sur.cl')).toEqual({ ok: true });
      const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
      expect(JSON.parse(init.body as string)).toEqual({ name: 'Corredora Sur', adminEmail: 'ana@sur.cl' });
    });

    it.each([
      [400, 'invalid_name', 'nombre_invalido'],
      [400, 'invalid_email', 'correo_invalido'],
      [409, 'name_taken', 'nombre_repetido'],
      [409, 'email_exists', 'correo_existente'],
      [403, 'not_owner', 'sin_permiso'],
      [502, 'invite_failed', 'conexion'],
    ])('traduce %s %s a %s', async (status, error, esperado) => {
      responde(status, { error });
      expect(await createTenant('Corredora Sur', 'ana@sur.cl')).toEqual({ ok: false, error: esperado });
    });
  });
});
