import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { rpc, getSession, from } = vi.hoisted(() => ({ rpc: vi.fn(), getSession: vi.fn(), from: vi.fn() }));
vi.mock('../data/dataSource', () => ({ remoteContext: () => ({ client: { rpc, from }, tenantId: 'tenant-1' }) }));
vi.mock('../auth/supabaseClient', () => ({ supabase: { auth: { getSession } } }));

import {
  fetchPortalConnections,
  startMercadoLibreConnection,
  disconnectPortal,
  consumePortalResult,
  fetchPortalListings,
  publishToMercadoLibre,
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

  describe('fetchPortalListings (H-068.3)', () => {
    beforeEach(() => from.mockReset());

    it('lee los avisos de la corredora indexados por propiedad, marcando los pendientes', async () => {
      const eq = vi.fn().mockResolvedValue({
        data: [
          { property_id: 'p1', portal: 'mercadolibre', external_id: 'MLC1', permalink: 'https://casa.mercadolibre.cl/MLC1', status: 'activa', last_error: null, updated_at: '2026-11-09T10:00:00Z' },
          { property_id: 'p2', portal: 'mercadolibre', external_id: 'pendiente', permalink: null, status: 'activa', last_error: 'Revisa', updated_at: '2026-11-09T11:00:00Z' },
        ],
        error: null,
      });
      from.mockReturnValue({ select: () => ({ eq }) });
      const r = await fetchPortalListings();
      expect(from).toHaveBeenCalledWith('portal_listings');
      expect(eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
      expect(r).toEqual({
        p1: { portal: 'mercadolibre', permalink: 'https://casa.mercadolibre.cl/MLC1', status: 'activa', pending: false, updatedAt: '2026-11-09T10:00:00Z', lastError: null },
        p2: { portal: 'mercadolibre', permalink: null, status: 'activa', pending: true, updatedAt: '2026-11-09T11:00:00Z', lastError: 'Revisa' },
      });
    });

    it('devuelve null si la base falla', async () => {
      from.mockReturnValue({ select: () => ({ eq: vi.fn().mockResolvedValue({ data: null, error: { code: 'x' } }) }) });
      expect(await fetchPortalListings()).toBeNull();
    });
  });

  describe('publishToMercadoLibre (H-068.3)', () => {
    const resp = (ok: boolean, status: number, body: unknown) => vi.fn().mockResolvedValue({ ok, status, json: async () => body });

    it('pide publicar con el token de sesión y devuelve el enlace', async () => {
      const fetchMock = resp(true, 200, { ok: true, permalink: 'https://casa.mercadolibre.cl/MLC1', warning: 'ojo' });
      vi.stubGlobal('fetch', fetchMock);
      expect(await publishToMercadoLibre('prop-1')).toEqual({ ok: true, permalink: 'https://casa.mercadolibre.cl/MLC1', warning: 'ojo' });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/portales/mercadolibre-publicar');
      expect(init.headers.Authorization).toBe('Bearer tok-sesion');
      expect(JSON.parse(init.body)).toEqual({ propertyId: 'prop-1' });
    });

    it('descarta un enlace que no sea de Mercado Libre', async () => {
      vi.stubGlobal('fetch', resp(true, 200, { ok: true, permalink: 'https://malo.example/x' }));
      expect(await publishToMercadoLibre('prop-1')).toEqual({ ok: true, permalink: null });
    });

    it('devuelve el código del servidor y sus mensajes', async () => {
      vi.stubGlobal('fetch', resp(false, 422, { error: 'datos', messages: ['Falta la superficie (total o construida).'] }));
      expect(await publishToMercadoLibre('prop-1')).toEqual({ ok: false, error: 'datos', messages: ['Falta la superficie (total o construida).'] });
    });

    it('un error desconocido o una caída se vuelven "conexion"', async () => {
      vi.stubGlobal('fetch', resp(false, 500, { error: 'algo-raro' }));
      expect(await publishToMercadoLibre('prop-1')).toEqual({ ok: false, error: 'conexion', messages: [] });
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('red')));
      expect(await publishToMercadoLibre('prop-1')).toEqual({ ok: false, error: 'conexion', messages: [] });
    });

    it('sin sesión no llama al servidor', async () => {
      getSession.mockResolvedValue({ data: { session: null } });
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      expect(await publishToMercadoLibre('prop-1')).toEqual({ ok: false, error: 'unauthorized', messages: [] });
      expect(fetchMock).not.toHaveBeenCalled();
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
