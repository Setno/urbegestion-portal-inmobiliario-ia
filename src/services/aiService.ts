import { Property } from '../types/property';
import { agencyConfig } from '../config/agencyConfig';
import { useLeadStore } from '../stores/useLeadStore';

interface AiResponseResult {
  text: string;
  suggestedProperties?: string[];
  actionRequired?: 'select_date' | 'provide_contact' | 'view_properties';
  leadCreated?: boolean;
}

export function processAiChatMessage(
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
      text: `En UrbeGestión contamos con más de 25 años de experiencia valorando y comercializando inmuebles urbanos y agrícolas en la Región Metropolitana con un tiempo promedio de venta de 42 días.\n\nTe invitamos a utilizar nuestra sección "Vende con Nosotros" o ingresar tu teléfono para que Pilar Osorio te contacte con un estudio de mercado comparativo preliminar sin costo.`,
      actionRequired: 'provide_contact',
    };
  }

  // 3. Detección de intención: Crédito hipotecario / Dividendo / UF
  if (
    query.includes('dividendo') || 
    query.includes('credito') || 
    query.includes('hipotecario') || 
    query.includes('banco') ||
    query.includes('uf') ||
    query.includes('pie')
  ) {
    const ufVal = agencyConfig.market.ufValueClp.toLocaleString('es-CL');
    return {
      text: `Actualmente el valor de la UF referencial es de $${ufVal} CLP. En nuestro simulador hipotecario integrado (ubicado en la ficha de cada propiedad) puedes calcular el dividendo mensual exacto según el plazo (15, 20 o 25 años) y el porcentaje de pie (desde 10% a 30%).\n\n¿Deseas que te recomendemos propiedades dentro de un valor de cuota específico?`,
    };
  }

  // 4. Búsqueda por comuna o tipo de propiedad
  const matchedProps = properties.filter((p) => {
    const matchesCommune = query.includes(p.commune.toLowerCase()) || 
      (p.commune.toLowerCase().includes('melipilla') && (query.includes('melipilla') || query.includes('agricola') || query.includes('campo') || query.includes('parcela'))) ||
      (p.commune.toLowerCase().includes('las condes') && (query.includes('las condes') || query.includes('golf') || query.includes('manquehue'))) ||
      (p.commune.toLowerCase().includes('vitacura') && query.includes('vitacura')) ||
      (p.commune.toLowerCase().includes('barnechea') && (query.includes('barnechea') || query.includes('dehesa') || query.includes('trapenses'))) ||
      (p.commune.toLowerCase().includes('pirque') && (query.includes('pirque') || query.includes('paine'))) ||
      (p.commune.toLowerCase().includes('providencia') && query.includes('providencia')) ||
      (p.commune.toLowerCase().includes('chicureo') && (query.includes('chicureo') || query.includes('colina') || query.includes('chamisero')));

    const matchesType = (query.includes('casa') && p.propertyType === 'casa') ||
      (query.includes('depto') && p.propertyType === 'departamento') ||
      (query.includes('departamento') && p.propertyType === 'departamento') ||
      (query.includes('parcela') && p.propertyType === 'parcela_agricola') ||
      (query.includes('oficina') && p.propertyType === 'oficina_comercial');

    const matchesOperation = (query.includes('arriendo') && p.operation === 'arriendo') ||
      (query.includes('venta') || query.includes('comprar') && p.operation === 'venta');

    return matchesCommune || matchesType || matchesOperation;
  });

  if (matchedProps.length > 0) {
    const topMatches = matchedProps.slice(0, 3);
    const names = topMatches.map(p => `• **${p.title}** (${p.commune}) - ${p.priceUf.toLocaleString('es-CL')} UF`).join('\n');
    
    return {
      text: `He encontrado opciones destacadas en nuestro inventario que coinciden con lo que buscas:\n\n${names}\n\nPuedes hacer clic sobre cualquiera de ellas para ver la ficha técnica completa, fotos en alta resolución o calcular el dividendo. ¿Te gustaría coordinar una visita a alguna de ellas?`,
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
  const addLead = useLeadStore.getState().addLead;
  
  return addLead({
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
