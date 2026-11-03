import { ArrowUp, Clock, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { instagramHandle, type SiteBrand, type SiteContent } from '@portal/sitio-datos';
import { enlaceCorreo, enlaceTelefono } from './enlaces';

interface PieProps {
  brand: SiteBrand;
  footer: SiteContent['footer'];
  mostrarSobreNosotros: boolean;
  mostrarTestimonios: boolean;
}

const tituloColumna = 'text-sm font-bold text-white uppercase tracking-wider mb-2';

export function Pie({ brand, footer, mostrarSobreNosotros, mostrarTestimonios }: PieProps) {
  const { contact } = brand;
  const handle = instagramHandle(contact.instagram);
  const descripcion = [brand.tagline && `${brand.tagline}.`, footer.description].filter(Boolean).join(' ');
  const conContacto = Boolean(contact.address || enlaceTelefono(contact.phone) || enlaceCorreo(contact.email) || contact.schedule);

  return (
    <footer className="bg-slate-950 text-white pt-16 pb-24 lg:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-12 border-b border-slate-800/80">
          <div className="space-y-4">
            <a href="/#inicio" className="block">
              {brand.logoWhiteUrl ? (
                <img src={brand.logoWhiteUrl} alt={brand.brandName} loading="lazy" className="h-10 sm:h-12 w-auto object-contain" />
              ) : (
                <span className="text-lg font-black text-white">{brand.brandName}</span>
              )}
            </a>
            {descripcion && <p className="text-xs text-slate-400 leading-relaxed">{descripcion}</p>}
            {contact.instagram && (
              <div className="pt-2">
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30 text-pink-300 text-xs font-bold hover:bg-pink-600/30 transition-colors"
                >
                  <Instagram className="w-4 h-4 text-pink-400" />
                  <span>{handle ? `Síguenos en ${handle}` : 'Síguenos en Instagram'}</span>
                </a>
              </div>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <h2 className={tituloColumna}>Navegación</h2>
            <ul className="space-y-2 text-slate-400">
              <li><a href="/#inicio" className="hover:text-urbe-accent transition-colors">Inicio</a></li>
              <li><a href="/#propiedades" className="hover:text-urbe-accent transition-colors">Catálogo de Propiedades</a></li>
              {mostrarSobreNosotros && <li><a href="/#sobre-nosotros" className="hover:text-urbe-accent transition-colors">Sobre {brand.brokerName}</a></li>}
              {mostrarTestimonios && <li><a href="/#testimonios" className="hover:text-urbe-accent transition-colors">Testimonios de Clientes</a></li>}
            </ul>
          </div>

          {footer.coverageAreas.length > 0 && (
            <div className="space-y-3 text-xs">
              <h2 className={tituloColumna}>Zonas de Cobertura</h2>
              <ul className="space-y-2 text-slate-400">
                {footer.coverageAreas.map((zona) => (
                  <li key={zona}>{zona}</li>
                ))}
              </ul>
            </div>
          )}

          {conContacto && (
            <div className="space-y-3 text-xs">
              <h2 className={tituloColumna}>Contacto Directo</h2>
              <ul className="space-y-2.5 text-slate-400">
                {contact.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-urbe-accent shrink-0 mt-0.5" />
                    <span>{contact.address}</span>
                  </li>
                )}
                {enlaceTelefono(contact.phone) && (
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <a href={enlaceTelefono(contact.phone)} className="hover:text-white font-bold transition-colors">{contact.phoneDisplay || contact.phone}</a>
                  </li>
                )}
                {enlaceCorreo(contact.email) && (
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-urbe-accent shrink-0" />
                    <a href={enlaceCorreo(contact.email)} className="hover:text-white transition-colors truncate">{contact.email}</a>
                  </li>
                )}
                {contact.schedule && (
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-urbe-accent shrink-0 mt-0.5" />
                    <span>{contact.schedule}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {brand.brandName}. Todos los derechos reservados.{footer.legalLine && ` ${footer.legalLine}`}</p>
          <a href="/#inicio" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
            <span>Volver arriba</span>
            <ArrowUp className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
