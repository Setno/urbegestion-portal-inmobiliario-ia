import React, { useState } from 'react';
import { ExternalLink, Globe2 } from 'lucide-react';
import { useAuthStore } from '../../../core/auth/useAuthStore';
import { canInviteAgents } from '../../../core/auth/permissions';
import { isRemoteData } from '../../../core/data/dataSource';
import { isStalePending, publishToMercadoLibre, type PortalListing, type PublishError } from '../../../core/portals/portalConnectionService';
import { isOnOffer, isPublished } from '../services/publicationWorkflow';
import type { Property } from '../types/property';

const ERROR_TEXT: Record<PublishError, string> = {
  unauthorized: 'Tu sesión venció. Vuelve a entrar e inténtalo de nuevo.',
  not_admin: 'Solo el administrador de la corredora puede publicar en portales.',
  not_found: 'No se encontró la propiedad. Recarga la página.',
  not_approved: 'La propiedad debe estar aprobada y publicada en el sitio antes de ir a un portal.',
  not_on_offer: 'Una propiedad vendida o arrendada no se publica en portales.',
  not_connected: 'Conecta Mercado Libre en Mi corredora → Portales inmobiliarios.',
  already_published: 'Esta propiedad ya está publicada en Mercado Libre.',
  in_progress: 'Ya se está publicando. Espera unos minutos y recarga.',
  uncertain: 'No se sabe si el aviso llegó a publicarse.',
  reconnect: 'Vuelve a conectar Mercado Libre en Mi corredora → Portales inmobiliarios: la conexión venció.',
  datos: 'Faltan datos para publicar:',
  rechazado: 'Mercado Libre no aceptó el aviso:',
  red: 'No se pudo contactar a Mercado Libre. Inténtalo de nuevo en unos minutos.',
  respuesta: 'Mercado Libre respondió algo inesperado. Revisa tu cuenta antes de reintentar.',
  not_configured: 'La publicación en Mercado Libre aún no está disponible en la plataforma. Avísanos para activarla.',
  conexion: 'No se pudo completar. Revisa tu conexión e inténtalo de nuevo.',
};

const LISTING_LABEL: Record<PortalListing['status'], string> = { activa: 'Publicada en Mercado Libre', pausada: 'Pausada en Mercado Libre', cerrada: 'Cerrada en Mercado Libre' };

interface Props {
  property: Property;
  listing?: PortalListing;
  connected: boolean;
  onChanged: () => void;
}

// Publicar una propiedad en Mercado Libre / Portal Inmobiliario desde su tarjeta (H-068.3). Solo el administrador.
export const PortalPublishControl: React.FC<Props> = ({ property, listing, connected, onChanged }) => {
  const role = useAuthStore((s) => s.membership?.role ?? null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; lines: string[] } | null>(null);

  if (!canInviteAgents(role) || !isRemoteData) return null;

  const published = listing && !listing.pending ? listing : null;
  // Una reserva pendiente abandonada (más de 10 minutos) no debe dejar la propiedad bloqueada para siempre.
  const abandoned = Boolean(listing && isStalePending(listing));
  const canPublish = (!listing || abandoned) && isPublished(property) && isOnOffer(property);

  const handlePublish = async () => {
    if (busy) return;
    if (!window.confirm(`¿Publicar "${property.title}" en Mercado Libre y Portal Inmobiliario con los datos actuales? Quedará visible para el público.`)) return;
    setBusy(true);
    setMessage(null);
    const result = await publishToMercadoLibre(property.id);
    setBusy(false);
    if ('permalink' in result) {
      setMessage({ ok: true, lines: ['Publicada en Mercado Libre.', ...(result.warning ? [result.warning] : [])] });
      onChanged();
      return;
    }
    setMessage({ ok: false, lines: [ERROR_TEXT[result.error], ...result.messages] });
    if (result.error === 'already_published' || result.error === 'in_progress' || result.error === 'uncertain') onChanged();
  };

  if (!published && !listing && !canPublish) return null;

  return (
    <div className="space-y-1">
      {published && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold">
            <Globe2 className="w-3 h-3" /> {LISTING_LABEL[published.status]}
          </span>
          {published.permalink && (
            <a href={published.permalink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-bold text-urbe-primary underline">
              Ver aviso <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
      {listing?.pending && !abandoned && (
        <p className="text-[11px] font-semibold text-slate-500">
          {listing.lastError ?? 'Publicándose en Mercado Libre… Si pasan unos minutos, recarga la página.'}
        </p>
      )}
      {abandoned && listing?.lastError && <p className="text-[11px] font-semibold text-amber-700">{listing.lastError}</p>}
      {canPublish && !connected && <p className="text-[11px] text-slate-500">{ERROR_TEXT.not_connected}</p>}
      {canPublish && connected && (
        <button
          type="button"
          onClick={handlePublish}
          disabled={busy}
          className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-[11px] font-bold flex items-center gap-1 disabled:opacity-50"
        >
          <Globe2 className="w-3 h-3" /> {busy ? 'Publicando…' : 'Publicar en Mercado Libre'}
        </button>
      )}
      {message && (
        <div role="status" className={`text-[11px] font-semibold ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {message.lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
};
