import { remoteContext } from '../data/dataSource';

// Dirección del sitio de la corredora (H-030, ADR-012): subdominio de la plataforma y dominio propio.
export interface SiteAddress {
  subdomain: string;
  customDomain: string;
}

export type SiteAddressError = 'repetida' | 'invalida' | 'permiso' | 'conexion' | 'no_configurado';
export type SiteAddressResult = { ok: true } | { ok: false; error: SiteAddressError };

// Dominio de la plataforma bajo el que viven los subdominios. Mientras no se elija, el panel lo dice.
export const platformDomain: string = (import.meta.env.VITE_SITIO_DOMINIO_BASE ?? '').trim().toLowerCase();

const SUBDOMAIN = /^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/;
const DOMAIN = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
export const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin', 'consola', 'panel', 'mail', 'correo', 'soporte', 'ayuda', 'blog', 'static', 'cdn'];

// Lo que la persona escribió, como lo guardará la base: minúsculas, sin https://, sin www. ni rutas.
export function cleanDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '');
}

export const validSubdomain = (value: string): boolean => value === '' || (SUBDOMAIN.test(value) && !RESERVED_SUBDOMAINS.includes(value));
// Ni el dominio de la plataforma (ni sus subdominios), ni los de Vercel o locales: nunca son de una corredora.
const notOwnable = (value: string): boolean =>
  /(^|\.)(vercel\.app|vercel-dns\.com|localhost)$/.test(value) ||
  (platformDomain !== '' && (value === platformDomain || value.endsWith(`.${platformDomain}`)));

export const validDomain = (value: string): boolean =>
  value === '' || (value.length >= 4 && value.length <= 253 && DOMAIN.test(value) && !notOwnable(value));

// Null si falla o no hay base: quien llama no deja editar (guardar sin haber leído borraría lo que hay).
export async function fetchSiteAddress(): Promise<SiteAddress | null> {
  const ctx = remoteContext();
  if (!ctx) return null;
  try {
    const { data, error } = await ctx.client
      .from('site_addresses')
      .select('subdomain, custom_domain')
      .eq('tenant_id', ctx.tenantId)
      .maybeSingle();
    if (error) return null;
    const row = data as { subdomain: string | null; custom_domain: string | null } | null;
    return { subdomain: row?.subdomain ?? '', customDomain: row?.custom_domain ?? '' };
  } catch (err) {
    console.warn('[sitio] No se pudo leer la dirección del sitio:', err);
    return null;
  }
}

export async function saveSiteAddress(address: SiteAddress): Promise<SiteAddressResult> {
  const ctx = remoteContext();
  if (!ctx) return { ok: false, error: 'no_configurado' };
  try {
    const { error } = await ctx.client.rpc('set_site_address', {
      p_tenant: ctx.tenantId,
      p_subdomain: address.subdomain,
      p_custom_domain: address.customDomain,
    });
    if (!error) return { ok: true };
    if (error.code === '23505') return { ok: false, error: 'repetida' };
    if (error.code === '23514') return { ok: false, error: 'invalida' };
    if (error.code === '42501') return { ok: false, error: 'permiso' };
    console.warn('[sitio] No se pudo guardar la dirección del sitio:', error);
    return { ok: false, error: 'conexion' };
  } catch (err) {
    console.warn('[sitio] No se pudo guardar la dirección del sitio:', err);
    return { ok: false, error: 'conexion' };
  }
}
