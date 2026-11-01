import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { createTenant, isPlatformOwner, type CreateTenantError } from '../../auth/platformService';

const ERROR_TEXT: Record<CreateTenantError, string> = {
  nombre_invalido: 'El nombre de la corredora debe tener entre 2 y 80 caracteres.',
  correo_invalido: 'El correo del administrador no es válido.',
  nombre_repetido: 'Ya existe una corredora con ese nombre. Usa otro.',
  correo_existente: 'Ese correo ya tiene una cuenta. Usa un correo nuevo para el administrador.',
  sin_permiso: 'No tienes permiso para crear corredoras.',
  conexion: 'No se pudo crear la corredora. Inténtalo de nuevo en unos minutos.',
};

// Solo la ve el dueño del producto (el servidor lo confirma); para el resto no se dibuja nada.
export const PlatformSection: React.FC = () => {
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
      setMessage({ ok: false, text: ERROR_TEXT[result.error] });
    } else {
      setMessage({ ok: true, text: `Corredora "${name.trim()}" creada. Se invitó a ${email.trim()} como administrador.` });
      setName('');
      setEmail('');
    }
  };

  const inputClass =
    'flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-urbe-primary';

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
        <Building2 className="w-4 h-4 text-urbe-primary" /> Plataforma: crear una corredora
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Crea la corredora y envía la invitación a su primer administrador. Solo la ve el dueño del producto.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la corredora"
          aria-label="Nombre de la corredora"
          className={inputClass}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo del administrador"
          aria-label="Correo del administrador"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy || !name.trim() || !email.trim()}
          className="px-5 py-2.5 bg-urbe-primary text-white rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {busy ? 'Creando…' : 'Crear'}
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
