// Caso completo de "publicar esta propiedad en Mercado Libre" (H-068.3), con la base y la red inyectadas para poder probarlo.
// El controlador de api/ solo arma las dependencias (cliente de Supabase con clave de servicio, fetch) y llama a `publishProperty`.
import type { PropiedadParaPortal, OpcionesMercadoLibre } from './mercadolibre';
import type { Credentials, TokenFetcher, TokenSet } from './oauth';
import { publishToMercadoLibre, type PortalSession, type PublishedListing } from './publicar.js';

// Una fila de la tabla `properties`, tal como la entrega la base (los numeric llegan como texto).
export interface PropertyRow {
  id: string;
  tenant_id: string;
  title: string;
  operation: string;
  property_type: string;
  price_amount: string | number;
  price_currency: string | null;
  commune: string;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  built_area_m2: string | number | null;
  total_area_m2: string | number | null;
  parking_spots: number | null;
  storage_units: number | null;
  images: string[] | null;
  description: string | null;
  features: string[] | null;
  lat: number | null;
  lng: number | null;
  status: string;
  publication_status: string;
}

export function rowToPortalProperty(r: PropertyRow): PropiedadParaPortal {
  const n = (v: unknown): number => {
    const x = Number(v ?? 0);
    return Number.isFinite(x) ? x : 0;
  };
  return {
    title: String(r.title ?? ''),
    operation: r.operation === 'arriendo' ? 'arriendo' : 'venta',
    propertyType: r.property_type,
    priceAmount: n(r.price_amount),
    priceCurrency: r.price_currency ?? 'UF',
    commune: String(r.commune ?? ''),
    address: r.address ?? '',
    bedrooms: n(r.bedrooms),
    bathrooms: n(r.bathrooms),
    builtAreaM2: n(r.built_area_m2),
    totalAreaM2: n(r.total_area_m2),
    parkingSpots: n(r.parking_spots),
    storageUnits: n(r.storage_units),
    images: r.images ?? [],
    description: r.description ?? '',
    features: r.features ?? [],
    ...(typeof r.lat === 'number' && typeof r.lng === 'number' ? { coordinates: { lat: r.lat, lng: r.lng } } : {}),
  };
}

// Estado del aviso en Mercado Libre → estado guardado. Lo que no se reconoce (por ejemplo "en revisión") cuenta como activo.
export const listingStatus = (status: string): 'activa' | 'pausada' | 'cerrada' =>
  status === 'paused' ? 'pausada' : status === 'closed' ? 'cerrada' : 'activa';

export interface PublishDeps {
  loadProperty(id: string): Promise<PropertyRow | null>;
  isAdminOf(tenantId: string): Promise<boolean>;
  loadConnection(tenantId: string): Promise<PortalSession | null>;
  // Reserva el cupo de la propiedad antes de llamar a Mercado Libre: evita dos avisos por un doble clic.
  claim(propertyId: string, tenantId: string): Promise<'ok' | 'existe' | 'en_curso'>;
  release(propertyId: string): Promise<void>;
  // true si quedaron guardados. El refresh_token de Mercado Libre es de un solo uso: perderlo mata la conexión.
  saveTokens(tenantId: string, tokens: TokenSet): Promise<boolean>;
  // El aviso pudo haberse creado pero no hay certeza: la reserva se deja puesta con una nota para el panel.
  markUncertain(propertyId: string, message: string): Promise<void>;
  saveListing(propertyId: string, tenantId: string, listing: PublishedListing): Promise<boolean>;
  getRates(currency: string): Promise<Record<string, number>>;
  fetcher: TokenFetcher;
  credentials: Credentials;
  categories: OpcionesMercadoLibre['categories'];
  now?: Date;
}

export interface HandlerResult {
  status: number;
  body: Record<string, unknown>;
}

const UNCERTAIN_NOTE = 'No se sabe si el aviso llegó a publicarse; revisa tu cuenta de Mercado Libre antes de reintentar.';
const UNCERTAIN_MESSAGE = 'No se sabe si el aviso llegó a publicarse. Revisa tu cuenta de Mercado Libre antes de reintentar; el botón vuelve a aparecer en unos minutos.';

const fail = (status: number, error: string, extra: Record<string, unknown> = {}): HandlerResult => ({ status, body: { error, ...extra } });

