import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePropertyStore } from './usePropertyStore';
import { setPropertyRepository, type PropertyRepository } from '../services/propertyRepository';
import type { Property } from '../types/property';

const prop = (over: Partial<Property> = {}): Property => ({
  id: 'p1',
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
  createdAt: '2026-11-01',
  ...over,
});

const repo = (): PropertyRepository => ({
  mode: 'remote',
  newId: () => 'uuid-prop',
  list: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
});

describe('flujo de aprobación en usePropertyStore', () => {
  let r: PropertyRepository;
  beforeEach(() => {
    localStorage.clear();
    r = repo();
    setPropertyRepository(r);
    usePropertyStore.setState({ properties: [prop({ publicationStatus: 'borrador' })], loading: false });
  });

  it('enviar a revisión cambia el estado a en_revision y lo guarda', () => {
    usePropertyStore.getState().submitForReview('p1');
    expect(usePropertyStore.getState().properties[0].publicationStatus).toBe('en_revision');
    expect(r.update).toHaveBeenCalledWith('p1', { publicationStatus: 'en_revision', rejectionReason: undefined }, expect.any(Array));
  });

  it('aprobar publica la propiedad y limpia el motivo de rechazo', () => {
    usePropertyStore.setState({ properties: [prop({ publicationStatus: 'en_revision', rejectionReason: 'fotos borrosas' })] });
    usePropertyStore.getState().approveProperty('p1');
    const p = usePropertyStore.getState().properties[0];
    expect(p.publicationStatus).toBe('publicada');
    expect(p.rejectionReason).toBeUndefined();
    expect(p.approvedAt).toBeTruthy();
    expect(r.update).toHaveBeenCalledWith('p1', expect.objectContaining({ publicationStatus: 'publicada' }), expect.any(Array));
  });

  it('rechazar exige un motivo y lo guarda', () => {
    usePropertyStore.setState({ properties: [prop({ publicationStatus: 'en_revision' })] });
    usePropertyStore.getState().rejectProperty('p1', '   ');
    expect(usePropertyStore.getState().properties[0].publicationStatus).toBe('en_revision');
    expect(r.update).not.toHaveBeenCalled();

    usePropertyStore.getState().rejectProperty('p1', ' Faltan fotos del living ');
    const p = usePropertyStore.getState().properties[0];
    expect(p.publicationStatus).toBe('rechazada');
    expect(p.rejectionReason).toBe('Faltan fotos del living');
  });
});
