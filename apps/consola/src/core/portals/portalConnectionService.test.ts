import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { rpc, getSession } = vi.hoisted(() => ({ rpc: vi.fn(), getSession: vi.fn() }));
vi.mock('../data/dataSource', () => ({ remoteContext: () => ({ client: { rpc }, tenantId: 'tenant-1' }) }));
vi.mock('../auth/supabaseClient', () => ({ supabase: { auth: { getSession } } }));

import {
  fetchPortalConnections,
  startMercadoLibreConnection,
  disconnectPortal,
  consumePortalResult,
} from './portalConnectionService';

describe('portalConnectionService (H-068.2)', () => {
  beforeEach(() => {
    rpc.mockReset();
    getSession.mockReset().mockResolvedValue({ data: { session: { access_token: 'tok-sesion' } } });
  });
  afterEach(() => vi.unstubAllGlobals());

  describe('fetchPortalConnections', () => {
    it('lee a qué portales está conectada la corredora, sin tokens', async () => {
      rpc.mockResolvedValue({
        data: [{ portal: 'mercadolibre', account_id: '987', connected_at: '2026-11-09T10:00:00Z', last_error: null }],
        error: null,
      });
      const r = await fetchPortalConnections();
      expect(rpc).toHaveBeenCalledWith('portal_connection_status', { p_tenant: 'tenant-1' });
      expect(r).toEqual([{ portal: 'mercadolibre', accountId: '987', connectedAt: '2026-11-09T10:00:00Z', lastError: null }]);
    });

    it('devuelve null si la base falla (no deja editar a ciegas)', async () => {
      rpc.mockResolvedValue({ data: null, error: { code: 'x' } });
      expect(await fetchPortalConnections()).toBeNull();
      rpc.mockRejectedValue(new Error('red'));
      expect(await fetchPortalConnections()).toBeNull();
    });
  });

  describe('startMercadoLibreConnection', () => {
    it('pide la dirección al servidor con el token de sesión', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: 'https://auth.mercadolibre.cl/authorization?x=1' }) });
      vi.stubGlobal('fetch', fetchMock);
      const r = await startMercadoLibreConnection();
      expect(r).toEqual({ ok: true, url: 'https://auth.mercadolibre.cl/authorization?x=1' });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/portales/mercadolibre-conectar');
      expect(init.method).toBe('POST');
      expect(init.headers.Authorization).toBe('Bearer tok-sesion');
      expect(JSON.parse(init.body)).toEqual({ tenantId: 'tenant-1' });
    });

    it.each([
      'https://malo.example/robo',
      'https://mercadolibre.evil.com/authorization',
      'https://auth.mercadolibre.cl.evil.com/authorization',
      'https://evilmercadolibre.com/authorization',
      'http://auth.mercadolibre.cl/authorization',
    ])('no acepta una dirección que no sea de Mercado Libre (%s)', async (url) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url }) }));
      expect(await startMercadoLibreConnection()).toEqual({ ok: false, error: 'conexion' });
    });

    it.each([
      [403, 'not_admin', 'permiso'],
      [401, 'unauthorized', 'permiso'],
      [503, 'not_configured', 'plataforma'],
      [500, 'server_error', 'conexion'],
    ])('traduce el error %s %s a %s', async (status, error, esperado) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status, json: async () => ({ error }) }));
      expect(await startMercadoLibreConnection()).toEqual({ ok: false, error: esperado });
    });

    it('sin sesión no llama al servidor', async () => {
      getSession.mockResolvedValue({ data: { session: null } });
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      expect(await startMercadoLibreConnection()).toEqual({ ok: false, error: 'permiso' });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('disconnectPortal', () => {
    it('desconecta por la función de la base', async () => {
      rpc.mockResolvedValue({ error: null });
      expect(await disconnectPortal('mercadolibre')).toEqual({ ok: true });
      expect(rpc).toHaveBeenCalledWith('disconnect_portal', { p_tenant: 'tenant-1', p_portal: 'mercadolibre' });
    });

    it('explica el permiso o la caída', async () => {
      rpc.mockResolvedValue({ error: { code: '42501' } });
      expect(await disconnectPortal('mercadolibre')).toEqual({ ok: false, error: 'permiso' });
      rpc.mockResolvedValue({ error: { code: 'x' } });
      expect(await disconnectPortal('mercadolibre')).toEqual({ ok: false, error: 'conexion' });
    });
  });

  describe('consumePortalResult', () => {
    it('lee el resultado de la dirección y lo borra', () => {
      window.history.replaceState(null, '', '/?portales=ml-ok&otro=1');
      expect(consumePortalResult()).toBe('ml-ok');
      expect(window.location.search).toBe('?otro=1');
    });

    it('ignora valores desconocidos', () => {
      window.history.replaceState(null, '', '/?portales=<script>');
      expect(consumePortalResult()).toBeNull();
    });

    it('sin resultado devuelve null', () => {
      window.history.replaceState(null, '', '/');
      expect(consumePortalResult()).toBeNull();
    });
  });
});
