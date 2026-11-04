import { ArrowRight, Award, ChevronDown, Instagram, Phone, Search } from 'lucide-react';
import { instagramHandle, type SiteBrand, type SiteContent } from '@portal/sitio-datos';
import { enlaceTelefono } from './enlaces';

interface PortadaProps {
  brand: SiteBrand;
  hero: SiteContent['hero'];
  conTasacion?: boolean;
}

export function Portada({ brand, hero, conTasacion = false }: PortadaProps) {
  const { contact } = brand;
  const handle = instagramHandle(contact.instagram);
  const stats = [
    { value: brand.stats.yearsExperience, label: 'Años de Trayectoria', color: 'text-slate-900' },
    { value: brand.stats.propertiesSold, label: 'Propiedades Gestionadas', color: 'text-slate-900' },
    { value: brand.stats.happyClients, label: 'Clientes Satisfechos', color: 'text-urbe-primary' },
    { value: brand.stats.averageDaysToSell, label: 'Promedio de Cierre', color: 'text-urbe-accent' },
  ].filter((s) => s.value);
  // Sin foto, cargo, credencial ni cifras, la tarjeta solo repetiría el nombre de la corredora.
  const conTarjeta = Boolean(brand.brokerPhotoUrl || brand.brokerRole || hero.credential || stats.length > 0);

  return (
    <section id="inicio" className="relative min-h-[85vh] lg:min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20">
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover scale-105 brightness-75 motion-reduce:hidden"
          poster="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1920"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_144509_89e2d612-8af2-45c3-90f4-4831bc60715d.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/75 to-slate-950/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-5 sm:space-y-7">
            {hero.badge && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold tracking-wide text-slate-200">
                <Award className="w-4 h-4 text-urbe-accent" />
                <span>{hero.badge}</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-white">
              {hero.headline}{' '}
              {hero.headlineHighlight && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-urbe-accent">{hero.headlineHighlight}</span>
              )}
            </h1>

            <p className="text-sm sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
              {brand.tagline && `${brand.tagline}. `}
              {hero.services}
              {brand.brokerName && brand.brokerName !== brand.brandName && (
                <>
                  {' '}
                  Atención directa de <strong>{brand.brokerName}</strong>.
                </>
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="#propiedades"
                className="w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-xl bg-urbe-accent hover:bg-urbe-accentHover text-slate-950 font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-xl transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Ver Propiedades en Venta / Arriendo</span>
              </a>
              {conTasacion && (
                <a
                  href="#vende"
                  className="w-full sm:w-auto px-5 py-3.5 sm:py-4 rounded-xl border border-white/30 hover:bg-white/10 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Vende tu propiedad</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>

            {(enlaceTelefono(contact.phone) || contact.instagram) && (
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
                {enlaceTelefono(contact.phone) && (
                  <a href={enlaceTelefono(contact.phone)} className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{contact.phoneDisplay || contact.phone}</span>
                  </a>
                )}
                {contact.instagram && (
                  <a
                    href={contact.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-pink-300"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>{handle || 'Instagram'}</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {conTarjeta && (
            <div className="lg:col-span-5">
              <div className="glass-card p-5 sm:p-7 rounded-3xl border border-white/20 shadow-2xl text-slate-900 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    {brand.brokerPhotoUrl && (
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-urbe-accent shadow-md shrink-0 bg-slate-100">
                        <img src={brand.brokerPhotoUrl} alt={brand.brokerName} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <h2 className="font-bold text-slate-900 text-sm sm:text-base">{brand.brokerName}</h2>
                      {brand.brokerRole && <p className="text-xs text-urbe-primary font-bold">{brand.brokerRole}</p>}
                      {hero.credential && <p className="text-[11px] text-slate-500">{hero.credential}</p>}
                    </div>
                  </div>
                  {hero.verifiedLabel && (
                    <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                      {hero.verifiedLabel}
                    </span>
                  )}
                </div>

                {stats.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {stats.map((s) => (
                      <div key={s.label} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className={`text-xl sm:text-2xl font-black ${s.color} block`}>{s.value}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-white/50 motion-safe:animate-bounce hidden sm:block">
        <a href="#propiedades" aria-label="Ir a las propiedades">
          <ChevronDown className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
}
