import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Building2, 
  Calendar, 
  Phone, 
  User, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Bot
} from 'lucide-react';
import { useChatStore } from '../stores/useChatStore';
import { usePropertyStore } from '../../catalogo/stores/usePropertyStore';
import { useOfferedProperties } from '../../catalogo/hooks/useOfferedProperties';
import { quickSearchChips } from '../../catalogo/services/propertySummary';
import { useT } from '../../../core/i18n/i18n';
import { priceOf } from '../../catalogo/services/propertyPrice';
import { processAiChatMessage, registerLeadFromChat } from '../services/aiService';
import { agencyConfig } from '../../../core/config/agencyConfig';
import { PrivacyNotice } from '../../../core/privacy/PrivacyNotice';
import { buildPrivacyNotice } from '../../../core/privacy/privacy';
import { Property } from '../../catalogo/types/property';

interface AiChatWidgetProps {
  onOpenPropertyModal: (property: Property) => void;
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({ onOpenPropertyModal }) => {
  const { isOpen, setIsOpen, messages, addMessage, isTyping, setIsTyping } = useChatStore();
  const { formatPrice } = usePropertyStore();
  const { t } = useT();
  const properties = useOfferedProperties();

  const [inputVal, setInputVal] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('11:30');
  const [leadRegistered, setLeadRegistered] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    // 1. Add user message
    addMessage({
      sender: 'user',
      text: text,
    });
    setInputVal('');

    // 2. AI thinking & processing
    setIsTyping(true);
    try {
      const response = await processAiChatMessage(text, properties);
      
      addMessage({
        sender: 'bot',
        text: response.text,
        suggestedProperties: response.suggestedProperties,
        actionRequired: response.actionRequired,
      });
    } catch (err) {
      addMessage({
        sender: 'bot',
        text: t('chat.error', { broker: agencyConfig.brokerName, phone: agencyConfig.contact.phoneDisplay }),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleRegisterLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;

    registerLeadFromChat(leadName, leadPhone, '', {
      privacyNotice: buildPrivacyNotice(),
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      notes: `Lead registrado desde el asistente IA. Fecha solicitada: ${selectedDate || 'Por coordinar'} a las ${selectedTime}`,
    });

    setLeadRegistered(true);
    addMessage({
      sender: 'bot',
      text: t('chat.confirm', { name: leadName, broker: agencyConfig.brokerName, phone: leadPhone }),
    });
  };

  // Las sugerencias salen de lo que la corredora tiene publicado, más las dos acciones fijas.
  const quickChips = [...quickSearchChips(properties), t('chat.chip.sell'), t('chat.chip.book')];

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="relative group p-4 rounded-full bg-gradient-to-r from-urbe-primary to-slate-900 text-white shadow-2xl hover:scale-105 transition-all flex items-center gap-3 border-2 border-urbe-accent/50"
            aria-label={t('chat.open')}
          >
            <div className="relative">
              <Sparkles className="w-6 h-6 text-urbe-accent animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>
            <div className="hidden sm:block text-left pr-1">
              <span className="text-xs font-black block tracking-tight">{t('chat.launcher.title')}</span>
              <span className="text-[10px] text-slate-300 font-medium block">{t('chat.launcher.subtitle')}</span>
            </div>
          </button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[600px] max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-urbe-primary to-slate-950 text-white p-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-urbe-accent/20 border border-urbe-accent/40 flex items-center justify-center">
                <Bot className="w-5 h-5 text-urbe-accent" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  {agencyConfig.aiAgent.botName}
                  <span className="text-[10px] bg-urbe-accent/30 text-urbe-accent font-black px-1.5 py-0.5 rounded">{t('chat.badge')}</span>
                </h4>
                <p className="text-[11px] text-slate-300 font-medium">
                  {t('chat.online', { brand: agencyConfig.brandName })}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-urbe-primary text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">
                      {msg.id === 'msg-welcome'
                        ? t('chat.welcome', { bot: agencyConfig.aiAgent.botName, locality: t('market.locality') })
                        : msg.text}
                    </p>

                    {/* Render Recommended Properties Cards in Chat */}
                    {msg.suggestedProperties && msg.suggestedProperties.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        {msg.suggestedProperties.map((propId) => {
                          const prop = properties.find((p) => p.id === propId);
                          if (!prop) return null;
                          const pInfo = formatPrice(priceOf(prop));

                          return (
                            <div
                              key={prop.id}
                              onClick={() => onOpenPropertyModal(prop)}
                              className="bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 cursor-pointer flex items-center gap-3 transition-colors group"
                            >
                              <img
                                src={prop.images[0]}
                                alt=""
                                className="w-12 h-12 rounded-lg object-cover shrink-0 group-hover:scale-105 transition-transform"
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-xs text-slate-900 truncate">
                                  {prop.title}
                                </h5>
                                <p className="text-[11px] text-slate-500">{prop.commune}</p>
                                <p className="text-xs font-black text-urbe-primary">{pInfo.display}</p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-urbe-primary shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
                <div className="w-2 h-2 rounded-full bg-urbe-accent animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-urbe-accent animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-urbe-accent animate-bounce" style={{ animationDelay: '0.4s' }} />
                <span className="text-xs text-slate-400 font-medium ml-1">{t('chat.typing')}</span>
              </div>
            )}

            {/* In-Chat Interactive Appointment Form */}
            {messages.some(m => m.actionRequired === 'select_date' || m.actionRequired === 'provide_contact') && !leadRegistered && (
              <div className="bg-white p-4 rounded-2xl border-2 border-urbe-accent/30 shadow-md space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Calendar className="w-4 h-4 text-urbe-primary" />
                  <span>{t('chat.form.title')}</span>
                </div>

                <form onSubmit={handleRegisterLead} className="space-y-2.5 text-xs">
                  <input
                    type="text"
                    required
                    placeholder={t('chat.form.name')}
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-urbe-primary"
                  />
                  <input
                    type="tel"
                    required
                    placeholder={t('form.phone')}
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-urbe-primary"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="10:00">{t('chat.time', { time: '10:00' })}</option>
                      <option value="11:30">{t('chat.time', { time: '11:30' })}</option>
                      <option value="15:30">{t('chat.time', { time: '15:30' })}</option>
                      <option value="17:00">{t('chat.time', { time: '17:00' })}</option>
                    </select>
                  </div>
<PrivacyNotice />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-urbe-accent hover:bg-urbe-accentHover text-slate-950 font-bold shadow transition-colors"
                  >
                    {t('chat.form.submit', { broker: agencyConfig.brokerName })}
                  </button>
                </form>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="p-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 whitespace-nowrap transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder={t('chat.input.placeholder')}
              value={inputVal}
              maxLength={500}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-urbe-primary focus:bg-white"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputVal.trim()}
              className="p-2.5 rounded-2xl bg-urbe-primary hover:bg-urbe-primaryDark disabled:opacity-40 text-white shadow transition-all"
              aria-label={t('chat.send')}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
};
