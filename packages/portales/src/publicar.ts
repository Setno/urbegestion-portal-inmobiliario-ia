// Publicar una propiedad en Mercado Libre / Portal Inmobiliario (H-068.3). Código puro: la red entra por un `fetcher`.
// Reglas: los datos se validan antes de llamar a nadie; el token se renueva antes (o una vez tras un 401); los tokens
// renovados se devuelven SIEMPRE, porque el refresh_token anterior deja de servir; ningún mensaje incluye secretos.
// Pendiente de confirmar con una cuenta real: la forma exacta de los errores de Mercado Libre (se leen `cause[].message` y `message`).
import { toMercadoLibreItem, type OpcionesMercadoLibre, type PropiedadParaPortal } from './mercadolibre.js';
import { requestTokens, tokenNeedsRefresh, type Credentials, type TokenFetcher, type TokenSet } from './oauth.js';

const API = 'https://api.mercadolibre.com';
const MAX_MENSAJE = 200;
const MAX_MENSAJES = 5;

export interface PortalSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface PublishInput {
  property: PropiedadParaPortal;
  options: OpcionesMercadoLibre;
  connection: PortalSession;
  credentials: Credentials;
  fetcher: TokenFetcher;
  now?: Date;
  // Solo validar con /items/validate: Mercado Libre revisa el aviso y dice qué le falta, sin crear nada.
  dryRun?: boolean;
}

export interface PublishedListing {
  externalId: string;
  permalink: string | null;
  status: string;
}

export type PublishFailure = 'datos' | 'sesion' | 'rechazado' | 'respuesta' | 'red';

export type PublishResult =
  | { ok: true; listing: PublishedListing; tokens?: TokenSet; warning?: string; validated?: boolean }
  // maybeCreated: el aviso pudo haberse creado en Mercado Libre aunque la llamada falló (corte, 5xx, respuesta rara).
  // Quien llama NO debe tratarlo como "no se publicó" ni invitar a reintentar a ciegas: se duplicaría.
  | { ok: false; kind: PublishFailure; errors: string[]; tokens?: TokenSet; maybeCreated?: boolean };

const SESSION_ERROR = 'La conexión con Mercado Libre venció. Vuelve a conectarla desde Mi corredora → Portales inmobiliarios.';

const NETWORK_ERROR = 'No se pudo contactar a Mercado Libre. Inténtalo de nuevo en unos minutos.';
const DESCRIPTION_WARNING = 'El aviso se publicó, pero Mercado Libre no recibió la descripción. Revísala en tu cuenta.';

const corto = (text: string): string => text.trim().slice(0, MAX_MENSAJE);

// Los motivos que da Mercado Libre, en texto y acotados. Solo se leen los campos de mensaje, nunca se vuelca la respuesta entera.
export function extractErrors(json: unknown, status: number): string[] {
  const body = json && typeof json === 'object' ? (json as { message?: unknown; cause?: unknown }) : {};
  const causes = Array.isArray(body.cause) ? body.cause : [];
  const messages = causes
    .filter((c): c is { type?: unknown; message: string } => Boolean(c) && typeof c === 'object' && typeof (c as { message?: unknown }).message === 'string')
    .filter((c) => c.type === undefined || c.type === 'error')
    .map((c) => corto(c.message))
    .filter(Boolean)
    .slice(0, MAX_MENSAJES);
  if (messages.length > 0) return messages;
  if (typeof body.message === 'string' && body.message.trim()) return [corto(body.message)];
  return [`Mercado Libre rechazó el aviso (código ${status}).`];
}

