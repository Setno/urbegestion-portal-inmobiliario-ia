import React, { useState } from 'react';
import { Sparkles, TrendingUp, ShieldAlert, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface AgencyPitchBannerProps {
  onOpenAdmin: () => void;
}

export const AgencyPitchBanner: React.FC<AgencyPitchBannerProps> = ({ onOpenAdmin }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <aside aria-label="Modo Demostración" className="bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-950 text-white border-b border-urbe-accent/30 text-xs py-2 px-4 relative z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-urbe-accent animate-ping" />
          <span className="font-bold text-urbe-accent uppercase tracking-wider text-[10px] bg-urbe-accent/20 px-2 py-0.5 rounded-full border border-urbe-accent/40">
            Modo Demostración Agencia IA
          </span>
          <p className="text-slate-300 hidden sm:inline">
            Plataforma con Catálogo Propio + Asistente IA 24/7 + CRM para Corredoras de Propiedades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-bold text-urbe-accent hover:underline flex items-center gap-1"
          >
            <span>{isExpanded ? 'Ocultar Auditoría' : 'Ver Propuesta de Valor para el Corredor'}</span>
            <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>

          <button
            onClick={onOpenAdmin}
            className="px-3 py-1 bg-urbe-accent text-slate-950 font-bold rounded-lg text-[11px] hover:bg-urbe-accentHover transition-colors shadow"
          >
            Abrir CRM Auto-Gestionable
          </button>

          <button
            onClick={() => setIsVisible(false)}
            className="text-slate-400 hover:text-white"
            title="Cerrar barra"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Expanded Pitch Explanation */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in fade-in duration-200">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <h5 className="font-bold text-rose-400 flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              1. Fuga Cero de Tráfico
            </h5>
            <p className="text-slate-300 text-[11px]">
              El sitio actual enviaba a los clientes a <em>Portal Inmobiliario</em>. Con este portal, el cliente navega tu catálogo exclusivo sin ver a la competencia.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <h5 className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              2. Asistente IA 24/7 y Agendamiento
            </h5>
            <p className="text-slate-300 text-[11px]">
              Responde dudas en UF, califica financiamiento BANT y coordina visitas presenciales en el acto, aumentando un 400% la tasa de contacto efectivo.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <h5 className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              3. CRM Auto-Gestionable en Vivo
            </h5>
            <p className="text-slate-300 text-[11px]">
              El dueño de la corredora puede publicar propiedades, gestionar prospectos en Kanban y modificar el valor de la UF sin depender de un programador.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
