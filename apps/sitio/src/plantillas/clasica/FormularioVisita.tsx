'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { HORARIO_INICIAL, HORARIOS, type EnviarVisita, type ErrorVisita } from '../../lib/visita';
import { AvisoPrivacidad } from './AvisoPrivacidad';

const MENSAJES: Record<ErrorVisita, string> = {
  nombre: 'Escribe tu nombre completo.',
  telefono: 'Revisa tu teléfono: debe tener entre 8 y 15 dígitos.',
  correo: 'Revisa tu correo o déjalo en blanco.',
  fecha: 'Elige una fecha de hoy en adelante o déjala en blanco.',
  hora: 'Elige uno de los horarios de la lista.',
  propiedad: 'Esta propiedad ya no está disponible.',
  conexion: 'No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos directamente.',
};

const etiqueta = 'block text-xs font-bold text-slate-700 mb-1';
const campo = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-urbe-primary';

interface FormularioVisitaProps {
  propiedadId: string;
  enviarVisita: EnviarVisita;
}

export function FormularioVisita({ propiedadId, enviarVisita }: FormularioVisitaProps) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState(HORARIO_INICIAL);
  const [sitioWeb, setSitioWeb] = useState('');
  const [estado, setEstado] = useState<'editando' | 'enviando' | 'listo'>('editando');
  const [error, setError] = useState<ErrorVisita | null>(null);
  // Se calcula en el navegador: es la fecha de quien mira, no la del servidor.
  const [hoy, setHoy] = useState<string | undefined>(undefined);
  useEffect(() => setHoy(new Date().toLocaleDateString('en-CA')), []);
  // El mensaje reemplaza al formulario: el foco del teclado pasa a él para que se anuncie.
  const confirmacion = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (estado === 'listo') confirmacion.current?.focus();
  }, [estado]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (estado === 'enviando') return;
    setEstado('enviando');
    setError(null);
    try {
      const resultado = await enviarVisita(propiedadId, { nombre, telefono, correo, fecha, hora, sitioWeb });
      if (resultado.ok === true) {
        setEstado('listo');
        return;
      }
      setError(resultado.error);
    } catch {
      setError('conexion');
    }
    setEstado('editando');
  };

  if (estado === 'listo') {
    return (
      <div ref={confirmacion} role="status" tabIndex={-1} className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center gap-2.5 border border-emerald-200">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>{`¡Listo! Recibimos tu solicitud. La corredora te contactará al ${telefono}.`}</span>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="visita-nombre" className={etiqueta}>Nombre completo</label>
          <input id="visita-nombre" type="text" required maxLength={120} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor="visita-telefono" className={etiqueta}>Teléfono</label>
          <input id="visita-telefono" type="tel" required maxLength={30} autoComplete="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={campo} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="visita-correo" className={etiqueta}>Correo (opcional)</label>
          <input id="visita-correo" type="email" maxLength={200} autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor="visita-fecha" className={etiqueta}>Fecha preferida (opcional)</label>
          <input id="visita-fecha" type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor="visita-hora" className={etiqueta}>Horario preferido</label>
          <select id="visita-hora" value={hora} onChange={(e) => setHora(e.target.value)} className={campo}>
            <option value="">Sin preferencia</option>
            {HORARIOS.map((h) => (
              <option key={h.valor} value={h.valor}>{h.texto}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Campo trampa: los robots lo llenan y una persona no lo ve. */}
      <div aria-hidden="true" className="hidden">
        <input type="text" name="sitio-web" tabIndex={-1} autoComplete="off" value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} />
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{MENSAJES[error]}</p>
      )}

      <AvisoPrivacidad />

      <button
        type="submit"
        // Antes de que la página esté lista el envío sería una navegación común y se perdería lo escrito.
        disabled={estado === 'enviando' || !hoy}
        className="w-full py-3 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark disabled:opacity-60 text-white text-sm font-bold shadow transition-colors"
      >
        {estado === 'enviando' ? 'Enviando…' : 'Solicitar visita'}
      </button>
    </form>
  );
}
