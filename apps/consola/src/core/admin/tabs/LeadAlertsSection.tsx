import React, { useEffect, useState } from 'react';
import { BellRing, Plus, Send, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../auth/useAuthStore';
import { canInviteAgents } from '../../auth/permissions';
import { isRemoteData } from '../../data/dataSource';
import {
  MAX_ALERT_EMAILS,
  fetchLeadAlerts,
  saveLeadAlerts,
  startTelegramLink,
  telegramBot,
  unlinkTelegram,
  validAlertEmail,
  type LeadAlerts,
  type LeadAlertsError,
} from '../../alerts/leadAlertService';

const ERROR_TEXT: Record<LeadAlertsError | 'enlace', string> = {
  correo_invalido: 'Revisa los correos: alguno no está bien escrito.',
  permiso: 'Solo el administrador de la corredora puede cambiar los avisos.',
  conexion: 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.',
  no_configurado: 'Los avisos se configuran cuando el panel está conectado a la base de datos.',
  enlace: 'No se pudo crear el enlace de Telegram. Inténtalo de nuevo.',
};

const inputClass = 'flex-1 min-w-0 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-urbe-primary';

// A quién avisa la corredora cuando entra un lead nuevo (H-054): hasta tres correos y un chat de Telegram.
// Solo la ve el administrador. El aviso sale desde la base, así que llega aunque nadie tenga el panel abierto.
export const LeadAlertsSection: React.FC = () => {
  const role = useAuthStore((s) => s.membership?.role ?? null);
  const isAdmin = canInviteAgents(role);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [saved, setSaved] = useState<LeadAlerts | null>(null);
  const [emails, setEmails] = useState<string[]>(['']);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const apply = (alerts: LeadAlerts) => {
    setSaved(alerts);
    setEmails(alerts.emails.length > 0 ? alerts.emails : ['']);
    setEmailEnabled(alerts.emailEnabled);
    setTelegramEnabled(alerts.telegramEnabled);
  };

  const reload = async () => {
    const alerts = await fetchLeadAlerts();
    if (!alerts) {
      setStatus('error');
      return;
    }
    apply(alerts);
    setStatus('ok');
  };

  useEffect(() => {
    if (!isAdmin || !isRemoteData) return;
    let cancelled = false;
    fetchLeadAlerts().then((alerts) => {
      if (cancelled) return;
      if (!alerts) {
        setStatus('error');
        return;
      }
      apply(alerts);
      setStatus('ok');
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  const cleanEmails = emails.map((e) => e.trim().toLowerCase()).filter(Boolean);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (cleanEmails.some((mail) => !validAlertEmail(mail))) return setMessage({ ok: false, text: ERROR_TEXT.correo_invalido });
    if (emailEnabled && cleanEmails.length === 0) return setMessage({ ok: false, text: 'Escribe al menos un correo para recibir los avisos.' });
    setBusy(true);
    setMessage(null);
    // Si en pantalla Telegram aún no aparece conectado, no se toca: pudo conectarse recién desde el bot
    const result = await saveLeadAlerts({ emails: cleanEmails, emailEnabled, telegramEnabled: saved?.telegramConnected ? telegramEnabled : null });
    setBusy(false);
    if ('error' in result) return setMessage({ ok: false, text: ERROR_TEXT[result.error] });
    await reload();
    setMessage({ ok: true, text: 'Avisos guardados.' });
  };

  const handleConnect = async () => {
    setMessage(null);
    setBusy(true);
    const url = await startTelegramLink();
    setBusy(false);
    if (!url) return setMessage({ ok: false, text: ERROR_TEXT.enlace });
    setLink(url);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleUnlink = async () => {
    if (!window.confirm('¿Dejar de recibir los avisos en Telegram?')) return;
    setBusy(true);
    const result = await unlinkTelegram();
    setBusy(false);
    if ('error' in result) return setMessage({ ok: false, text: ERROR_TEXT[result.error] });
    setLink(null);
    await reload();
    setMessage({ ok: true, text: 'Telegram desconectado.' });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
        <BellRing className="w-4 h-4 text-urbe-primary" /> Avisos de leads nuevos
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Cuando alguien deja sus datos en tu sitio, te avisamos al instante con su nombre, teléfono y la propiedad que le interesa.
      </p>

      {!isRemoteData && <p className="text-xs text-slate-600">{ERROR_TEXT.no_configurado}</p>}
      {isRemoteData && status === 'loading' && <p className="text-xs text-slate-500">Cargando los avisos…</p>}
      {isRemoteData && status === 'error' && (
        <p role="alert" className="text-xs font-semibold text-red-600">
          No se pudo leer la configuración de avisos. Recarga la página para intentarlo de nuevo.
        </p>
      )}

      {isRemoteData && status === 'ok' && saved && (
        <form onSubmit={handleSave} noValidate className="space-y-5">
          <fieldset className="space-y-2 min-w-0">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} className="w-4 h-4 rounded text-urbe-primary" />
              Avisarme por correo
            </label>
            {emails.map((mail, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="email"
                  value={mail}
                  onChange={(e) => setEmails((list) => list.map((m, j) => (j === i ? e.target.value : m)))}
                  placeholder="tu@correo.cl"
                  aria-label={`Correo ${i + 1}`}
                  className={inputClass}
                />
                {emails.length > 1 && (
                  <button type="button" onClick={() => setEmails((list) => list.filter((_, j) => j !== i))} aria-label={`Quitar el correo ${i + 1}`} className="p-2 text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {emails.length < MAX_ALERT_EMAILS && (
              <button type="button" onClick={() => setEmails((list) => [...list, ''])} className="text-[11px] font-bold text-urbe-primary flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Agregar otro correo
              </button>
            )}
          </fieldset>

          <fieldset className="space-y-2 min-w-0">
            <span className="block text-xs font-bold text-slate-700">Telegram</span>
            {!telegramBot && <p className="text-xs text-slate-500">Los avisos por Telegram aún no están disponibles en la plataforma.</p>}
            {telegramBot && saved.telegramConnected && (
              <>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={telegramEnabled} onChange={(e) => setTelegramEnabled(e.target.checked)} className="w-4 h-4 rounded text-urbe-primary" />
                  Avisarme por Telegram (conectado)
                </label>
                <button type="button" onClick={handleUnlink} disabled={busy} className="text-[11px] font-bold text-rose-600">
                  Desconectar Telegram
                </button>
              </>
            )}
            {telegramBot && !saved.telegramConnected && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Toca el botón, se abrirá Telegram con nuestro bot y presiona <b>Iniciar</b>. Después vuelve aquí y toca "Ya lo conecté".
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleConnect} disabled={busy} className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
                    <Send className="w-3.5 h-3.5" /> Conectar Telegram
                  </button>
                  {link && (
                    <button type="button" onClick={() => void reload()} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                      Ya lo conecté
                    </button>
                  )}
                </div>
                {link && (
                  <p className="text-[11px] text-slate-500 break-all">
                    Si no se abrió, usa este enlace (vence en 30 minutos): <a href={link} target="_blank" rel="noopener noreferrer" className="text-urbe-primary underline">{link}</a>
                  </p>
                )}
              </div>
            )}
          </fieldset>

          <button type="submit" disabled={busy} className="px-5 py-2.5 bg-urbe-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">
            {busy ? 'Guardando…' : 'Guardar avisos'}
          </button>
        </form>
      )}

      {message && (
        <p role="status" className={`text-xs mt-3 font-semibold ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};
