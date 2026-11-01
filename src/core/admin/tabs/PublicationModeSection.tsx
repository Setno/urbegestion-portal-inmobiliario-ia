import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../auth/useAuthStore';
import { canInviteAgents } from '../../auth/permissions';
import type { PublicationMode } from '../../auth/authService';

const OPTIONS: Array<{ mode: PublicationMode; title: string; text: string }> = [
  {
    mode: 'con_aprobacion',
    title: 'El administrador aprueba',
    text: 'Los agentes crean borradores y los envían a revisión. Solo el administrador publica. Recomendado para corredoras con varios agentes.',
  },
  {
    mode: 'directa',
    title: 'Cada agente publica lo suyo',
    text: 'Los agentes publican directamente y responden por lo que publican (queda registrado quién y cuándo). Pensado para corredoras de una o dos personas.',
  },
];

// Solo el administrador la ve. El administrador siempre puede editar y borrar cualquier publicación, en ambos modos.
export const PublicationModeSection: React.FC = () => {
  const role = useAuthStore((s) => s.membership?.role ?? null);
  const current = useAuthStore((s) => s.membership?.publicationMode ?? 'con_aprobacion');
  const changeMode = useAuthStore((s) => s.changePublicationMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (!canInviteAgents(role)) return null;

  const choose = async (mode: PublicationMode) => {
    if (mode === current || busy) return;
    setBusy(true);
    setError(false);
    const result = await changeMode(mode);
    setBusy(false);
    setError(!result.ok);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-urbe-primary" /> Cómo se publican las propiedades
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Tú decides si las publicaciones de tus agentes pasan por tu aprobación. Puedes cambiarlo cuando quieras y siempre
        podrás editar o borrar cualquier publicación.
      </p>
      <div role="radiogroup" aria-label="Modo de publicación" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OPTIONS.map((o) => (
          <button
            key={o.mode}
            type="button"
            role="radio"
            aria-checked={current === o.mode}
            disabled={busy}
            onClick={() => choose(o.mode)}
            className={`text-left p-4 rounded-xl border text-xs transition-colors ${
              current === o.mode
                ? 'border-urbe-primary bg-urbe-primary/5 ring-1 ring-urbe-primary'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="block font-bold text-slate-900 mb-1">{o.title}</span>
            <span className="block text-slate-500">{o.text}</span>
          </button>
        ))}
      </div>
      {error && (
        <p role="status" className="text-xs mt-3 font-semibold text-red-600">
          No se pudo guardar el cambio. Inténtalo de nuevo.
        </p>
      )}
    </div>
  );
};
