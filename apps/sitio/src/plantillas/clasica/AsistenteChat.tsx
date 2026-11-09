'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Bot, Send, Sparkles, X } from 'lucide-react';
import { formatMoney } from '@portal/dinero';
import { getMarketPack, normalizePhone } from '@portal/mercados';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';
import { bienvenida, responder, sugerencias, type ContextoAsistente } from '../../lib/asistente';
import type { EnviarContactoChat, ErrorChat } from '../../lib/chat';
import { HORARIOS } from '../../lib/visita';
import { AvisoPrivacidad } from './AvisoPrivacidad';

const MENSAJES: Record<ErrorChat, string> = {
  nombre: 'Escribe tu nombre completo.',
  telefono: `Revisa tu teléfono. Ejemplo: ${getMarketPack().phoneExample}.`,
  fecha: 'Elige una fecha de hoy en adelante o déjala en blanco.',
  hora: 'Elige uno de los horarios de la lista.',
  conexion: 'No pudimos enviar tus datos. Inténtalo de nuevo o escríbenos directamente.',
};

interface Mensaje {
  id: number;
  de: 'bot' | 'persona';
  texto: string;
  propiedades?: string[];
}

interface AsistenteChatProps {
  propiedades: PublicProperty[];
  contexto: ContextoAsistente;
  enviarContacto: EnviarContactoChat;
}

const campo = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-urbe-primary';

// Asistente flotante: responde con las propiedades que ya llegaron a la página y, cuando la persona lo pide, deja su contacto como lead.
export function AsistenteChat({ propiedades, contexto, enviarContacto }: AsistenteChatProps) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>(() => [{ id: 0, de: 'bot', texto: bienvenida(contexto) }]);
  const [escrito, setEscrito] = useState('');
  const [pedirContacto, setPedirContacto] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<ErrorChat | null>(null);
  const final = useRef<HTMLDivElement>(null);
  const pack = getMarketPack(contexto.marketId);

  useEffect(() => {
    final.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [mensajes, pedirContacto, abierto]);

  const agregar = (mensaje: Omit<Mensaje, 'id'>) => setMensajes((actuales) => [...actuales, { ...mensaje, id: actuales.length }]);

  const preguntar = (texto: string) => {
    const limpio = texto.trim();
    if (!limpio) return;
    agregar({ de: 'persona', texto: limpio });
    setEscrito('');
    setConsulta(limpio);
    const respuesta = responder(limpio, propiedades, contexto);
    agregar({ de: 'bot', texto: respuesta.texto, propiedades: respuesta.propiedades });
    if (respuesta.pedirContacto) setPedirContacto(true);
  };

  const dejarContacto = async (e: FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const resultado = await enviarContacto({ nombre, telefono, fecha, hora, consulta, sitioWeb });
      if (resultado.ok === true) {
        setPedirContacto(false);
        agregar({ de: 'bot', texto: `¡Listo, ${nombre.trim()}! ${contexto.corredor || 'La corredora'} te contactará al ${telefono.trim()} para confirmar los detalles.` });
        setEnviando(false);
        return;
      }
      setError(resultado.error);
    } catch {
      setError('conexion');
    }
    setEnviando(false);
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir asistente"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 p-4 rounded-full bg-urbe-primary text-white shadow-2xl hover:scale-105 transition-transform flex items-center gap-2.5 border-2 border-urbe-accent/60"
      >
        <Sparkles className="w-6 h-6 text-urbe-accent" />
        <span className="hidden sm:inline text-xs font-black pr-1">Asistente</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Asistente"
      className="fixed bottom-2 right-2 sm:bottom-6 sm:right-6 z-50 w-[96vw] sm:w-[400px] h-[600px] max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
    >
      <div className="bg-urbe-primary text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <Bot className="w-5 h-5 text-urbe-accent" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Asistente</h2>
            <p className="text-[11px] text-white/70">Respuestas al instante</p>
          </div>
        </div>
        <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar asistente" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50" aria-live="polite">
        {mensajes.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.de === 'persona' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                m.de === 'persona' ? 'bg-urbe-primary text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-line">{m.texto}</p>
              {m.propiedades && m.propiedades.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  {m.propiedades.map((id) => {
                    const p = propiedades.find((x) => x.id === id);
                    if (!p) return null;
                    return (
                      <a key={id} href={`/propiedades/${id}`} className="bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex items-center gap-3 transition-colors">
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold text-xs text-slate-900 truncate">{p.title}</span>
                          <span className="block text-[11px] text-slate-500">{p.commune}</span>
                          <span className="block text-xs font-black text-urbe-primary">{formatMoney({ amount: p.priceAmount, currency: p.priceCurrency }, pack)}</span>
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {pedirContacto && (
          <form onSubmit={dejarContacto} className="bg-white p-4 rounded-2xl border-2 border-urbe-accent/40 shadow-md space-y-3">
            <p className="text-xs font-bold text-slate-800">Déjanos tus datos para coordinar</p>
            <div>
              <label htmlFor="chat-nombre" className="block text-xs font-bold text-slate-700 mb-1">Tu nombre completo</label>
              <input id="chat-nombre" type="text" required maxLength={120} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} />
            </div>
            <div>
              <label htmlFor="chat-telefono" className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
              <input id="chat-telefono" type="tel" inputMode="tel" required maxLength={30} autoComplete="tel" placeholder={getMarketPack().phoneExample} value={telefono} onChange={(e) => setTelefono(e.target.value)} onBlur={() => setTelefono((t) => normalizePhone(t) ?? t)} className={campo} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="chat-fecha" className="block text-xs font-bold text-slate-700 mb-1">Fecha preferida (opcional)</label>
                <input id="chat-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} />
              </div>
              <div>
                <label htmlFor="chat-hora" className="block text-xs font-bold text-slate-700 mb-1">Horario preferido</label>
                <select id="chat-hora" value={hora} onChange={(e) => setHora(e.target.value)} className={campo}>
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

            {error && <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5">{MENSAJES[error]}</p>}

            <AvisoPrivacidad />

            <button type="submit" disabled={enviando} className="w-full py-2.5 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark disabled:opacity-60 text-white text-sm font-bold shadow transition-colors">
              {enviando ? 'Enviando…' : 'Enviar mis datos'}
            </button>
          </form>
        )}
        <div ref={final} />
      </div>

      <div className="p-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto">
        {sugerencias(propiedades, contexto).map((s) => (
          <button key={s} type="button" onClick={() => preguntar(s)} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 whitespace-nowrap transition-colors">
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          preguntar(escrito);
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Pregúntale al asistente sobre propiedades…"
          aria-label="Tu consulta"
          value={escrito}
          maxLength={500}
          onChange={(e) => setEscrito(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-urbe-primary focus:bg-white"
        />
        <button type="submit" disabled={!escrito.trim()} aria-label="Enviar mensaje" className="p-2.5 rounded-2xl bg-urbe-primary hover:bg-urbe-primaryDark disabled:opacity-40 text-white shadow transition-all">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
