import { describe, it, expect } from 'vitest';
import { buildPropertyFromLead } from './leadToProperty';
import type { Lead } from '../types/lead';

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'l1',
  fullName: 'Carla Soto',
  email: 'carla@correo.cl',
  phone: '+56 9 1111 2222',
  operationInterest: 'venta_propietario',
  status: 'nuevo',
  notes: [],
  source: 'captacion_propietarios',
  createdAt: '2026-11-01',
  attachments: ['data:image/jpeg;base64,AAA'],
  propertySpecs: { operation: 'arriendo', propertyType: 'departamento', commune: 'Providencia', areaM2: '65', bedrooms: '2' },
  ...over,
});

describe('buildPropertyFromLead', () => {
  it('crea la propiedad como borrador con los datos que dio el propietario', () => {
    const p = buildPropertyFromLead(lead());
    expect(p.publicationStatus).toBe('borrador');
    expect(p.operation).toBe('arriendo');
    expect(p.propertyType).toBe('departamento');
    expect(p.commune).toBe('Providencia');
    expect(p.totalAreaM2).toBe(65);
    expect(p.bedrooms).toBe(2);
    expect(p.title).toContain('Providencia');
  });

  it('no copia las fotos del propietario: la corredora usa las suyas', () => {
    expect(buildPropertyFromLead(lead()).images).toEqual([]);
  });

  it('deja anotado de qué contacto viene, sin publicar precio ni dirección inventados', () => {
    const p = buildPropertyFromLead(lead());
    expect(p.description).toContain('Carla Soto');
    expect(p.priceUf).toBe(0);
    expect(p.address).toBe('');
  });

  it('con datos faltantes o desconocidos usa valores seguros', () => {
    const p = buildPropertyFromLead(lead({ propertySpecs: { propertyType: 'castillo', areaM2: 'abc' } }));
    expect(p.propertyType).toBe('casa');
    expect(p.operation).toBe('venta');
    expect(p.totalAreaM2).toBe(0);
    expect(p.bedrooms).toBe(0);
    expect(p.commune).toBe('Sin comuna');
  });
});
