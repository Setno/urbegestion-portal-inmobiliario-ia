import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Zap,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { agencyConfig } from '../../config/agencyConfig';
import { webhookService, WebhookStatus } from '../../../modules/captacion/services/webhookService';
import { getAiConfig, saveAiConfig, AiProviderType } from '../../../modules/captacion/services/aiService';
import { TeamSection } from './TeamSection';
import { PublicationModeSection } from './PublicationModeSection';
import { ServiceAreasSection } from './ServiceAreasSection';
import { DataExportSection } from './DataExportSection';
import { PlatformSection } from './PlatformSection';

export const IntegrationsTab: React.FC = () => {

  // Custom UF State
  const [currentUf, setCurrentUf] = useState(agencyConfig.market.ufValueClp);

  // Integration Settings State (GoHighLevel & Cal.com)
  const [calComUrl, setCalComUrl] = useState(() => webhookService.getWebhookConfig().calComUrl);
  const [isTestingGhl, setIsTestingGhl] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | 'checking'>('checking');
  const [ghlTestResult, setGhlTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // AI Assistant Engine State
  const [aiProvider, setAiProvider] = useState<AiProviderType>(() => getAiConfig().provider);

  useEffect(() => {
    let cancelled = false;
    setWebhookStatus('checking');
    webhookService.checkStatus().then((status) => {
      if (!cancelled) setWebhookStatus(status);
    });
    return () => { cancelled = true; };
  }, []);

  const handleSaveIntegrations = () => {
    webhookService.saveWebhookConfig({
      calComUrl,
      isEnabled: true,
    });
    saveAiConfig({
      provider: aiProvider,
    });
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  const handleTestGHL = async () => {
    setIsTestingGhl(true);
    setGhlTestResult(null);
    const res = await webhookService.testConnection();
    setGhlTestResult(res);
    setWebhookStatus(await webhookService.checkStatus());
    setIsTestingGhl(false);
  };

  return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
            Ajustes & Conectores de Integración
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Conecta la plataforma en tiempo real con tu CRM externo (GoHighLevel / Zapier) y tu calendario de citas (Cal.com / Calendly).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Integration 1: GoHighLevel Webhook */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-100 text-orange-600 font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">GoHighLevel / Webhook Sync</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Inbound Leads & Automation Trigger</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  webhookStatus === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : webhookStatus === 'checking' ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-rose-100 text-rose-800 border-rose-200'
                }`}>
                  {webhookStatus === 'active' ? 'Webhook Activo'
                    : webhookStatus === 'checking' ? 'Verificando...'
                    : webhookStatus === 'inactive' ? 'Webhook Inactivo: sin configurar'
                    : 'Sin conexión con el servidor'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Cada vez que un prospecto solicite una tasación, suba fotos de su casa o consulte por una propiedad, se enviará el contacto con sus etiquetas y campos personalizados en tiempo real a GoHighLevel.
              </p>

              <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                La URL del webhook se configura en el servidor (variable GHL_WEBHOOK_URL) y ya no se guarda en el navegador.
              </p>

              {ghlTestResult && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  ghlTestResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {ghlTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                  <span>{ghlTestResult.message}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleTestGHL}
                disabled={isTestingGhl || webhookStatus === 'inactive'}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingGhl ? 'animate-spin' : ''}`} />
                <span>{isTestingGhl ? 'Enviando Prueba...' : 'Probar Envío a GHL'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveIntegrations}
                className="px-4 py-2 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold shadow transition-colors"
              >
                {saveSuccessMsg ? '¡Guardado!' : 'Guardar Conexión'}
              </button>
            </div>
          </div>

          {/* Integration 2: Cal.com / Calendly */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700 font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Cal.com / Agendamiento Online</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Google Calendar & Outlook Sync</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Sincronización 24/7
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Permite que los compradores agenden visitas presenciales o reuniones virtuales en tiempo real según la disponibilidad de tu agenda, sin cruce de horarios.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL del Evento en Cal.com / Calendly
                </label>
                <input
                  type="url"
                  placeholder="https://cal.com/urbegestion/visita-propiedad"
                  value={calComUrl}
                  onChange={(e) => setCalComUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={calComUrl || 'https://cal.com'}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Calendario</span>
              </a>

              <button
                type="button"
                onClick={handleSaveIntegrations}
                className="px-4 py-2 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold shadow transition-colors"
              >
                {saveSuccessMsg ? '¡Guardado!' : 'Guardar Enlace'}
              </button>
            </div>
          </div>

        </div>

        {/* Integration 3: AI Assistant LLM Gateway & Custom Prompt */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700 font-bold">
                <Sparkles className="w-5 h-5 text-urbe-primary" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Motor del Asistente Virtual IA</h4>
                <span className="text-[10px] text-slate-400 font-medium">Motor local o LLM configurado en el servidor</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 w-fit">
              {aiProvider === 'local_rules' ? '⚡ Motor Local (0 Costo)' : '🤖 LLM del servidor'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Proveedor de Inteligencia Artificial
              </label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as AiProviderType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="local_rules">⚡ Motor Local Experto (Gratis, Ilimitado, Ultrarrápido - Ideal Demo)</option>
                <option value="server">🤖 LLM del servidor (requiere configurar el endpoint /api/chat)</option>
              </select>
            </div>

          </div>

          <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
            La clave del proveedor, el modelo y las instrucciones del asistente se configuran en el servidor (variables LLM_API_KEY, AI_PROVIDER y AI_MODEL). Nunca se guardan en el navegador.
          </p>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveIntegrations}
              className="px-5 py-2.5 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold shadow transition-colors"
            >
              {saveSuccessMsg ? '¡Configuración IA Guardada!' : 'Guardar Ajustes de IA'}
            </button>
          </div>
        </div>

        {/* Financial Parameters */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 space-y-4 max-w-xl">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-urbe-primary" />
            Parámetros Financieros Globales
          </h4>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Valor Actual de la UF ($ CLP)
            </label>
            <input
              type="number"
              value={currentUf}
              onChange={(e) => {
                setCurrentUf(Number(e.target.value));
                agencyConfig.market.ufValueClp = Number(e.target.value);
              }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-urbe-primary"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Actualiza en vivo todos los precios calculados en pesos chilenos y simulaciones de crédito en todo el portal.
            </p>
          </div>
        </div>

        <TeamSection />
        <ServiceAreasSection />
        <PublicationModeSection />
        <DataExportSection />
        <PlatformSection />
      </div>
  );
};
