import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ChartCardData {
  id: string;
  title: string;
  value: string;
  data: number[];
}

const analyticsData: ChartCardData[] = [
  {
    id: 'annual-growth',
    title: 'Plusvalía Anual en UF (Sector Oriente)',
    value: '14.8%',
    data: [35, 60, 45, 40, 55, 75, 60, 80, 55, 30],
  },
  {
    id: 'aggregate-yield',
    title: 'Patrimonio Gestionado & Transado',
    value: '$48.500M',
    data: [8, 12, 18, 28, 32, 38, 55, 70, 85],
  },
  {
    id: 'median-returns',
    title: 'Rentabilidad Neta por Arriendo',
    value: '6.8%',
    data: [10, 75, 20, 35, 30, 65, 55, 25, 40],
  },
];

// Custom shape function for Bar that renders two rectangles:
// 1. Light background rect with fill="#141414" and fillOpacity={0.05}
// 2. Solid top cap rect with height={2} and fill="#141414"
const CustomBarShape = (props: any) => {
  const { x, y, width, height } = props;
  
  if (width <= 0 || height <= 0) return null;

  return (
    <g>
      {/* Light background bar */}
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={height} 
        fill="#141414" 
        fillOpacity={0.05} 
      />
      {/* Solid top cap line */}
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={2} 
        fill="#141414" 
      />
    </g>
  );
};

export const ZenithAnalytics: React.FC = () => {
  return (
    <section id="analytics" className="w-full bg-[#F8F8F8] py-24 md:py-32 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header: 12-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start mb-16 md:mb-20">
          <div className="md:col-span-7 lg:col-span-8">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight leading-[1.1] text-[#141414]">
              Estructuras probadas para un crecimiento patrimonial seguro
            </h2>
          </div>
          
          <div className="md:col-span-5 lg:col-span-4 md:col-start-8 lg:col-start-9 space-y-4">
            <p className="text-[#A5A5A5] text-[14px] leading-relaxed">
              Nuestros activos inmobiliarios van más allá de los planos; representan vehículos confiables para proteger y multiplicar tu patrimonio en UF frente a la inflación.
            </p>
            <p className="text-[#A5A5A5] text-[14px] leading-relaxed">
              Analizamos con rigor técnico y 25 años de experiencia las mejores oportunidades residenciales y agrícolas de la Región Metropolitana.
            </p>
          </div>
        </div>

        {/* Charts Grid: 3 cards side by side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {analyticsData.map((card, index) => {
            const chartData = card.data.map((val, i) => ({
              idx: i,
              value: val,
            }));

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white p-6 md:p-8 flex flex-col justify-between aspect-video md:aspect-[1.8/1] shadow-xs"
              >
                {/* Metric Header */}
                <div>
                  <h3 className="text-[#141414]/40 text-[12px] font-medium tracking-tight uppercase mb-2">
                    {card.title}
                  </h3>
                  <div className="text-3xl md:text-4xl font-medium text-[#141414] tracking-tight">
                    {card.value}
                  </div>
                </div>

                {/* Chart Container: h-24 with ResponsiveContainer and BarChart */}
                <div className="h-24 w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={chartData} 
                      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      barCategoryGap="18%"
                    >
                      <Bar 
                        dataKey="value" 
                        shape={<CustomBarShape />}
                        isAnimationActive={true}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
