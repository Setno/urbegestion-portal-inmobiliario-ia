// Reenvía leads al webhook (GoHighLevel / Zapier / Make). La URL vive solo en el servidor.
import { createRateLimiter, clientKey, tooManyRequests } from './_limiteTasa.js';
declare const process: { env: Record<string, string | undefined> };

// Límite por dirección IP (H-005): 10 llamadas cada 10 minutos.
const limiter = createRateLimiter({ max: 10, windowMs: 600000 });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Informa solo si el webhook está configurado; nunca expone la URL.
export async function GET(): Promise<Response> {
  return json({ configured: Boolean(process.env.GHL_WEBHOOK_URL) });
}

export async function POST(request: Request): Promise<Response> {
  const wait = limiter.check(clientKey(request));
  if (wait > 0) return tooManyRequests(wait);
  const webhookUrl = process.env.GHL_WEBHOOK_URL;
  if (!webhookUrl) return json({ error: 'webhook_not_configured' }, 503);

  const raw = await request.text();
  if (!raw || raw.length > 100_000) return json({ error: 'invalid_payload' }, 400);

  try {
    const parsed = JSON.parse(raw);
    // Un lead es siempre un objeto con un contacto; un arreglo o un valor suelto no se reenvía.
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'invalid_payload' }, 400);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: raw,
    });
    return json({ ok: upstream.ok }, upstream.ok ? 200 : 502);
  } catch {
    return json({ error: 'webhook_unreachable' }, 504);
  } finally {
    clearTimeout(timeoutId);
  }
}
