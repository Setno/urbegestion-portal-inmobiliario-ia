export type OperationType = 'venta' | 'arriendo';

export type PropertyType = 
  | 'departamento' 
  | 'casa' 
  | 'parcela_agricola' 
  | 'oficina_comercial' 
  | 'terreno';

export type PropertyStatus = 'disponible' | 'reservada' | 'vendida' | 'arrendada';

export interface Property {
  id: string;
  title: string;
  operation: OperationType;
  propertyType: PropertyType;
  priceUf: number;
  priceClp?: number;
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
  createdAt: string;
}

export interface PropertyFilterState {
  operation: OperationType | 'todas';
  propertyType: PropertyType | 'todos';
  commune: string;
  minPriceUf: number | '';
  maxPriceUf: number | '';
  minBedrooms: number | '';
  minBathrooms: number | '';
  searchQuery: string;
}
