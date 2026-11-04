import { describe, it, expect } from 'vitest';
import { sourceLabel } from './leadSource';

describe('origen de un lead', () => {
  it('cada origen se muestra con un nombre que entiende la corredora', () => {
    expect(sourceLabel('asistente_ia')).toBe('Asistente IA');
    expect(sourceLabel('ficha_propiedad')).toBe('Ficha de propiedad');
    expect(sourceLabel('formulario_contacto')).toBe('Formulario de contacto');
    expect(sourceLabel('captacion_propietarios')).toBe('Propietario');
  });

  it('un origen desconocido se muestra legible, sin guiones bajos ni mayúsculas gritadas', () => {
    expect(sourceLabel('whatsapp_entrante')).toBe('Whatsapp entrante');
    expect(sourceLabel('')).toBe('Sin origen');
  });
});

describe('attributionLabel (H-058)', () => {
  it('une fuente, medio y campaña, o dice Directo', async () => {
    const { attributionLabel } = await import('./leadSource');
    expect(attributionLabel({ fuente: 'google', medio: 'cpc', campana: 'verano' })).toBe('google / cpc / verano');
    expect(attributionLabel({ campana: 'remate' })).toBe('remate');
    expect(attributionLabel(undefined)).toBe('Directo');
    expect(attributionLabel({})).toBe('Directo');
  });
});
