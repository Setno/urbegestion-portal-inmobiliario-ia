// Atribución de un lead (H-058): de qué fuente, medio y campaña llegó la persona al sitio.
// Son los parámetros utm_source, utm_medium y utm_campaign de los enlaces de los anuncios. No llevan datos personales.

export interface Atribucion {
  fuente?: string;
  medio?: string;
  campana?: string;
}

export const COOKIE_ATRIBUCION = 'atribucion';
export const DURACION_COOKIE_SEGUNDOS = 30 * 24 * 60 * 60;
// Lo que se muestra cuando el lead no trae campaña.
export const ETIQUETA_DIRECTO = 'Directo';

const LARGO_MAXIMO = 80;
const CLAVES = ['fuente', 'medio', 'campana'] as const;

// Lo escribe cualquier visitante y termina en planillas y pantallas: solo letras, números y unos pocos signos.
const limpiarTexto = (valor: unknown): string | undefined => {
  if (typeof valor !== 'string') return undefined;
  const limpio = valor.replace(/[^\p{L}\p{N} _.+:/-]/gu, '').trim().slice(0, LARGO_MAXIMO);
  return limpio || undefined;
};

export function limpiarAtribucion(valor: unknown): Atribucion | null {
  if (!valor || typeof valor !== 'object') return null;
  const origen = valor as Record<string, unknown>;
  const salida: Atribucion = {};
  for (const clave of CLAVES) {
    const texto = limpiarTexto(origen[clave]);
    if (texto) salida[clave] = texto;
  }
  return Object.keys(salida).length > 0 ? salida : null;
}

export function atribucionDeBusqueda(params: { get: (nombre: string) => string | null }): Atribucion | null {
  return limpiarAtribucion({
    fuente: params.get('utm_source'),
    medio: params.get('utm_medium'),
    campana: params.get('utm_campaign'),
  });
}

export const aCookie = (a: Atribucion): string => encodeURIComponent(JSON.stringify(a));

export function deCookie(valor: string | undefined): Atribucion | null {
  if (!valor) return null;
  try {
    return limpiarAtribucion(JSON.parse(decodeURIComponent(valor)));
  } catch {
    return null;
  }
}

// Texto corto para mostrar en el CRM: "google / cpc / verano_2026" o "Directo".
export function describirAtribucion(a: Atribucion | null | undefined): string {
  if (!a) return ETIQUETA_DIRECTO;
  const partes = [a.fuente, a.medio, a.campana].filter(Boolean);
  return partes.length > 0 ? partes.join(' / ') : ETIQUETA_DIRECTO;
}

// Para armar la fila del lead: la columna solo se envía si hay algo que guardar.
// El modelo es de último toque: un nuevo enlace con utm reemplaza al anterior.
export const conAtribucion = (valor: unknown): { attribution?: Atribucion } => {
  const limpia = limpiarAtribucion(valor);
  return limpia ? { attribution: limpia } : {};
};
