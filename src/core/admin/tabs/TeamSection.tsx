import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '../../auth/useAuthStore';
import { inviteAgent, type InviteError } from '../../auth/authService';
import { canInviteAgents } from '../../auth/permissions';

const ERROR_TEXT: Record<InviteError, string> = {
  correo_invalido: 'El correo no es válido. Revísalo e inténtalo de nuevo.',
  ya_miembro: 'Esa persona ya es parte de tu corredora o ya tiene una invitación enviada.',
  otra_corredora: 'Ese correo ya pertenece a otra corredora.',
  sin_permiso: 'No tienes permiso para invitar agentes. Vuelve a iniciar sesión.',
  no_configurado: 'La invitación aún no está configurada en el servidor.',
  conexion: 'No se pudo enviar la invitación. Inténtalo de nuevo en unos minutos.',
};

export const TeamSection: React.FC = () => {
  const role = useAuthStore((s) => s.membership?.role ?? null);
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
      setMessage({ ok: false, text: ERROR_TEXT[result.error] });
    } else {
      setMessage({
        ok: true,
        text:
          result.status === 'invitado'
            ? `Invitación enviada a ${email.trim()}. Recibirá un correo con un enlace para fijar su clave.`
            : `${email.trim()} ya tenía cuenta y ahora es agente de tu corredora.`,
      });
      setEmail('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
        <UserPlus className="w-4 h-4 text-urbe-primary" /> Equipo: invitar a un agente
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        El agente recibe un correo con un enlace, fija su clave y entra a tu corredora con rol agente.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.cl"
          aria-label="Correo del agente"
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-urbe-primary"
        />
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="px-5 py-2.5 bg-urbe-primary text-white rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {busy ? 'Enviando…' : 'Invitar'}
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
