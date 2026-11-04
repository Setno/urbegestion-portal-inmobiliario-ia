import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createFakeSupabase } from '../../../core/data/fakeSupabase';
import { PUBLIC_PROPERTY_COLUMNS as SITIO_COLUMNAS } from '@portal/sitio-datos/propiedades';
import { createRemotePropertyRepository, createLocalPropertyRepository, PUBLIC_PROPERTY_COLUMNS_ANON } from './propertyRepository';
import type { Property } from '../types/property';

const TENANT = '5947138c-0eaa-4f12-8715-850e2fc833ae';

const propiedad: Property = {
  id: 'a0a0a0a0-0000-0000-0000-0000000000a1',
  title: 'Casa de prueba',
  operation: 'venta',
  propertyType: 'casa',
  priceAmount: 5000,
  priceCurrency: 'UF',
  commune: 'Vitacura',
  address: 'Calle 1',
  bedrooms: 3,
  bathrooms: 2,
  builtAreaM2: 120,
  totalAreaM2: 300,
  parkingSpots: 2,
  storageUnits: 1,
  featured: true,
  status: 'disponible',
  images: ['https://x.cl/a.jpg'],
  description: 'Linda',
  features: ['Jardín'],
  expensesMonthlyClp: 90000,
  mapQuery: 'Vitacura',
  coordinates: { lat: -33.4, lng: -70.6 },
  createdAt: '2026-10-31',
};

const fila = {
  id: propiedad.id,
  tenant_id: TENANT,
  title: 'Casa de prueba',
  operation: 'venta',
  property_type: 'casa',
  price_amount: 5000,
  price_currency: 'UF',
  commune: 'Vitacura',
  address: 'Calle 1',
  bedrooms: 3,
  bathrooms: 2,
  built_area_m2: 120,
  total_area_m2: 300,
  parking_spots: 2,
  storage_units: 1,
  featured: true,
  status: 'disponible',
  images: ['https://x.cl/a.jpg'],
  video_url: null,
  description: 'Linda',
  features: ['Jardín'],
  virtual_tour_url: null,
  expenses_monthly_clp: 90000,
  map_query: 'Vitacura',
  lat: -33.4,
  lng: -70.6,
  created_at: '2026-10-31T15:00:00+00:00',
};

