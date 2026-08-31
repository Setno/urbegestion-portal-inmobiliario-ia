import React from 'react';
import { 
  Award, 
  ShieldCheck, 
  Clock, 
  Users, 
  FileCheck, 
  Phone,
  Instagram,
  Mail,
  MapPin
} from 'lucide-react';
import { useBrandStore } from '../../stores/useBrandStore';

export const AboutSection: React.FC = () => {
  const { config: agencyConfig } = useBrandStore();
  return (
    <section id="sobre-mi" className="py-16 sm:py-24 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Photo & Credential Cards (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative max-w-sm mx-auto lg:max-w-none">
              {/* Profile Image with subtle gold border */}
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100 relative bg-slate-100">
                <img
                  src={agencyConfig.brokerPhotoUrl}
                  alt={agencyConfig.brokerName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
                
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="text-2xl font-black block">{agencyConfig.brokerName}</span>
                  <span className="text-xs text-urbe-accent font-bold uppercase tracking-wider block">
                    {agencyConfig.brokerRole}
                  </span>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Ex-Presidente & Director de Estudios ACOP
                  </p>
                </div>
              </div>

              {/* Floating Experience Badge */}
              <div className="absolute -bottom-4 -right-2 sm:-bottom-5 sm:-right-5 bg-urbe-primary text-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-white/20 text-center min-w-[110px]">
                <span className="text-2xl sm:text-3xl font-black block text-urbe-accent">25+</span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-200">Años de Trayectoria</span>
              </div>
            </div>

            {/* Direct Contact Card under Photo */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <a href={`tel:${agencyConfig.contact.phone}`} className="font-bold hover:underline">
                  {agencyConfig.contact.phoneDisplay}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-urbe-primary shrink-0" />
                <a href={`mailto:${agencyConfig.contact.email}`} className="font-medium hover:underline truncate">
                  {agencyConfig.contact.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-pink-700">
                <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                <a href={agencyConfig.contact.instagram} target="_blank" rel="noreferrer" className="font-bold hover:underline">
                  @urbegestion en Instagram
                </a>
              </div>
            </div>
          </div>

          {/* Biography & Pillar Points (Right 7 Cols) */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-urbe-primary/10 text-urbe-primary text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-urbe-accent" />
              Liderazgo & Confianza Inmobiliaria
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Asesoría personalizada, estudio de títulos y excelencia en post-venta.
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              En <strong>UrbeGestión</strong> nos especializamos en ofrecer soluciones integrales en el mercado inmobiliario de Santiago. Con más de dos décadas y media de trayectoria profesional, hemos gestionado con éxito operaciones de compra, venta, arriendo, administración y tasación profesional tanto en propiedades residenciales de alta gama como en parcelas agrícolas y campos de producción.
            </p>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Nuestro compromiso va más allá de mostrar un inmueble: acompañamos a nuestros clientes en todo el proceso legal, estudio de títulos con abogados especialistas, trámites notariales e inscripción en el Conservador de Bienes Raíces, garantizando operaciones transparentes y seguras.
            </p>

            {/* Core Values / Competencies Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-urbe-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Estudio de Títulos Riguroso</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Revisión jurídica exhaustiva para compraventas sin riesgos.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-urbe-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Especialidad Agrícola & Urbana</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dominio técnico de derechos de agua, subdivisiones y loteos.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <Users className="w-5 h-5 text-urbe-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Atención Personalizada 1 a 1</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Trato directo con Pilar Osorio, sin intermediarios rotativos.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <Clock className="w-5 h-5 text-urbe-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Cierre Rápido y Eficaz</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Promedio de colocación en 42 días con cartera selecta.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
