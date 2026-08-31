import React, { useState } from 'react';
import { 
  X, 
  Bed, 
  Bath, 
  Maximize2, 
  Car, 
  MapPin, 
  Calendar, 
  Phone, 
  CheckCircle2, 
  Sparkles, 
  Box,
  Compass,
  ExternalLink,
  Map,
  Share2,
  Copy,
  Check,
  Calculator,
  Clock
} from 'lucide-react';
import { Property } from '../../types/property';
import { usePropertyStore } from '../../stores/usePropertyStore';
import { useLeadStore } from '../../stores/useLeadStore';
import { agencyConfig } from '../../config/agencyConfig';
import { CalBookingModal } from '../scheduling/CalBookingModal';

interface PropertyModalProps {
  property: Property | null;
  onClose: () => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({ property, onClose }) => {
  const { formatPrice } = usePropertyStore();
  const { addLead } = useLeadStore();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isCalOpen, setIsCalOpen] = useState(false);
  const [copiedFicha, setCopiedFicha] = useState(false);

  // Mortgage Calculator in Modal
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [mortgageYears, setMortgageYears] = useState(25);
  const [annualRate, setAnnualRate] = useState(4.85);

  // Booking Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('11:00');

  if (!property) return null;

  const priceInfo = formatPrice(property.priceUf);

  // Mortgage Calculation Logic
  const loanAmountUf = property.priceUf * (1 - downPaymentPct / 100);
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = mortgageYears * 12;
  const monthlyDividendUf = monthlyRate > 0 
    ? (loanAmountUf * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    : loanAmountUf / totalMonths;
  const monthlyDividendClp = Math.round(monthlyDividendUf * agencyConfig.market.ufValueClp);

  // Structured Commercial Sheet Text for WhatsApp Share
  const commercialFichaText = `🏢 *FICHA INMOBILIARIA - URBEGESTIÓN*\n\n` +
    `🏡 *${property.title}*\n` +
    `📍 *Ubicación:* ${property.address}, ${property.commune}\n` +
    `💰 *Valor:* *${priceInfo.display}* (${property.operation === 'venta' ? 'Venta' : 'Arriendo'})\n` +
    `📐 *Superficie:* ${property.builtAreaM2 > 0 ? `${property.builtAreaM2} m² útiles` : ''} ${property.totalAreaM2 > 0 ? `/ ${property.totalAreaM2} m² totales` : ''}\n` +
    `🛏️ *Dormitorios:* ${property.bedrooms} | 🚿 *Baños:* ${property.bathrooms}\n` +
    `🚗 *Estacionamientos:* ${property.parkingSpots} | 📦 *Bodegas:* ${property.storageUnits || 1}\n\n` +
    `✨ *Características destacadas:*\n${property.features.slice(0, 4).map(f => `• ${f}`).join('\n')}\n\n` +
    `📲 *Asesoría y Visitas con Pilar Osorio:* https://wa.me/${agencyConfig.contact.whatsapp}?text=${encodeURIComponent(`Hola Pilar, me interesa coordinar visita para "${property.title}" (${property.commune}).`)}`;

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(commercialFichaText)}`;

  const handleCopyFicha = () => {
    navigator.clipboard.writeText(commercialFichaText);
    setCopiedFicha(true);
    setTimeout(() => setCopiedFicha(false), 2200);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    addLead({
      fullName: name,
      email: email || 'sin-correo@visita.cl',
      phone: phone,
      propertyInterestId: property.id,
      propertyTitle: property.title,
      operationInterest: property.operation === 'venta' ? 'compra' : 'arriendo',
      budgetAmount: property.priceUf,
      budgetCurrency: 'UF',
      status: 'visita_agendada',
      appointmentDate: date || new Date().toISOString().split('T')[0],
      appointmentTime: time,
      notes: [
        `Visita solicitada para "${property.title}" (${property.commune})`,
        `Fecha: ${date || 'Próximamente'} a las ${time} hrs.`
      ],
      source: 'ficha_propiedad',
    });

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setShowBookingForm(false);
    }, 3500);
  };

  const mapQueryText = encodeURIComponent(
    property.mapQuery || `${property.address}, ${property.commune}, Santiago, Chile`
  );
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${mapQueryText}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${mapQueryText}`;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
        
