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


// Pruebas de validación (/items/validate no crea nada): sirven para ver si el rechazo es general o solo de inmuebles.
// Un error de datos (falta un atributo, etc.) significa que la autorización pasó; UNAUTHORIZED significa que no.
async function validar(fetcher: TokenFetcher, accessToken: string, etiqueta: string, item: unknown): Promise<string> {
  try {
    const r = await fetcher(`${API}/items/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(item),
    });
    const body = await r.json().catch(() => ({}));
    if (r.status === 204 || r.status === 200) return `Validación ${etiqueta}: aceptada.`;
    const causas = isObj(body) && Array.isArray(body.cause) ? body.cause.map((c) => (isObj(c) ? corto(c.message) : '')).filter(Boolean).slice(0, 2).join(' | ') : '';
    return `Validación ${etiqueta}: código ${r.status}${causas ? ` (${causas})` : motivo(body)}.`;
  } catch {
    return `Validación ${etiqueta}: sin respuesta.`;
  }
}

const FOTO_PRUEBA = 'https://http2.mlstatic.com/D_NQ_NP_000000-MLC00000000-000000_000000-F.jpg';

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

  // Las demás partes del estado de la cuenta (según la guía "Validar datos de vendedores"): cualquiera en "no" bloquea las escrituras.
  const partes = ['sell', 'billing', 'buy']
    .map((clave) => {
      const parte = status[clave];
      if (!isObj(parte) || typeof parte.allow !== 'boolean') return `${clave}: ?`;
      const cod = Array.isArray(parte.codes) ? parte.codes.map(corto).slice(0, 5).join(', ') : '';
      return `${clave}: ${parte.allow ? 'sí' : 'no'}${cod ? ` (${cod})` : ''}`;
    })
    .join(' · ');
  const accion = status.required_action == null ? 'ninguna' : corto(typeof status.required_action === 'string' ? status.required_action : JSON.stringify(status.required_action));
  const etiqueta = (v: unknown) => (typeof v === 'boolean' ? (v ? 'sí' : 'no') : '?');
  lines.push(
    `Estado de la cuenta → ${partes} · acción requerida: ${accion} · correo confirmado: ${etiqueta(status.confirmed_email)} · términos de Mercado Pago aceptados: ${etiqueta(status.mercadopago_tc_accepted)}.`,
  );

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

  // ¿El rechazo es general o solo de inmuebles? Un artículo cualquiera, y un inmueble mínimo con cada tipo de aviso.
  lines.push(
    await validar(fetcher, accessToken, 'de un artículo común', {
      title: 'Articulo de prueba',
      category_id: 'MLC3530',
      price: 10000,
      currency_id: 'CLP',
      available_quantity: 1,
      buying_mode: 'buy_it_now',
      listing_type_id: 'free',
      condition: 'new',
      pictures: [{ source: FOTO_PRUEBA }],
    }),
  );
  if (input.categoryId) {
    for (const tipo of ['free', 'silver']) {
      lines.push(
        await validar(fetcher, accessToken, `de un inmueble mínimo (tipo ${tipo})`, {
          title: 'Casa de prueba',
          category_id: input.categoryId,
          price: 500000,
          currency_id: 'CLP',
          buying_mode: 'classified',
          listing_type_id: tipo,
          channels: ['marketplace'],
          pictures: [{ source: FOTO_PRUEBA }],
          attributes: [],
          location: { address_line: 'El Alba 2919, Buin' },
        }),
      );
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
