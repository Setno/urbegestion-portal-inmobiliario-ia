// La dirección con que llega una visita, limpia: minúsculas, sin puerto ni punto final. La usan proxy.ts y direccion.ts.
const HOST = /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/;

// Null si no es una dirección válida.
export function limpiarHost(host: string): string | null {
  const nombre = host.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  return HOST.test(nombre) ? nombre : null;
}

// El computador local y los previews de Vercel: nunca son de una corredora y no deben aparecer en Google.
export const esDireccionDePrueba = (host: string): boolean => /(^|\.)localhost$|\.vercel\.app$|^127\.0\.0\.1$/.test(host);
