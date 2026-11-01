import type { Lead } from '../types/lead';
import type { OperationType, Property, PropertyType } from '../../catalogo/types/property';

const PROPERTY_TYPES: PropertyType[] = ['departamento', 'casa', 'parcela_agricola', 'oficina_comercial', 'terreno'];

const toNumber = (value: string | undefined): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// Lo que envía un propietario es una primera impresión: la propiedad nace como borrador, sin precio ni
// dirección ni fotos del propietario. La corredora completa los datos y sube sus propias fotos antes de publicar.
export function buildPropertyFromLead(lead: Lead): Omit<Property, 'id' | 'createdAt'> {
  const specs = lead.propertySpecs ?? {};
  const propertyType = PROPERTY_TYPES.includes(specs.propertyType as PropertyType)
    ? (specs.propertyType as PropertyType)
    : 'casa';
  const operation: OperationType = specs.operation === 'arriendo' ? 'arriendo' : 'venta';
  const commune = specs.commune?.trim() || 'Sin comuna';
  const label = propertyType.replace('_', ' ');

  return {
    title: `${label.charAt(0).toUpperCase()}${label.slice(1)} en ${commune}`,
    operation,
    propertyType,
    priceUf: 0,
    commune,
    address: '',
    bedrooms: toNumber(specs.bedrooms),
    bathrooms: 0,
    builtAreaM2: 0,
    totalAreaM2: toNumber(specs.areaM2),
    parkingSpots: 0,
    storageUnits: 0,
    featured: false,
    status: 'disponible',
    images: [],
    description: `Borrador creado desde el contacto de ${lead.fullName}. Completa precio, dirección, descripción y fotos propias antes de publicar.`,
    features: [],
    publicationStatus: 'borrador',
  };
}