export async function publishProperty(propertyId: string, deps: PublishDeps): Promise<HandlerResult> {
  const row = await deps.loadProperty(propertyId);
  if (!row) return fail(404, 'not_found');

  // Solo el administrador de ESA corredora publica en portales.
  if (!(await deps.isAdminOf(row.tenant_id))) return fail(403, 'not_admin');

  // Lo que sale al exterior debe estar aprobado (H-037) y a la venta o arriendo (H-048).
  if (row.publication_status !== 'publicada') return fail(409, 'not_approved');
  if (row.status === 'vendida' || row.status === 'arrendada') return fail(409, 'not_on_offer');

  const connection = await deps.loadConnection(row.tenant_id);
  if (!connection) return fail(409, 'not_connected');

  const claim = await deps.claim(row.id, row.tenant_id);
  if (claim === 'existe') return fail(409, 'already_published');
  if (claim === 'en_curso') return fail(409, 'in_progress');

  const property = rowToPortalProperty(row);
  const currency = property.priceCurrency.trim().toUpperCase();

  // Desde aquí hay una reserva puesta: si algo revienta antes de hablar con Mercado Libre, se libera para no dejarla atascada.
  let result;
  try {
    const rates = currency === 'CLP' ? {} : await deps.getRates(currency);
    const run = (session: PortalSession) =>
      publishToMercadoLibre({
        property,
        options: { categories: deps.categories, rates },
        connection: session,
        credentials: deps.credentials,
        fetcher: deps.fetcher,
        now: deps.now,
      });
    result = await run(connection);

    // Dos publicaciones a la vez de la misma corredora usan el mismo refresh_token y solo una puede renovar.
    // Si la renovación fue rechazada pero otra ya dejó un token distinto, se reintenta una vez con ese.
    if (!('listing' in result) && result.kind === 'sesion' && !result.tokens) {
      const fresh = await deps.loadConnection(row.tenant_id);
      if (fresh && fresh.refreshToken !== connection.refreshToken) result = await run(fresh);
    }
  } catch (error) {
    await deps.release(row.id);
    throw error;
  }

  // Los tokens renovados se guardan siempre: el refresh_token anterior ya no sirve.
  const tokensSaved = result.tokens ? await deps.saveTokens(row.tenant_id, result.tokens) : true;
  const tokenWarning = tokensSaved ? [] : ['No se pudo guardar la renovación de la conexión con Mercado Libre. Si el panel pide volver a conectar, hazlo en Mi corredora → Portales inmobiliarios.'];

  if (!('listing' in result)) {
    // El aviso pudo haberse creado: NO se libera la reserva (se duplicaría) y se pide revisar la cuenta.
    if (result.maybeCreated) {
      await deps.markUncertain(row.id, UNCERTAIN_NOTE);
      return fail(502, 'uncertain', { messages: [UNCERTAIN_MESSAGE, ...tokenWarning] });
    }
    await deps.release(row.id);
    const messages = [...result.errors, ...tokenWarning];
    if (result.kind === 'sesion') return fail(409, 'reconnect', { messages: tokenWarning }); // el panel ya explica cómo reconectar
    if (result.kind === 'datos' || result.kind === 'rechazado') return fail(422, result.kind, { messages });
    return fail(502, result.kind, { messages });
  }

  // El aviso ya existe en Mercado Libre. Si no se pudo guardar el registro, NO se libera el cupo (se duplicaría) y se avisa.
  const saved = await deps.saveListing(row.id, row.tenant_id, result.listing);
  const warnings = [
    ...(result.warning ? [result.warning] : []),
    ...tokenWarning,
    ...(saved ? [] : ['El aviso se publicó, pero no se pudo guardar el registro en el panel. No lo publiques de nuevo; avísanos.']),
  ];
  return {
    status: 200,
    body: { ok: true, permalink: result.listing.permalink, ...(warnings.length > 0 ? { warning: warnings.join(' ') } : {}) },
  };
}

// Probar sin publicar (solo en previews): arma el aviso y lo valida con Mercado Libre. No reserva cupo, no crea nada ni guarda
// ningún aviso. Sirve para ver qué falta (categoría, atributos, datos) antes de un aviso real. Los tokens renovados sí se guardan.
export type ValidateDeps = Pick<PublishDeps, 'loadProperty' | 'isAdminOf' | 'loadConnection' | 'saveTokens' | 'getRates' | 'fetcher' | 'credentials' | 'categories' | 'now'>;

export async function validateProperty(propertyId: string, deps: ValidateDeps): Promise<HandlerResult> {
  const row = await deps.loadProperty(propertyId);
  if (!row) return fail(404, 'not_found');
  if (!(await deps.isAdminOf(row.tenant_id))) return fail(403, 'not_admin');
  const connection = await deps.loadConnection(row.tenant_id);
  if (!connection) return fail(409, 'not_connected');

  const property = rowToPortalProperty(row);
  const currency = property.priceCurrency.trim().toUpperCase();
  const rates = currency === 'CLP' ? {} : await deps.getRates(currency);
  const result = await publishToMercadoLibre({
    property,
    options: { categories: deps.categories, rates },
    connection,
    credentials: deps.credentials,
    fetcher: deps.fetcher,
    now: deps.now,
    dryRun: true,
  });

  const tokensSaved = result.tokens ? await deps.saveTokens(row.tenant_id, result.tokens) : true;
  const tokenWarning = tokensSaved ? [] : ['No se pudo guardar la renovación de la conexión con Mercado Libre. Si el panel pide volver a conectar, hazlo en Mi corredora → Portales inmobiliarios.'];

  if ('listing' in result) return { status: 200, body: { ok: true, validated: true, ...(tokenWarning.length > 0 ? { warning: tokenWarning.join(' ') } : {}) } };
  if (result.kind === 'sesion') return fail(409, 'reconnect', { messages: tokenWarning });
  if (result.kind === 'datos' || result.kind === 'rechazado') return fail(422, result.kind, { messages: [...result.errors, ...tokenWarning] });
  return fail(502, result.kind, { messages: [...result.errors, ...tokenWarning] });
}
