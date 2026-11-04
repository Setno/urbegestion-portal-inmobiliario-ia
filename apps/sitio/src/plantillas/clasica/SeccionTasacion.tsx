import { CheckCircle2 } from 'lucide-react';
import type { SiteBrand } from '@portal/sitio-datos';
import type { EnviarTasacion } from '../../lib/tasacion';
import { FormularioTasacion } from './FormularioTasacion';

// Para propietarios: quien quiere vender o arrendar deja los datos de su propiedad y la corredora lo contacta.
// Es una banda con el color de la corredora para que se vea como una sección propia, no como un añadido al catálogo.
export function SeccionTasacion({ brand, enviarTasacion }: { brand: SiteBrand; enviarTasacion: EnviarTasacion }) {
  const beneficios = [
    'Tasación sin costo',
    brand.brokerName ? `Atención directa de ${brand.brokerName}` : 'Atención directa de la corredora',
    'Te contactamos para coordinar los siguientes pasos',
  ];

  return (
    <section id="vende" className="bg-urbe-primary text-white py-14 sm:py-16 scroll-mt-16 sm:scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-5 space-y-5">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">¿Quieres vender o arrendar tu propiedad?</h2>
          <p className="text-sm sm:text-base text-white/80 leading-relaxed">
            Cuéntanos de tu propiedad y {brand.brandName ? `${brand.brandName} te contacta` : 'te contactamos'} para hacer una tasación profesional.
          </p>
          <ul className="space-y-2.5">
            {beneficios.map((texto) => (
              <li key={texto} className="flex items-start gap-2.5 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-urbe-accent shrink-0" />
                <span>{texto}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-7">
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl p-5 sm:p-8">
            <FormularioTasacion enviarTasacion={enviarTasacion} />
          </div>
        </div>
      </div>
    </section>
  );
}
