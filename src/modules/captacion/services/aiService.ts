import { Property } from '../../catalogo/types/property';
import { agencyConfig } from '../../../core/config/agencyConfig';
import { emitLeadCreated } from '../../../core/events/appEvents';

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

const DEFAULT_SYSTEM_PROMPT = `Eres UrbeBot Concierge, el asistente inmobiliario de alta gama para la corredora de propiedades UrbeGestión (liderada por Pilar Osorio con más de 25 años de experiencia en Santiago de Chile y propiedades agrícolas). 
Tu objetivo es asesorar con amabilidad y elegancia a compradores, arrendatarios y propietarios, responder dudas sobre precios en UF y financiamiento hipotecario, y calificar al prospecto para agendar una visita privada con Pilar Osorio.`;

export function getAiConfig(): AiModelConfig {
  const env = (import.meta as any).env || {};
  const savedProvider = localStorage.getItem('urbe_ai_provider') as AiProviderType;
  return { provider: savedProvider || (env.VITE_AI_PROVIDER === 'server' ? 'server' : 'local_rules') };
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
    return { text: 'Por favor escribe tu consulta sobre nuestras propiedades.' };
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
    price: `${p.priceUf} UF`,
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

  // 1. Detección de intención: Agendar visita
  if (
    query.includes('agendar') || 
    query.includes('visita') || 
    query.includes('cita') || 
    query.includes('reunión') ||
    query.includes('ver la propiedad') ||
    query.includes('coordinar')
  ) {
    return {
      text: `¡Excelente iniciativa! En UrbeGestión coordinamos visitas guiadas y privadas. Para asegurar la disponibilidad de Pilar Osorio, ¿qué día y hora te acomoda mejor? También puedes ingresar tus datos a continuación para registrar la reserva en nuestra agenda.`,
      actionRequired: 'select_date',
    };
  }

  // 2. Detección de intención: Vender / Tasar / Propietario
  if (
    query.includes('vender') || 
    query.includes('tasar') || 
    query.includes('tasacion') || 
    query.includes('mi propiedad') || 
    query.includes('comision') ||
    query.includes('poner en arriendo')
  ) {
    return {
      text: `En UrbeGestión contamos con más de 25 años de experiencia valorando y comercializando inmuebles urbanos y agrícolas en la Región Metropolitana con un tiempo promedio de venta de 42 días.\n\nTe invitamos a utilizar nuestra sección "Vende con Nosotros" para subir fotos desde tu celular o ingresar tu teléfono para que Pilar Osorio te contacte con un estudio de mercado sin costo.`,
      actionRequired: 'provide_contact',
    };
  }

  // 3. Consulta de financiamiento: no se evalúa crédito aquí (lo hace el banco); se deriva al contacto
  if (/\b(dividendo|credito|hipotecari[oa]s?|banco|bancos|pie)\b/.test(sinTildes(query))) {
    return {
      text: `El financiamiento y la evaluación del crédito los realiza tu banco, así que no podemos simularlo por aquí. Lo que sí hacemos es mostrarte la propiedad, coordinar una visita y acompañarte en el proceso.

Déjanos tus datos y ${agencyConfig.brokerName} te contactará para ayudarte.`,
      actionRequired: 'provide_contact',
    };
  }

  // 4. Búsqueda por comuna, tipo y operación: lo que el usuario menciona debe cumplirse (no basta una coincidencia)
  const communeAliases: Record<string, string[]> = {
    melipilla: ['melipilla'],
    'las condes': ['las condes', 'golf', 'manquehue'],
    vitacura: ['vitacura'],
    barnechea: ['barnechea', 'dehesa', 'trapenses'],
    pirque: ['pirque', 'paine'],
    providencia: ['providencia'],
    chicureo: ['chicureo', 'colina', 'chamisero'],
  };
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
    casa: ['casa'],
    departamento: ['depto', 'departamento'],
    parcela_agricola: ['parcela', 'agricola', 'campo'],
    oficina_comercial: ['oficina'],
  };
  const mentionedTypes = Object.entries(typeWords)
    .filter(([, words]) => words.some((w) => query.includes(w)))
    .map(([type]) => type);
  const mentionedOperations = [
    query.includes('arriendo') ? 'arriendo' : null,
    query.includes('venta') || query.includes('comprar') ? 'venta' : null,
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
    const names = topMatches.map(p => `• **${p.title}** (${p.commune}) - ${p.priceUf.toLocaleString('es-CL')} UF`).join('\n');
    
    return {
      text: `He encontrado opciones destacadas en nuestro inventario que coinciden con lo que buscas:\n\n${names}\n\nPuedes hacer clic sobre cualquiera de ellas para ver la ficha técnica completa, fotos en alta resolución. ¿Te gustaría coordinar una visita a alguna de ellas?`,
      suggestedProperties: topMatches.map(p => p.id),
      actionRequired: 'view_properties',
    };
  }

  // 5. Consulta por contacto / teléfono / oficina
  if (
    query.includes('telefono') || 
    query.includes('whatsapp') || 
    query.includes('contacto') || 
    query.includes('correo') ||
    query.includes('donde estan')
  ) {
    return {
      text: `Puedes comunicarte de manera directa con **Pilar Osorio** al teléfono o WhatsApp **${agencyConfig.contact.phoneDisplay}** o escribir a **${agencyConfig.contact.email}**.\n\nHorario de atención: ${agencyConfig.contact.schedule}.`,
      actionRequired: 'provide_contact',
    };
  }

  // 6. Respuesta por defecto consultiva y proactiva
  return {
    text: `Comprendo perfectamente. En UrbeGestión tenemos propiedades exclusivas tanto en arriendo como en venta en sectores de alta plusvalía de Santiago (Las Condes, Vitacura, La Dehesa, Chicureo) y parcelas agrícolas con derechos de agua en Melipilla y Pirque.\n\n¿Tienes alguna comuna o presupuesto aproximado en mente para mostrarte las mejores opciones?`,
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
  });
}
