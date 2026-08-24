import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bed, 
  Bath, 
  Maximize2, 
  Car, 
  MapPin, 
  Sparkles, 
  Calendar, 
  Eye,
  MessageCircle,
  Shield
} from 'lucide-react';
import { Property } from '../../types/property';
import { usePropertyStore } from '../../stores/usePropertyStore';
import { agencyConfig } from '../../config/agencyConfig';

interface PropertyCardProps {
  property: Property;
  onOpenDetails: (property: Property) => void;
  onOpenBooking: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onOpenDetails, 
  onOpenBooking 
}) => {
  const { formatPrice } = usePropertyStore();
  const priceInfo = formatPrice(property.priceUf);

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case 'departamento': return 'Departamento';
      case 'casa': return 'Casa';
      case 'parcela_agricola': return 'Parcela Agrícola';
      case 'oficina_comercial': return 'Oficina';
      default: return 'Inmueble';
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hola Pilar, me interesa conocer más detalles sobre la propiedad: "${property.title}" (${property.commune}) valor ${property.priceUf} UF.`
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Image Container with Badges */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onOpenDetails(property)}>
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md backdrop-blur-md ${
              property.operation === 'venta' 
                ? 'bg-urbe-primary text-white' 
                : 'bg-emerald-600 text-white'
            }`}>
              {property.operation === 'venta' ? 'En Venta' : 'En Arriendo'}
            </span>

            {property.featured && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-urbe-accent text-slate-950 flex items-center gap-1 shadow-md">
                <Sparkles className="w-3 h-3" />
                Exclusiva
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 z-10">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/90 text-slate-800 backdrop-blur-md shadow-sm">
              {getPropertyTypeLabel(property.propertyType)}
            </span>
          </div>

          {/* Bottom Location Overlay on Image */}
          <div className="absolute bottom-3 left-3 right-3 text-white z-10 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-medium drop-shadow-md">
              <MapPin className="w-3.5 h-3.5 text-urbe-accent" />
              {property.commune}
            </span>
            <span className="text-[11px] font-semibold bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
              {property.images.length} fotos
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5">
          {/* Price Header */}
          <div className="mb-2">
            <span className="text-2xl font-black text-slate-900 block leading-tight tracking-tight">
              {priceInfo.display}
            </span>
            <span className="text-xs text-slate-500 font-medium block">
              {priceInfo.full}
            </span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onOpenDetails(property)}
            className="text-base font-bold text-slate-800 line-clamp-1 group-hover:text-urbe-primary transition-colors cursor-pointer mb-2"
          >
            {property.title}
          </h3>

          {/* Address */}
          <p className="text-xs text-slate-500 line-clamp-1 mb-4 flex items-center gap-1">
            <span>{property.address}</span>
          </p>

          {/* Property Specifications Grid */}
          <div className="grid grid-cols-4 gap-2 py-3 border-y border-slate-100 text-slate-700 text-xs font-semibold">
            {property.bedrooms > 0 && (
              <div className="flex flex-col items-center text-center p-1 rounded-lg bg-slate-50">
                <Bed className="w-4 h-4 text-slate-400 mb-1" />
                <span>{property.bedrooms} Dorm.</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex flex-col items-center text-center p-1 rounded-lg bg-slate-50">
                <Bath className="w-4 h-4 text-slate-400 mb-1" />
                <span>{property.bathrooms} Baños</span>
              </div>
            )}
            <div className="flex flex-col items-center text-center p-1 rounded-lg bg-slate-50">
              <Maximize2 className="w-4 h-4 text-slate-400 mb-1" />
              <span>{property.builtAreaM2 > 0 ? `${property.builtAreaM2} m²` : `${property.totalAreaM2} m²`}</span>
            </div>
            {property.parkingSpots > 0 && (
              <div className="flex flex-col items-center text-center p-1 rounded-lg bg-slate-50">
                <Car className="w-4 h-4 text-slate-400 mb-1" />
                <span>{property.parkingSpots} Estac.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="px-5 pb-5 pt-1 grid grid-cols-2 gap-2">
        <button
          onClick={() => onOpenDetails(property)}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-slate-600" />
          <span>Ver Ficha</span>
        </button>

        <button
          onClick={() => onOpenBooking(property)}
          className="w-full py-2.5 px-3 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-urbe-accent" />
          <span>Agendar Visita</span>
        </button>
      </div>

    </motion.div>
  );
};
