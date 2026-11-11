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
  // Valor de 1 unidad de cada moneda EXTRANJERA en pesos chilenos. La UF y el dólar no la necesitan (se publican tal cual).
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
  currency_id: MonedaML;
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

// Monedas que la categoría de inmuebles de Mercado Libre acepta tal cual: CLP, USD y CLF (la UF). La UF NO se convierte a pesos:
// se publica en UF con el valor que cargó la corredora (no depende de ninguna fuente externa). Cualquier otra moneda se convierte
// a pesos con su tasa; sin tasa válida no se inventa la conversión.
const EN_MERCADO_LIBRE: Record<string, MonedaML> = { UF: 'CLF', USD: 'USD' };

export type MonedaML = 'CLP' | 'CLF' | 'USD';

const redondear = (n: number, decimales: number): number => {
  const f = 10 ** decimales;
  return Math.round((n + Number.EPSILON) * f) / f;
};

function precioParaMercadoLibre(monto: number, moneda: string, rates: Record<string, number>): { price: number; currency: MonedaML } | null {
  if (!esPositivo(monto)) return null;
  const codigo = moneda.trim().toUpperCase();
  const directa = EN_MERCADO_LIBRE[codigo];
  if (directa) {
    const price = redondear(monto, 2);
    return price >= 0.01 ? { price, currency: directa } : null;
  }
  const tasa = codigo === 'CLP' ? 1 : rates[codigo];
  if (!esPositivo(tasa)) return null;
  const pesos = Math.round(monto * tasa);
  return Number.isFinite(pesos) && pesos >= 1 ? { price: pesos, currency: 'CLP' } : null;
}

// El motivo por el que no hay precio, en el mismo orden de preguntas que usa el resto del traductor.
function motivoSinPrecio(monto: number, moneda: string, rates: Record<string, number>): string {
  const codigo = moneda.trim().toUpperCase();
  if (!esPositivo(monto)) return 'El precio debe ser mayor que cero.';
  if (!codigo) return 'Falta la moneda del precio.';
  if (!EN_MERCADO_LIBRE[codigo] && codigo !== 'CLP' && !esPositivo(rates[codigo])) return `No hay valor de ${codigo} para convertir el precio a pesos.`;
  return 'El precio es demasiado bajo (menos de $1).';
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

  const precio = precioParaMercadoLibre(p.priceAmount, p.priceCurrency, opciones.rates);
  if (!precio) errors.push(motivoSinPrecio(p.priceAmount, p.priceCurrency, opciones.rates));

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

  if (errors.length > 0 || !precio || !category_id) return { ok: false, errors };

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
      price: precio.price,
      currency_id: precio.currency,
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
