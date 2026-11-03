import { Instagram, Phone, Search } from 'lucide-react';
import { instagramHandle, type SiteBrand } from '@portal/sitio-datos';
import { enlaceTelefono } from './enlaces';
import { MenuMovil, type EnlaceMenu } from './MenuMovil';

interface CabeceraProps {
  brand: SiteBrand;
  mostrarSobreNosotros: boolean;
  mostrarTestimonios: boolean;
}

export function Cabecera({ brand, mostrarSobreNosotros, mostrarTestimonios }: CabeceraProps) {
  const { contact } = brand;
  const enlaces: EnlaceMenu[] = [
    { href: '#propiedades', texto: 'Propiedades' },
    ...(mostrarSobreNosotros ? [{ href: '#sobre-nosotros', texto: brand.brokerName }] : []),
    ...(mostrarTestimonios ? [{ href: '#testimonios', texto: 'Testimonios' }] : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-nav border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <a href="#inicio" className="flex items-center flex-1 min-w-0 mr-2">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.brandName} className="h-10 sm:h-12 w-auto max-w-full object-contain drop-shadow-sm" />
            ) : (
              <span className="text-sm sm:text-lg font-black text-urbe-primary truncate">{brand.brandName}</span>
            )}
          </a>

          <nav className="hidden lg:flex items-center shrink-0 space-x-6 mr-6 text-xs font-semibold">
            {enlaces.map((enlace, i) => (
              <a key={enlace.href} href={enlace.href} className="text-slate-700 hover:text-urbe-primary transition-colors flex items-center gap-1.5">
                {i === 0 && <Search className="w-3.5 h-3.5 text-urbe-accent" />}
                {enlace.texto}
              </a>
            ))}
          </nav>

          <div className="flex items-center shrink-0 space-x-2 sm:space-x-3">
            {contact.instagram && (
              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200 transition-colors"
                title={`Instagram ${instagramHandle(contact.instagram)}`.trim()}
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {enlaceTelefono(contact.phone) && (
              <a
                href={enlaceTelefono(contact.phone)}
                className="hidden md:flex p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold items-center gap-1.5 transition-colors"
                title={`Llamar a ${contact.phoneDisplay || contact.phone}`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{contact.phoneDisplay || contact.phone}</span>
              </a>
            )}
            <MenuMovil enlaces={enlaces} />
          </div>
        </div>
      </div>
    </header>
  );
}