describe('propertyRepository remoto', () => {
  it('lista solo las propiedades de la corredora y las convierte al formato de la app', async () => {
    const fake = createFakeSupabase({ data: [fila], error: null });
    const repo = createRemotePropertyRepository(fake.client, TENANT);
    const lista = await repo.list();

    expect(fake.calls[0].table).toBe('properties');
    expect(fake.argsOf(0, 'eq')).toEqual(['tenant_id', TENANT]);
    expect(lista).toHaveLength(1);
    expect(lista![0]).toMatchObject({
      id: propiedad.id,
      propertyType: 'casa',
      priceAmount: 5000,
      priceCurrency: 'UF',
      builtAreaM2: 120,
      parkingSpots: 2,
      expensesMonthlyClp: 90000,
      coordinates: { lat: -33.4, lng: -70.6 },
      createdAt: '2026-10-31',
    });
    expect(lista![0].videoUrl).toBeUndefined();
  });

  it('crea la propiedad con la corredora y los nombres de columna de la base', async () => {
    const fake = createFakeSupabase();
    const repo = createRemotePropertyRepository(fake.client, TENANT);
    await repo.create(propiedad, []);

    const [row] = fake.argsOf(0, 'insert') as [Record<string, unknown>];
    expect(row).toMatchObject({
      id: propiedad.id,
      tenant_id: TENANT,
      property_type: 'casa',
      price_amount: 5000,
      price_currency: 'UF',
      built_area_m2: 120,
      lat: -33.4,
      lng: -70.6,
    });
    expect(row).not.toHaveProperty('createdAt');
    expect(row).not.toHaveProperty('propertyType');
  });

  it('al editar envía solo los campos cambiados', async () => {
    const fake = createFakeSupabase({ data: [{ id: propiedad.id }], error: null });
    const repo = createRemotePropertyRepository(fake.client, TENANT);
    await repo.update(propiedad.id, { priceAmount: 4500, status: 'reservada' }, []);

    const [patch] = fake.argsOf(0, 'update') as [Record<string, unknown>];
    expect(patch).toMatchObject({ price_amount: 4500, status: 'reservada' });
    expect(Object.keys(patch).sort()).toEqual(['price_amount', 'status', 'updated_at']);
    expect(fake.argsOf(0, 'eq')).toEqual(['id', propiedad.id]);
  });

  it('al editar, un campo opcional borrado se envía como null para que no reaparezca', async () => {
    const fake = createFakeSupabase({ data: [{ id: propiedad.id }], error: null });
    const repo = createRemotePropertyRepository(fake.client, TENANT);
    await repo.update(propiedad.id, { videoUrl: undefined, coordinates: undefined }, []);
    const [patch] = fake.argsOf(0, 'update') as [Record<string, unknown>];
    expect(patch).toMatchObject({ video_url: null, lat: null, lng: null });
  });

  it('si editar o borrar no afecta ninguna fila (sin permiso o no existe), lanza error', async () => {
    const fake = createFakeSupabase({ data: [], error: null });
    const repo = createRemotePropertyRepository(fake.client, TENANT);
    await expect(repo.update(propiedad.id, { priceAmount: 1 }, [])).rejects.toThrow(/permiso/);
    await expect(repo.remove(propiedad.id, [])).rejects.toThrow(/permiso/);
  });

  it('borra por id', async () => {
    const fake = createFakeSupabase({ data: [{ id: propiedad.id }], error: null });
    const repo = createRemotePropertyRepository(fake.client, TENANT);
    await repo.remove(propiedad.id, []);

    expect(fake.opsOf(0)).toContain('delete');
    expect(fake.argsOf(0, 'eq')).toEqual(['id', propiedad.id]);
  });

  it('lanza un error si la base responde con error', async () => {
    const fake = createFakeSupabase({ data: null, error: { message: 'permiso denegado' } });
    const repo = createRemotePropertyRepository(fake.client, TENANT);
    await expect(repo.create(propiedad, [])).rejects.toThrow('permiso denegado');
    await expect(repo.list()).rejects.toThrow('permiso denegado');
  });

  it('genera ids con formato uuid', () => {
    const repo = createRemotePropertyRepository(createFakeSupabase().client, TENANT);
    expect(repo.newId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

describe('propertyRepository local', () => {
  it('guarda en el navegador la lista completa que entrega la tienda', async () => {
    localStorage.clear();
    const repo = createLocalPropertyRepository();
    await repo.create(propiedad, [propiedad]);
    expect(JSON.parse(localStorage.getItem('urbe_properties') || '[]')).toEqual([propiedad]);
    expect(repo.mode).toBe('local');
    expect(repo.newId()).toMatch(/^prop-/);
  });
});

describe('propertyRepository: columnas públicas para visitantes (H-047)', () => {
  it('con sesión pide todas las columnas', async () => {
    const fake = createFakeSupabase({ data: [], error: null });
    await createRemotePropertyRepository(fake.client, 't').list();
    expect(fake.argsOf(0, 'select')).toEqual(['*']);
  });

  it('sin sesión pide solo las columnas públicas, sin datos internos', async () => {
    const fake = createFakeSupabase({ data: [], error: null }, { signedIn: false });
    await createRemotePropertyRepository(fake.client, 't').list();
    const pedidas = String(fake.argsOf(0, 'select')![0]).split(',');
    expect(pedidas).toEqual(PUBLIC_PROPERTY_COLUMNS_ANON.split(','));
    for (const interna of ['created_by', 'updated_by', 'approved_by', 'approved_at', 'rejection_reason', 'lat', 'lng']) {
      expect(pedidas).not.toContain(interna);
    }
  });

  it('la lista coincide con la que la base le permite leer a un visitante (migración)', () => {
    const sql = readFileSync(path.resolve(__dirname, '../../../../../../supabase/migrations/20261104170000_propiedades_columnas_publicas.sql'), 'utf-8');
    const permitidas = /grant select \(([^)]*)\)/.exec(sql)![1].split(',').map((c) => c.trim()).filter(Boolean).sort();
    expect(permitidas).toEqual(PUBLIC_PROPERTY_COLUMNS_ANON.split(',').sort());
  });

  it('el sitio solo pide columnas que la base le permite leer', () => {
    const permitidas = new Set(PUBLIC_PROPERTY_COLUMNS_ANON.split(','));
    for (const c of SITIO_COLUMNAS.split(',')) expect(permitidas.has(c)).toBe(true);
  });
});
