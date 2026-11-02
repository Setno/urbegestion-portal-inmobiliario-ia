import type { ComponentType } from 'react';
import { DEFAULT_TEMPLATE_ID, type SiteData } from '@portal/sitio-datos';
import { Clasica } from './Clasica';

export type Plantilla = ComponentType<{ site: SiteData }>;

// Plantillas disponibles. Todas reciben los mismos datos, así cambiar de plantilla no pierde nada (H-029).
const PLANTILLAS: Record<string, Plantilla> = {
  [DEFAULT_TEMPLATE_ID]: Clasica,
};

export function resolvePlantilla(templateId: string): Plantilla {
  return Object.prototype.hasOwnProperty.call(PLANTILLAS, templateId) ? PLANTILLAS[templateId] : PLANTILLAS[DEFAULT_TEMPLATE_ID];
}
