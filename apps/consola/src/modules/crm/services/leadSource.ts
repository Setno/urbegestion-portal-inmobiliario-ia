// Cómo se nombra, en pantalla, el origen de un lead (la columna `source` de la base).
const ETIQUETAS: Record<string, string> = {
  asistente_ia: 'Asistente IA',
  ficha_propiedad: 'Ficha de propiedad',
  formulario_contacto: 'Formulario de contacto',
  captacion_propietarios: 'Propietario',
};

export const sourceLabel = (source: string): string => {
  if (!source) return 'Sin origen';
  if (Object.prototype.hasOwnProperty.call(ETIQUETAS, source)) return ETIQUETAS[source];
  const texto = source.replace(/_/g, ' ').trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

// De dónde llegó el contacto según los parámetros utm del enlace: "google / cpc / verano" o "Directo" (H-058).
export { describirAtribucion as attributionLabel } from '@portal/sitio-datos/atribucion';
