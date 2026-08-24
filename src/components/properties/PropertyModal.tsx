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
  Map
} from 'lucide-react';
import { Property } from '../../types/property';
import { usePropertyStore } from '../../stores/usePropertyStore';
import { useLeadStore } from '../../stores/useLeadStore';
import { agencyConfig } from '../../config/agencyConfig';

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

  // Booking Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('11:00');
  const [note, setNote] = useState('');

  if (!property) return null;

  const priceInfo = formatPrice(property.priceUf);

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
        note ? `Nota adicional: ${note}` : ''
      ].filter(Boolean),
      source: 'ficha_propiedad',
    });

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setShowBookingForm(false);
    }, 3500);
  };

  const whatsappUrl = `https://wa.me/${agencyConfig.contact.whatsapp}?text=${encodeURIComponent(
    `Hola Pilar, me interesa coordinar una visita para la propiedad "${property.title}" (${property.commune}), valor ${property.priceUf} UF.`
  )}`;

  const mapQueryText = encodeURIComponent(
    property.mapQuery || `${property.address}, ${property.commune}, Santiago, Chile`
  );
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${mapQueryText}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${mapQueryText}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      
      {/* Modal / Bottom Sheet Box (Mobile Optimized) */}
      <div className="relative bg-white w-full max-w-5xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        
        {/* Header Close Bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between">
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

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
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
                    Propiedad Destacada
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
            <p className="text-[11px] text-slate-400">
              * Por seguridad del propietario, la ubicación en el mapa es referencial al sector o cuadrante ({property.commune}). La dirección exacta se comparte al confirmar la visita.
            </p>
          </div>

          {/* Interactive Booking Section */}
          <div className="bg-slate-50 border border-slate-200 p-5 sm:p-6 rounded-2xl">
            {!showBookingForm ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">¿Deseas visitar esta propiedad?</h4>
                  <p className="text-xs text-slate-500">Coordinamos visitas presenciales privadas guiadas por Pilar Osorio.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>WhatsApp Directo</span>
                  </a>
                  <button
                    onClick={() => setShowBookingForm(true)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-urbe-accent" />
                    <span>Agendar en Línea</span>
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
  );
};