        {/* Modal / Bottom Sheet Box */}
        <div className="relative bg-white w-full max-w-5xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col">
          
          {/* Header Close Bar */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                property.operation === 'venta' ? 'bg-urbe-primary text-white' : 'bg-emerald-600 text-white'
              }`}>
                {property.operation === 'venta' ? 'En Venta' : 'En Arriendo'}
              </span>
              <span className="text-xs font-bold text-slate-700 truncate max-w-[200px] sm:max-w-md">
                {property.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition-colors"
                title="Compartir por WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Compartir</span>
              </a>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Modal Body */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-8 space-y-6 sm:space-y-8">
            
            {/* Gallery with Thumbnails */}
            <div className="space-y-2">
              <div className="relative bg-slate-950 aspect-[16/10] sm:aspect-[21/9] rounded-2xl overflow-hidden shadow-inner">
                <img
                  src={property.images[activeImageIdx] || property.images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />

                {property.featured && (
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full bg-urbe-accent text-slate-950 text-xs font-black shadow flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Propiedad Exclusiva
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail selector */}
              {property.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto py-1">
                  {property.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-16 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        activeImageIdx === idx ? 'border-urbe-primary scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing & Location Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                  <MapPin className="w-4 h-4 text-urbe-primary shrink-0" />
                  <span>{property.commune} • {property.address}</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {property.title}
                </h2>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 min-w-[220px]">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 block leading-none">
                  {priceInfo.display}
                </span>
                <span className="text-xs text-slate-500 font-semibold block mt-1">
                  {priceInfo.full}
                </span>
                {property.expensesMonthlyClp !== undefined && property.expensesMonthlyClp > 0 && (
                  <span className="text-[11px] text-slate-400 font-medium block mt-1">
                    Gastos comunes: ${property.expensesMonthlyClp.toLocaleString('es-CL')} CLP
                  </span>
                )}
              </div>
            </div>

            {/* COMMERCIAL SHARE BAR (WHATSAPP & COPY) */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Compartir Ficha Comercial con Prospectos
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Envía el resumen estructurado con fotos, precio y specs listo para WhatsApp.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyFicha}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  {copiedFicha ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFicha ? 'Ficha Copiada' : 'Copiar Texto'}</span>
                </button>

                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Enviar por WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Technical Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {property.builtAreaM2 > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Maximize2 className="w-4 h-4 text-urbe-primary mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">M² Const.</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{property.builtAreaM2} m²</span>
                </div>
              )}
              {property.totalAreaM2 > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Compass className="w-4 h-4 text-urbe-primary mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">M² Totales</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{property.totalAreaM2} m²</span>
                </div>
              )}
              {property.bedrooms > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Bed className="w-4 h-4 text-urbe-primary mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Dormitorios</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{property.bedrooms} Dorm.</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Bath className="w-4 h-4 text-urbe-primary mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Baños</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{property.bathrooms} Baños</span>
                </div>
              )}
              {property.parkingSpots > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Car className="w-4 h-4 text-urbe-primary mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Estacionam.</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{property.parkingSpots} Autos</span>
                </div>
              )}
              {property.storageUnits > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <Box className="w-4 h-4 text-urbe-primary mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Bodega</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{property.storageUnits} Bodega</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5 uppercase tracking-wider">
                Descripción de la Propiedad
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities & Features */}
            {property.features.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2.5 uppercase tracking-wider">
                  Equipamiento & Terminaciones
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {property.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SIMULADOR DE CRÉDITO HIPOTECARIO (VENTA) */}
            {property.operation === 'venta' && (
              <div className="bg-slate-50 border border-slate-200 p-5 sm:p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-urbe-primary" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Simulador de Dividendo Estimado
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500">UF {agencyConfig.market.ufValueClp.toLocaleString('es-CL')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Pie Inicial (%): {downPaymentPct}%</label>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      step={5}
                      value={downPaymentPct}
                      onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                      className="w-full accent-urbe-primary"
                    />
                    <span className="text-[11px] text-slate-500">Monto Pie: {(property.priceUf * downPaymentPct / 100).toFixed(0)} UF</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Plazo: {mortgageYears} Años</label>
                    <select
                      value={mortgageYears}
                      onChange={(e) => setMortgageYears(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="15">15 Años</option>
                      <option value="20">20 Años</option>
                      <option value="25">25 Años</option>
                      <option value="30">30 Años</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Tasa Anual Estimada</label>
                    <input
                      type="number"
                      step="0.05"
                      value={annualRate}
                      onChange={(e) => setAnnualRate(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">Dividendo Mensual Estimado:</span>
                    <span className="text-lg sm:text-xl font-extrabold text-urbe-primary">
                      {monthlyDividendUf.toFixed(2)} UF / mes
                    </span>
                    <span className="text-xs text-slate-500 font-semibold ml-2">
                      (~${monthlyDividendClp.toLocaleString('es-CL')} CLP)
                    </span>
                  </div>

                  <a
                    href={`https://wa.me/${agencyConfig.contact.whatsapp}?text=${encodeURIComponent(`Hola Pilar, simulé el dividendo para "${property.title}" (${monthlyDividendUf.toFixed(2)} UF/mes) y quiero evaluar mi crédito hipotecario.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-urbe-accent hover:bg-urbe-accentHover text-slate-950 text-xs font-bold rounded-xl shadow transition-colors"
                  >
                    Evaluar Crédito con UrbeGestión
                  </a>
                </div>
              </div>
            )}

            {/* Map Location Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-urbe-primary" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Ubicación en el Mapa
                  </h3>
                </div>

                <a
                  href={googleMapsExternalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-urbe-primary hover:underline flex items-center gap-1"
                >
                  <span>Abrir en Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Embedded Google Map Iframe */}
              <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                <iframe
                  title={`Mapa de ${property.title}`}
                  src={googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Interactive Booking Section with Cal.com & Form */}
            <div className="bg-slate-50 border border-slate-200 p-5 sm:p-6 rounded-2xl">
              {!showBookingForm ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">¿Deseas visitar esta propiedad?</h4>
                    <p className="text-xs text-slate-500">Coordinamos visitas presenciales privadas con Pilar Osorio.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={() => setIsCalOpen(true)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Agendar con Cal.com</span>
                    </button>
                    
                    <button
                      onClick={() => setShowBookingForm(true)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-urbe-accent" />
                      <span>Formulario Rápido</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-urbe-primary" />
                      Agendar Visita a "{property.title}"
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancelar
                    </button>
                  </div>

                  {bookingSuccess ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>¡Visita agendada! Pilar Osorio te contactará al {phone} para confirmar los detalles.</span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre Completo *</label>
                          <input
                            type="text"
                            required
                            placeholder="Tu nombre y apellido"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-urbe-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Teléfono / WhatsApp *</label>
                          <input
                            type="tel"
                            required
                            placeholder="+56 9 1234 5678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-urbe-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Correo Electrónico</label>
                          <input
                            type="email"
                            placeholder="ejemplo@correo.cl"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-urbe-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Fecha de Visita</label>
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-urbe-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Horario Preferido</label>
                          <select
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-urbe-primary"
                          >
                            <option value="09:30">Mañana (09:30 - 11:00)</option>
                            <option value="11:30">Mediodía (11:30 - 13:00)</option>
                            <option value="15:30">Tarde (15:30 - 17:00)</option>
                            <option value="17:30">Tarde Final (17:30 - 19:00)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold shadow transition-colors"
                      >
                        Confirmar Reserva de Visita
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Cal.com Interactive Booking Modal */}
      <CalBookingModal
        isOpen={isCalOpen}
        property={property}
        onClose={() => setIsCalOpen(false)}
      />
    </>
  );
};
