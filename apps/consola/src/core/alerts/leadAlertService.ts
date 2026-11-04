import { remoteContext } from '../data/dataSource';

// A quién avisa la corredora cuando entra un lead (H-054). Solo el administrador la ve y la cambia.
export interface LeadAlerts {
  emails: string[];
  emailEnabled: boolean;
  telegramConnected: boolean;
  telegramEnabled: boolean;
}

export type LeadAlertsError = 'correo_invalido' | 'permiso' | 'conexion' | 'no_configurado';
export type LeadAlertsResult = { ok: true } | { ok: false; error: LeadAlertsError };

export const MAX_ALERT_EMAILS = 3;

// Nombre del bot de Telegram de la plataforma (sin @). Público: es el que aparece en t.me/<bot>.
export const telegramBot: string = (import.meta.env.VITE_TELEGRAM_BOT ?? '').trim().replace(/^@/, '');

const EMAIL = /^[^\s@"<>,;]+@[^\s@"<>,;]+\.[^\s@"<>,;]+$/;
export const validAlertEmail = (value: string): boolean => value.length <= 200 && EMAIL.test(value);

const NO_ALERTS: LeadAlerts = { emails: [], emailEnabled: false, telegramConnected: false, telegramEnabled: false };

// Null si falla o no hay base: quien llama no deja editar.
export async function fetchLeadAlerts(): Promise<LeadAlerts | null> {
  const ctx = remoteContext();
  if (!ctx) return null;
  try {
    const { data, error } = await ctx.client
      .from('lead_alert_settings')
      .select('emails, email_enabled, telegram_chat_id, telegram_enabled')
      .eq('tenant_id', ctx.tenantId)
      .maybeSingle();
    if (error) return null;
    if (!data) return NO_ALERTS;
    const row = data as { emails: string[] | null; email_enabled: boolean; telegram_chat_id: string | null; telegram_enabled: boolean };
    return {
      emails: row.emails ?? [],
      emailEnabled: row.email_enabled,
      telegramConnected: Boolean(row.telegram_chat_id),
      telegramEnabled: row.telegram_enabled,
    };
  } catch (err) {
    console.warn('[avisos] No se pudo leer la configuración de avisos:', err);
    return null;
  }
}

function toError(error: { code?: string } | null): LeadAlertsError {
  if (error?.code === '23514') return 'correo_invalido';
  if (error?.code === '42501') return 'permiso';
  return 'conexion';
}

// `telegramEnabled: null` deja Telegram como está en la base (por ejemplo, si se conectó recién desde el bot).
export async function saveLeadAlerts(alerts: { emails: string[]; emailEnabled: boolean; telegramEnabled: boolean | null }): Promise<LeadAlertsResult> {
  const ctx = remoteContext();
  if (!ctx) return { ok: false, error: 'no_configurado' };
  try {
    const { error } = await ctx.client.rpc('set_lead_alerts', {
      p_tenant: ctx.tenantId,
      p_emails: alerts.emails,
      p_email_enabled: alerts.emailEnabled,
      p_telegram_enabled: alerts.telegramEnabled,
    });
    if (!error) return { ok: true };
    console.warn('[avisos] No se pudo guardar la configuración de avisos:', error);
    return { ok: false, error: toError(error) };
  } catch (err) {
    console.warn('[avisos] No se pudo guardar la configuración de avisos:', err);
    return { ok: false, error: 'conexion' };
  }
}

// Enlace de un solo uso (vence en 30 minutos) para que el administrador conecte su Telegram. Null si falla.
export async function startTelegramLink(): Promise<string | null> {
  const ctx = remoteContext();
  if (!ctx || !telegramBot) return null;
  try {
    const { data, error } = await ctx.client.rpc('start_telegram_link', { p_tenant: ctx.tenantId });
    if (error || typeof data !== 'string') return null;
    return `https://t.me/${telegramBot}?start=${data}`;
  } catch (err) {
    console.warn('[avisos] No se pudo crear el enlace de Telegram:', err);
    return null;
  }
}

export async function unlinkTelegram(): Promise<LeadAlertsResult> {
  const ctx = remoteContext();
  if (!ctx) return { ok: false, error: 'no_configurado' };
  try {
    const { error } = await ctx.client.rpc('unlink_telegram', { p_tenant: ctx.tenantId });
    return error ? { ok: false, error: toError(error) } : { ok: true };
  } catch (err) {
    console.warn('[avisos] No se pudo desconectar Telegram:', err);
    return { ok: false, error: 'conexion' };
  }
}
