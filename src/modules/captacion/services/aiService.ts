import { canNow } from '../../../core/platform/useEntitlementsStore';
import { Property } from '../../catalogo/types/property';
import { agencyConfig } from '../../../core/config/agencyConfig';
import { emitLeadCreated } from '../../../core/events/appEvents';
import { useMarketStore, marketView } from '../../../core/market/useMarketStore';
import { t } from '../../../core/i18n/i18n';
import { featuredLocalities } from '../../catalogo/services/propertySummary';
import { priceOf } from '../../catalogo/services/propertyPrice';
import { formatMoney } from '../../../core/money/money';
import { getMarketPack } from '../../../markets';
import type { LeadPrivacyNotice } from '../../crm/types/lead';

export type AiProviderType = 'local_rules' | 'server';

export interface AiModelConfig {
  provider: AiProviderType;
}

export interface AiResponseResult {
  text: string;
  suggestedProperties?: string[];
  actionRequired?: 'select_date' | 'provide_contact' | 'view_properties';
  leadCreated?: boolean;
}

export function getAiConfig(): AiModelConfig {
  const env = import.meta.env;
  const savedProvider = localStorage.getItem('urbe_ai_provider') as AiProviderType;
  const provider = savedProvider || (env.VITE_AI_PROVIDER === 'server' ? 'server' : 'local_rules');
  // Si el plan no incluye el modelo de lenguaje en el servidor, el asistente usa el motor local (ADR-009)
  return { provider: provider === 'server' && !canNow('ai.llm_server') ? 'local_rules' : provider };
}

export function saveAiConfig(config: Partial<AiModelConfig>): void {
  if (config.provider) localStorage.setItem('urbe_ai_provider', config.provider);
}

/**
 * Main AI Message Processing Gateway (Local Heuristic Engine or Live LLM API)
 */
export async function processAiChatMessage(
  userText: string,
  properties: Property[]
): Promise<AiResponseResult> {
  const sanitizedText = userText.trim().slice(0, 500);
  if (!sanitizedText) {
    return { text: t('chat.reply.empty') };
  }

  const config = getAiConfig();

  // Si el LLM del servidor está activo, se consulta /api/chat (la clave nunca está en el navegador)
  if (config.provider === 'server') {
    try {
      const llmResponse = await callLlmApi(sanitizedText, properties);
      if (llmResponse) return llmResponse;
    } catch (err) {
      console.warn('[AI Service] Fallback to local heuristic engine:', err);
    }
  }

  // Fast, zero-cost, context-aware local real estate engine
  return processLocalRuleEngine(sanitizedText, properties);
}

/**
 * Live LLM Gateway: llama a la función serverless /api/chat
 */
