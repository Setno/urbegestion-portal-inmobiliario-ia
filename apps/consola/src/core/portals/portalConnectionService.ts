import { remoteContext } from '../data/dataSource';
import { supabase } from '../auth/supabaseClient';

// Conexión de la corredora con los portales (H-068.2). Los tokens viven solo en el servidor: el panel ve únicamente
// a qué portal está conectada, con qué cuenta y desde cuándo.
export type PortalId = 'mercadolibre';

export interface PortalConnection {
  portal: PortalId;
  accountId: string;
  connectedAt: string;
  lastError: string | null;
}

export type PortalError = 'permiso' | 'plataforma' | 'conexion' | 'no_configurado';
export type PortalResult = { ok: true } | { ok: false; error: PortalError };

// Null si falla o no hay base: quien llama no muestra un estado inventado.
export async function fetchPortalConnections(): Promise<PortalConnection[] | null> {
  const ctx = remoteContext();
  if (!ctx) return null;
  try {
    const { data, error } = await ctx.client.rpc('portal_connection_status', { p_tenant: ctx.tenantId });
    if (error) return null;
    return ((data ?? []) as { portal: PortalId; account_id: string; connected_at: string; last_error: string | null }[]).map((row) => ({
      portal: row.portal,
      accountId: row.account_id,
      connectedAt: row.connected_at,
      lastError: row.last_error,
    }));
  } catch (err) {
    console.warn('[portales] No se pudo leer el estado de las conexiones:', err);
    return null;
  }
}

const CONNECT_ERRORS: Record<string, PortalError> = {
  unauthorized: 'permiso',
  not_admin: 'permiso',
  not_configured: 'plataforma',
};

// Pide al servidor la dirección de autorización de Mercado Libre. Solo se acepta una dirección de Mercado Libre.
// Direcciones de autorización de Mercado Libre aceptadas (lista exacta, nunca un patrón abierto).
const AUTH_HOSTS = new Set(['auth.mercadolibre.cl', 'auth.mercadolibre.com']);

export async function startMercadoLibreConnection(): Promise<{ ok: true; url: string } | { ok: false; error: PortalError }> {
  const ctx = remoteContext();
  if (!supabase || !ctx) return { ok: false, error: 'no_configurado' };
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ok: false, error: 'permiso' };
    // Se envía la corredora del panel: el servidor comprueba que sea administrador de ESA y no de otra.
    const res = await fetch('/api/portales/mercadolibre-conectar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tenantId: ctx.tenantId }),
    });
    const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (res.ok && typeof body.url === 'string') {
      try {
        const url = new URL(body.url);
        if (url.protocol === 'https:' && AUTH_HOSTS.has(url.hostname)) return { ok: true, url: url.toString() };
      } catch {
        /* dirección ilegible: cae al error */
      }
      return { ok: false, error: 'conexion' };
    }
    return { ok: false, error: CONNECT_ERRORS[body.error ?? ''] ?? 'conexion' };
  } catch (err) {
    console.warn('[portales] No se pudo iniciar la conexión con Mercado Libre:', err);
    return { ok: false, error: 'conexion' };
  }
}

export async function disconnectPortal(portal: PortalId): Promise<PortalResult> {
  const ctx = remoteContext();
  if (!ctx) return { ok: false, error: 'no_configurado' };
  try {
    const { error } = await ctx.client.rpc('disconnect_portal', { p_tenant: ctx.tenantId, p_portal: portal });
    if (!error) return { ok: true };
    return { ok: false, error: error.code === '42501' ? 'permiso' : 'conexion' };
  } catch (err) {
    console.warn('[portales] No se pudo desconectar el portal:', err);
    return { ok: false, error: 'conexion' };
  }
}

export type PortalReturn = 'ml-ok' | 'ml-error' | 'ml-cancelado' | 'ml-no-configurado';
const RETURNS: PortalReturn[] = ['ml-ok', 'ml-error', 'ml-cancelado', 'ml-no-configurado'];

// Al volver de Mercado Libre, la dirección trae `?portales=<resultado>`: se lee una vez y se borra de la barra.
export function consumePortalResult(): PortalReturn | null {
  try {
    const url = new URL(window.location.href);
    const value = url.searchParams.get('portales');
    if (value === null) return null;
    url.searchParams.delete('portales');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    return (RETURNS as string[]).includes(value) ? (value as PortalReturn) : null;
  } catch {
    return null;
  }
}
