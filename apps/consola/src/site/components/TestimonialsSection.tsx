import React from 'react';
import { Star } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: "Agustín Manterola Covarrubias",
      role: "Ex-Presidente ACOP (Asociación de Corredores de Propiedades)",
      photo: "https://www.urbegestion.cl/assets/images/t_agustin.jpeg",
      quote: "Fui jefe de Pilar durante 15 años, doy fe de sus altas capacidades profesionales y de su excelente disposición para resolver problemas. Me ayudó manejando una gran cartera de arriendos y administraciones complejas. Totalmente recomendada.",
      stars: 5,
    },
    {
      name: "Carmen Luz Martín",
      role: "Abogada Especialista en Derecho Inmobiliario",
      initials: "CLM",
      quote: "He sido clienta de Pilar tanto para la compra como para la venta de propiedades. Siempre recibí un servicio excelente, diligente y eficaz. Además, colaboro con Pilar apoyando los estudios de títulos de las operaciones que realiza. Es una profesional de primer nivel.",
      stars: 5,
    },
    {
      name: "Alfredo Hevia Minder",
      role: "Propietario / Vendedor",
      initials: "AH",
      quote: "Increíble experiencia con UrbeGestión. Pilar logró vender mi propiedad en tiempo récord y a un excelente valor de mercado. Su asesoría en la negociación fue clave para cerrar la operación sin contratiempos.",
      stars: 5,
    }
  ];

  return (
    <section id="testimonios" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="px-3 py-1 rounded-full bg-urbe-accent/20 text-slate-900 text-xs font-bold uppercase tracking-wider inline-block mb-2">
            Reputación Comprobada
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Testimonios de Clientes y Colegas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            La confianza, transparencia y rigor jurídico han guiado nuestras operaciones durante 25 años en Santiago.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((t, idx) => (
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
