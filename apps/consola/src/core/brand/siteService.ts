import { supabase } from '../auth/supabaseClient';
import { parseSiteData, type SiteBrand, type SiteData, type SiteLayout, type SiteTheme } from '@portal/sitio-datos';

export type SiteSaveResult = { ok: true } | { ok: false; error: 'permiso' | 'demasiado_grande' | 'conexion' | 'no_configurado' | 'sin_datos' | 'enlace_invalido' };

// Datos públicos del sitio de la corredora, legibles sin sesión. Devuelve null si falla o la corredora no existe:
// quien llama sigue con lo último que tenía.
export async function fetchPublicSite(tenantId: string): Promise<SiteData | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('get_tenant_public_site', { p_tenant: tenantId });
    if (error || !data) return null;
    return parseSiteData(data);
  } catch (err) {
    console.warn('[sitio] No se pudieron leer los datos de la corredora:', err);
    return null;
  }
}

// Solo el administrador de esa corredora, y si su plan lo permite (lo exige la base con una función protegida).
export async function saveSiteBrand(tenantId: string, brand: SiteBrand, theme: SiteTheme, layout: SiteLayout): Promise<SiteSaveResult> {
  if (!supabase) return { ok: false, error: 'no_configurado' };
  try {
    const { error } = await supabase.rpc('set_site_brand', { p_tenant: tenantId, p_brand: brand, p_theme: theme, p_layout: layout });
    if (!error) return { ok: true };
    if (error.code === '42501') return { ok: false, error: 'permiso' };
    if (error.code === '23514') return { ok: false, error: 'demasiado_grande' };
    console.warn('[sitio] No se pudo guardar la marca:', error);
    return { ok: false, error: 'conexion' };
  } catch (err) {
    console.warn('[sitio] No se pudo guardar la marca:', err);
    return { ok: false, error: 'conexion' };
  }
}
