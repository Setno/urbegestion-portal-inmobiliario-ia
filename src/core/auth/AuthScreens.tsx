import React, { useState } from 'react';
import { LogIn, KeyRound, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from './useAuthStore';
import type { AuthError } from './authService';

const MENSAJES: Record<AuthError, string> = {
  credenciales: 'Correo o clave incorrectos.',
  conexion: 'No se pudo conectar. Revisa tu internet e inténtalo de nuevo.',
  no_configurado: 'El acceso no está configurado en este entorno.',
  clave_corta: 'La clave debe tener al menos 8 caracteres.',
  enlace_invalido: 'El enlace venció o ya fue usado. Pide uno nuevo.',
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

  if (olvido) return <ForgotScreen onBack={() => setOlvido(false)} />;

  return (
    <Tarjeta titulo="Ingresar al panel">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void signIn(email, password);
        }}
      >
        <label className="block text-xs font-semibold text-slate-600">
          Correo
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
          Clave
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
            {MENSAJES[error]}
          </p>
        )}
        <button type="submit" disabled={busy} className={botonClase}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Ingresar
        </button>
      </form>
      <button type="button" onClick={() => setOlvido(true)} className="text-xs font-semibold text-urbe-primary hover:underline">
        ¿Olvidaste tu clave?
      </button>
    </Tarjeta>
  );
};

const ForgotScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'enviado' | AuthError>('idle');

  return (
    <Tarjeta titulo="Recuperar clave">
      {estado === 'enviado' ? (
        <p role="status" className="text-sm text-slate-700">
          Si el correo está registrado, te enviamos un enlace para crear una clave nueva. Revisa tu bandeja y la carpeta de spam.
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
            Correo
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
              {MENSAJES[estado]}
            </p>
          )}
          <button type="submit" disabled={estado === 'enviando'} className={botonClase}>
            {estado === 'enviando' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Enviar enlace
          </button>
        </form>
      )}
      <button type="button" onClick={onBack} className="text-xs font-semibold text-slate-500 hover:underline flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Volver a ingresar
      </button>
    </Tarjeta>
  );
};

export const NewPasswordScreen: React.FC = () => {
  const setNewPassword = useAuthStore((s) => s.setNewPassword);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<AuthError | null>(null);
  const [listo, setListo] = useState(false);

  return (
    <Tarjeta titulo="Crea tu clave nueva">
      {listo ? (
        <p role="status" className="text-sm text-slate-700">
          Listo. Ya puedes ingresar con tu clave nueva.
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
            Clave nueva (mínimo 8 caracteres)
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
              {MENSAJES[error]}
            </p>
          )}
          <button type="submit" className={botonClase}>
            <KeyRound className="w-4 h-4" /> Guardar clave
          </button>
        </form>
      )}
    </Tarjeta>
  );
};

export const NoMembershipScreen: React.FC<{ email: string | null }> = ({ email }) => (
  <Tarjeta titulo="Cuenta sin corredora">
    <p className="text-sm text-slate-700">
      Tu cuenta{email ? ` (${email})` : ''} aún no está asociada a una corredora. Pide al administrador que te invite.
    </p>
  </Tarjeta>
);
