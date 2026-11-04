import { getMarketPack } from '@portal/mercados';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';

// Motor local del asistente del sitio: reglas simples, sin costo y sin enviar nada a un servicio externo.
// Solo recomienda lo que la corredora tiene publicado; lo que no entiende lo deriva a una persona.

export interface ContextoAsistente {
  corredora: string;
  corredor: string;
  telefono: string;
  correo: string;
  marketId: string;
  // La sección de tasación existe en la página (el plan incluye el valorizador).
  conTasacion: boolean;
}

export interface Respuesta {
  texto: string;
  propiedades: string[];
  pedirContacto: boolean;
}

const MAXIMO_OPCIONES = 3;

const normaliza = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

// La comuna sin el detalle entre paréntesis: "Lo Barnechea (La Dehesa / Los Trapenses)" → "Lo Barnechea".
const nombreComuna = (comuna: string): string => comuna.split('(')[0].trim();

const TIPOS: Record<string, string[]> = {
  casa: ['casa'],
  departamento: ['depto', 'departamento'],
  parcela_agricola: ['parcela', 'agricola', 'campo'],
  oficina_comercial: ['oficina', 'local comercial'],
};

const quien = (ctx: ContextoAsistente): string => ctx.corredor || 'la corredora';

export function bienvenida(ctx: ContextoAsistente): string {
  return `¡Hola! Soy el asistente de ${ctx.corredora}. Puedo ayudarte a encontrar la propiedad ideal o a vender o arrendar la tuya.\n\n¿Qué tipo de propiedad buscas y en qué comuna?`;
}

function comunasConPropiedades(propiedades: PublicProperty[], limite: number): string[] {
  const vistas = new Map<string, string>();
  for (const p of propiedades) {
    const nombre = nombreComuna(p.commune);
    if (nombre && !vistas.has(normaliza(nombre))) vistas.set(normaliza(nombre), nombre);
  }
  return [...vistas.values()].slice(0, limite);
}

export function sugerencias(propiedades: PublicProperty[], ctx: ContextoAsistente): string[] {
  return [
    ...comunasConPropiedades(propiedades, 2).map((comuna) => `Propiedades en ${comuna}`),
    'Agendar visita',
    ...(ctx.conTasacion ? ['Vender mi propiedad'] : []),
  ];
}

