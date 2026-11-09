// Traductor de una propiedad al aviso de Mercado Libre / Portal Inmobiliario (H-068.1).
// Código puro, sin red ni dependencias: recibe los datos y devuelve el aviso o los motivos por los que no se puede armar.
// Lo que depende de la cuenta (categorías de Chile, tipo de aviso) entra por `opciones`; no se inventa ningún ID.
// Pendiente de H-068.3: validar el resultado con /items/validate y los IDs de atributo con /categories/{id}/attributes
// (BEDROOMS, FULL_BATHROOMS, PARKING_LOTS, COVERED_AREA y TOTAL_AREA salen de un ejemplo de la documentación, sin verificar para Chile).
// Límites conocidos: la comuna y las bodegas aún no se envían; un valor en cero (por ejemplo 0 dormitorios de un estudio) se omite.

export type Operacion = 'venta' | 'arriendo';

// Solo los campos de la propiedad que el aviso necesita (no depende del módulo de catálogo).
export interface PropiedadParaPortal {
  title: string;
  operation: Operacion;
  propertyType: string;
  priceAmount: number;
  priceCurrency: string;
  commune: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  builtAreaM2: number;
  totalAreaM2: number;
  parkingSpots: number;
  storageUnits: number;
  images: string[];
  description: string;
  features: string[];
  coordinates?: { lat: number; lng: number };
}

export interface OpcionesMercadoLibre {
  // Categoría de Mercado Libre por "operación:tipo" (por ejemplo "venta:departamento"). Se obtiene de su API de categorías.
  categories: Record<string, string>;
  // Valor de 1 unidad de cada moneda en pesos chilenos (en Chile: { UF: 38650 }). El peso vale 1.
  rates: Record<string, number>;
  listingTypeId?: string; // por defecto "silver"
}

export interface AtributoML {
  id: string;
  value_name?: string;
  value_struct?: { number: number; unit: string };
}

export interface AvisoMercadoLibre {
  title: string;
  category_id: string;
  price: number;
  currency_id: 'CLP';
  buying_mode: 'classified';
  listing_type_id: string;
  channels: string[];
  pictures: { source: string }[];
  attributes: AtributoML[];
  location: { address_line?: string; latitude?: number; longitude?: number };
}

export type ResultadoAviso =
  | { ok: true; item: AvisoMercadoLibre; description: string }
  | { ok: false; errors: string[] };

const MAX_TITULO = 60;

const esFotoPublica = (url: string): boolean => /^https?:\/\//i.test(url.trim());

const esPositivo = (n: number): boolean => Number.isFinite(n) && n > 0;

// Precio en pesos redondeado; sin tasa válida para la moneda del precio no se inventa la conversión.
function precioEnPesos(monto: number, moneda: string, rates: Record<string, number>): number | null {
  if (!esPositivo(monto)) return null;
  const codigo = moneda.trim().toUpperCase();
  const tasa = codigo === 'CLP' ? 1 : rates[codigo];
  if (!esPositivo(tasa)) return null;
  const pesos = Math.round(monto * tasa);
  return Number.isFinite(pesos) && pesos >= 1 ? pesos : null;
}

const conteo = (id: string, n: number): AtributoML[] =>
  esPositivo(n) ? [{ id, value_name: String(Math.round(n)) }] : [];
const superficie = (id: string, m2: number): AtributoML[] =>
  esPositivo(m2) ? [{ id, value_struct: { number: m2, unit: 'm²' } }] : [];

function armarDescripcion(p: PropiedadParaPortal): string {
  const partes = [p.description.trim()];
  const caracteristicas = p.features.map((f) => f.trim()).filter(Boolean);
  if (caracteristicas.length > 0) partes.push(`Características: ${caracteristicas.join(', ')}.`);
  return partes.filter(Boolean).join('\n\n');
}

export function toMercadoLibreItem(p: PropiedadParaPortal, opciones: OpcionesMercadoLibre): ResultadoAviso {
  const errors: string[] = [];

  const title = p.title.trim().slice(0, MAX_TITULO).trim();
  if (!title) errors.push('Falta el título.');

  const price = precioEnPesos(p.priceAmount, p.priceCurrency, opciones.rates);
  if (price === null) {
    const moneda = p.priceCurrency.trim();
    errors.push(
      !esPositivo(p.priceAmount)
        ? 'El precio debe ser mayor que cero.'
        : !moneda
          ? 'Falta la moneda del precio.'
          : !esPositivo(moneda.toUpperCase() === 'CLP' ? 1 : opciones.rates[moneda.toUpperCase()])
            ? `No hay valor de ${moneda.toUpperCase()} para convertir el precio a pesos.`
            : 'El precio es demasiado bajo (menos de $1).',
    );
  }

  const pictures = p.images.filter(esFotoPublica).map((source) => ({ source: source.trim() }));
  if (pictures.length === 0) errors.push('Falta al menos una foto con dirección pública.');

  const category_id = opciones.categories[`${p.operation}:${p.propertyType}`];
  if (!category_id) errors.push(`No hay categoría de Mercado Libre configurada para ${p.operation} de ${p.propertyType}.`);

  if (!esPositivo(p.totalAreaM2) && !esPositivo(p.builtAreaM2)) errors.push('Falta la superficie (total o construida).');

  const address = p.address.trim();
  const c = p.coordinates;
  const coordenadas =
    c && Number.isFinite(c.lat) && Number.isFinite(c.lng) && Math.abs(c.lat) <= 90 && Math.abs(c.lng) <= 180 ? c : undefined;
  if (!address && !coordenadas) errors.push('Falta la dirección o las coordenadas.');

  if (errors.length > 0 || price === null || !category_id) return { ok: false, errors };

  const location: AvisoMercadoLibre['location'] = {
    ...(address ? { address_line: address } : {}),
    ...(coordenadas ? { latitude: coordenadas.lat, longitude: coordenadas.lng } : {}),
  };

  return {
    ok: true,
    description: armarDescripcion(p),
    item: {
      title,
      category_id,
      price,
      currency_id: 'CLP',
      buying_mode: 'classified',
      listing_type_id: opciones.listingTypeId?.trim() || 'silver',
      channels: ['marketplace'],
      pictures,
      attributes: [
        ...conteo('BEDROOMS', p.bedrooms),
        ...conteo('FULL_BATHROOMS', p.bathrooms),
        ...conteo('PARKING_LOTS', p.parkingSpots),
        ...superficie('COVERED_AREA', p.builtAreaM2),
        ...superficie('TOTAL_AREA', p.totalAreaM2),
      ],
      location,
    },
  };
}
