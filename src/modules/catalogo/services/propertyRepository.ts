import type { SupabaseClient } from '@supabase/supabase-js';
import type { Property } from '../types/property';
import { createLocalRepository, throwIfError, throwIfNoRows, type Repository } from '../../../core/data/repository';
import { remoteContext } from '../../../core/data/dataSource';
import { newId, newUuid } from '../../../core/utils/newId';

export type PropertyRepository = Repository<Property>;

// Propiedad (app) → columna (base). Los campos opcionales vacíos no se envían.
const COLUMNS: Record<string, string> = {
  title: 'title',
  operation: 'operation',
  propertyType: 'property_type',
  priceUf: 'price_uf',
  priceClp: 'price_clp',
  commune: 'commune',
  address: 'address',
  bedrooms: 'bedrooms',
  bathrooms: 'bathrooms',
  builtAreaM2: 'built_area_m2',
  totalAreaM2: 'total_area_m2',
  parkingSpots: 'parking_spots',
  storageUnits: 'storage_units',
  featured: 'featured',
  status: 'status',
  images: 'images',
  videoUrl: 'video_url',
  description: 'description',
  features: 'features',
  virtualTourUrl: 'virtual_tour_url',
  expensesMonthlyClp: 'expenses_monthly_clp',
  mapQuery: 'map_query',
};

// Al crear, los campos ausentes se omiten (la base pone su valor por defecto). Al editar (`clear`), un campo
// presente con valor undefined significa "borrar": se envía null para que el valor viejo no reaparezca.
function toRow(p: Partial<Property>, clear = false): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(COLUMNS)) {
    const value = (p as Record<string, unknown>)[key];
    if (value !== undefined) row[column] = value;
    else if (clear && key in p) row[column] = null;
  }
  if (p.coordinates) {
    row.lat = p.coordinates.lat;
    row.lng = p.coordinates.lng;
  } else if (clear && 'coordinates' in p) {
    row.lat = null;
    row.lng = null;
  }
  return row;
}

type Row = Record<string, unknown>;

const opt = <T>(value: unknown): T | undefined => (value === null || value === undefined ? undefined : (value as T));

function fromRow(r: Row): Property {
  const property: Property = {
    id: String(r.id),
    title: String(r.title),
    operation: r.operation as Property['operation'],
    propertyType: r.property_type as Property['propertyType'],
    priceUf: Number(r.price_uf),
    commune: String(r.commune),
    address: String(r.address ?? ''),
    bedrooms: Number(r.bedrooms ?? 0),
    bathrooms: Number(r.bathrooms ?? 0),
    builtAreaM2: Number(r.built_area_m2 ?? 0),
    totalAreaM2: Number(r.total_area_m2 ?? 0),
    parkingSpots: Number(r.parking_spots ?? 0),
    storageUnits: Number(r.storage_units ?? 0),
    featured: Boolean(r.featured),
    status: r.status as Property['status'],
    images: (r.images as string[]) ?? [],
    description: String(r.description ?? ''),
    features: (r.features as string[]) ?? [],
    createdAt: String(r.created_at ?? '').slice(0, 10),
  };
  const priceClp = opt<number>(r.price_clp);
  if (priceClp !== undefined) property.priceClp = Number(priceClp);
  const videoUrl = opt<string>(r.video_url);
  if (videoUrl !== undefined) property.videoUrl = videoUrl;
  const tour = opt<string>(r.virtual_tour_url);
  if (tour !== undefined) property.virtualTourUrl = tour;
  const expenses = opt<number>(r.expenses_monthly_clp);
  if (expenses !== undefined) property.expensesMonthlyClp = Number(expenses);
  const mapQuery = opt<string>(r.map_query);
  if (mapQuery !== undefined) property.mapQuery = mapQuery;
  if (typeof r.lat === 'number' && typeof r.lng === 'number') property.coordinates = { lat: r.lat, lng: r.lng };
  return property;
}

export function createLocalPropertyRepository(): PropertyRepository {
  return createLocalRepository<Property>('urbe_properties', 'prop', newId);
}

export function createRemotePropertyRepository(client: SupabaseClient, tenantId: string): PropertyRepository {
  return {
    mode: 'remote',
    newId: newUuid,
    list: async () => {
      const { data, error } = await client
        .from('properties')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      throwIfError(error);
      return ((data ?? []) as Row[]).map(fromRow);
    },
    create: async (item) => {
      const { error } = await client.from('properties').insert({ id: item.id, tenant_id: tenantId, ...toRow(item) });
      throwIfError(error);
    },
    update: async (id, patch) => {
      const { data, error } = await client
        .from('properties')
        .update({ ...toRow(patch, true), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id');
      throwIfError(error);
      throwIfNoRows(data, 'actualizar la propiedad');
    },
    remove: async (id) => {
      const { data, error } = await client.from('properties').delete().eq('id', id).select('id');
      throwIfError(error);
      throwIfNoRows(data, 'borrar la propiedad');
    },
  };
}

let current: PropertyRepository | null = null;

export function getPropertyRepository(): PropertyRepository {
  if (!current) {
    const ctx = remoteContext();
    current = ctx ? createRemotePropertyRepository(ctx.client, ctx.tenantId) : createLocalPropertyRepository();
  }
  return current;
}

// Solo para pruebas: cambia el repositorio que usa la tienda.
export function setPropertyRepository(repo: PropertyRepository | null): void {
  current = repo;
}
