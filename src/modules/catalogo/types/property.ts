export type OperationType = 'venta' | 'arriendo';

export type PropertyType = 
  | 'departamento' 
  | 'casa' 
  | 'parcela_agricola' 
  | 'oficina_comercial' 
  | 'terreno';

export type PropertyStatus = 'disponible' | 'reservada' | 'vendida' | 'arrendada';

// Estado de la publicación: solo las "publicada" se ven en el sitio. El agente propone y el administrador aprueba.
export type PublicationStatus = 'borrador' | 'en_revision' | 'publicada' | 'rechazada';

export interface Property {
  id: string;
  title: string;
  operation: OperationType;
  propertyType: PropertyType;
  priceAmount: number; // monto en la moneda del precio
  priceCurrency: string; // 'UF', 'CLP', 'USD'…: la moneda en que se cargó el precio
  commune: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  builtAreaM2: number;
  totalAreaM2: number;
  parkingSpots: number;
  storageUnits: number;
  featured: boolean;
  status: PropertyStatus;
  images: string[];
  videoUrl?: string;
  description: string;
  features: string[];
  virtualTourUrl?: string;
  expensesMonthlyClp?: number;
  mapQuery?: string; // Query de ubicación para Google Maps embed
  coordinates?: { lat: number; lng: number };
  publicationStatus?: PublicationStatus; // sin valor = publicada (datos antiguos y modo local)
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface PropertyFilterState {
  operation: OperationType | 'todas';
  propertyType: PropertyType | 'todos';
  commune: string;
  minPrice: number | ''; // en la moneda con que se está mirando el catálogo
  maxPrice: number | '';
  minBedrooms: number | '';
  minBathrooms: number | '';
  searchQuery: string;
}
