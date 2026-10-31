import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePropertyStore } from './usePropertyStore';
import { setPropertyRepository, type PropertyRepository } from '../services/propertyRepository';
import type { Property } from '../types/property';

const base = (): Omit<Property, 'id' | 'createdAt'> => ({
  title: 'Casa',
  operation: 'venta',
  propertyType: 'casa',
  priceUf: 1000,
  commune: 'Vitacura',
  address: 'Calle 1',
  bedrooms: 3,
  bathrooms: 2,
  builtAreaM2: 100,
  totalAreaM2: 200,
  parkingSpots: 1,
  storageUnits: 0,
  featured: false,
  status: 'disponible',
  images: [],
  description: '',
  features: [],
});

const remoto = (over: Partial<PropertyRepository> = {}): PropertyRepository => ({
  mode: 'remote',
  newId: () => 'uuid-prop',
  list: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  ...over,
});

describe('usePropertyStore con repositorio remoto', () => {
  beforeEach(() => {
    localStorage.clear();
    usePropertyStore.setState({ properties: [], loading: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('crear, editar y borrar pasan por el repositorio y no tocan el navegador', () => {
    const repo = remoto();
    setPropertyRepository(repo);
    usePropertyStore.getState().addProperty(base());

    const creada = usePropertyStore.getState().properties[0];
    expect(creada.id).toBe('uuid-prop');
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ id: 'uuid-prop', title: 'Casa' }), expect.any(Array));

    usePropertyStore.getState().updateProperty('uuid-prop', { priceUf: 900 });
    expect(repo.update).toHaveBeenCalledWith('uuid-prop', { priceUf: 900 }, expect.any(Array));

    usePropertyStore.getState().deleteProperty('uuid-prop');
    expect(repo.remove).toHaveBeenCalledWith('uuid-prop', expect.any(Array));
    expect(usePropertyStore.getState().properties).toHaveLength(0);
    expect(localStorage.getItem('urbe_properties')).toBeNull();
  });

  it('si el repositorio falla al crear, conserva la propiedad en memoria y avisa', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setPropertyRepository(remoto({ create: vi.fn().mockRejectedValue(new Error('sin red')) }));
    usePropertyStore.getState().addProperty(base());
    await Promise.resolve();
    await Promise.resolve();
    expect(usePropertyStore.getState().properties).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
  });

  it('load() trae las propiedades de la base y apaga el indicador de carga', async () => {
    const delaBase: Property[] = [{ ...base(), id: 'p1', createdAt: '2026-10-31' }];
    setPropertyRepository(remoto({ list: vi.fn().mockResolvedValue(delaBase) }));
    const promesa = usePropertyStore.getState().load();
    expect(usePropertyStore.getState().loading).toBe(true);
    await promesa;
    expect(usePropertyStore.getState().properties).toEqual(delaBase);
    expect(usePropertyStore.getState().loading).toBe(false);
  });

  it('load() con error de base apaga la carga y no rompe', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setPropertyRepository(remoto({ list: vi.fn().mockRejectedValue(new Error('sin red')) }));
    await usePropertyStore.getState().load();
    expect(usePropertyStore.getState().loading).toBe(false);
    expect(warn).toHaveBeenCalled();
  });

  it('load() no hace nada con el repositorio local', async () => {
    const list = vi.fn();
    setPropertyRepository(remoto({ mode: 'local', list }));
    await usePropertyStore.getState().load();
    expect(list).not.toHaveBeenCalled();
  });
});
