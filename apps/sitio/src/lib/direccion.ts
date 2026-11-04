import { REVALIDATE_SECONDS, type SiteEnv } from './getSite';
import { esDireccionDePrueba, limpiarHost } from './host';
import { esUuid } from './uuid';

// Cómo llegar a la base y qué corredora mostrar en local y en los previews (H-030, ADR-012).
export interface Conexion {
  url: string;
  key: string;
  // SITIO_TENANT_ID: solo para localhost y *.vercel.app, que no son de ninguna corredora.
  tenantPorDefecto: string | null;
}

// En Vercel se usan los nombres propios del sitio; en local se reutilizan los de la consola (mismo .env.local).
export function conexion(env: Record<string, string | undefined> = process.env): Conexion | null {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const tenant = env.SITIO_TENANT_ID || env.VITE_TENANT_ID || '';
  return url && key ? { url, key, tenantPorDefecto: esUuid(tenant) ? tenant : null } : null;
}

// El dominio de la plataforma bajo el que viven los subdominios (casasur.<dominio>). En local, casasur.localhost:3001.
export function dominioBase(env: Record<string, string | undefined> = process.env): string {
  const base = (env.SITIO_DOMINIO_BASE ?? '').trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  return base || (env.NODE_ENV === 'production' ? '' : 'localhost');
}

export interface Direccion {
  subdominio: string | null;
  dominio: string;
}

// Separa la dirección de la visita en subdominio de la plataforma o dominio propio.
// Null si no es una dirección válida o es la portada de la plataforma (base o www.base), que no es de ninguna corredora.
export function leerDireccion(host: string, base: string): Direccion | null {
  const nombre = limpiarHost(host);
  if (!nombre) return null;
  if (base && (nombre === base || nombre === `www.${base}`) && base !== 'localhost') return null;
  if (base && nombre.endsWith(`.${base}`)) return { subdominio: nombre.slice(0, -(base.length + 1)), dominio: nombre };
  return { subdominio: null, dominio: nombre };
}

// La corredora que atiende la visita y la dirección única con que debe conocerla Google (H-031).
export interface Visita extends SiteEnv {
  canonico: string;
}

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : '');

// ¿Qué corredora atiende esta dirección? Null si ninguna o si su sitio está apagado (cancelada, suspendida, plan).
// Si falla la lectura lanza un error, para que Next conserve la última copia buena.
export async function resolverVisita(host: string, c: Conexion | null = conexion(), base: string = dominioBase()): Promise<Visita | null> {
  const direccion = leerDireccion(host, base);
  if (!c || !direccion) return null;
  // La corredora por defecto nunca se usa en un dominio real: mostraría su sitio y recibiría leads ajenos.
  const porDefecto = !direccion.subdominio && esDireccionDePrueba(direccion.dominio) ? c.tenantPorDefecto : null;
  const response = await fetch(`${c.url}/rest/v1/rpc/resolve_site`, {
    method: 'POST',
    headers: { apikey: c.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_subdomain: direccion.subdominio, p_domain: direccion.dominio, p_fallback: porDefecto }),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) throw new Error(`La base respondió ${response.status} al resolver la dirección del sitio`);
  const datos: unknown = await response.json();
  if (datos === null) return null;
  const r = (datos && typeof datos === 'object' ? datos : {}) as Record<string, unknown>;
  const tenantId = texto(r.tenantId);
  if (!esUuid(tenantId)) throw new Error('Respuesta inesperada de la base al resolver la dirección del sitio');
  // Dominio propio si lo tiene; si no, su subdominio; si no hay dominio de la plataforma, la dirección de la visita.
  const subdominio = texto(r.subdomain);
  const canonico = texto(r.customDomain) || (subdominio && base ? `${subdominio}.${base}` : direccion.dominio);
  return { url: c.url, key: c.key, tenantId, canonico };
}
