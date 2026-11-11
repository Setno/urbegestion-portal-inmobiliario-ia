// Diagnóstico de solo lectura de la conexión con Mercado Libre (H-068.3d, solo previews).
// Hace consultas GET para averiguar por qué Mercado Libre rechaza la publicación con UNAUTHORIZED. No crea ni cambia nada.
// Devuelve líneas de texto cortas; nunca incluye tokens, claves ni la respuesta completa.
import type { TokenFetcher } from './oauth.js';

const API = 'https://api.mercadolibre.com';
const MAX = 160;

const corto = (v: unknown): string => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX);
const isObj = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);

async function get(fetcher: TokenFetcher, accessToken: string, path: string): Promise<{ status: number; body: unknown }> {
  try {
    const r = await fetcher(`${API}${path}`, { method: 'GET', headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` } });
    return { status: r.status, body: await r.json().catch(() => ({})) };
  } catch {
    return { status: 0, body: {} };
  }
}

// Si Mercado Libre contesta con error, muestra su código y motivo; así se ve qué política rechaza.
const motivo = (body: unknown): string => {
  if (!isObj(body)) return '';
  const partes = [body.error, body.message].filter((x) => typeof x === 'string' && x).map(corto);
  return partes.length ? ` (${partes.join(' · ')})` : '';
};

export async function diagnoseMercadoLibre(input: { accessToken: string; clientId: string; categoryId?: string; fetcher: TokenFetcher }): Promise<string[]> {
  const { accessToken, fetcher } = input;
  const lines: string[] = [];

  const me = await get(fetcher, accessToken, '/users/me');
  if (me.status === 0) return ['No se pudo contactar a Mercado Libre.'];
  const meBody = isObj(me.body) ? me.body : {};
  if (me.status !== 200) {
    return [`Cuenta (/users/me): código ${me.status}${motivo(me.body)}. El permiso de la conexión no sirve ni para leer la cuenta.`];
  }
  const userId = typeof meBody.id === 'number' || typeof meBody.id === 'string' ? String(meBody.id) : '';
  const status = isObj(meBody.status) ? meBody.status : {};
  const tags = Array.isArray(meBody.tags) ? meBody.tags.filter((t): t is string => typeof t === 'string').slice(0, 12) : [];
  const lista = isObj(status.list) ? status.list : {};
  const codigos = Array.isArray(lista.codes) ? lista.codes.map(corto).slice(0, 8).join(', ') : '';
  const puede = typeof lista.allow === 'boolean' ? (lista.allow ? 'sí' : 'no') : '?';
  lines.push(
    `Cuenta: tipo ${corto(meBody.user_type) || '?'}, país ${corto(meBody.country_id) || '?'}, estado ${corto(status.site_status) || '?'}, puede publicar: ${puede}${codigos ? ` (motivos: ${codigos})` : ''}.`,
  );
  if (tags.length) lines.push(`Etiquetas de la cuenta: ${tags.join(', ')}.`);

  if (userId) {
    const packs = await get(fetcher, accessToken, `/users/${encodeURIComponent(userId)}/classifieds_promotion_packs`);
    const n = Array.isArray(packs.body) ? packs.body.length : isObj(packs.body) && Array.isArray(packs.body.results) ? packs.body.results.length : null;
    lines.push(packs.status === 200 ? `Paquetes de publicación de inmuebles: ${n ?? 'respuesta sin lista'}.` : `Paquetes de inmuebles: código ${packs.status}${motivo(packs.body)}.`);

    if (input.categoryId) {
      const types = await get(fetcher, accessToken, `/users/${encodeURIComponent(userId)}/available_listing_types?category_id=${encodeURIComponent(input.categoryId)}`);
      if (types.status === 200 && isObj(types.body) && Array.isArray(types.body.available)) {
        const ids = types.body.available.map((t) => (isObj(t) ? corto(t.id) : '')).filter(Boolean).slice(0, 8);
        lines.push(`Tipos de aviso disponibles en ${input.categoryId}: ${ids.length ? ids.join(', ') : 'ninguno'}.`);
      } else {
        lines.push(`Tipos de aviso en ${input.categoryId}: código ${types.status}${motivo(types.body)}.`);
      }
    }
  }

  if (input.clientId) {
    const app = await get(fetcher, accessToken, `/applications/${encodeURIComponent(input.clientId)}`);
    const b = isObj(app.body) ? app.body : {};
    lines.push(
      app.status === 200
        ? `Aplicación: certificada ${String(b.certification_status ?? b.certified ?? '?')}, estado ${corto(b.status) || '?'}, permisos ${Array.isArray(b.scopes) ? b.scopes.map(corto).join('/') : '?'}.`
        : `Aplicación: código ${app.status}${motivo(app.body)}.`,
    );
  }
  return lines;
}