async function callLlmApi(
  userText: string,
  properties: Property[]
): Promise<AiResponseResult | null> {
  const catalog = properties.map(p => ({
    id: p.id,
    title: p.title,
    propertyType: p.propertyType,
    commune: p.commune,
    price: formatMoney(priceOf(p), getMarketPack(useMarketStore.getState().marketId)),
    specs: `${p.bedrooms} dorm, ${p.bathrooms} baños, ${p.builtAreaM2 || p.totalAreaM2} m²`,
    operation: p.operation,
  }));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: userText, catalog }),
    });

    if (!response.ok) {
      throw new Error(`LLM endpoint returned status ${response.status}`);
    }

    const data = await response.json();
    const replyText: string = data.reply || '';
    if (!replyText) return null;

    // Extract property matches
    const matchedIds = properties
      .filter(p => replyText.toLowerCase().includes(p.commune.toLowerCase()) || replyText.includes(p.id))
      .slice(0, 3)
      .map(p => p.id);

    return {
      text: replyText,
      suggestedProperties: matchedIds.length > 0 ? matchedIds : undefined,
      actionRequired: replyText.toLowerCase().includes('visita') || replyText.toLowerCase().includes('agendar')
        ? 'select_date'
        : undefined
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Local Context-Aware Real Estate Engine
 */
const sinTildes = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function processLocalRuleEngine(
  userText: string,
  properties: Property[]
): AiResponseResult {
  const query = userText.toLowerCase().trim();

  // Las palabras clave se reconocen en español y en inglés, sea cual sea el idioma de la interfaz
  // (una persona puede escribir en un idioma y leer en otro); la respuesta sale en el idioma activo.
  const has = (...words: string[]) => words.some((w) => query.includes(w));
  const brand = agencyConfig.brandName;
  const broker = agencyConfig.brokerName;
  const view = marketView(useMarketStore.getState().marketId, useMarketStore.getState().serviceAreas);

  // 1. Detección de intención: Agendar visita
  if (has('agendar', 'visita', 'cita', 'reunión', 'ver la propiedad', 'coordinar', 'schedule', 'book', 'appointment', 'visit', 'viewing', 'meeting')) {
    return { text: t('chat.reply.schedule', { brand, broker }), actionRequired: 'select_date' };
  }

  // 2. Detección de intención: Vender / Tasar / Propietario
  if (has('vender', 'tasar', 'tasacion', 'mi propiedad', 'comision', 'poner en arriendo', 'sell', 'appraisal', 'valuation', 'my property', 'commission', 'rent out')) {
    return {
      text: t('chat.reply.sell', { brand, broker, scope: view.scopeLabel, section: t('nav.sell') }),
      actionRequired: 'provide_contact',
    };
  }

  // 3. Consulta de financiamiento: no se evalúa crédito aquí (lo hace el banco); se deriva al contacto
  if (/\b(dividendo|credito|hipotecari[oa]s?|banco|bancos|pie|mortgage|loan|credit|bank|banks|down payment)\b/.test(sinTildes(query))) {
    return { text: t('chat.reply.finance', { broker }), actionRequired: 'provide_contact' };
  }

  // 4. Búsqueda por comuna, tipo y operación: lo que el usuario menciona debe cumplirse (no basta una coincidencia)
  // Los alias de las comunas ("golf" para Las Condes) los define el paquete de mercado de la corredora.
  const { pack } = view;
  const communeAliases = pack.localityAliases;
  const communeMatches = (p: Property) => {
    const commune = p.commune.toLowerCase();
    return (
      query.includes(commune) ||
      Object.entries(communeAliases).some(
        ([key, words]) => commune.includes(key) && words.some((w) => query.includes(w))
      )
    );
  };
  const typeWords: Record<string, string[]> = {
    casa: ['casa', 'house', 'home'],
    departamento: ['depto', 'departamento', 'apartment', 'flat'],
    parcela_agricola: ['parcela', 'agricola', 'campo', 'farm', 'plot'],
    oficina_comercial: ['oficina', 'office'],
  };
  const mentionedTypes = Object.entries(typeWords)
    .filter(([, words]) => words.some((w) => query.includes(w)))
    .map(([type]) => type);
  const mentionedOperations = [
    has('arriendo', 'rent') ? 'arriendo' : null,
    has('venta', 'comprar', 'for sale', 'buy') ? 'venta' : null,
  ].filter(Boolean);
  const mentionsCommune = properties.some(communeMatches);

  const matchedProps =
    mentionsCommune || mentionedTypes.length > 0 || mentionedOperations.length > 0
      ? properties.filter(
          (p) =>
            (!mentionsCommune || communeMatches(p)) &&
            (mentionedTypes.length === 0 || mentionedTypes.includes(p.propertyType)) &&
            (mentionedOperations.length === 0 || mentionedOperations.includes(p.operation))
        )
      : [];

  if (matchedProps.length > 0) {
    const topMatches = matchedProps.slice(0, 3);
    const names = topMatches.map(p => `• **${p.title}** (${p.commune}) - ${formatMoney(priceOf(p), pack)}`).join('\n');
    
    return {
      text: t('chat.reply.matches', { names }),
      suggestedProperties: topMatches.map(p => p.id),
      actionRequired: 'view_properties',
    };
  }

  // 5. Consulta por contacto / teléfono / oficina
  if (has('telefono', 'whatsapp', 'contacto', 'correo', 'donde estan', 'phone', 'contact', 'email', 'where are you')) {
    return {
      text: t('chat.reply.contact', {
        broker,
        phone: agencyConfig.contact.phoneDisplay,
        email: agencyConfig.contact.email,
        schedule: agencyConfig.contact.schedule,
      }),
      actionRequired: 'provide_contact',
    };
  }

  // 6. Respuesta por defecto consultiva y proactiva: nombra las comunas donde hay propiedades publicadas
  const names = featuredLocalities(properties, 4);
  const places = names.length > 1 ? `${names.slice(0, -1).join(', ')} ${t('list.and')} ${names[names.length - 1]}` : (names[0] ?? '');
  return {
    text: t('chat.reply.default', { brand, places: places || view.scopeLabel, locality: t('market.locality') }),
  };
}

export function registerLeadFromChat(
  name: string, 
  phone: string, 
  email: string, 
  details?: {
    propertyTitle?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    notes?: string;
    privacyNotice?: LeadPrivacyNotice;
  }
) {
  emitLeadCreated({
    fullName: name,
    email: email || 'sin-correo@solicitud.cl',
    phone: phone,
    propertyTitle: details?.propertyTitle || 'Consulta General por Catálogo',
    operationInterest: 'compra',
    status: details?.appointmentDate ? 'visita_agendada' : 'nuevo',
    appointmentDate: details?.appointmentDate,
    appointmentTime: details?.appointmentTime,
    notes: details?.notes ? [details.notes] : ['Lead generado a través del Asistente Virtual UrbeBot'],
    source: 'asistente_ia',
    privacyNotice: details?.privacyNotice,
  });
}
