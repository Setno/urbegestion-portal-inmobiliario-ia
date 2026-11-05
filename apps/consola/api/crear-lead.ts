// Crea el lead de un visitante (landing y chat de la consola) llamando a la función `create_site_lead` de la base.
// Desde H-063 esa función ya no se puede llamar con la clave pública: solo con la clave de servicio, que vive aquí,
// en el servidor (SUPABASE_SERVICE_ROLE_KEY). Así nadie salta el formulario con la clave pública, y este endpoint
// limita los envíos por dirección IP. Los topes por corredora y por contacto los sigue poniendo la base.
import { createRateLimiter, clientKey, tooManyRequests } from './_limiteTasa.js';
declare const process: { env: Record<string, string | undefined> };

// Límite por dirección IP: 6 envíos cada 10 minutos (una persona legítima deja sus datos una o dos veces).
const limiter = createRateLimiter({ max: 6, windowMs: 600000 });

const MAX_BODY = 20_000;
const ESPERA_MS = 8000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Lo que la base dice al rechazar un envío → respuesta genérica (nunca se reenvían sus mensajes internos).
const MOTIVOS: Record<string, { error: string; status: number }> = {
  limite_corredora: { error: 'too_many_requests', status: 429 },
  limite_contacto: { error: 'too_many_requests', status: 429 },
  lead_invalido: { error: 'invalid_lead', status: 400 },
  sitio_no_disponible: { error: 'site_unavailable', status: 404 },
};

export async function POST(request: Request): Promise<Response> {
  const wait = limiter.check(clientKey(request));
  if (wait > 0) return tooManyRequests(wait);

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return json({ error: 'not_configured' }, 503);

  // Se mira el tamaño declarado antes de leer el cuerpo, para no cargar en memoria lo que igual se va a rechazar.
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) return json({ error: 'invalid_payload' }, 400);
  const raw = await request.text();
  if (!raw || raw.length > MAX_BODY) return json({ error: 'invalid_payload' }, 400);

  let tenantId: unknown;
  let lead: unknown;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    tenantId = parsed?.tenantId;
    lead = parsed?.lead;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (typeof tenantId !== 'string' || !UUID.test(tenantId)) return json({ error: 'invalid_payload' }, 400);
  if (!lead || typeof lead !== 'object' || Array.isArray(lead)) return json({ error: 'invalid_payload' }, 400);

  try {
    const response = await fetch(`${url}/rest/v1/rpc/create_site_lead`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(ESPERA_MS),
      body: JSON.stringify({ p_tenant: tenantId, p_lead: lead }),
    });
    if (response.ok) return json({ ok: true });
    const cuerpo = (await response.json().catch(() => null)) as { message?: string } | null;
    const motivo = MOTIVOS[cuerpo?.message ?? ''];
    if (motivo) return json({ error: motivo.error }, motivo.status);
    console.warn(`[api/crear-lead] La base respondió ${response.status}`);
    return json({ error: 'upstream' }, 502);
  } catch {
    console.warn('[api/crear-lead] No se pudo llamar a la base');
    return json({ error: 'upstream' }, 502);
  }
}