export async function publishToMercadoLibre(input: PublishInput): Promise<PublishResult> {
  const now = input.now ?? new Date();

  // 1. Los datos primero: si el aviso no se puede armar, no se toca a Mercado Libre.
  const built = toMercadoLibreItem(input.property, input.options);
  if ('errors' in built) return { ok: false, kind: 'datos', errors: built.errors };

  let session = input.connection;
  let renewed: TokenSet | undefined;
  let maybeCreated = false;
  const dry = input.dryRun === true;

  const withTokens = <T extends object>(result: T): T & { tokens?: TokenSet } => (renewed ? { ...result, tokens: renewed } : result);

  const refresh = async (): Promise<boolean> => {
    const r = await requestTokens({ type: 'refresh', refreshToken: session.refreshToken }, input.credentials, input.fetcher, now);
    if (!r.ok) return false;
    renewed = r.tokens;
    session = { accessToken: r.tokens.accessToken, refreshToken: r.tokens.refreshToken, expiresAt: r.tokens.expiresAt };
    return true;
  };

  const post = (url: string, payload: unknown) =>
    input.fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify(payload),
    });

  try {
    // 2. Token vigente (se renueva con margen).
    if (tokenNeedsRefresh(session.expiresAt, now) && !(await refresh())) {
      return { ok: false, kind: 'sesion', errors: [SESSION_ERROR] };
    }

    // 3. Crear el aviso; un 401 renueva una sola vez y reintenta.
    maybeCreated = !dry; // validar no crea nada: no hay nada que duplicar
    const itemsUrl = `${API}${dry ? '/items/validate' : '/items'}`;
    let response = await post(itemsUrl, built.item);
    if (response.status === 401 && !renewed) {
      maybeCreated = false; // un 401 es un rechazo claro: no se creó nada
      if (!(await refresh())) return { ok: false, kind: 'sesion', errors: [SESSION_ERROR] };
      maybeCreated = !dry;
      response = await post(itemsUrl, built.item);
    }
    const json: unknown = await response.json().catch(() => ({}));
    if (response.status === 401) {
      return withTokens({ ok: false as const, kind: 'sesion' as const, errors: [SESSION_ERROR] });
    }
    // Un 5xx no dice si Mercado Libre alcanzó a crear el aviso: es reintentable, pero con reserva.
    if (response.status >= 500) {
      return withTokens({ ok: false as const, kind: 'red' as const, ...(dry ? {} : { maybeCreated: true }), errors: [NETWORK_ERROR] });
    }
    if (!response.ok) {
      maybeCreated = false; // rechazo claro (4xx): el aviso no se creó
      return withTokens({ ok: false as const, kind: 'rechazado' as const, errors: extractErrors(json, response.status) });
    }

    // Validación correcta: Mercado Libre responde 204 sin cuerpo. No se crea ni se guarda nada.
    if (dry) {
      return withTokens({ ok: true as const, validated: true as const, listing: { externalId: '', permalink: null, status: 'validado' } });
    }

    const item = json && typeof json === 'object' ? (json as { id?: unknown; permalink?: unknown; status?: unknown }) : {};
    if (typeof item.id !== 'string' || !item.id) {
      return withTokens({ ok: false as const, kind: 'respuesta' as const, maybeCreated: true, errors: ['Mercado Libre respondió sin el número del aviso. Revisa tu cuenta antes de reintentar.'] });
    }
    const listing: PublishedListing = {
      externalId: item.id,
      permalink: typeof item.permalink === 'string' && item.permalink ? item.permalink : null,
      status: typeof item.status === 'string' && item.status ? item.status : 'active',
    };

    // 4. La descripción va aparte; si falla, el aviso ya existe y solo se avisa.
    let warning: string | undefined;
    if (built.description) {
      // Su propio try: un corte aquí no puede convertir en fallo un aviso que ya existe.
      try {
        const description = await post(`${API}/items/${encodeURIComponent(listing.externalId)}/description`, { plain_text: built.description });
        if (!description.ok) warning = DESCRIPTION_WARNING;
      } catch {
        warning = DESCRIPTION_WARNING;
      }
    }
    return withTokens({ ok: true as const, listing, ...(warning ? { warning } : {}) });
  } catch {
    // Sin red o respuesta ilegible. El mensaje original puede traer datos sensibles: no se propaga.
    return withTokens({ ok: false as const, kind: 'red' as const, ...(maybeCreated ? { maybeCreated: true } : {}), errors: [NETWORK_ERROR] });
  }
}
