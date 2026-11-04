import Link from 'next/link';
import { Bath, Bed, Building, Car, Eye, MapPin, Maximize2, MessageCircle, Sparkles } from 'lucide-react';
import { convertMoney, formatMoney, type CurrencyRates } from '@portal/dinero';
import { getMarketPack } from '@portal/mercados';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';
import { enlaceWhatsapp } from './enlaces';

export interface ContactoTarjeta {
  whatsapp: string;
  whatsappMessage: string;
}

const TIPOS: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  parcela_agricola: 'Parcela Agrícola',
  oficina_comercial: 'Oficina',
  terreno: 'Terreno',
};

export const etiquetaTipo = (tipo: string): string => TIPOS[tipo] ?? 'Inmueble';

export const textoBanos = (n: number): string => (n === 1 ? '1 Baño' : `${n} Baños`);

interface TarjetaProps {
  propiedad: PublicProperty;
  marketId: string;
  contacto: ContactoTarjeta;
  // Moneda en que se muestra el precio (la que eligió quien mira) y las tasas para convertir; sin ellas se ve como se publicó.
  moneda?: string;
  tasas?: CurrencyRates;
}

export function TarjetaPropiedad({ propiedad: p, marketId, contacto, moneda, tasas = {} }: TarjetaProps) {
  const pack = getMarketPack(marketId);
  const publicado = { amount: p.priceAmount, currency: p.priceCurrency };
  const visto = moneda ? convertMoney(publicado, moneda, pack, tasas) : publicado;
  const convertido = visto.currency !== publicado.currency;
  const superficie = p.builtAreaM2 || p.totalAreaM2;
  const lugar = p.commune ? ` (${p.commune})` : '';
  const consulta = enlaceWhatsapp(contacto.whatsapp, `Hola, vi la propiedad "${p.title}"${lugar} y quiero más información.`);
  const ficha = `/propiedades/${p.id}`;
  const datos = [
    ...(p.bedrooms > 0 ? [{ Icono: Bed, texto: `${p.bedrooms} Dorm.` }] : []),
    ...(p.bathrooms > 0 ? [{ Icono: Bath, texto: textoBanos(p.bathrooms) }] : []),
    ...(superficie > 0 ? [{ Icono: Maximize2, texto: `${superficie} m²` }] : []),
    ...(p.parkingSpots > 0 ? [{ Icono: Car, texto: `${p.parkingSpots} Estac.` }] : []),
  ];

  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          {/* Atajo para quien usa el mouse: el enlace accesible es el título. Las etiquetas quedan fuera para que los lectores de pantalla las lean. */}
          <Link href={ficha} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
            {p.images[0] ? (
              <img src={p.images[0]} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building className="w-12 h-12 text-slate-300" />
              </div>
            )}
          </Link>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-70" />

          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10 pointer-events-none">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md ${p.operation === 'venta' ? 'bg-urbe-primary text-white' : 'bg-emerald-600 text-white'}`}>
              {p.operation === 'venta' ? 'En Venta' : 'En Arriendo'}
            </span>
            {p.reservada && <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md">Reservada</span>}
            {p.featured && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-urbe-accent text-slate-950 flex items-center gap-1 shadow-md">
                <Sparkles className="w-3 h-3" />
                Exclusiva
              </span>
            )}
          </div>

          <span className="absolute top-3 right-3 z-10 pointer-events-none px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/90 text-slate-800 shadow-sm">{etiquetaTipo(p.propertyType)}</span>

          {p.commune && (
            <span className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-1 text-white text-xs font-medium drop-shadow-md">
              <MapPin className="w-3.5 h-3.5 text-urbe-accent" />
              {p.commune}
            </span>
          )}
        </div>

        <div className="p-5">
          <span className="text-2xl font-black text-slate-900 block leading-tight tracking-tight mb-2">
            {convertido ? `≈ ${formatMoney(visto, pack)}` : formatMoney(publicado, pack)}
          </span>
          {convertido && <span className="text-xs text-slate-500 block -mt-1 mb-2">Publicado en {formatMoney(publicado, pack)}</span>}
          <h3 className="text-base font-bold text-slate-800 line-clamp-1 mb-2">
            <Link href={ficha} className="hover:text-urbe-primary transition-colors">{p.title}</Link>
          </h3>
          {p.address && <p className="text-xs text-slate-500 line-clamp-1 mb-4">{p.address}</p>}

          {datos.length > 0 && (
            <div className="grid grid-cols-4 gap-2 py-3 border-y border-slate-100 text-slate-700 text-xs font-semibold">
              {datos.map(({ Icono, texto }) => (
                <div key={texto} className="flex flex-col items-center text-center p-1 rounded-lg bg-slate-50">
                  <Icono className="w-4 h-4 text-slate-400 mb-1" />
                  <span>{texto}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 pt-1 space-y-2">
        <Link
          href={ficha}
          aria-label={`Ver ficha: ${p.title}`}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-slate-600" />
          <span>Ver ficha</span>
        </Link>
        {consulta && (
          <a
            href={consulta}
            aria-label={`Consultar por WhatsApp: ${p.title}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-urbe-accent" />
            <span>Consultar por WhatsApp</span>
          </a>
        )}
      </div>
    </article>
  );
}
