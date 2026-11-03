import Link from 'next/link';
import { ArrowLeft, Bath, Bed, Box, CalendarClock, Car, CheckCircle2, Compass, MapPin, Maximize2, MessageCircle, Sparkles } from 'lucide-react';
import { formatMoney } from '@portal/dinero';
import { getMarketPack } from '@portal/mercados';
import type { SiteData } from '@portal/sitio-datos';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';
import type { EnviarVisita } from '../../lib/visita';
import { enlaceWhatsapp } from './enlaces';
import { FormularioVisita } from './FormularioVisita';
import { Galeria } from './Galeria';
import { Marco } from './Marco';
import { etiquetaTipo, textoBanos } from './TarjetaPropiedad';

const tituloSeccion = 'text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider';

interface FichaProps {
  site: SiteData;
  propiedad: PublicProperty;
  marketId: string;
  enviarVisita: EnviarVisita;
}

export function FichaClasica({ site, propiedad: p, marketId, enviarVisita }: FichaProps) {
  const { brand } = site;
  const pack = getMarketPack(marketId);
  const lugar = [p.address, p.commune].filter(Boolean).join(', ');
  const ubicacion = p.mapQuery || (lugar && `${lugar}, ${pack.name}`);
  const whatsapp = enlaceWhatsapp(brand.contact.whatsapp, `Hola, vi la propiedad "${p.title}"${p.commune ? ` (${p.commune})` : ''} y quiero más información.`);
  const datos = [
    ...(p.builtAreaM2 > 0 ? [{ Icono: Maximize2, titulo: 'Construidos', valor: `${p.builtAreaM2} m²` }] : []),
    ...(p.totalAreaM2 > 0 ? [{ Icono: Compass, titulo: 'Totales', valor: `${p.totalAreaM2} m²` }] : []),
    ...(p.bedrooms > 0 ? [{ Icono: Bed, titulo: 'Dormitorios', valor: `${p.bedrooms} Dorm.` }] : []),
    ...(p.bathrooms > 0 ? [{ Icono: Bath, titulo: 'Baños', valor: textoBanos(p.bathrooms) }] : []),
    ...(p.parkingSpots > 0 ? [{ Icono: Car, titulo: 'Estacionamientos', valor: `${p.parkingSpots}` }] : []),
    ...(p.storageUnits > 0 ? [{ Icono: Box, titulo: 'Bodegas', valor: `${p.storageUnits}` }] : []),
  ];

  return (
    <Marco site={site}>
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-8">
        <Link href="/#propiedades" className="inline-flex items-center gap-1.5 text-xs font-bold text-urbe-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Volver a las propiedades
        </Link>

        <Galeria imagenes={p.images} titulo={p.title} />

        <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${p.operation === 'venta' ? 'bg-urbe-primary text-white' : 'bg-emerald-600 text-white'}`}>
                {p.operation === 'venta' ? 'En Venta' : 'En Arriendo'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800">{etiquetaTipo(p.propertyType)}</span>
              {p.featured && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-urbe-accent text-slate-950 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Exclusiva
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{p.title}</h1>
            {lugar && (
              <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-2">
                <MapPin className="w-4 h-4 text-urbe-primary shrink-0" />
                {lugar}
              </p>
            )}
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 lg:min-w-[220px] shrink-0">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block leading-none">{formatMoney({ amount: p.priceAmount, currency: p.priceCurrency }, pack)}</span>
            {p.expensesMonthlyClp > 0 && (
              <span className="text-xs text-slate-500 block mt-2">Gastos comunes: {formatMoney({ amount: p.expensesMonthlyClp, currency: 'CLP' }, pack)}</span>
            )}
          </div>
        </header>

        {datos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {datos.map(({ Icono, titulo, valor }) => (
              <div key={titulo} className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                <Icono className="w-4 h-4 text-urbe-primary mx-auto mb-1" />
                <span className="text-[10px] text-slate-500 block uppercase font-bold">{titulo}</span>
                <span className="text-sm font-bold text-slate-800">{valor}</span>
              </div>
            ))}
          </div>
        )}

        {p.description && (
          <section>
            <h2 className={tituloSeccion}>Descripción</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{p.description}</p>
          </section>
        )}

        {p.features.length > 0 && (
          <section>
            <h2 className={tituloSeccion}>Características</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {p.features.map((caracteristica) => (
                <li key={caracteristica} className="flex items-center gap-2 text-sm text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {caracteristica}
                </li>
              ))}
            </ul>
          </section>
        )}

        {ubicacion && (
          <section>
            <h2 className={tituloSeccion}>Ubicación</h2>
            <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <iframe
                title={`Mapa de ${p.title}`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(ubicacion)}&z=14&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        )}

        <section id="visita" className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl space-y-4 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">¿Quieres visitar esta propiedad?</h2>
              <p className="text-xs text-slate-500">Déjanos tus datos y te contactamos para coordinar.</p>
            </div>
            {(whatsapp || brand.aiAgent.calendarUrl) && (
              <div className="flex flex-col sm:flex-row gap-2">
                {whatsapp && (
                  <a href={whatsapp} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                {brand.aiAgent.calendarUrl && (
                  <a href={brand.aiAgent.calendarUrl} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors">
                    <CalendarClock className="w-4 h-4" />
                    Agendar en línea
                  </a>
                )}
              </div>
            )}
          </div>
          <FormularioVisita propiedadId={p.id} enviarVisita={enviarVisita} />
        </section>
      </article>
    </Marco>
  );
}
