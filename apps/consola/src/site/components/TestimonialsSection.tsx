import React from 'react';
import { Star } from 'lucide-react';
import { useBrandStore } from '../../core/brand/useBrandStore';

export const TestimonialsSection: React.FC = () => {
  const { testimonials } = useBrandStore((state) => state.content);

  return (
    <section id="testimonios" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          {testimonials.eyebrow && (
          <span className="px-3 py-1 rounded-full bg-urbe-accent/20 text-slate-900 text-xs font-bold uppercase tracking-wider inline-block mb-2">
            {testimonials.eyebrow}
          </span>
          )}
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {testimonials.title || 'Testimonios'}
          </h2>
          {testimonials.subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            {testimonials.subtitle}
          </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.items.map((t, idx) => (
            <div
              key={idx}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4 sm:mb-6 text-amber-400">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed mb-6">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                {t.photo ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-urbe-accent shrink-0 bg-slate-100 shadow-sm">
                    <img
                      src={t.photo}
                      alt={t.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-urbe-primary/10 text-urbe-primary font-black text-xs sm:text-sm flex items-center justify-center border border-urbe-primary/20 shrink-0">
                    {t.initials}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{t.name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight">{t.role}</p>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
