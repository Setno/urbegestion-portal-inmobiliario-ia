// H-054: avisos de leads nuevos por correo (Resend) y Telegram. Lo usan las funciones `alerta-lead` y `telegram-bot`.
// Sin dependencias de Deno: se prueba con Vitest y las funciones solo le pasan `fetch` y las variables de entorno.

export type Env = Record<string, string | undefined>;
export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export interface LeadAviso {
  nombre: string;
  telefono: string;
  correo: string;
  propiedad: string;
  origen: string;
  fechaVisita: string;
  horaVisita: string;
}

export interface DatosAviso {
  corredora: string;
  emails: string[];
  telegramChatId: string | null;
  lead: LeadAviso;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const texto = (v: unknown): string => (typeof v === 'string' ? v : '');

// Lo que devuelve claim_lead_alert; null si no hay nada que avisar.
export function leerDatosAviso(raw: unknown): DatosAviso | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const l = (r.lead && typeof r.lead === 'object' ? r.lead : {}) as Record<string, unknown>;
  const emails = Array.isArray(r.emails) ? r.emails.filter((e): e is string => typeof e === 'string' && e.includes('@')) : [];
  const chat = texto(r.telegramChatId);
  return {
    corredora: texto(r.corredora),
    emails,
    telegramChatId: /^-?\d{1,20}$/.test(chat) ? chat : null,
    lead: {
      nombre: texto(l.nombre),
      telefono: texto(l.telefono),
      correo: texto(l.correo),
      propiedad: texto(l.propiedad),
      origen: texto(l.origen),
      fechaVisita: texto(l.fechaVisita),
      horaVisita: texto(l.horaVisita),
    },
  };
}

// Todo lo que viene del lead lo escribió un visitante: se escapa antes de ponerlo en HTML.
export const escaparHtml = (v: string): string =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const ORIGEN: Record<string, string> = {
  ficha_propiedad: 'ficha de una propiedad',
  asistente_ia: 'asistente del sitio',
  formulario_contacto: 'formulario de contacto',
  captacion_propietarios: 'propietario que quiere vender o arrendar',
};

// "2026-11-05" → "05-11-2026"
const fechaChilena = (fecha: string): string => (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha.split('-').reverse().join('-') : fecha);

interface Linea {
  etiqueta: string;
  valor: string;
}

function lineas({ lead }: DatosAviso): Linea[] {
  const visita = lead.fechaVisita ? `${fechaChilena(lead.fechaVisita)}${lead.horaVisita ? ` a las ${lead.horaVisita}` : ''}` : '';
  return [
    { etiqueta: 'Nombre', valor: lead.nombre },
    { etiqueta: 'Teléfono', valor: lead.telefono },
    { etiqueta: 'Correo', valor: lead.correo },
    { etiqueta: 'Propiedad', valor: lead.propiedad },
    { etiqueta: 'Visita pedida', valor: visita },
    { etiqueta: 'Llegó por', valor: ORIGEN[lead.origen] ?? '' },
  ].filter((l) => l.valor.trim() !== '');
}

const titulo = (d: DatosAviso): string => (d.lead.fechaVisita ? 'Nueva solicitud de visita' : 'Nuevo lead');

// El teléfono como enlace de WhatsApp, para responder con un toque. Solo dígitos: nada que se pueda inyectar.
export function enlaceWhatsapp(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '');
  return digitos.length >= 8 && digitos.length <= 15 ? `https://wa.me/${digitos}` : '';
}

export function mensajeTelegram(d: DatosAviso, panelUrl: string): string {
  const partes = [`<b>${escaparHtml(titulo(d))}${d.corredora ? ` · ${escaparHtml(d.corredora)}` : ''}</b>`, ''];
  for (const l of lineas(d)) partes.push(`<b>${escaparHtml(l.etiqueta)}:</b> ${escaparHtml(l.valor)}`);
  const whatsapp = enlaceWhatsapp(d.lead.telefono);
  if (whatsapp) partes.push('', `<a href="${whatsapp}">Responder por WhatsApp</a>`);
  if (panelUrl) partes.push(`<a href="${escaparHtml(panelUrl)}">Abrir el panel</a>`);
  return partes.join('\n');
}

