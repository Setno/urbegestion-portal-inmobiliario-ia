import React, { useState } from 'react';
import { 
  Phone, 
  LayoutDashboard, 
  Menu, 
  X,
  Sparkles,
  Search,
  UserCheck,
  Instagram
} from 'lucide-react';
import { agencyConfig } from '../../config/agencyConfig';
import { usePropertyStore } from '../../stores/usePropertyStore';
import { useLeadStore } from '../../stores/useLeadStore';
import { useChatStore } from '../../stores/useChatStore';

interface NavbarProps {
  onOpenAdmin: () => void;
  onOpenValuation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAdmin, onOpenValuation }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currency, setCurrency } = usePropertyStore();
  const { leads } = useLeadStore();
  const { toggleChat } = useChatStore();

  const newLeadsCount = leads.filter(l => l.status === 'nuevo' || l.status === 'visita_agendada').length;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-nav border-b border-slate-200/90 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand / Logo - Only the original UrbeGestion Image */}
          <a href="#inicio" className="flex items-center shrink-0">
            <img
              src={agencyConfig.logoUrl}
              alt={agencyConfig.brandName}
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold">
            <a href="#propiedades" className="text-slate-700 hover:text-urbe-primary transition-colors flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-urbe-accent" />
              Propiedades
            </a>
            <button 
              onClick={onOpenValuation}
              className="text-slate-700 hover:text-urbe-primary transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-urbe-accent" />
              Vende con Nosotros
            </button>
            <a href="#sobre-mi" className="text-slate-700 hover:text-urbe-primary transition-colors">
              Pilar Osorio
            </a>
            <a href="#testimonios" className="text-slate-700 hover:text-urbe-primary transition-colors">
              Testimonios
            </a>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Currency Toggle (UF / CLP) */}
            <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-lg border border-slate-200 text-[11px] font-bold">
              <button
                onClick={() => setCurrency('UF')}
                className={`px-2 py-1 rounded-md transition-all ${
                  currency === 'UF' 
                    ? 'bg-white text-urbe-primary shadow-sm font-black' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                UF
              </button>
              <button
                onClick={() => setCurrency('CLP')}
                className={`px-2 py-1 rounded-md transition-all ${
                  currency === 'CLP' 
                    ? 'bg-white text-urbe-primary shadow-sm font-black' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                CLP
              </button>
            </div>

            {/* Direct Instagram Link Button */}
            <a
              href={agencyConfig.contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200 transition-colors"
              title="Instagram Oficial @urbegestion"
              aria-label="Instagram Oficial"
            >
              <Instagram className="w-4 h-4" />
            </a>

            {/* Admin CRM Button */}
            <button
              onClick={onOpenAdmin}
              className="relative px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors"
              title="Panel de Auto-Gestión y CRM"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-urbe-primary" />
              <span className="hidden sm:inline">CRM</span>
              {newLeadsCount > 0 && (
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-urbe-accent text-slate-950 text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow">
                  {newLeadsCount}
                </span>
              )}
            </button>

            {/* Phone Quick Call */}
            <a
              href={`tel:${agencyConfig.contact.phone}`}
              className="hidden md:flex p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold items-center gap-1.5 transition-colors"
              title={`Llamar a ${agencyConfig.contact.phoneDisplay}`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{agencyConfig.contact.phoneDisplay}</span>
            </a>

            {/* AI Assistant Trigger Button */}
            <button
              onClick={toggleChat}
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-urbe-primary hover:bg-urbe-primaryDark text-white text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-urbe-accent" />
              <span className="hidden sm:inline">Asistente IA</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-top-3 duration-200">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <span className="font-semibold text-slate-500">Moneda del portal:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setCurrency('UF')}
                className={`px-3 py-1 rounded-md ${currency === 'UF' ? 'bg-white font-black text-urbe-primary shadow-sm' : 'text-slate-600'}`}
              >
                UF
              </button>
              <button
                onClick={() => setCurrency('CLP')}
                className={`px-3 py-1 rounded-md ${currency === 'CLP' ? 'bg-white font-black text-urbe-primary shadow-sm' : 'text-slate-600'}`}
              >
                CLP
              </button>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3 text-sm font-semibold">
            <a 
              href="#propiedades" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-slate-800 hover:text-urbe-primary flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-urbe-accent" />
              Catálogo de Propiedades
            </a>
            <button 
              onClick={() => { onOpenValuation(); setMobileMenuOpen(false); }}
              className="py-1.5 text-left text-slate-800 hover:text-urbe-primary flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-urbe-accent" />
              Vende o Arrienda tu Inmueble
            </button>
            <a 
              href="#sobre-mi" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-slate-800 hover:text-urbe-primary"
            >
              Sobre Pilar Osorio (25+ años)
            </a>
            <a 
              href="#testimonios" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-slate-800 hover:text-urbe-primary"
            >
              Testimonios de Clientes
            </a>
            <a 
              href={agencyConfig.contact.instagram}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-pink-600 font-bold flex items-center gap-2"
            >
              <Instagram className="w-4 h-4" />
              Instagram Oficial (@urbegestion)
            </a>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <a
              href={`https://wa.me/${agencyConfig.contact.whatsapp}?text=${encodeURIComponent(agencyConfig.contact.whatsappMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow"
            >
              <Phone className="w-4 h-4" />
              WhatsApp Directo ({agencyConfig.contact.phoneDisplay})
            </a>
            <button
              onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200"
            >
              <LayoutDashboard className="w-4 h-4 text-urbe-primary" />
              Panel de Administración y CRM ({leads.length} Leads)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
