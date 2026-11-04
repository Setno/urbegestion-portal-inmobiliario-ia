import type { ComponentType } from 'react';
import { DEFAULT_TEMPLATE_ID, type SiteData } from '@portal/sitio-datos';
import type { PublicCatalog, PublicProperty } from '@portal/sitio-datos/propiedades';
import type { EnviarTasacion } from '../lib/tasacion';
import type { EnviarVisita } from '../lib/visita';
import { Clasica } from './Clasica';
import { FichaClasica } from './clasica/FichaPropiedad';

export type Plantilla = ComponentType<{ site: SiteData; catalogo: PublicCatalog; enviarTasacion?: EnviarTasacion }>;

// Plantillas disponibles. Todas reciben los mismos datos, así cambiar de plantilla no pierde nada (H-029).
const PLANTILLAS: Record<string, Plantilla> = {
  [DEFAULT_TEMPLATE_ID]: Clasica,
};

export function resolvePlantilla(templateId: string): Plantilla {
  return Object.prototype.hasOwnProperty.call(PLANTILLAS, templateId) ? PLANTILLAS[templateId] : PLANTILLAS[DEFAULT_TEMPLATE_ID];
}

export type PlantillaFicha = ComponentType<{ site: SiteData; propiedad: PublicProperty; marketId: string; enviarVisita: EnviarVisita }>;

const FICHAS: Record<string, PlantillaFicha> = {
  [DEFAULT_TEMPLATE_ID]: FichaClasica,
};

export function resolveFicha(templateId: string): PlantillaFicha {
  return Object.prototype.hasOwnProperty.call(FICHAS, templateId) ? FICHAS[templateId] : FICHAS[DEFAULT_TEMPLATE_ID];
}