export interface Correo {
  asunto: string;
  html: string;
  texto: string;
}

export function correoDeAviso(d: DatosAviso, panelUrl: string): Correo {
  const filas = lineas(d)
    .map((l) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${escaparHtml(l.etiqueta)}</td><td style="padding:4px 0"><b>${escaparHtml(l.valor)}</b></td></tr>`)
    .join('');
  const whatsapp = enlaceWhatsapp(d.lead.telefono);
  const botones = [
    whatsapp ? `<a href="${whatsapp}" style="color:#047857">Responder por WhatsApp</a>` : '',
    panelUrl ? `<a href="${escaparHtml(panelUrl)}" style="color:#164e63">Abrir el panel</a>` : '',
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');
  // El asunto no lleva datos del visitante: algunos correos lo muestran en la pantalla bloqueada.
  const asunto = `${titulo(d)}${d.corredora ? ` en ${d.corredora}` : ''}`.replace(/[\r\n]+/g, ' ');
  return {
    asunto,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a"><h2 style="font-size:18px">${escaparHtml(titulo(d))}</h2><table>${filas}</table>${botones ? `<p>${botones}</p>` : ''}<p style="color:#94a3b8;font-size:12px">Recibes este aviso porque tu corredora lo activó en Mi corredora → Avisos de leads nuevos.</p></div>`,
    texto: [titulo(d), ...lineas(d).map((l) => `${l.etiqueta}: ${l.valor}`), whatsapp, panelUrl].filter(Boolean).join('\n'),
  };
}

export interface Resultado {
  correo: 'enviado' | 'fallo' | 'sin_configurar' | 'no_aplica';
  telegram: 'enviado' | 'fallo' | 'sin_configurar' | 'no_aplica';
}

const ESPERA_MS = 8000;

// Manda los avisos que la corredora tiene prendidos. Un canal que falla no impide el otro.
export async function enviarAvisos(d: DatosAviso, env: Env, fetchFn: Fetch): Promise<Resultado> {
  const panel = env.PANEL_URL ?? '';
  const resultado: Resultado = { correo: 'no_aplica', telegram: 'no_aplica' };

  if (d.emails.length > 0) {
    if (!env.RESEND_API_KEY || !env.ALERTAS_REMITENTE) resultado.correo = 'sin_configurar';
    else {
      const c = correoDeAviso(d, panel);
      try {
        const r = await fetchFn('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: env.ALERTAS_REMITENTE, to: d.emails, subject: c.asunto, html: c.html, text: c.texto }),
          signal: AbortSignal.timeout(ESPERA_MS),
        });
        resultado.correo = r.ok ? 'enviado' : 'fallo';
      } catch {
        resultado.correo = 'fallo';
      }
    }
  }

  if (d.telegramChatId) {
    if (!env.TELEGRAM_BOT_TOKEN) resultado.telegram = 'sin_configurar';
    else {
      try {
        const r = await fetchFn(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: d.telegramChatId, text: mensajeTelegram(d, panel), parse_mode: 'HTML', disable_web_page_preview: true }),
          signal: AbortSignal.timeout(ESPERA_MS),
        });
        resultado.telegram = r.ok ? 'enviado' : 'fallo';
      } catch {
        resultado.telegram = 'fallo';
      }
    }
  }
  return resultado;
}

