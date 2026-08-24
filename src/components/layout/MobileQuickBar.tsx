import React from 'react';
import { Search, Phone, MessageCircle, Sparkles } from 'lucide-react';
import { agencyConfig } from '../../config/agencyConfig';
import { useChatStore } from '../../stores/useChatStore';

export const MobileQuickBar: React.FC = () => {
  const { toggleChat } = useChatStore();

  const whatsappUrl = `https://wa.me/${agencyConfig.contact.whatsapp}?text=${encodeURIComponent(
    agencyConfig.contact.whatsappMessage
  )}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 py-2 px-3 lg:hidden shadow-2xl safe-area-bottom">
      <div className="grid grid-cols-4 gap-1 max-w-md mx-auto text-center">
        
        {/* Search */}
        <a
          href="#buscador"
          className="flex flex-col items-center justify-center py-1 text-slate-700 hover:text-urbe-primary active:scale-95 transition-all"
        >
          <Search className="w-4 h-4 text-urbe-accent mb-0.5" />
          <span className="text-[10px] font-bold">Buscar</span>
        </a>

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center py-1 text-emerald-700 hover:text-emerald-800 active:scale-95 transition-all"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mb-0.5">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-[10px] font-bold">WhatsApp</span>
        </a>

        {/* Call */}
        <a
          href={`tel:${agencyConfig.contact.phone}`}
          className="flex flex-col items-center justify-center py-1 text-slate-700 hover:text-urbe-primary active:scale-95 transition-all"
        >
          <Phone className="w-4 h-4 text-urbe-primary mb-0.5" />
          <span className="text-[10px] font-bold">Llamar</span>
        </a>

        {/* AI Concierge */}
        <button
          onClick={toggleChat}
          className="flex flex-col items-center justify-center py-1 text-urbe-primary hover:text-cyan-900 active:scale-95 transition-all"
        >
          <div className="w-5 h-5 rounded-full bg-urbe-primary/10 flex items-center justify-center mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-urbe-accent animate-pulse" />
          </div>
          <span className="text-[10px] font-bold">Chat IA</span>
        </button>

      </div>
    </div>
  );
};
