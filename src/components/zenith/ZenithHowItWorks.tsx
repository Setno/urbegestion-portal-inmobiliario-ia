import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessStep {
  id: string;
  name: string;
  title: string;
  desc: string;
  cta: string;
}

const processSteps: ProcessStep[] = [
  {
    id: 'market-analysis',
    name: 'Análisis de Mercado & Plusvalía',
    title: 'Análisis de Mercado & Plusvalía',
    desc: 'Tasación comercial precisa basada en transacciones reales inscritas en el Conservador de Bienes Raíces (CBR) y proyecciones de rentabilidad en UF.',
    cta: 'Solicitar tasación',
  },
  {
    id: 'exclusive-collection',
    name: 'Colección Exclusiva Off-Market',
    title: 'Colección Exclusiva Off-Market',
    desc: 'Curaduría personalizada de propiedades residenciales y agrícolas de alto estándar. Incluye tours privados, material audiovisual de alta fidelidad y máxima discreción.',
    cta: 'Consulta gratuita',
  },
  {
    id: 'policy-support',
    name: 'Respaldo Legal & Estudio de Títulos',
    title: 'Respaldo Legal & Estudio de Títulos',
    desc: 'Estudios de títulos exhaustivos por más de 30 años, regularización de derechos de agua agrícola, verificación municipal y optimización tributaria.',
    cta: 'Asesoría legal',
  },
  {
    id: 'closing-deal',
    name: 'Cierre Notarial & Entrega',
    title: 'Cierre Notarial & Entrega',
    desc: 'Gestión completa de promesa de compraventa, coordinación con bancos, firma en notaría, inscripción en CBR y entrega formal de la propiedad.',
    cta: 'Iniciar proceso',
  },
];

interface ZenithHowItWorksProps {
  onFreeConsult?: () => void;
}

export const ZenithHowItWorks: React.FC<ZenithHowItWorksProps> = ({ onFreeConsult }) => {
  const [activeStepId, setActiveStepId] = useState<string>('exclusive-collection');

  const currentStep = processSteps.find((s) => s.id === activeStepId) || processSteps[1];

  return (
    <section id="how-it-works" className="w-full bg-[#F8F8F8] py-24 md:py-32 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header: 12-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-end mb-16 md:mb-20">
          <div className="md:col-span-8">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight leading-[1.1] text-[#141414]">
              Conoce nuestro servicio y proceso de corretaje
            </h2>
          </div>
          <div className="md:col-span-4 md:col-start-9 pb-1">
            <p className="text-[#A5A5A5] text-[14px] leading-relaxed">
              Tours virtuales, catálogo privado fuera de mercado y 25 años de experiencia legal — todas las herramientas para comprar y vender con total seguridad.
            </p>
          </div>
        </div>

        {/* 12-column Grid: Left 4 columns content block, Right 8 columns image */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          
          {/* Content Block (Left 4 columns) */}
          <div className="md:col-span-4 bg-white p-8 md:p-14 lg:p-16 flex flex-col justify-between min-h-[500px] md:min-h-[580px]">
            
            {/* Top section: Title, Description, and CTA Button */}
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  <h3 className="text-xl md:text-2xl font-medium text-[#141414] tracking-tight mb-4">
                    {currentStep.title}
                  </h3>

                  <p className="text-[#A5A5A5] text-[14px] leading-relaxed mb-8">
                    {currentStep.desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              <button
                onClick={onFreeConsult}
                className="border border-black/15 bg-transparent hover:bg-gray-50 px-7 py-3 text-[13px] font-medium text-[#141414] transition-colors cursor-pointer"
              >
                {currentStep.id === 'exclusive-collection' ? 'Consulta gratuita' : currentStep.cta}
              </button>
            </div>

            {/* Bottom section: Navigation list (4 text buttons vertically stacked) */}
            <div className="flex flex-col space-y-3.5 pt-10 border-t border-black/5 mt-8">
              {processSteps.map((step) => {
                const isActive = step.id === activeStepId;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStepId(step.id)}
                    className={`text-left text-[13px] font-medium tracking-tight transition-colors cursor-pointer ${
                      isActive 
                        ? 'text-[#141414] font-semibold' 
                        : 'text-[#A5A5A5] hover:text-[#141414]'
                    }`}
                  >
                    {step.name}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Right 8 columns: Image (aspect-video md:aspect-square) */}
          <div className="md:col-span-8 overflow-hidden aspect-video md:aspect-auto md:min-h-[580px] bg-black">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1280"
              alt="UrbeGestión Arquitectura Exclusiva y Respaldo Inmobiliario"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>

        </div>

      </div>
    </section>
  );
};