// Llamada con la clave de servicio a una función de la base.
async function rpc(env: Env, fetchFn: Fetch, nombre: string, args: Record<string, unknown>): Promise<unknown> {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  const r = await fetchFn(`${url}/rest/v1/rpc/${nombre}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`La base respondió ${r.status} a ${nombre}`);
  return r.json();
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Función alerta-lead. La llama la base al crearse un lead, con {"leadId": "..."}. Cualquiera podría llamarla,
// pero solo avisa una vez por lead y con los datos de la base: nunca acepta destinatarios ni textos de afuera.
export async function atenderAlerta(request: Request, env: Env, fetchFn: Fetch): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let leadId: string;
  try {
    leadId = texto(((await request.json()) as Record<string, unknown>)?.leadId);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (!UUID.test(leadId)) return json({ error: 'invalid_lead' }, 400);
  try {
    const datos = leerDatosAviso(await rpc(env, fetchFn, 'claim_lead_alert', { p_lead: leadId }));
    if (!datos) return json({ ok: true, avisos: 'nada_que_avisar' });
    const resultado = await enviarAvisos(datos, env, fetchFn);
    if (resultado.correo === 'fallo' || resultado.telegram === 'fallo') console.warn('[alerta-lead] Un aviso no se pudo enviar', resultado);
    return json({ ok: true, ...resultado });
  } catch (err) {
    console.warn('[alerta-lead] No se pudo procesar el aviso:', err instanceof Error ? err.message : err);
    return json({ error: 'server_error' }, 500);
  }
}

// "/start 1a2b…" (lo que manda Telegram al abrir t.me/<bot>?start=<código>) → el código, o null.
export function codigoDeInicio(textoMensaje: string): string | null {
  const m = /^\/start(?:@\w+)?\s+([0-9a-f]{24})\s*$/.exec(textoMensaje.trim());
  return m ? m[1] : null;
}

async function responderTelegram(env: Env, fetchFn: Fetch, chatId: string, mensaje: string): Promise<void> {
  try {
    await fetchFn(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: mensaje }),
      signal: AbortSignal.timeout(ESPERA_MS),
    });
  } catch {
    console.warn('[telegram-bot] No se pudo responder en Telegram');
  }
}

// Función telegram-bot. Telegram la llama con cada mensaje al bot, firmada con el secreto que se dio al registrarla.
export async function atenderTelegram(request: Request, env: Env, fetchFn: Fetch): Promise<Response> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) return json({ error: 'not_configured' }, 503);
  if (request.headers.get('x-telegram-bot-api-secret-token') !== env.TELEGRAM_WEBHOOK_SECRET) return json({ error: 'unauthorized' }, 401);
  let update: Record<string, unknown>;
  try {
    update = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: true });
  }
  const message = (update?.message ?? {}) as Record<string, unknown>;
  const chat = (message.chat ?? {}) as Record<string, unknown>;
  const chatId = typeof chat.id === 'number' || typeof chat.id === 'string' ? String(chat.id) : '';
  const recibido = texto(message.text);
  // A Telegram siempre se le responde 200: si no, reintenta el mismo mensaje una y otra vez.
  if (!/^-?\d{1,20}$/.test(chatId) || !recibido.startsWith('/start')) return json({ ok: true });

  const codigo = codigoDeInicio(recibido);
  if (!codigo) {
    await responderTelegram(env, fetchFn, chatId, 'Hola. Para recibir aquí los avisos de leads nuevos, abre el enlace "Conectar Telegram" desde tu panel, en Mi corredora.');
    return json({ ok: true });
  }
  try {
    const corredora = texto(await rpc(env, fetchFn, 'link_telegram_chat', { p_code: codigo, p_chat_id: chatId }));
    await responderTelegram(
      env,
      fetchFn,
      chatId,
      corredora
        ? `Listo: aquí recibirás los avisos de leads nuevos de ${corredora}. Puedes desconectarlo cuando quieras desde el panel.`
        : 'El enlace venció o ya se usó. Pide uno nuevo en tu panel, en Mi corredora → Avisos de leads nuevos.',
    );
  } catch (err) {
    console.warn('[telegram-bot] No se pudo conectar el chat:', err instanceof Error ? err.message : err);
    await responderTelegram(env, fetchFn, chatId, 'No pudimos conectar este chat. Inténtalo de nuevo en unos minutos.');
  }
  return json({ ok: true });
}
