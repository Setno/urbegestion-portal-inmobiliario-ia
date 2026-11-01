import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePropertyStore } from './usePropertyStore';
import { initialProperties } from '../data/initialProperties';
import type { Property } from '../types/property';

type NuevaPropiedad = Omit<Property, 'id' | 'createdAt'>;

const base = initialProperties[0];
const nueva = (titulo: string): NuevaPropiedad => {
  const { id: _id, createdAt: _createdAt, ...resto } = base;
  return { ...resto, title: titulo };
};

const guardadas = (): Property[] => JSON.parse(localStorage.getItem('urbe_properties') || '[]');

describe('usePropertyStore', () => {
  beforeEach(() => {
    localStorage.clear();
    usePropertyStore.setState({ properties: [...initialProperties] });
  });

  it('arranca con las 8 propiedades de ejemplo', () => {
    expect(usePropertyStore.getState().properties).toHaveLength(8);
  });

  it('agrega una propiedad al inicio con id nuevo y la persiste', () => {
    usePropertyStore.getState().addProperty(nueva('Casa de prueba'));
    const { properties } = usePropertyStore.getState();
    expect(properties).toHaveLength(9);
    expect(properties[0].title).toBe('Casa de prueba');
    expect(properties[0].id).toMatch(/^prop-/);
    expect(guardadas()).toHaveLength(9);
  });

  it('edita solo la propiedad indicada y la persiste', () => {
    usePropertyStore.getState().updateProperty('prop-02', { title: 'Título editado', priceAmount: 1 });
    const { properties } = usePropertyStore.getState();
    const editada = properties.find((p) => p.id === 'prop-02');
    expect(editada?.title).toBe('Título editado');
    expect(editada?.priceAmount).toBe(1);
    expect(properties.find((p) => p.id === 'prop-01')?.title).toBe(initialProperties[0].title);
    expect(guardadas().find((p) => p.id === 'prop-02')?.title).toBe('Título editado');
  });

  it('elimina una propiedad y actualiza el almacenamiento', () => {
    usePropertyStore.getState().deleteProperty('prop-03');
    expect(usePropertyStore.getState().properties.find((p) => p.id === 'prop-03')).toBeUndefined();
    expect(guardadas().find((p) => p.id === 'prop-03')).toBeUndefined();
    expect(guardadas()).toHaveLength(7);
  });

  it('muestra el precio en UF o en pesos según la moneda elegida', () => {
    usePropertyStore.setState({ currency: 'UF' });
    expect(usePropertyStore.getState().formatPrice({ amount: 1000, currency: 'UF' }).display).toContain('UF');
    usePropertyStore.setState({ currency: 'CLP' });
    expect(usePropertyStore.getState().formatPrice({ amount: 1000, currency: 'UF' }).display).toContain('CLP');
  });

  it('un precio cargado en pesos se muestra en UF cuando se elige UF', () => {
    usePropertyStore.setState({ currency: 'UF' });
    const r = usePropertyStore.getState().formatPrice({ amount: 38650000, currency: 'CLP' });
    expect(r.display).toBe('1.000 UF');
  });

  it('dos propiedades creadas en el mismo milisegundo reciben ids distintos', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-10-30T10:00:00.000Z'));
      usePropertyStore.getState().addProperty(nueva('A'));
      usePropertyStore.getState().addProperty(nueva('B'));
      const [b, a] = usePropertyStore.getState().properties;
      expect(a.id).not.toBe(b.id);
    } finally {
      vi.useRealTimers();
    }
  });
});
