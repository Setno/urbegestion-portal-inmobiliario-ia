import { MessageCircle, Phone, Search } from 'lucide-react';
import type { SiteBrand } from '@portal/sitio-datos';
import { enlaceTelefono, enlaceWhatsapp } from './enlaces';

const COLUMNAS = ['grid-cols-1', 'grid-cols-2', 'grid-cols-3'];

export function BarraMovil({ contact }: { contact: SiteBrand['contact'] }) {
  const whatsapp = enlaceWhatsapp(contact.whatsapp, contact.whatsappMessage);
  const columnas = 1 + Number(Boolean(whatsapp)) + Number(Boolean(enlaceTelefono(contact.phone)));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 py-2 px-3 lg:hidden shadow-2xl">
      <div className={`grid ${COLUMNAS[columnas - 1]} gap-1 max-w-md mx-auto text-center`}>
        <a href="#propiedades" className="flex flex-col items-center justify-center py-1 text-slate-700 hover:text-urbe-primary">
          <Search className="w-4 h-4 text-urbe-accent mb-0.5" />
          <span className="text-[10px] font-bold">Buscar</span>
        </a>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center py-1 text-emerald-700 hover:text-emerald-800"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 mb-0.5" />
            <span className="text-[10px] font-bold">WhatsApp</span>
          </a>
        )}
        {enlaceTelefono(contact.phone) && (
          <a href={enlaceTelefono(contact.phone)} className="flex flex-col items-center justify-center py-1 text-slate-700 hover:text-urbe-primary">
            <Phone className="w-4 h-4 text-urbe-primary mb-0.5" />
            <span className="text-[10px] font-bold">Llamar</span>
          </a>
        )}
      </div>
    </div>
  );
}
