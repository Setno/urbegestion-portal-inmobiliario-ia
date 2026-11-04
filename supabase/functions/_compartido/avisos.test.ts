import { describe, it, expect, vi } from 'vitest';
import {
  atenderAlerta,
  atenderTelegram,
  codigoDeInicio,
  correoDeAviso,
  enlaceWhatsapp,
  enviarAvisos,
  leerDatosAviso,
  mensajeTelegram,
  type DatosAviso,
} from './avisos';

const LEAD_ID = '11111111-1111-4111-8111-111111111111';
const CODIGO = 'a1b2c3d4e5f6a1b2c3d4e5f6';

const datos = (extra: Partial<DatosAviso> = {}): DatosAviso => ({
  corredora: 'Casa Sur',
  emails: ['ana@casasur.cl'],
  telegramChatId: '123456',
  lead: { nombre: 'Luis <b>Soto</b>', telefono: '+56 9 1111 2222', correo: 'luis@correo.cl', propiedad: 'Casa con vista', origen: 'ficha_propiedad', fechaVisita: '2026-11-05', horaVisita: '10:00', },
  ...extra,
});

const env = {
  SUPABASE_URL: 'https://proyecto.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'clave-servicio',
  RESEND_API_KEY: 'clave-resend',
  ALERTAS_REMITENTE: 'Avisos <avisos@miportal.cl>',
  TELEGRAM_BOT_TOKEN: 'token-bot',
  TELEGRAM_WEBHOOK_SECRET: 'secreto-webhook',
  PANEL_URL: 'https://panel.miportal.cl',
};

// Responde según la dirección: la base (rpc) o los servicios de aviso.
function servicios(respuestaBase: unknown = null, ok = true) {
  return vi.fn(async (url: string) => {
    if (url.includes('/rest/v1/rpc/')) return new Response(JSON.stringify(respuestaBase), { status: 200 });
    return new Response('{}', { status: ok ? 200 : 500 });
  });
}

const llamadasA = (fetchMock: ReturnType<typeof servicios>, parte: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url).includes(parte)) as unknown as [string, RequestInit][];

describe('mensajes de aviso (H-054)', () => {
  it('el mensaje de Telegram trae los datos del lead escapados, WhatsApp y el panel', () => {
    const m = mensajeTelegram(datos(), 'https://panel.miportal.cl');
    expect(m).toContain('<b>Nueva solicitud de visita · Casa Sur</b>');
    expect(m).toContain('Luis &lt;b&gt;Soto&lt;/b&gt;');
    expect(m).toContain('05-11-2026 a las 10:00');
    expect(m).toContain('<a href="https://wa.me/56911112222">Responder por WhatsApp</a>');
    expect(m).toContain('<a href="https://panel.miportal.cl">Abrir el panel</a>');
    expect(m).not.toContain('<b>Soto</b>');
  });

  it('un lead sin visita ni correo no muestra líneas vacías', () => {
    const m = mensajeTelegram(datos({ lead: { ...datos().lead, correo: '', fechaVisita: '', horaVisita: '' } }), '');
    expect(m).toContain('<b>Nuevo lead · Casa Sur</b>');
    expect(m).not.toContain('Correo');
    expect(m).not.toContain('Visita pedida');
    expect(m).not.toContain('Abrir el panel');
  });

  it('el correo no pone datos del visitante en el asunto y escapa el contenido', () => {
    const c = correoDeAviso(datos(), 'https://panel.miportal.cl');
    expect(c.asunto).toBe('Nueva solicitud de visita en Casa Sur');
    expect(c.html).toContain('Luis &lt;b&gt;Soto&lt;/b&gt;');
    expect(c.texto).toContain('Teléfono: +56 9 1111 2222');
    expect(c.texto).toContain('https://wa.me/56911112222');
  });

  it('WhatsApp solo con un teléfono de largo razonable', () => {
    expect(enlaceWhatsapp('+56 9 1111 2222')).toBe('https://wa.me/56911112222');
    expect(enlaceWhatsapp('123')).toBe('');
  });

  it('lee la respuesta de la base y descarta lo raro', () => {
    expect(leerDatosAviso(null)).toBeNull();
    const d = leerDatosAviso({ corredora: 'X', emails: ['a@b.cl', 3, 'mal'], telegramChatId: 'abc', lead: { nombre: 'Ana' } });
    expect(d).toMatchObject({ emails: ['a@b.cl'], telegramChatId: null, lead: { nombre: 'Ana', telefono: '' } });
  });
});

