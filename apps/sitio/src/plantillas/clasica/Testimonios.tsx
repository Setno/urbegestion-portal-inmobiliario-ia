import { Star } from 'lucide-react';
import type { SiteContent } from '@portal/sitio-datos';

export function Testimonios({ testimonials }: { testimonials: SiteContent['testimonials'] }) {
  return (
    <section id="testimonios" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200 scroll-mt-16 sm:scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          {testimonials.eyebrow && (
            <span className="px-3 py-1 rounded-full fondo-acento-suave text-slate-900 text-xs font-bold uppercase tracking-wider inline-block mb-2">{testimonials.eyebrow}</span>
          )}
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{testimonials.title || 'Testimonios'}</h2>
          {testimonials.subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-2">{testimonials.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.items.map((t, i) => (
            <figure key={i} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 mb-4 sm:mb-6 text-amber-400" role="img" aria-label={`${t.stars} de 5 estrellas`}>
                  {Array.from({ length: t.stars }, (_, n) => (
                    <Star key={n} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <blockquote className="text-xs sm:text-sm text-slate-700 italic leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</blockquote>
              </div>
              <figcaption className="flex items-center gap-3 pt-4 border-t border-slate-100">
                {t.photo ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-urbe-accent shrink-0 bg-slate-100 shadow-sm">
                    <img src={t.photo} alt={t.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full fondo-primario-suave text-urbe-primary font-black text-xs sm:text-sm flex items-center justify-center shrink-0">
                    {t.initials}
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{t.name}</p>
                  {t.role && <p className="text-[11px] text-slate-500 font-medium leading-tight">{t.role}</p>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
