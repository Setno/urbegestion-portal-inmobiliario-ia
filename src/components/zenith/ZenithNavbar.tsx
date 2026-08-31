import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Home, Menu, X, Phone, MessageSquare } from 'lucide-react';
import { agencyConfig } from '../../config/agencyConfig';

interface ZenithNavbarProps {
  onPostProperty?: () => void;
  onBookCall?: () => void;
}

export const ZenithNavbar: React.FC<ZenithNavbarProps> = ({ onPostProperty, onBookCall }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="relative z-50 w-full px-6 py-6 md:px-12">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo: Stacked text URBE over GESTIÓN with luxury styling */}
        <a href="#hero" className="flex flex-col select-none group">
          <span className="text-xl font-black leading-[0.85] tracking-tighter text-[#141414]">URBE</span>
          <span className="text-xl font-black leading-[0.85] tracking-tighter text-[#141414]">GESTIÓN</span>
        </a>

        {/* Links (Desktop) */}
        <div className="hidden lg:flex items-center space-x-8">
          <a 
            href="#properties" 
            className="text-[13px] font-medium tracking-tight text-[#141414] hover:opacity-60 transition-opacity flex items-center gap-1"
          >
            Propiedades
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </a>

          <a 
            href="#how-it-works" 
            className="text-[13px] font-medium tracking-tight text-[#141414] hover:opacity-60 transition-opacity flex items-center gap-1.5"
          >
            Tasación & Crédito
            <span className="bg-black text-white text-[9px] px-1.5 py-0.5 rounded-[2px] leading-none uppercase font-semibold">
              Nuevo
            </span>
          </a>

          <a 
            href="#how-it-works" 
            className="text-[13px] font-medium tracking-tight text-[#141414] hover:opacity-60 transition-opacity"
          >
            Sobre Pilar Osorio
          </a>

          <a 
            href="#analytics" 
            className="text-[13px] font-medium tracking-tight text-[#141414] hover:opacity-60 transition-opacity flex items-center gap-1"
          >
            Plusvalía RM
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </a>

          <a 
            href={`https://wa.me/${agencyConfig.contact.whatsapp}?text=${encodeURIComponent(agencyConfig.contact.whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium tracking-tight text-[#141414] hover:opacity-60 transition-opacity flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#141414]" />
            WhatsApp Directo
          </a>
        </div>

        {/* Action Button & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onPostProperty}
            className="hidden sm:flex items-center gap-2 border border-black/10 bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-none text-[13px] font-medium text-[#141414] hover:bg-white transition-all cursor-pointer shadow-sm"
          >
            <Home className="w-3.5 h-3.5 text-[#141414]" />
            <span>Publicar Propiedad</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir Menú Móvil"
            className="lg:hidden p-2 text-[#141414] hover:opacity-70 transition-opacity cursor-pointer border border-black/10 bg-white/70 backdrop-blur-md"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Slide-In Menu with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 lg:hidden"
            />

            {/* Slide-in panel from the right */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-50 lg:hidden flex flex-col justify-between p-8"
            >
              <div>
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between pb-8 border-b border-black/10">
                  <div className="flex flex-col">
                    <span className="text-lg font-black leading-[0.85] tracking-tighter text-[#141414]">URBE</span>
                    <span className="text-lg font-black leading-[0.85] tracking-tighter text-[#141414]">GESTIÓN</span>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Cerrar menú"
                    className="p-2 text-[#141414] hover:opacity-60 cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Mobile Nav Links */}
                <div className="flex flex-col space-y-6 pt-8">
                  <a 
                    href="#properties" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[16px] font-medium tracking-tight text-[#141414] hover:opacity-60 transition-opacity flex items-center justify-between"
                  >
                    Propiedades Exclusivas
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </a>

                  <a 
                    href="#how-it-works" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[16px] font-medium tracking-tight text-[#141414] hover:opacity-60 transition-opacity flex items-center gap-2"
                  >
                    Tasación & Crédito
                    <span className="bg-black text-white text-[9px] px-1.5 py-0.5 rounded-[2px] leading-none uppercase font-semibold">
                      Nuevo
                    </span>
                  </a>

                  <a 
                    href="#how-it-works" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[16px] font-medium tracking-tight text-[#141414] hover:opacity-60 transition-opacity"
                  >
                    Sobre Pilar Osorio (25+ años)
                  </a>

                  <a 
                    href="#analytics" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[16px] font-medium tracking-tight text-[#141414] hover:opacity-60 transition-opacity flex items-center justify-between"
                  >
                    Plusvalía & Rentabilidad RM
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </a>

                  <a 
                    href={`https://wa.me/${agencyConfig.contact.whatsapp}?text=${encodeURIComponent(agencyConfig.contact.whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[16px] font-medium tracking-tight text-[#141414] hover:opacity-60 transition-opacity flex items-center gap-2 text-emerald-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp Directo
                  </a>
                </div>
              </div>

              {/* Action buttons at the bottom */}
              <div className="pt-6 border-t border-black/10 space-y-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onBookCall?.();
                  }}
                  className="w-full bg-white border border-black/15 text-[#141414] py-3 px-6 rounded-none text-[13px] font-medium tracking-wide uppercase flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Agendar Asesoría</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onPostProperty?.();
                  }}
                  className="w-full bg-[#141414] text-white py-3.5 px-6 rounded-none text-[13px] font-medium tracking-wide uppercase flex items-center justify-center gap-2 hover:bg-black/90 transition-colors shadow-lg cursor-pointer"
                >
                  <Home className="w-4 h-4 text-white" />
                  <span>Publicar Propiedad</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
