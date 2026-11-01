import { supabase } from '../auth/supabaseClient';
import type { SimpleResult } from '../auth/authService';
import { DEFAULT_MARKET_ID } from '../../markets';

export interface MarketSettings {
  marketId: string;
  serviceAreas: string[];
}

export const DEFAULT_SETTINGS: MarketSettings = { marketId: DEFAULT_MARKET_ID, serviceAreas: [] };

// Lo que llegue del servidor se valida: un dato raro nunca debe romper el buscador del sitio.
export function parseSettings(raw: unknown): MarketSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as { market?: unknown; service_areas?: unknown };
  return {
    marketId: typeof obj.market === 'string' && obj.market ? obj.market : DEFAULT_SETTINGS.marketId,
    serviceAreas: Array.isArray(obj.service_areas) ? obj.service_areas.filter((a): a is string => typeof a === 'string') : [],
  };
}

// Mercado y zonas de la corredora, legibles sin sesión (el sitio público los necesita para armar el buscador).
// Devuelve null si no hay Supabase, falla la consulta o la corredora no existe: el llamador usa los valores por defecto.
export async function fetchPublicSettings(tenantId: string): Promise<MarketSettings | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('get_tenant_public_settings', { p_tenant: tenantId });
    if (error || !data) return null;
    return parseSettings(data);
  } catch (err) {
    console.warn('[market] No se pudieron leer los ajustes de la corredora:', err);
    return null;
  }
}

// Solo el administrador puede cambiar las zonas (lo exige la base con una función protegida).
export async function saveServiceAreas(areas: string[]): Promise<SimpleResult> {
  if (!supabase) return { ok: false, error: 'no_configurado' };
  try {
    const { error } = await supabase.rpc('set_service_areas', { p_areas: areas });
    return error ? { ok: false, error: 'conexion' } : { ok: true };
  } catch (err) {
    console.warn('[market] No se pudieron guardar las zonas de trabajo:', err);
    return { ok: false, error: 'conexion' };
  }
}