describe('enviarAvisos', () => {
  it('manda el correo por Resend y el Telegram al chat de la corredora', async () => {
    const fetchMock = servicios();
    expect(await enviarAvisos(datos(), env, fetchMock)).toEqual({ correo: 'enviado', telegram: 'enviado' });
    const [[, correo]] = llamadasA(fetchMock, 'api.resend.com');
    expect(JSON.parse(String(correo.body))).toMatchObject({ from: env.ALERTAS_REMITENTE, to: ['ana@casasur.cl'] });
    const [[urlTelegram, telegram]] = llamadasA(fetchMock, 'api.telegram.org');
    expect(urlTelegram).toBe('https://api.telegram.org/bottoken-bot/sendMessage');
    expect(JSON.parse(String(telegram.body))).toMatchObject({ chat_id: '123456', parse_mode: 'HTML' });
  });

  it('sin claves del servicio avisa "sin configurar" y no llama a nadie', async () => {
    const fetchMock = servicios();
    expect(await enviarAvisos(datos(), { PANEL_URL: '' }, fetchMock)).toEqual({ correo: 'sin_configurar', telegram: 'sin_configurar' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('un canal que falla no impide el otro', async () => {
    const fetchMock = vi.fn(async (url: string) => new Response('{}', { status: url.includes('resend') ? 500 : 200 }));
    expect(await enviarAvisos(datos(), env, fetchMock)).toEqual({ correo: 'fallo', telegram: 'enviado' });
  });

  it('solo usa los canales que la corredora tiene prendidos', async () => {
    const fetchMock = servicios();
    expect(await enviarAvisos(datos({ emails: [], telegramChatId: null }), env, fetchMock)).toEqual({ correo: 'no_aplica', telegram: 'no_aplica' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

const pedir = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://f.supabase.co/x', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers });

describe('función alerta-lead', () => {
  it('reclama el aviso del lead en la base con la clave de servicio y lo envía', async () => {
    const fetchMock = servicios({ corredora: 'Casa Sur', emails: ['ana@casasur.cl'], telegramChatId: null, lead: { nombre: 'Luis' } });
    const r = await atenderAlerta(pedir({ leadId: LEAD_ID }), env, fetchMock);
    expect(await r.json()).toEqual({ ok: true, correo: 'enviado', telegram: 'no_aplica' });
    const [[url, init]] = llamadasA(fetchMock, '/rpc/');
    expect(url).toBe('https://proyecto.supabase.co/rest/v1/rpc/claim_lead_alert');
    expect(JSON.parse(String(init.body))).toEqual({ p_lead: LEAD_ID });
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer clave-servicio');
  });

  it('si el lead ya se avisó (o no hay avisos prendidos) no manda nada', async () => {
    const fetchMock = servicios(null);
    const r = await atenderAlerta(pedir({ leadId: LEAD_ID }), env, fetchMock);
    expect(await r.json()).toEqual({ ok: true, avisos: 'nada_que_avisar' });
    expect(llamadasA(fetchMock, 'resend')).toHaveLength(0);
  });

  it('rechaza lo que no es un identificador de lead, sin consultar la base', async () => {
    const fetchMock = servicios();
    expect((await atenderAlerta(pedir({ leadId: 'x' }), env, fetchMock)).status).toBe(400);
    expect((await atenderAlerta(pedir('no es json'), env, fetchMock)).status).toBe(400);
    expect((await atenderAlerta(new Request('https://f.supabase.co/x'), env, fetchMock)).status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si la base falla responde error sin enviar nada', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 500 }));
    expect((await atenderAlerta(pedir({ leadId: LEAD_ID }), env, fetchMock)).status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('función telegram-bot', () => {
  const mensaje = (text: string, chatId: number | string = 987) => ({ message: { chat: { id: chatId }, text } });
  const firmado = { 'x-telegram-bot-api-secret-token': 'secreto-webhook' };

  it('lee el código de "/start <código>"', () => {
    expect(codigoDeInicio(`/start ${CODIGO}`)).toBe(CODIGO);
    expect(codigoDeInicio(`/start@MiBot ${CODIGO}`)).toBe(CODIGO);
    expect(codigoDeInicio('/start')).toBeNull();
    expect(codigoDeInicio(`/start ${CODIGO}; drop table`)).toBeNull();
  });

  it('sin la firma de Telegram no hace nada', async () => {
    const fetchMock = servicios('Casa Sur');
    expect((await atenderTelegram(pedir(mensaje(`/start ${CODIGO}`)), env, fetchMock)).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('con un código válido conecta el chat y lo confirma', async () => {
    const fetchMock = servicios('Casa Sur');
    expect((await atenderTelegram(pedir(mensaje(`/start ${CODIGO}`), firmado), env, fetchMock)).status).toBe(200);
    const [[, rpc]] = llamadasA(fetchMock, '/rpc/link_telegram_chat');
    expect(JSON.parse(String(rpc.body))).toEqual({ p_code: CODIGO, p_chat_id: '987' });
    const [[, respuesta]] = llamadasA(fetchMock, 'sendMessage');
    expect(JSON.parse(String(respuesta.body)).text).toContain('Listo: aquí recibirás los avisos de leads nuevos de Casa Sur');
  });

  it('un código vencido o usado se explica', async () => {
    const fetchMock = servicios(null);
    await atenderTelegram(pedir(mensaje(`/start ${CODIGO}`), firmado), env, fetchMock);
    const [[, respuesta]] = llamadasA(fetchMock, 'sendMessage');
    expect(JSON.parse(String(respuesta.body)).text).toContain('El enlace venció o ya se usó');
  });

  it('"/start" sin código explica cómo conectarse; otros mensajes se ignoran', async () => {
    const fetchMock = servicios();
    await atenderTelegram(pedir(mensaje('/start'), firmado), env, fetchMock);
    expect(JSON.parse(String(llamadasA(fetchMock, 'sendMessage')[0][1].body)).text).toContain('Conectar Telegram');
    fetchMock.mockClear();
    expect((await atenderTelegram(pedir(mensaje('hola'), firmado), env, fetchMock)).status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sin configurar responde 503', async () => {
    expect((await atenderTelegram(pedir(mensaje('/start')), {}, servicios())).status).toBe(503);
  });
});
