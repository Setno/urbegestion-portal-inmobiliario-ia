import React from 'react';
import { motion } from 'framer-motion';
import { Square, Layers, Bed, Bath } from 'lucide-react';

interface PropertyItem {
  id: string;
  title: string;
  price: string;
  priceSecondary: string;
  location: string;
  stats: {
    area: string;
    floors: string;
    beds: string;
    baths: string;
  };
  image: string;
}

const properties: PropertyItem[] = [
  {
    id: 'prop-vitacura',
    title: 'Penthouse Dúplex Nueva Costanera',
    price: '18.500 UF',
    priceSecondary: '~$715.000.000 CLP',
    location: 'Chile / Santiago / Vitacura',
    stats: {
      area: '310 m²',
      floors: '2 pisos',
      beds: '4 dorms',
      baths: '4 baños',
    },
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'prop-lo-barnechea',
    title: 'Residencia Mediterránea Los Trapenses',
    price: '24.900 UF',
    priceSecondary: '~$962.000.000 CLP',
    location: 'Chile / Santiago / Lo Barnechea',
    stats: {
      area: '950 m²',
      floors: '2 pisos',
      beds: '5 dorms',
      baths: '5 baños',
    },
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'prop-melipilla',
    title: 'Finca Agrícola con Derechos de Agua',
    price: '8.900 UF',
    priceSecondary: '~$344.000.000 CLP',
    location: 'Chile / RM / Melipilla',
    stats: {
      area: '50.000 m²',
      floors: '1 piso',
      beds: '4 dorms',
      baths: '3 baños',
    },
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200',
  },
];

interface ZenithPropertiesProps {
  onSelectProperty?: (propId: string) => void;
}

export const ZenithProperties: React.FC<ZenithPropertiesProps> = ({ onSelectProperty }) => {
  return (
    <section id="properties" className="w-full bg-[#F8F8F8] py-24 md:py-32 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header: 12-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-end mb-16 md:mb-20">
          <div className="md:col-span-8">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight leading-[1.1] text-[#141414]">
              Guiándote hacia la residencia de tus sueños
            </h2>
          </div>
          <div className="md:col-span-4 md:col-start-9 pb-1">
            <p className="text-[#A5A5A5] text-[14px] leading-relaxed">
              Nuestra visión une arquitectura de autor, plusvalía y atención dedicada para que cada cliente resida en un espacio que refleje sus valores y estatus.
            </p>
          </div>
        </div>

        {/* Property Cards Grid: 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {properties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onSelectProperty?.(property.id)}
              className="bg-white group cursor-pointer flex flex-col justify-between"
            >
              {/* Image Container with Zoom Effect */}
              <div className="aspect-[4/3] md:aspect-square overflow-hidden relative">
                <img
                  src={property.image}
                  alt={property.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 duration-700 ease-out transition-transform"
                />
              </div>

              {/* Property Details Section */}
              <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-baseline justify-between mb-1.5 gap-2">
                    <h3 className="text-lg md:text-xl font-medium text-[#141414] tracking-tight line-clamp-1">
                      {property.title}
                    </h3>
                    <span className="text-base md:text-lg font-semibold text-[#141414] whitespace-nowrap">
                      {property.price}
                    </span>
                  </div>

                  <p className="text-[#A5A5A5] text-[13px] mb-6">
                    {property.location} <span className="text-slate-400 text-[11px]">({property.priceSecondary})</span>
                  </p>
                </div>

                {/* Inline Stats Flex-Wrap Row */}
                <div className="pt-4 border-t border-black/5 flex flex-wrap items-center gap-x-5 gap-y-2">
                  
                  {/* Area */}
                  <div className="flex items-center gap-1.5">
                    <Square size={13} strokeWidth={2.5} className="text-[#A5A5A5]" />
                    <span className="text-[#141414] text-[11px] font-medium">{property.stats.area}</span>
                  </div>

                  {/* Floors */}
                  <div className="flex items-center gap-1.5">
                    <Layers size={13} strokeWidth={2.5} className="text-[#A5A5A5]" />
                    <span className="text-[#141414] text-[11px] font-medium">{property.stats.floors}</span>
                  </div>

                  {/* Beds */}
                  <div className="flex items-center gap-1.5">
                    <Bed size={13} strokeWidth={2.5} className="text-[#A5A5A5]" />
                    <span className="text-[#141414] text-[11px] font-medium">{property.stats.beds}</span>
                  </div>

                  {/* Baths */}
                  <div className="flex items-center gap-1.5">
                    <Bath size={13} strokeWidth={2.5} className="text-[#A5A5A5]" />
                    <span className="text-[#141414] text-[11px] font-medium">{property.stats.baths}</span>
                  </div>

                </div>

              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
