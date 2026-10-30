// Reenvía leads al webhook (GoHighLevel / Zapier / Make). La URL vive solo en el servidor.
declare const process: { env: Record<string, string | undefined> };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Informa solo si el webhook está configurado; nunca expone la URL.
export async function GET(): Promise<Response> {
  return json({ configured: Boolean(process.env.GHL_WEBHOOK_URL) });
}

export async function POST(request: Request): Promise<Response> {
  const webhookUrl = process.env.GHL_WEBHOOK_URL;
  if (!webhookUrl) return json({ error: 'webhook_not_configured' }, 503);

  const raw = await request.text();
  if (!raw || raw.length > 100_000) return json({ error: 'invalid_payload' }, 400);

  try {
    JSON.parse(raw);
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