export function responder(consulta: string, propiedades: PublicProperty[], ctx: ContextoAsistente): Respuesta {
  const q = normaliza(consulta.slice(0, 500)).trim();
  const respuesta = (texto: string, extra: Partial<Respuesta> = {}): Respuesta => ({ texto, propiedades: [], pedirContacto: false, ...extra });
  if (!q) return respuesta('Escribe tu consulta sobre nuestras propiedades.');

  const tiene = (...palabras: string[]) => palabras.some((w) => q.includes(w));
  const enteras = (patron: RegExp) => patron.test(q);

  // 1. Agendar una visita
  if (tiene('agendar', 'visita', 'reunion', 'ver la propiedad', 'coordinar') || enteras(/\bcita\b/)) {
    return respuesta(
      `¡Excelente! En ${ctx.corredora} coordinamos visitas guiadas. Déjanos tus datos y la fecha que te acomode, y ${quien(ctx)} te contactará para confirmar.`,
      { pedirContacto: true },
    );
  }

  // 2. Vender o tasar
  if (tiene('vender', 'tasar', 'tasacion', 'mi propiedad', 'comision', 'poner en arriendo')) {
    if (ctx.conTasacion) {
      return respuesta(
        `En ${ctx.corredora} valoramos y comercializamos propiedades. En esta página, más abajo, está la sección "¿Quieres vender o arrendar tu propiedad?": deja los datos de tu propiedad y ${quien(ctx)} te contactará para una tasación sin costo.`,
      );
    }
    return respuesta(`En ${ctx.corredora} valoramos y comercializamos propiedades. Déjanos tus datos y ${quien(ctx)} te contactará para una tasación sin costo.`, {
      pedirContacto: true,
    });
  }

  // 3. Financiamiento: no se evalúa crédito aquí (lo hace el banco); se deriva a una persona
  if (enteras(/\b(dividendo|credito|hipotecari[oa]s?|banco|bancos|pie)\b/)) {
    return respuesta(
      `El financiamiento y la evaluación del crédito los realiza tu banco, así que no podemos simularlo por aquí. Lo que sí hacemos es mostrarte la propiedad, coordinar una visita y acompañarte en el proceso.\n\nDéjanos tus datos y ${quien(ctx)} te contactará para ayudarte.`,
      { pedirContacto: true },
    );
  }

  // 4. Búsqueda: lo que la persona menciona debe cumplirse (no basta una coincidencia)
  const alias = getMarketPack(ctx.marketId).localityAliases;
  const coincideComuna = (p: PublicProperty): boolean => {
    const base = normaliza(nombreComuna(p.commune));
    if (!base) return false;
    return q.includes(base) || Object.entries(alias).some(([clave, palabras]) => base.includes(clave) && palabras.some((w) => q.includes(w)));
  };
  const tipos = Object.entries(TIPOS)
    .filter(([, palabras]) => palabras.some((w) => q.includes(w)))
    .map(([tipo]) => tipo);
  const operaciones = [tiene('arriendo', 'arrendar') ? 'arriendo' : null, tiene('venta', 'comprar', 'compra') ? 'venta' : null].filter(Boolean);
  const mencionaComuna = propiedades.some(coincideComuna);

  if (mencionaComuna || tipos.length > 0 || operaciones.length > 0) {
    const coinciden = propiedades.filter(
      (p) =>
        (!mencionaComuna || coincideComuna(p)) &&
        (tipos.length === 0 || tipos.includes(p.propertyType)) &&
        (operaciones.length === 0 || operaciones.includes(p.operation)),
    );
    if (coinciden.length > 0) {
      const elegidas = coinciden.slice(0, MAXIMO_OPCIONES);
      const n = elegidas.length;
      return respuesta(
        `Encontré ${n} ${n === 1 ? 'opción que coincide' : 'opciones que coinciden'} con lo que buscas. Toca una para ver su ficha completa. ¿Te gustaría coordinar una visita?`,
        { propiedades: elegidas.map((p) => p.id) },
      );
    }
    // Pidió algo concreto y no hay: se dice con claridad y se ofrece avisarle, en vez de mostrar otra cosa.
    return respuesta(
      `Por ahora no tengo publicado algo que coincida con lo que buscas. Déjanos tus datos y ${quien(ctx)} te avisará cuando haya algo parecido o te ayudará a buscar.`,
      { pedirContacto: true },
    );
  }

  // 5. Contacto directo
  if (tiene('telefono', 'whatsapp', 'contacto', 'correo', 'donde estan', 'horario')) {
    const datos = [ctx.telefono && `teléfono o WhatsApp ${ctx.telefono}`, ctx.correo && `correo ${ctx.correo}`].filter(Boolean);
    return respuesta(
      datos.length > 0
        ? `Puedes comunicarte directamente con ${quien(ctx)}: ${datos.join(' o por ')}.`
        : `Déjanos tus datos y ${quien(ctx)} te contactará.`,
      { pedirContacto: true },
    );
  }

  // 6. Respuesta por defecto: nombra las comunas donde hay propiedades publicadas, sin inventar nada
  const comunas = comunasConPropiedades(propiedades, 4);
  const lugares = comunas.length > 1 ? `${comunas.slice(0, -1).join(', ')} y ${comunas[comunas.length - 1]}` : (comunas[0] ?? '');
  return respuesta(
    `En ${ctx.corredora} tenemos propiedades en venta y en arriendo${lugares ? ` en ${lugares}` : ''}.\n\n¿Qué tipo de propiedad y en qué comuna te gustaría? También puedes agendar una visita.`,
  );
}
