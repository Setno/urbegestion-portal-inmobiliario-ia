import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '../../auth/useAuthStore';
import { inviteAgent, type InviteError } from '../../auth/authService';
import { canInviteAgents } from '../../auth/permissions';
import { useT, type MessageKey } from '../../i18n/i18n';

const ERROR_TEXT: Record<InviteError, MessageKey> = {
  correo_invalido: 'team.err.correo_invalido',
  ya_miembro: 'team.err.ya_miembro',
  otra_corredora: 'team.err.otra_corredora',
  sin_permiso: 'team.err.sin_permiso',
  no_configurado: 'team.err.no_configurado',
  limite_alcanzado: 'team.err.limite_alcanzado',
  solo_lectura: 'team.err.solo_lectura',
  conexion: 'team.err.conexion',
};

export const TeamSection: React.FC = () => {
  const role = useAuthStore((s) => s.membership?.role ?? null);
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!canInviteAgents(role)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    const result = await inviteAgent(email);
    setBusy(false);
    if ('error' in result) {
      setMessage({ ok: false, text: t(ERROR_TEXT[result.error]) });
    } else {
      setMessage({
        ok: true,
        text: t(result.status === 'invitado' ? 'team.ok.invited' : 'team.ok.existing', { email: email.trim() }),
      });
      setEmail('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
        <UserPlus className="w-4 h-4 text-urbe-primary" /> {t('team.title')}
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        {t('team.help')}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('team.placeholder')}
          aria-label={t('team.aria')}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-urbe-primary"
        />
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="px-5 py-2.5 bg-urbe-primary text-white rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {busy ? t('team.sending') : t('team.submit')}
        </button>
      </form>
      {message && (
        <p role="status" className={`text-xs mt-3 font-semibold ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};
