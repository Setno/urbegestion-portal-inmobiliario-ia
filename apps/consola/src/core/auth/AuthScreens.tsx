import React, { useState } from 'react';
import { LogIn, KeyRound, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from './useAuthStore';
import type { AuthError } from './authService';
import { useT, type MessageKey } from '../i18n/i18n';

const MENSAJES: Record<AuthError, MessageKey> = {
  credenciales: 'auth.err.credenciales',
  conexion: 'auth.err.conexion',
  no_configurado: 'auth.err.no_configurado',
  clave_corta: 'auth.err.clave_corta',
  enlace_invalido: 'auth.err.enlace_invalido',
};

const inputClase =
  'w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-urbe-primary/40 focus:border-urbe-primary';
const botonClase =
  'w-full py-2.5 rounded-xl bg-urbe-primary text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition';

const Tarjeta: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
    <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
      <h3 className="text-lg font-bold text-slate-900">{titulo}</h3>
      {children}
    </div>
  </div>
);

export const LoginScreen: React.FC = () => {
  const { signIn, busy, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [olvido, setOlvido] = useState(false);
  const { t } = useT();

  if (olvido) return <ForgotScreen onBack={() => setOlvido(false)} />;

  return (
    <Tarjeta titulo={t('auth.login.title')}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void signIn(email, password);
        }}
      >
        <label className="block text-xs font-semibold text-slate-600">
          {t('auth.email')}
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClase} mt-1`}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          {t('auth.password')}
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClase} mt-1`}
          />
        </label>
        {error && (
          <p role="alert" className="text-xs font-semibold text-rose-600">
            {t(MENSAJES[error])}
          </p>
        )}
        <button type="submit" disabled={busy} className={botonClase}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          {t('auth.login.submit')}
        </button>
      </form>
      <button type="button" onClick={() => setOlvido(true)} className="text-xs font-semibold text-urbe-primary hover:underline">
        {t('auth.forgot.link')}
      </button>
    </Tarjeta>
  );
};

const ForgotScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'enviado' | AuthError>('idle');

  return (
    <Tarjeta titulo={t('auth.forgot.title')}>
      {estado === 'enviado' ? (
        <p role="status" className="text-sm text-slate-700">
          {t('auth.forgot.sent')}
        </p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setEstado('enviando');
            const r = await resetPassword(email);
            setEstado('error' in r ? r.error : 'enviado');
          }}
        >
          <label className="block text-xs font-semibold text-slate-600">
            {t('auth.email')}
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClase} mt-1`}
            />
          </label>
          {estado !== 'idle' && estado !== 'enviando' && (
            <p role="alert" className="text-xs font-semibold text-rose-600">
              {t(MENSAJES[estado])}
            </p>
          )}
          <button type="submit" disabled={estado === 'enviando'} className={botonClase}>
            {estado === 'enviando' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {t('auth.forgot.submit')}
          </button>
        </form>
      )}
      <button type="button" onClick={onBack} className="text-xs font-semibold text-slate-500 hover:underline flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> {t('auth.forgot.back')}
      </button>
    </Tarjeta>
  );
};

export const NewPasswordScreen: React.FC = () => {
  const setNewPassword = useAuthStore((s) => s.setNewPassword);
  const { t } = useT();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<AuthError | null>(null);
  const [listo, setListo] = useState(false);

  return (
    <Tarjeta titulo={t('auth.new.title')}>
      {listo ? (
        <p role="status" className="text-sm text-slate-700">
          {t('auth.new.done')}
        </p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await setNewPassword(password);
            if ('error' in r) setError(r.error);
            else setListo(true);
          }}
        >
          <label className="block text-xs font-semibold text-slate-600">
            {t('auth.new.label')}
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClase} mt-1`}
            />
          </label>
          {error && (
            <p role="alert" className="text-xs font-semibold text-rose-600">
              {t(MENSAJES[error])}
            </p>
          )}
          <button type="submit" className={botonClase}>
            <KeyRound className="w-4 h-4" /> {t('auth.new.submit')}
          </button>
        </form>
      )}
    </Tarjeta>
  );
};

export const NoMembershipScreen: React.FC<{ email: string | null }> = ({ email }) => {
  const { t } = useT();
  return (
    <Tarjeta titulo={t('auth.nomember.title')}>
      <p className="text-sm text-slate-700">{t('auth.nomember.text', { email: email ? ` (${email})` : '' })}</p>
    </Tarjeta>
  );
};
