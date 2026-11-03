import { Award, Clock, FileCheck, Instagram, Mail, Phone, ShieldCheck, Users } from 'lucide-react';
import { instagramHandle, type SiteBrand, type SiteContent } from '@portal/sitio-datos';
import { enlaceCorreo, enlaceTelefono } from './enlaces';

const ICONOS = [ShieldCheck, FileCheck, Users, Clock];

interface SobreNosotrosProps {
  brand: SiteBrand;
  about: SiteContent['about'];
}

export function SobreNosotros({ brand, about }: SobreNosotrosProps) {
  const { contact } = brand;
  const handle = instagramHandle(contact.instagram);
  const conContacto = Boolean(enlaceTelefono(contact.phone) || enlaceCorreo(contact.email) || contact.instagram);
  const conColumna = Boolean(brand.brokerPhotoUrl || conContacto);

  return (
    <section id="sobre-nosotros" className="py-16 sm:py-24 bg-white border-y border-slate-200 scroll-mt-16 sm:scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {conColumna && (
            <div className="lg:col-span-5 space-y-6">
              {brand.brokerPhotoUrl && (
                <div className="relative max-w-sm mx-auto lg:max-w-none">
                  <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100 relative bg-slate-100">
                    <img src={brand.brokerPhotoUrl} alt={brand.brokerName} loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <span className="text-2xl font-black block">{brand.brokerName}</span>
                      {brand.brokerRole && <span className="text-xs text-urbe-accent font-bold uppercase tracking-wider block">{brand.brokerRole}</span>}
                      {about.credential && <p className="text-[11px] text-slate-300 mt-1">{about.credential}</p>}
                    </div>
                  </div>
                </div>
              )}

              {conContacto && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  {enlaceTelefono(contact.phone) && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <a href={enlaceTelefono(contact.phone)} className="font-bold hover:underline">{contact.phoneDisplay || contact.phone}</a>
                    </div>
                  )}
                  {enlaceCorreo(contact.email) && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-4 h-4 text-urbe-primary shrink-0" />
                      <a href={enlaceCorreo(contact.email)} className="font-medium hover:underline truncate">{contact.email}</a>
                    </div>
                  )}
                  {contact.instagram && (
                    <div className="flex items-center gap-2 text-pink-700">
                      <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                      <a href={contact.instagram} target="_blank" rel="noreferrer" className="font-bold hover:underline">
                        {handle ? `${handle} en Instagram` : 'Instagram'}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={`${conColumna ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-5 sm:space-y-6`}>
            {about.eyebrow && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full fondo-primario-suave text-urbe-primary text-xs font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-urbe-accent" />
                {about.eyebrow}
              </div>
            )}
            {about.title && <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{about.title}</h2>}
            {about.paragraphs.map((parrafo, i) => (
              <p key={i} className="text-sm sm:text-base text-slate-600 leading-relaxed">{parrafo}</p>
            ))}
            {about.highlights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {about.highlights.map((punto, i) => {
                  const Icono = ICONOS[i % ICONOS.length];
                  return (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                      <Icono className="w-5 h-5 text-urbe-primary shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{punto.title}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{punto.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
