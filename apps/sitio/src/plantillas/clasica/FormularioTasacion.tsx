'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { OPERACIONES_TASACION, TIPOS_TASACION, type EnviarTasacion, type ErrorTasacion } from '../../lib/tasacion';
import { AvisoPrivacidad } from './AvisoPrivacidad';

const MENSAJES: Record<ErrorTasacion, string> = {
  operacion: 'Elige si quieres vender o arrendar.',
  tipo: 'Elige el tipo de propiedad.',
  comuna: 'Escribe la comuna donde está la propiedad.',
  superficie: 'Revisa la superficie: debe ser un número de metros cuadrados mayor que cero.',
  dormitorios: 'Revisa los dormitorios: debe ser un número o quedar en blanco.',
  nombre: 'Escribe tu nombre completo.',
  telefono: 'Revisa tu teléfono: debe tener entre 8 y 15 dígitos.',
  correo: 'Revisa tu correo o déjalo en blanco.',
  conexion: 'No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos directamente.',
};

const etiqueta = 'block text-xs font-bold text-slate-700 mb-1';
const campo = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-urbe-primary';

export function FormularioTasacion({ enviarTasacion }: { enviarTasacion: EnviarTasacion }) {
  const [operacion, setOperacion] = useState<'venta' | 'arriendo'>('venta');
  const [tipo, setTipo] = useState('casa');
  const [comuna, setComuna] = useState('');
  const [superficieM2, setSuperficieM2] = useState('');
  const [dormitorios, setDormitorios] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [estado, setEstado] = useState<'editando' | 'enviando' | 'listo'>('editando');
  const [error, setError] = useState<ErrorTasacion | null>(null);
  // Antes de que la página esté lista el envío sería una navegación común y se perdería lo escrito.
  const [lista, setLista] = useState(false);
  useEffect(() => setLista(true), []);
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
      const resultado = await enviarTasacion({ operacion, tipo, comuna, superficieM2, dormitorios, nombre, telefono, correo, sitioWeb });
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="tasacion-operacion" className={etiqueta}>¿Qué quieres hacer?</label>
          <select id="tasacion-operacion" value={operacion} onChange={(e) => setOperacion(e.target.value as 'venta' | 'arriendo')} className={campo}>
            {OPERACIONES_TASACION.map((o) => (
              <option key={o.valor} value={o.valor}>{o.texto}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tasacion-tipo" className={etiqueta}>Tipo de propiedad</label>
          <select id="tasacion-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo}>
            {TIPOS_TASACION.map((t) => (
              <option key={t.valor} value={t.valor}>{t.texto}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tasacion-comuna" className={etiqueta}>Comuna</label>
          <input id="tasacion-comuna" type="text" required maxLength={100} value={comuna} onChange={(e) => setComuna(e.target.value)} className={campo} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="tasacion-superficie" className={etiqueta}>Superficie (m²)</label>
          <input id="tasacion-superficie" type="text" inputMode="decimal" required maxLength={12} value={superficieM2} onChange={(e) => setSuperficieM2(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor="tasacion-dormitorios" className={etiqueta}>Dormitorios</label>
          <input id="tasacion-dormitorios" type="text" inputMode="numeric" maxLength={2} value={dormitorios} onChange={(e) => setDormitorios(e.target.value)} className={campo} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="tasacion-nombre" className={etiqueta}>Nombre completo</label>
          <input id="tasacion-nombre" type="text" required maxLength={120} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor="tasacion-telefono" className={etiqueta}>Teléfono</label>
          <input id="tasacion-telefono" type="tel" required maxLength={30} autoComplete="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={campo} />
        </div>
        <div>
          <label htmlFor="tasacion-correo" className={etiqueta}>Correo (opcional)</label>
          <input id="tasacion-correo" type="email" maxLength={200} autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={campo} />
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
        disabled={estado === 'enviando' || !lista}
        className="w-full py-3 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark disabled:opacity-60 text-white text-sm font-bold shadow transition-colors"
      >
        {estado === 'enviando' ? 'Enviando…' : 'Solicitar tasación'}
      </button>
    </form>
  );
}
