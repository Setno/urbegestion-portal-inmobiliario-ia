import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp
} from 'lucide-react';
import { useLeadStore } from '../../stores/useLeadStore';
import { REGION_METROPOLITANA_ZONES } from '../../data/chileanLocations';

interface OwnerValuationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerValuation: React.FC<OwnerValuationProps> = ({ isOpen, onClose }) => {
  const { addLead } = useLeadStore();

  const [step, setStep] = useState(1);
  const [operation, setOperation] = useState<'venta' | 'arriendo'>('venta');
  const [propertyType, setPropertyType] = useState('casa');
  const [commune, setCommune] = useState('Las Condes');
  const [areaM2, setAreaM2] = useState('140');
  const [bedrooms, setBedrooms] = useState('3');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    addLead({
      fullName: name,
      email: email || 'propietario@sin-email.cl',
      phone: phone,
      operationInterest: 'venta_propietario',
      propertyTitle: `${propertyType.toUpperCase()} en ${commune} (${areaM2} m²)`,
      status: 'nuevo',
      notes: [
        `Propietario desea ${operation.toUpperCase()} su ${propertyType}`,
        `Ubicación: ${commune}, Superficie: ${areaM2} m², Dormitorios: ${bedrooms}`,
        `Solicita tasación profesional y asesoría personalizada.`
      ],
      source: 'captacion_propietarios',
    });

    setIsSuccess(true);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-urbe-primary to-cyan-950 text-white p-5 sm:p-8 flex items-center justify-between">
          <div>
            <span className="px-3 py-1 rounded-full bg-urbe-accent/20 text-urbe-accent text-[10px] sm:text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3 h-3" />
              Tasación & Asesoría Profesional
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Vende o Arrienda con UrbeGestión
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Más de 25 años de experiencia en la Región Metropolitana.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-8">
          
          {isSuccess ? (
            <div className="text-center py-6 sm:py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
                ¡Solicitud Registrada con Éxito!
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Pilar Osorio revisará los datos de tu propiedad en <strong>{commune}</strong> y te contactará al teléfono <strong>{phone}</strong> con un estudio de mercado preliminar.
              </p>
              <div className="pt-3">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl bg-urbe-primary text-white text-xs font-bold shadow hover:bg-urbe-primaryDark transition-colors"
                >
                  Volver al Portal
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Stepper indicator */}
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 text-[11px] sm:text-xs">
                <div className={`font-bold ${step === 1 ? 'text-urbe-primary' : 'text-slate-400'}`}>
                  1. Operación
                </div>
                <div className="h-0.5 w-8 sm:w-12 bg-slate-200" />
                <div className={`font-bold ${step === 2 ? 'text-urbe-primary' : 'text-slate-400'}`}>
                  2. Ubicación & M²
                </div>
                <div className="h-0.5 w-8 sm:w-12 bg-slate-200" />
                <div className={`font-bold ${step === 3 ? 'text-urbe-primary' : 'text-slate-400'}`}>
                  3. Contacto
                </div>
              </div>

              {/* Step 1: Operation & Property Type */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ¿Qué deseas hacer con tu propiedad?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOperation('venta')}
                        className={`p-3.5 sm:p-4 rounded-2xl border text-center transition-all ${
                          operation === 'venta'
                            ? 'border-urbe-primary bg-urbe-primary/5 text-urbe-primary font-bold shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <TrendingUp className="w-5 h-5 mx-auto mb-1 text-urbe-primary" />
                        <span className="text-xs sm:text-sm font-bold">Vender</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOperation('arriendo')}
                        className={`p-3.5 sm:p-4 rounded-2xl border text-center transition-all ${
                          operation === 'arriendo'
                            ? 'border-urbe-primary bg-urbe-primary/5 text-urbe-primary font-bold shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Building2 className="w-5 h-5 mx-auto mb-1 text-urbe-primary" />
                        <span className="text-xs sm:text-sm font-bold">Poner en Arriendo</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Tipo de Inmueble
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'casa', label: 'Casa' },
                        { id: 'departamento', label: 'Departamento' },
                        { id: 'parcela_agricola', label: 'Parcela Agrícola' },
                        { id: 'oficina_comercial', label: 'Oficina / Local' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPropertyType(t.id)}
                          className={`p-2.5 sm:p-3 rounded-xl border text-xs font-bold transition-all ${
                            propertyType === t.id
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-urbe-primary text-white text-xs font-bold flex items-center gap-2 shadow hover:bg-urbe-primaryDark transition-colors"
                    >
                      <span>Siguiente Paso</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Location & Specs */}
              {step === 2 && (
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Comuna (Región Metropolitana)
                    </label>
                    <select
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-urbe-primary font-medium"
                    >
                      {REGION_METROPOLITANA_ZONES.map((zone) => (
                        <optgroup key={zone.groupName} label={zone.groupName}>
                          {zone.communes.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Superficie Aprox (m²)
                      </label>
                      <input
                        type="number"
                        placeholder="Ej: 140"
                        value={areaM2}
                        onChange={(e) => setAreaM2(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-urbe-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Dormitorios
                      </label>
                      <select
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-urbe-primary"
                      >
                        <option value="1">1 Dormitorio</option>
                        <option value="2">2 Dormitorios</option>
                        <option value="3">3 Dormitorios</option>
                        <option value="4">4 Dormitorios</option>
                        <option value="5+">5 o más Dormitorios</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Atrás</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-5 py-2.5 rounded-xl bg-urbe-primary text-white text-xs font-bold flex items-center gap-2 shadow hover:bg-urbe-primaryDark transition-colors"
                    >
                      <span>Siguiente Paso</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Contact Details */}
              {step === 3 && (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Tu nombre y apellido"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-urbe-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+56 9 1234 5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-urbe-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        placeholder="tu@email.cl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-urbe-primary"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Tus datos son confidenciales. Asesoría directa con Pilar Osorio sin compromisos ni cobros ocultos.</span>
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Atrás</span>
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-urbe-accent hover:bg-urbe-accentHover text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg transition-colors"
                    >
                      <span>Solicitar Tasación Gratuita</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
