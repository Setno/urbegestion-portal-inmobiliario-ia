import React, { useState } from 'react';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Building, 
  ShieldCheck, 
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { agencyConfig } from '../../config/agencyConfig';
import { usePropertyStore } from '../../stores/usePropertyStore';
import { useChatStore } from '../../stores/useChatStore';

export const MortgageCalc: React.FC = () => {
  const { currency } = usePropertyStore();
  const { toggleChat } = useChatStore();

  const [priceUf, setPriceUf] = useState(12000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(4.85);
  const [years, setYears] = useState(25);

  const ufValueClp = agencyConfig.market.ufValueClp;

  // Computations
  const propertyPriceClp = priceUf * ufValueClp;
  const downPaymentUf = (priceUf * downPaymentPct) / 100;
  const downPaymentClp = downPaymentUf * ufValueClp;
  const loanAmountUf = priceUf - downPaymentUf;
  const loanAmountClp = loanAmountUf * ufValueClp;

  const monthlyRate = (interestRate / 100) / 12;
  const totalMonths = years * 12;

  const monthlyDividendUf = 
    (loanAmountUf * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) / 
    (Math.pow(1 + monthlyRate, totalMonths) - 1);
  const monthlyDividendClp = Math.round(monthlyDividendUf * ufValueClp);

  const minRequiredIncomeClp = Math.round(monthlyDividendClp * 4); // 25% debt-to-income ratio

  return (
    <section id="calculadora" className="py-16 bg-slate-900 text-white relative overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-urbe-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-urbe-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-urbe-accent text-xs font-bold uppercase tracking-wider mb-3">
            <Calculator className="w-3.5 h-3.5" />
            Simulador Financiero
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Calculadora de Dividendo Hipotecario
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Proyecta tu cuota mensual estimada en UF y Pesos Chilenos según las tasas del mercado bancario actual.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Controls (Left 7 Cols) */}
          <div className="lg:col-span-7 bg-slate-950/70 p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            
            {/* Price Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Valor de la Propiedad (UF)
                </label>
                <div className="text-right">
                  <span className="text-xl font-black text-urbe-accent">{priceUf.toLocaleString('es-CL')} UF</span>
                  <span className="text-xs text-slate-400 block">≈ ${propertyPriceClp.toLocaleString('es-CL')} CLP</span>
                </div>
              </div>
              <input
                type="range"
                min="2000"
                max="35000"
                step="500"
                value={priceUf}
                onChange={(e) => setPriceUf(Number(e.target.value))}
                className="w-full accent-urbe-accent cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>2.000 UF</span>
                <span>15.000 UF</span>
                <span>35.000 UF</span>
              </div>
            </div>

            {/* Down Payment Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Pie Inicial ({downPaymentPct}%)
                </label>
                <div className="text-right">
                  <span className="text-base font-bold text-white">{Math.round(downPaymentUf).toLocaleString('es-CL')} UF</span>
                  <span className="text-xs text-slate-400 block">≈ ${Math.round(downPaymentClp).toLocaleString('es-CL')} CLP</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                className="w-full accent-urbe-accent cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>10% (Mínimo)</span>
                <span>20% (Estándar)</span>
                <span>40%</span>
              </div>
            </div>

            {/* Terms and Rate Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Plazo del Crédito (Años)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 20, 25, 30].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYears(y)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        years === y
                          ? 'bg-urbe-accent text-slate-950 border-urbe-accent'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {y} años
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Tasa de Interés Anual ({interestRate}%)
                </label>
                <input
                  type="range"
                  min="3.5"
                  max="7.0"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full accent-urbe-accent cursor-pointer mt-2"
                />
                <span className="text-[11px] text-slate-400 block text-right mt-1">
                  Promedio bancario chileno 2026: ~4.8%
                </span>
              </div>
            </div>

          </div>

          {/* Results Summary Card (Right 5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-800 to-slate-900 p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6">
            
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Dividendo Mensual Estimado
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-urbe-accent">
                  ${monthlyDividendClp.toLocaleString('es-CL')}
                </span>
                <span className="text-sm font-semibold text-slate-300">CLP</span>
              </div>
              <span className="text-sm text-slate-400 font-medium block mt-1">
                ≈ {monthlyDividendUf.toFixed(2)} UF / mes
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Monto a financiar (80%):</span>
                <span className="font-bold text-white">{Math.round(loanAmountUf).toLocaleString('es-CL')} UF</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total meses:</span>
                <span className="font-bold text-white">{totalMonths} cuotas</span>
              </div>
              <div className="flex justify-between text-slate-300 pt-2 border-t border-white/10">
                <span className="font-bold text-white">Renta familiar requerida aprox:</span>
                <span className="font-bold text-emerald-400">${minRequiredIncomeClp.toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={toggleChat}
                className="w-full py-3.5 rounded-xl bg-urbe-accent hover:bg-urbe-accentHover text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Consultar con Asistente IA sobre mi financiamiento</span>
              </button>
              
              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                * Valores referenciales no incluyen seguros de desgravamen ni sismo/incendio. La aprobación final depende de la evaluación comercial del banco.
              </p>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
