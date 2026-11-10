import React, { useEffect, useState } from 'react';
import { Globe2 } from 'lucide-react';
import { useAuthStore } from '../../auth/useAuthStore';
import { canInviteAgents } from '../../auth/permissions';
import { isRemoteData } from '../../data/dataSource';
import {
  consumePortalResult,
  disconnectPortal,
  fetchPortalConnections,
  startMercadoLibreConnection,
  type PortalConnection,
  type PortalError,
  type PortalReturn,
} from '../../portals/portalConnectionService';

const ERROR_TEXT: Record<PortalError, string> = {
  permiso: 'Solo el administrador de la corredora puede conectar los portales.',
  plataforma: 'La conexión con Mercado Libre aún no está disponible en la plataforma. Avísanos para activarla.',
  conexion: 'No se pudo completar. Revisa tu conexión e inténtalo de nuevo.',
  no_configurado: 'Los portales se conectan cuando el panel está conectado a la base de datos.',
};

const RETURN_TEXT: Record<PortalReturn, { ok: boolean; text: string }> = {
  'ml-ok': { ok: true, text: 'Mercado Libre conectado.' },
  'ml-error': { ok: false, text: 'No se pudo conectar con Mercado Libre. Inténtalo de nuevo; si sigue fallando, avísanos.' },
  'ml-cancelado': { ok: false, text: 'No autorizaste la conexión en Mercado Libre, así que no se conectó nada.' },
  'ml-no-configurado': { ok: false, text: ERROR_TEXT.plataforma },
};

const defaultNavigate = (url: string) => window.location.assign(url);

// Conexión de la corredora con Mercado Libre y Portal Inmobiliario (H-068.2). Solo la ve el administrador.
// La autorización ocurre en Mercado Libre; los tokens quedan en el servidor y nunca pasan por el navegador.
export const PortalsSection: React.FC<{ navigate?: (url: string) => void }> = ({ navigate = defaultNavigate }) => {
  const role = useAuthStore((s) => s.membership?.role ?? null);
  const isAdmin = canInviteAgents(role);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [connections, setConnections] = useState<PortalConnection[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const reload = async () => {
    const list = await fetchPortalConnections();
    if (!list) return setStatus('error');
    setConnections(list);
    setStatus('ok');
  };

  useEffect(() => {
    if (!isAdmin || !isRemoteData) return;
    const back = consumePortalResult();
    if (back) setMessage(RETURN_TEXT[back]);
    let cancelled = false;
    fetchPortalConnections().then((list) => {
      if (cancelled) return;
      if (!list) return setStatus('error');
      setConnections(list);
      setStatus('ok');
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  const ml = connections.find((c) => c.portal === 'mercadolibre');

  const handleConnect = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const result = await startMercadoLibreConnection();
    if ('error' in result) {
      setBusy(false);
      return setMessage({ ok: false, text: ERROR_TEXT[result.error] });
    }
    navigate(result.url); // sigue en Mercado Libre; al volver el panel se recarga
  };

  const handleDisconnect = async () => {
    if (!window.confirm('¿Desconectar Mercado Libre? Los avisos que ya están publicados no se borran, pero dejarán de actualizarse desde aquí.')) return;
    setBusy(true);
    setMessage(null);
    const result = await disconnectPortal('mercadolibre');
    setBusy(false);
    if ('error' in result) return setMessage({ ok: false, text: ERROR_TEXT[result.error] });
    await reload();
    setMessage({ ok: true, text: 'Mercado Libre desconectado.' });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
        <Globe2 className="w-4 h-4 text-urbe-primary" /> Portales inmobiliarios
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Conecta tu cuenta de Mercado Libre para publicar tus propiedades también en Mercado Libre y Portal Inmobiliario.
      </p>

      {!isRemoteData && <p className="text-xs text-slate-600">{ERROR_TEXT.no_configurado}</p>}
      {isRemoteData && status === 'loading' && <p className="text-xs text-slate-500">Cargando las conexiones…</p>}
      {isRemoteData && status === 'error' && (
        <p role="alert" className="text-xs font-semibold text-red-600">
          No se pudo leer el estado de las conexiones. Recarga la página para intentarlo de nuevo.
        </p>
      )}

      {isRemoteData && status === 'ok' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-700">Mercado Libre / Portal Inmobiliario</span>
              {ml ? (
                <span className="block text-[11px] text-emerald-700">
                  Conectado · Cuenta {ml.accountId} · desde {new Date(ml.connectedAt).toLocaleDateString('es-CL')}
                </span>
              ) : (
                <span className="block text-[11px] text-slate-500">No conectado</span>
              )}
              {ml?.lastError && <span className="block text-[11px] text-red-600">Último problema: {ml.lastError}</span>}
            </div>
            {ml ? (
              <button type="button" onClick={handleDisconnect} disabled={busy} className="text-[11px] font-bold text-rose-600 disabled:opacity-50">
                Desconectar
              </button>
            ) : (
              <button type="button" onClick={handleConnect} disabled={busy} className="px-4 py-2 rounded-xl bg-urbe-primary text-white text-xs font-bold disabled:opacity-50">
                Conectar Mercado Libre
              </button>
            )}
          </div>
          {!ml && (
            <p className="text-[11px] text-slate-500">
              Para publicar en Mercado Libre necesitas tener contratado un paquete de publicaciones de inmuebles en tu cuenta.
            </p>
          )}
        </div>
      )}

      {message && (
        <p role="status" className={`text-xs mt-3 font-semibold ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};
