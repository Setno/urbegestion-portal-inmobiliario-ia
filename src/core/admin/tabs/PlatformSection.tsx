import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { createTenant, isPlatformOwner, type CreateTenantError } from '../../auth/platformService';
import { useT, type MessageKey } from '../../i18n/i18n';

const ERROR_TEXT: Record<CreateTenantError, MessageKey> = {
  nombre_invalido: 'platform.err.nombre_invalido',
  correo_invalido: 'platform.err.correo_invalido',
  nombre_repetido: 'platform.err.nombre_repetido',
  correo_existente: 'platform.err.correo_existente',
  sin_permiso: 'platform.err.sin_permiso',
  conexion: 'platform.err.conexion',
};

// Solo la ve el dueño del producto (el servidor lo confirma); para el resto no se dibuja nada.
export const PlatformSection: React.FC = () => {
  const { t } = useT();
  const [owner, setOwner] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    isPlatformOwner().then((v) => {
      if (!cancelled) setOwner(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!owner) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    const result = await createTenant(name, email);
    setBusy(false);
    if ('error' in result) {
      setMessage({ ok: false, text: t(ERROR_TEXT[result.error]) });
    } else {
      setMessage({ ok: true, text: t('platform.ok', { name: name.trim(), email: email.trim() }) });
      setName('');
      setEmail('');
    }
  };

  const inputClass =
    'flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-urbe-primary';

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
        <Building2 className="w-4 h-4 text-urbe-primary" /> {t('platform.title')}
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        {t('platform.help')}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('platform.name.placeholder')}
          aria-label={t('platform.name.placeholder')}
          className={inputClass}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('platform.email.placeholder')}
          aria-label={t('platform.email.aria')}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy || !name.trim() || !email.trim()}
          className="px-5 py-2.5 bg-urbe-primary text-white rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {busy ? t('platform.creating') : t('platform.submit')}
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
