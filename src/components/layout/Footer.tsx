import React from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Instagram, 
  ArrowUp 
} from 'lucide-react';
import { agencyConfig } from '../../config/agencyConfig';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-white pt-16 pb-24 lg:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Col 1: Brand & Logo (Only original logo image) */}
          <div className="space-y-4">
            <a href="#inicio" className="block">
              <img
                src={agencyConfig.logoWhiteUrl}
                alt={agencyConfig.brandName}
                className="h-10 sm:h-12 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </a>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              {agencyConfig.tagline}. Especialistas en corretaje de alta gama, tasaciones y parcelas agrícolas con derechos de agua en Santiago.
            </p>

            <div className="pt-2">
              <a
                href={agencyConfig.contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30 text-pink-300 text-xs font-bold hover:bg-pink-600/30 transition-colors"
              >
                <Instagram className="w-4 h-4 text-pink-400" />
                <span>Síguenos en @urbegestion</span>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              Navegación
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#inicio" className="hover:text-urbe-accent transition-colors">Inicio</a></li>
              <li><a href="#propiedades" className="hover:text-urbe-accent transition-colors">Catálogo de Propiedades</a></li>
              <li><a href="#sobre-mi" className="hover:text-urbe-accent transition-colors">Trayectoria de Pilar Osorio</a></li>
              <li><a href="#testimonios" className="hover:text-urbe-accent transition-colors">Testimonios de Clientes</a></li>
            </ul>
          </div>

          {/* Col 3: Coverage Areas */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              Zonas de Cobertura
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>Vitacura & Lo Barnechea</li>
              <li>Las Condes & Barrio El Golf</li>
              <li>Providencia & La Reina</li>
              <li>Chicureo / Chamisero</li>
              <li>Melipilla & Pirque (Agrícola)</li>
            </ul>
          </div>

          {/* Col 4: Official Contact Info */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              Contacto Directo
            </h4>
            <ul className="space-y-2.5 text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-urbe-accent shrink-0 mt-0.5" />
                <span>{agencyConfig.contact.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${agencyConfig.contact.phone}`} className="hover:text-white font-bold transition-colors">
                  {agencyConfig.contact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-urbe-accent shrink-0" />
                <a href={`mailto:${agencyConfig.contact.email}`} className="hover:text-white transition-colors truncate">
                  {agencyConfig.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-urbe-accent shrink-0 mt-0.5" />
                <span>{agencyConfig.contact.schedule}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {agencyConfig.brandName}. Todos los derechos reservados. Corretaje de Propiedades en Santiago de Chile.</p>
          
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <span>Volver arriba</span>
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

      </div>
    </footer>
  );
};
