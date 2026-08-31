import React, { useState, useRef } from 'react';
import { 
  X, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  FileText,
  Video,
  Camera
} from 'lucide-react';
import { useLeadStore } from '../../stores/useLeadStore';
import { REGION_METROPOLITANA_ZONES } from '../../data/chileanLocations';

interface OwnerValuationProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadedFilePreview {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
}

export const OwnerValuation: React.FC<OwnerValuationProps> = ({ isOpen, onClose }) => {
  const { addLead } = useLeadStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [operation, setOperation] = useState<'venta' | 'arriendo'>('venta');
  const [propertyType, setPropertyType] = useState('casa');
  const [commune, setCommune] = useState('Las Condes');
  const [areaM2, setAreaM2] = useState('140');
  const [bedrooms, setBedrooms] = useState('3');
  
  // Attachments State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileProcess = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isVideo && !isPdf) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const sizeFormatted = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`;

        const newAttachment: UploadedFilePreview = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          url,
          type: isVideo ? 'video' : isPdf ? 'document' : 'image',
          size: sizeFormatted,
        };

        setUploadedFiles((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileProcess(e.dataTransfer.files);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const attachmentUrls = uploadedFiles.map((f) => f.url);

    addLead({
      fullName: name,
      email: email || 'propietario@sin-email.cl',
      phone: phone,
      operationInterest: 'venta_propietario',
      propertyTitle: `${propertyType.toUpperCase()} en ${commune} (${areaM2} m²)`,
      status: 'nuevo',
      attachments: attachmentUrls,
      propertySpecs: {
        operation,
        propertyType,
        commune,
        areaM2,
        bedrooms,
      },
      notes: [
        `Propietario desea ${operation.toUpperCase()} su ${propertyType}`,
        `Ubicación: ${commune}, Superficie: ${areaM2} m², Dormitorios: ${bedrooms}`,
        uploadedFiles.length > 0 
          ? `Adjuntó ${uploadedFiles.length} foto(s)/archivo(s) desde su dispositivo para antecedentes.` 
          : 'Sin fotografías adjuntas al momento del registro.',
        `Solicita tasación profesional y gestión directa con UrbeGestión.`
      ],
      source: 'captacion_propietarios',
    });

    setIsSuccess(true);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setStep(1);
    setUploadedFiles([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-urbe-primary to-cyan-950 text-white p-5 sm:p-8 flex items-center justify-between shrink-0">
          <div>
            <span className="px-3 py-1 rounded-full bg-urbe-accent/20 text-urbe-accent text-[10px] sm:text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3 h-3" />
              Tasación & Captación Profesional
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {operation === 'arriendo' ? 'Pon en Arriendo tu Propiedad' : 'Vende con UrbeGestión'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Más de 25 años de experiencia en la Región Metropolitana con Pilar Osorio.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1">
          
          {isSuccess ? (
            <div className="text-center py-6 sm:py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
                ¡Solicitud y Antecedentes Registrados con Éxito!
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Pilar Osorio revisará los datos y las <strong>{uploadedFiles.length} foto(s)/archivo(s)</strong> de tu propiedad en <strong>{commune}</strong> y te contactará al teléfono <strong>{phone}</strong> con la propuesta de gestión.
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
              {/* Stepper indicator (4 steps) */}
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 text-[11px] sm:text-xs">
                <div className={`font-bold ${step === 1 ? 'text-urbe-primary' : 'text-slate-400'}`}>
                  1. Operación
                </div>
                <div className="h-0.5 w-6 sm:w-10 bg-slate-200" />
                <div className={`font-bold ${step === 2 ? 'text-urbe-primary' : 'text-slate-400'}`}>
                  2. Ubicación
                </div>
                <div className="h-0.5 w-6 sm:w-10 bg-slate-200" />
                <div className={`font-bold ${step === 3 ? 'text-urbe-primary' : 'text-slate-400'}`}>
                  3. Fotos & Docs
                </div>
                <div className="h-0.5 w-6 sm:w-10 bg-slate-200" />
                <div className={`font-bold ${step === 4 ? 'text-urbe-primary' : 'text-slate-400'}`}>
                  4. Contacto
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
                            ? 'border-urbe-primary bg-urbe-primary/5 text-urbe-primary font-bold shadow-sm ring-2 ring-urbe-primary/20'
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
                            ? 'border-urbe-primary bg-urbe-primary/5 text-urbe-primary font-bold shadow-sm ring-2 ring-urbe-primary/20'
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

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-urbe-primary text-white text-xs font-bold flex items-center gap-2 shadow hover:bg-urbe-primaryDark transition-colors"
                    >
                      <span>Siguiente: Ubicación</span>
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

                  <div className="pt-4 flex justify-between">
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
                      <span>Siguiente: Fotos & Antecedentes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Photos & Antecedents Upload from PC/Mobile (NEW) */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Cargar Fotos o Antecedentes de la Propiedad
                      </label>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Opcional / Recomendado
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Arrastra o sube fotos desde tu computador o celular para que Pilar Osorio evalúe el estado del inmueble de inmediato.
                    </p>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-urbe-primary bg-urbe-primary/10 scale-[1.01]' 
                        : 'border-slate-300 hover:border-urbe-primary bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileProcess(e.target.files)}
                    />

                    <div className="w-12 h-12 rounded-full bg-urbe-primary/10 text-urbe-primary flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <UploadCloud className="w-6 h-6" />
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Haz clic para seleccionar fotos o arrástralas aquí
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Soporta imágenes (JPG, PNG, WEBP), videos o documentos PDF
                    </p>
                  </div>

                  {/* Uploaded Files Previews Grid */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Archivos adjuntados ({uploadedFiles.length})</span>
                        <button
                          type="button"
                          onClick={() => setUploadedFiles([])}
                          className="text-rose-600 hover:underline text-[11px]"
                        >
                          Eliminar todos
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-100 aspect-[4/3] flex items-center justify-center shadow-sm"
                          >
                            {file.type === 'image' ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : file.type === 'video' ? (
                              <div className="flex flex-col items-center justify-center p-2 text-slate-700">
                                <Video className="w-6 h-6 text-rose-500 mb-1" />
                                <span className="text-[10px] font-bold truncate max-w-[100px]">{file.name}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-2 text-slate-700">
                                <FileText className="w-6 h-6 text-sky-600 mb-1" />
                                <span className="text-[10px] font-bold truncate max-w-[100px]">{file.name}</span>
                              </div>
                            )}

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(file.id);
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-950/70 hover:bg-rose-600 text-white transition-colors"
                              title="Eliminar foto"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            <div className="absolute bottom-0 inset-x-0 bg-slate-950/70 text-white text-[9px] px-1.5 py-0.5 truncate">
                              {file.name} ({file.size})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Atrás</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="px-5 py-2.5 rounded-xl bg-urbe-primary text-white text-xs font-bold flex items-center gap-2 shadow hover:bg-urbe-primaryDark transition-colors"
                    >
                      <span>Siguiente: Datos de Contacto</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Contact Details & Submit */}
              {step === 4 && (
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

                  {/* Summary of uploaded items */}
                  {uploadedFiles.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">
                        Se adjuntarán <strong>{uploadedFiles.length} foto(s)/archivo(s)</strong> para la evaluación de Pilar Osorio.
                      </span>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Tus datos y fotografías son 100% confidenciales. Asesoría directa con UrbeGestión sin compromisos.</span>
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Atrás</span>
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-urbe-accent hover:bg-urbe-accentHover text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg transition-colors"
                    >
                      <span>Enviar Solicitud con Antecedentes</span>
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
