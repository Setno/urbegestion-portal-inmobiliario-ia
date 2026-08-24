import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Search, 
  ArrowRight,
  Award,
  ChevronDown,
  Phone,
  Instagram
} from 'lucide-react';
import { agencyConfig } from '../../config/agencyConfig';
import { useChatStore } from '../../stores/useChatStore';

interface HeroSectionProps {
  onOpenValuation: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenValuation }) => {
  const { toggleChat } = useChatStore();

  return (
    <section id="inicio" className="relative min-h-[85vh] lg:min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20">
      
      {/* Background Video / Ambient Media with Contrast Gradients */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="w-full h-full object-cover scale-105 filter brightness-70"
          poster="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1920"
        >
          <source 
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_144509_89e2d612-8af2-45c3-90f4-4831bc60715d.mp4" 
            type="video/mp4" 
          />
        </video>
        {/* Layered Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/75 to-slate-950/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
      </div>

      {/* Content Container (Mobile First) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Main Copy (Left Column) */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-7">
            
            {/* Top Pill Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold tracking-wide text-slate-200"
            >
              <Award className="w-4 h-4 text-urbe-accent" />
              <span>Más de 25 años en Santiago & Región Metropolitana</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-white"
            >
              Propiedades exclusivas y agrícolas con <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-urbe-accent">asesoría experta e IA.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-sm sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed"
            >
              {agencyConfig.tagline}. Venta, arriendo, administración y tasación profesional con atención directa de <strong>{agencyConfig.brokerName}</strong>.
            </motion.p>

            {/* Mobile & Desktop Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3 pt-2"
            >
              <a
                href="#propiedades"
                className="w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-xl bg-urbe-accent hover:bg-urbe-accentHover text-slate-950 font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Ver Propiedades en Venta / Arriendo</span>
              </a>

              <button
                onClick={toggleChat}
                className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 hover:border-white/40 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-urbe-accent animate-pulse" />
                <span>Consultar con Asistente IA</span>
              </button>

              <button
                onClick={onOpenValuation}
                className="w-full sm:w-auto px-4 py-3 sm:py-4 text-slate-300 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:underline"
              >
                <span>Vende tu Propiedad</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Quick Contact Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
              <a 
                href={`tel:${agencyConfig.contact.phone}`} 
                className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{agencyConfig.contact.phoneDisplay}</span>
              </a>
              <a 
                href={agencyConfig.contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-pink-300"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>@urbegestion</span>
              </a>
            </div>

          </div>

          {/* Right Highlights Card (Tablet & Desktop) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5"
          >
            <div className="glass-card p-5 sm:p-7 rounded-3xl border border-white/20 shadow-2xl text-slate-900 space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-urbe-accent shadow-md shrink-0 bg-slate-100">
                    <img 
                      src={agencyConfig.brokerPhotoUrl} 
                      alt={agencyConfig.brokerName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{agencyConfig.brokerName}</h3>
                    <p className="text-xs text-urbe-primary font-bold">{agencyConfig.brokerRole}</p>
                    <p className="text-[11px] text-slate-500">Ex-Colaboradora ACOP</p>
                  </div>
                </div>
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                  Verificada
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 block">{agencyConfig.stats.yearsExperience}</span>
                  <span className="text-[11px] text-slate-500 font-medium">Años de Trayectoria</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 block">{agencyConfig.stats.propertiesSold}</span>
                  <span className="text-[11px] text-slate-500 font-medium">Propiedades Gestionadas</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xl sm:text-2xl font-black text-urbe-primary block">{agencyConfig.stats.happyClients}</span>
                  <span className="text-[11px] text-slate-500 font-medium">Clientes Satisfechos</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xl sm:text-2xl font-black text-urbe-accent block">{agencyConfig.stats.averageDaysToSell}</span>
                  <span className="text-[11px] text-slate-500 font-medium">Promedio de Cierre</span>
                </div>
              </div>

              {/* Direct Booking Hook */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-urbe-primary/10 to-cyan-900/10 border border-urbe-primary/15 flex items-center justify-between">
                <div className="text-xs text-slate-700">
                  <p className="font-bold">¿Buscas arriendo o compra?</p>
                  <p className="text-slate-500 text-[11px]">Agendamos visitas privadas 1 a 1</p>
                </div>
                <button
                  onClick={toggleChat}
                  className="px-3.5 py-1.5 rounded-xl bg-urbe-primary text-white text-xs font-bold hover:bg-urbe-primaryDark transition-colors shadow-sm"
                >
                  Agendar
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      </div>

      {/* Subtle Scroll Down */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-white/50 animate-bounce hidden sm:block">
        <a href="#buscador" aria-label="Ir al buscador">
          <ChevronDown className="w-5 h-5" />
        </a>
      </div>

    </section>
  );
};
