import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../auth/useAuthStore';
import { canInviteAgents } from '../../auth/permissions';
import type { PublicationMode } from '../../auth/authService';
import { useT, type MessageKey } from '../../i18n/i18n';

const OPTIONS: Array<{ mode: PublicationMode; title: MessageKey; text: MessageKey }> = [
  { mode: 'con_aprobacion', title: 'pubmode.approval.title', text: 'pubmode.approval.text' },
  { mode: 'directa', title: 'pubmode.direct.title', text: 'pubmode.direct.text' },
];

// Solo el administrador la ve. El administrador siempre puede editar y borrar cualquier publicación, en ambos modos.
export const PublicationModeSection: React.FC = () => {
  const role = useAuthStore((s) => s.membership?.role ?? null);
  const current = useAuthStore((s) => s.membership?.publicationMode ?? 'con_aprobacion');
  const changeMode = useAuthStore((s) => s.changePublicationMode);
  const { t } = useT();
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
        <ShieldCheck className="w-4 h-4 text-urbe-primary" /> {t('pubmode.title')}
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        {t('pubmode.help')}
      </p>
      <div role="radiogroup" aria-label={t('pubmode.aria')} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <span className="block font-bold text-slate-900 mb-1">{t(o.title)}</span>
            <span className="block text-slate-500">{t(o.text)}</span>
          </button>
        ))}
      </div>
      {error && (
        <p role="status" className="text-xs mt-3 font-semibold text-red-600">
          {t('pubmode.error')}
        </p>
      )}
    </div>
  );
};
