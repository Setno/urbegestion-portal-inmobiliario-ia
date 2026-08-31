import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  MapPin, 
  Phone,
  UserCheck
} from 'lucide-react';
import { Property } from '../../types/property';
import { agencyConfig } from '../../config/agencyConfig';
import { webhookService } from '../../services/webhookService';
import { useLeadStore } from '../../stores/useLeadStore';

interface CalBookingModalProps {
  isOpen: boolean;
  property: Property | null;
  onClose: () => void;
}

export const CalBookingModal: React.FC<CalBookingModalProps> = ({
  isOpen,
  property,
  onClose,
}) => {
  const { addLead } = useLeadStore();
  const calConfig = webhookService.getWebhookConfig();
  const calendarUrl = calConfig.calComUrl || agencyConfig.aiAgent.calendarUrl || 'https://cal.com';

  const [bookingMode, setBookingMode] = useState<'embed' | 'form'>('embed');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('11:00');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    addLead({
      fullName: name,
      email: email || 'visita@cal.cl',
      phone: phone,
      propertyInterestId: property?.id,
      propertyTitle: property?.title || 'Visita a Propiedad',
      operationInterest: property?.operation === 'arriendo' ? 'arriendo' : 'compra',
      budgetAmount: property?.priceUf || 0,
      budgetCurrency: 'UF',
      status: 'visita_agendada',
      appointmentDate: selectedDate || new Date().toISOString().split('T')[0],
      appointmentTime: selectedTime,
      notes: [
        `Cita agendada vía Cal.com / Scheduler para "${property?.title || 'Propiedad'}"`,
        `Fecha seleccionada: ${selectedDate} a las ${selectedTime} hrs.`
      ],
      source: 'ficha_propiedad'
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-urbe-accent/20 text-urbe-accent flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Agendar Visita Inmobiliaria
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Cal.com Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {property ? `${property.title} (${property.commune})` : 'Atención directa con Pilar Osorio'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBookingMode('embed')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                bookingMode === 'embed' ? 'bg-white text-urbe-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗓️ Calendario Interactivo
            </button>
            <button
              onClick={() => setBookingMode('form')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                bookingMode === 'form' ? 'bg-white text-urbe-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📝 Formulario Rápido
            </button>
          </div>

          <a
            href={calendarUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-urbe-primary hover:underline flex items-center gap-1"
          >
            <span>Abrir en Cal.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {isSuccess ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">
                ¡Visita Agendada y Sincronizada!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Tu cita para el día <strong>{selectedDate || 'próximamente'}</strong> ha quedado registrada en nuestro CRM y calendario oficial.
              </p>
            </div>
          ) : bookingMode === 'embed' ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-urbe-primary" />
                  <span>Duración de la visita: <strong>45 minutos</strong></span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Confirmación automática por Google Calendar / WhatsApp
                </span>
              </div>

              {/* Cal.com Embed Container */}
              <div className="w-full h-[480px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative">
                <iframe
                  src={`${calendarUrl}?embed=true&notes=${encodeURIComponent(property ? `Visita para ${property.title} (${property.commune})` : 'Consulta Inmobiliaria')}`}
                  className="w-full h-full border-0"
                  title="Cal.com Booking Scheduler"
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4 max-w-lg mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha deseada para la visita *
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horario de preferencia
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="09:30">09:30 hrs (Mañana)</option>
                    <option value="11:00">11:00 hrs (Mañana)</option>
                    <option value="12:30">12:30 hrs (Mediodía)</option>
                    <option value="15:30">15:30 hrs (Tarde)</option>
                    <option value="17:00">17:00 hrs (Tarde)</option>
                    <option value="18:30">18:30 hrs (Tarde)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre y apellido"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+56 9 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="tu@email.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold rounded-xl shadow transition-all"
                >
                  Confirmar Visita
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
